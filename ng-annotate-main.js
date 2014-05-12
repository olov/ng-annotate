// ng-annotate-main.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2014 Olov Lassus <olov.lassus@gmail.com>

"use strict";
const esprima = require("esprima").parse;
const is = require("simple-is");
const alter = require("alter");
const traverse = require("ordered-ast-traverse");
const Heap = require("./heap");

const chainedRouteProvider = 1;
const chainedUrlRouterProvider = 2;
const chainedStateProvider = 3;
const chainedRegular = 4;

function match(node, re) {
    const isMethodCall = (
        node.type === "CallExpression" &&
            node.callee.type === "MemberExpression" &&
            node.callee.computed === false
        );

    const matchMethodCalls = (isMethodCall &&
        (matchRegular(node, re) || matchNgRoute(node) || matchUiRouter(node)));

    return matchMethodCalls ||
        matchDirectiveReturnObject(node) ||
        matchProviderGet(node);
}

function matchDirectiveReturnObject(node) {
    // TODO make these more strict by checking that we're inside an angular module?

    // return { .. controller: function($scope, $timeout), ...}

    return node.type === "ReturnStatement" &&
        node.argument && node.argument.type === "ObjectExpression" &&
        matchProp("controller", node.argument.properties);
}

function matchProviderGet(node) {
    // TODO make these more strict by checking that we're inside an angular module?

    // this.$get = function($scope, $timeout)
    // { ... $get: function($scope, $timeout), ...}

    return (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" &&
        node.left.object.type === "ThisExpression" && node.left.property.name === "$get" && node.right) ||
        (node.type === "ObjectExpression" && matchProp("$get", node.properties));
}

function matchNgRoute(node) {
    // $routeProvider.when("path", {
    //   ...
    //   controller: function($scope) {},
    //   resolve: {f: function($scope) {}, ..}
    // })

    // we already know that node is a (non-computed) method call
    const callee = node.callee;
    const obj = callee.object; // identifier or expression
    if (!(obj.$chained === chainedRouteProvider || (obj.type === "Identifier" && obj.name === "$routeProvider"))) {
        return false;
    }
    node.$chained = chainedRouteProvider;

    const method = callee.property; // identifier
    if (method.name !== "when") {
        return false;
    }

    const args = node.arguments;
    if (args.length !== 2) {
        return false;
    }
    const configArg = last(args)
    if (configArg.type !== "ObjectExpression") {
        return false;
    }

    const props = configArg.properties;
    const res = [
        matchProp("controller", props)
    ];
    // {resolve: ..}
    res.push.apply(res, matchResolve(props));

    const filteredRes = res.filter(Boolean);
    return (filteredRes.length === 0 ? false : filteredRes);
}

function matchUiRouter(node) {
    // $stateProvider.state("myState", {
    //     ...
    //     controller: function($scope)
    //     controllerProvider: function($scope)
    //     templateProvider: function($scope)
    //     onEnter: function($scope)
    //     onExit: function($scope)
    // });
    // $stateProvider.state("myState", {... resolve: {f: function($scope) {}, ..} ..})
    // $stateProvider.state("myState", {... views: {... somename: {... controller: fn, templateProvider: fn, resolve: {f: fn}}}})
    //
    // $urlRouterProvider.when_otherwise_rule(.., function($scope) {})

    // we already know that node is a (non-computed) method call
    const callee = node.callee;
    const obj = callee.object; // identifier or expression
    const args = node.arguments;

    // special shortcut for $urlRouterProvider.*(.., function($scope) {})
    if ((obj.$chained === chainedUrlRouterProvider || (obj.type === "Identifier" && obj.name === "$urlRouterProvider")) && args.length >= 1) {
        node.$chained = chainedUrlRouterProvider;
        return last(args);
    }

    // everything below is for $stateProvider alone
    if (!(obj.$chained === chainedStateProvider || (obj.type === "Identifier" && obj.name === "$stateProvider"))) {
        return false;
    }
    node.$chained = chainedStateProvider;

    const method = callee.property; // identifier
    if (method.name !== "state") {
        return false;
    }

    // $stateProvider.state({ ... }) and $stateProvider.state("name", { ... })
    if (!(args.length >= 1 && args.length <= 2)) {
        return false;
    }

    const configArg = last(args);
    if (configArg.type !== "ObjectExpression") {
        return false;
    }

    const props = configArg.properties;
    const res = [
        matchProp("controller", props),
        matchProp("controllerProvider", props),
        matchProp("templateProvider", props),
        matchProp("onEnter", props),
        matchProp("onExit", props),
    ];

    // {resolve: ..}
    res.push.apply(res, matchResolve(props));

    // {view: ...}
    const viewObject = matchProp("views", props);
    if (viewObject && viewObject.type === "ObjectExpression") {
        viewObject.properties.forEach(function(prop) {
            if (prop.value.type === "ObjectExpression") {
                res.push(matchProp("controller", prop.value.properties));
                res.push(matchProp("templateProvider", prop.value.properties));
                res.push.apply(res, matchResolve(prop.value.properties));
            }
        });
    }

    const filteredRes = res.filter(Boolean);
    return (filteredRes.length === 0 ? false : filteredRes);
}

