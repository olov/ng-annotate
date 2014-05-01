"use strict";
const esprima = require("esprima").parse;
const is = require("simple-is");
const alter = require("alter");
const traverse = require("ast-traverse");

function match(node, re) {
    return matchRegular(node, re) ||
        matchUiRouter(node) ||
        matchDirectiveReturnObject(node) ||
        matchProviderGet(node);
}

function matchDirectiveReturnObject(node) {
    // return { .. controller: function($scope, $timeout), ...}

    return node.type === "ReturnStatement" &&
        node.argument && node.argument.type === "ObjectExpression" &&
        matchProp("controller", node.argument.properties);
}

function matchProviderGet(node) {
    // this.$get = function($scope, $timeout)
    // { ... $get: function($scope, $timeout), ...}

    return (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" &&
        node.left.object.type === "ThisExpression" && node.left.property.name === "$get" && node.right) ||
        (node.type === "ObjectExpression" && matchProp("$get", node.properties));
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
    if (node.type !== "CallExpression") {
        return;
    }

    const callee = node.callee;
    if (callee.type !== "MemberExpression") {
        return false;
    }

    const obj = callee.object;
    const prop = callee.property;
    const args = node.arguments;

    // special shortcut for $urlRouterProvider.*(.., function($scope) {})
    if ((obj.$chainedURP || (obj.type === "Identifier" && obj.name === "$urlRouterProvider")) && args.length >= 1) {
        node.$chainedURP = true;
        return args[args.length - 1];
    }

    // everything below is for $stateProvider alone
    if (!(obj.$chained || (obj.type === "Identifier" && obj.name === "$stateProvider"))) {
        return false;
    }
    node.$chained = true;

    if (!obj || !prop || prop.name !== "state") {
        return false;
    }

    // $stateProvider.state({ ... }) and $stateProvider.state("name", { ... })
    if (is.noneof(args.length, [1, 2])) {
        return false;
    }

    const configArg = args[args.length - 1];
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


    function matchResolve(props) {
        const resolveObject = matchProp("resolve", props);
        if (resolveObject && resolveObject.type === "ObjectExpression") {
            return resolveObject.properties.map(function(prop) {
                return prop.value;
            });
        }
        return [];
    };
}

function matchRegular(node, re) {
    // Short form: *.controller("MyCtrl", function($scope, $timeout) {});
    function isShortDef(node, re) {
        return is.string(node.name) && (!re || re.test(node.name));
    }

    // Long form: angular.module(*).controller("MyCtrl", function($scope, $timeout) {});
    function isLongDef(node) {
        return node.callee &&
            node.callee.object && node.callee.object.name === "angular" &&
            node.callee.property && node.callee.property.name === "module";
    }

    if (node.type !== "CallExpression") {
        return;
    }

    const callee = node.callee;
    if (callee.type !== "MemberExpression") {
        return false;
    }
    const obj = callee.object;
    const prop = callee.property;
    if (!obj || !prop) {
        return false;
    }
    const matchAngularModule = (obj.$chained || isShortDef(obj, re) || isLongDef(obj)) &&
        is.someof(prop.name, ["provider", "value", "constant", "config", "factory", "directive", "filter", "run", "controller", "service", "decorator", "animation"]);
    if (!matchAngularModule) {
        return false;
    }
    node.$chained = true;

    if (is.someof(prop.name, ["value", "constant"])) {
        return false; // affects matchAngularModule because of chaining
    }

    const args = node.arguments;
    return (is.someof(prop.name, ["config", "run"]) ?
        args.length === 1 && args[0] :
        args.length === 2 && args[0].type === "Literal" && is.string(args[0].value) && args[1]);
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

function isAnnotatedArray(node) {
    return node.type === "ArrayExpression" && node.elements.length >= 1 && last(node.elements).type === "FunctionExpression";
}
function isFunctionWithArgs(node) {
    return node.type === "FunctionExpression" && node.params.length >= 1;
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
    const ast = esprima(src, {
        range: true,
    });

    const fragments = [];

    traverse(ast, {post: function(node) {
        let targets = match(node, re);
        if (!targets) {
            return;
        }
        if (!is.array(targets)) {
            targets = [targets];
        }

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (mode === "rebuild" && isAnnotatedArray(target)) {
                replaceArray(target, fragments, quot);
            } else if (mode === "remove" && isAnnotatedArray(target)) {
                removeArray(target, fragments);
            } else if (is.someof(mode, ["add", "rebuild"]) && isFunctionWithArgs(target)) {
                insertArray(target, fragments, quot);
            }
        }
    }});

    const out = alter(src, fragments);

    return {
        src: out,
    };
}