function matchRegular(node, re) {
    // we already know that node is a (non-computed) method call
    const callee = node.callee;
    const obj = callee.object; // identifier or expression
    const method = callee.property; // identifier

    const matchAngularModule = (obj.$chained === chainedRegular || isShortDef(obj, re) || isMediumDef(obj, re) || isLongDef(obj)) &&
        is.someof(method.name, ["provider", "value", "constant", "bootstrap", "config", "factory", "directive", "filter", "run", "controller", "service", "decorator", "animation"]);
    if (!matchAngularModule) {
        return false;
    }
    node.$chained = chainedRegular;

    if (is.someof(method.name, ["value", "constant", "bootstrap"])) {
        return false; // affects matchAngularModule because of chaining
    }

    const args = node.arguments;
    return (is.someof(method.name, ["config", "run"]) ?
        args.length === 1 && args[0] :
        args.length === 2 && args[0].type === "Literal" && is.string(args[0].value) && args[1]);
}

// Short form: *.controller("MyCtrl", function($scope, $timeout) {});
function isShortDef(node, re) {
    return node.type === "Identifier" && is.string(node.name) && (!re || re.test(node.name));
}

// Medium form: *.*.controller("MyCtrl", function($scope, $timeout) {});
function isMediumDef(node, re) {
    if (node.type === "MemberExpression" && is.object(node.object) && is.object(node.property) && is.string(node.object.name) && is.string(node.property.name)) {
        return (!re || re.test(node.object.name + "." + node.property.name));
    }
    return false;
}

// Long form: angular.module(*).controller("MyCtrl", function($scope, $timeout) {});
function isLongDef(node) {
    return node.callee &&
        node.callee.object && node.callee.object.name === "angular" &&
        node.callee.property && node.callee.property.name === "module";
}

function last(arr) {
    return arr[arr.length - 1];
}

function matchProp(name, props) {
    for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (prop.key.type === "Identifier" && prop.key.name === name) {
            return prop.value; // FunctionExpression or ArrayExpression
        }
    }
    return null;
}

function matchResolve(props) {
    const resolveObject = matchProp("resolve", props);
    if (resolveObject && resolveObject.type === "ObjectExpression") {
        return resolveObject.properties.map(function(prop) {
            return prop.value;
        });
    }
    return [];
};

function stringify(arr, quot) {
    return "[" + arr.map(function(arg) {
        return quot + arg.name + quot;
    }).join(", ") + "]";
}

function insertArray(functionExpression, fragments, quot) {
    const range = functionExpression.range;

    const args = stringify(functionExpression.params, quot);
    fragments.push({
        start: range[0],
        end: range[0],
        str: args.slice(0, -1) + ", ",
    });
    fragments.push({
        start: range[1],
        end: range[1],
        str: "]",
    });
}

function replaceArray(array, fragments, quot) {
    const functionExpression = last(array.elements);

    if (functionExpression.params.length === 0) {
        return removeArray(array, fragments);
    }
    const args = stringify(functionExpression.params, quot);
    fragments.push({
        start: array.range[0],
        end: functionExpression.range[0],
        str: args.slice(0, -1) + ", ",
    });
}

function removeArray(array, fragments) {
    const functionExpression = last(array.elements);

    fragments.push({
        start: array.range[0],
        end: functionExpression.range[0],
        str: "",
    });
    fragments.push({
        start: functionExpression.range[1],
        end: array.range[1],
        str: "",
    });
}

function replaceRemoveOrInsertArrayForTarget(target, ctx) {
    const mode = ctx.mode;
    const fragments = ctx.fragments;
    const quot = ctx.quot;

    if (mode === "rebuild" && isAnnotatedArray(target)) {
        replaceArray(target, fragments, quot);
    } else if (mode === "remove" && isAnnotatedArray(target)) {
        removeArray(target, fragments);
    } else if (is.someof(mode, ["add", "rebuild"]) && isFunctionExpressionWithArgs(target)) {
        insertArray(target, fragments, quot);
    } else {
        return false;
    }
    return true;
}

function isAnnotatedArray(node) {
    return node.type === "ArrayExpression" && node.elements.length >= 1 && last(node.elements).type === "FunctionExpression";
}
function isFunctionExpressionWithArgs(node) {
    return node.type === "FunctionExpression" && node.params.length >= 1;
}
function isFunctionDeclarationWithArgs(node) {
    return node.type === "FunctionDeclaration" && node.params.length >= 1;
}

module.exports = function ngAnnotate(src, options) {
    const mode = (options.add && options.remove ? "rebuild" :
        options.remove ? "remove" :
            options.add ? "add" : null);

    if (!mode) {
        return {src: src};
    }

    const quot = options.single_quotes ? "'" : '"';
    const re = (options.regexp && new RegExp(options.regexp));
    let ast;
    try {
        ast = esprima(src, {
            range: true,
            comment: true,
        });
    } catch(e) {
        return {
            errors: ["error: couldn't process source due to parse error", e.message],
        };
    }

    // Fix Program node range (https://code.google.com/p/esprima/issues/detail?id=541)
    ast.range[0] = 0;

    // append a dummy-node to ast to catch any remaining triggers
    ast.body.push({
        type: "DebuggerStatement",
        range: [ast.range[1], ast.range[1]],
    });

    // detach comments from ast
    // [{type: "Block"|"Line", value: str, range: [from,to]}, ..]
    const comments = ast.comments;
    ast.comments = null;

    // all source modifications are built up as operations in the
    // fragments array, later sent to alter in one shot
    const fragments = [];

    // triggers contains functions to trigger when traverse hits the
    // first node at (or after) a certain pos
    const triggers = new Heap();

    const ctx = {
        mode: mode,
        quot: quot,
        src: src,
        comments: comments,
        fragments: fragments,
        triggers: triggers,
        isFunctionExpressionWithArgs: isFunctionExpressionWithArgs,
        isFunctionDeclarationWithArgs: isFunctionDeclarationWithArgs,
        isAnnotatedArray: isAnnotatedArray,
        replaceRemoveOrInsertArrayForTarget: replaceRemoveOrInsertArrayForTarget,
        stringify: stringify,
    };

    traverse(ast, {pre: function(node) {
        const pos = node.range[0];
        while (pos >= triggers.pos) {
            const trigger = triggers.getAndRemoveNext();
            trigger.fn.call(null, node, trigger.ctx);
        }
    }, post: function(node) {
        let targets = match(node, re);
        if (!targets) {
            return;
        }
        if (!is.array(targets)) {
            targets = [targets];
        }

        // TODO add something to know that node has been altered so it won't happen again
        for (let i = 0; i < targets.length; i++) {
            replaceRemoveOrInsertArrayForTarget(targets[i], ctx);
        }
    }});

    const out = alter(src, fragments);

    return {
        src: out,
    };
}
