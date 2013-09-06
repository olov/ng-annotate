"use strict";
const esprima = require("esprima").parse;
const is = require("simple-is");
const alter = require("alter");
const traverse = require("ast-traverse");

/*
// return { .. controller: function($scope, $timeout), ...}
// TODO check that we're inside directive def?
function matchDirectiveReturnObject(node) {
    function matcControllerProp(props) {
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (prop.key.type === "Identifier" && prop.key.name === "controller") {
                return prop.value; // FunctionExpression or ArrayExpression
            }
        }
        return null;
    }

    return node.type === "ReturnStatement" &&
        node.argument && node.argument.type === "ObjectExpression" &&
        matchControllerProp(node.argument.properties);
}

*/
function match(node, re) {
    return matchRegular(node, re);
}

function matchRegular(node, re) {
    // Short form:
    // *.controller("MyCtrl", function($scope, $timeout) {});
    function isShortDef(node, re) {
        return is.string(node.name) && (!re || re.test(node.name));
    }

    // Long form:
    // angular.module(*).controller("MyCtrl", function($scope, $timeout) {});
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
    const matchAngularModule = (obj.$chained || isShortDef(obj, re) || isLongDef(obj)) && is.someof(prop.name, ["config", "factory", "directive", "filter", "run", "controller", "service"]);
    if (!matchAngularModule) {
        return false;
    }

    const args = node.arguments;
    return (is.someof(prop.name, ["config", "run"]) ?
        args.length === 1 && args[0] :
        args.length === 2 && args[0].type === "Literal" && is.string(args[0].value) && args[1]);
}

function last(arr) {
    return arr[arr.length - 1];
}

function insertArray(functionExpression, fragments) {
    const range = functionExpression.range;

    const args = JSON.stringify(functionExpression.params.map(function(arg) {
        return arg.name;
    }));
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

function replaceArray(array, fragments) {
    const functionExpression = last(array.elements);

    if (functionExpression.params.length === 0) {
        return removeArray(array, fragments);
    }
    const args = JSON.stringify(functionExpression.params.map(function(arg) {
        return arg.name;
    }));
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
function isFunction(node) {
    return node.type === "FunctionExpression";
}

module.exports = function ngAnnotate(src, options) {
    const mode = (options.add && options.remove ? "rebuild" :
        options.remove ? "remove" :
            options.add ? "add" : null);

    if (!mode) {
        return {src: src};
    }

    const re = (options.regexp && new RegExp(options.regexp));
    const ast = esprima(src, {
        range: true,
    });

    const fragments = [];
    // TODO chained
    //    node.$chained = true;

    traverse(ast, {post: function(node, parent) {
        const target = match(node, re);
        if (!target) {
            return;
        }

        if (mode === "rebuild" && isAnnotatedArray(target)) {
            replaceArray(target, fragments);
        } else if (mode === "remove" && isAnnotatedArray(target)) {
            removeArray(target, fragments);
        } else if (is.someof(mode, ["add", "rebuild"]) && isFunction(target)) {
            insertArray(target, fragments);
        }
    }});

    const out = alter(src, fragments);

    return {
        src: out,
    };
}




/*
 function allButLastStrings(arr) {
 for (var i = 0; i < arr.length - 1; i++) {
 if (arr[i].type !== "Literal" ||
 is.not.string(arr[i].value)) {
 return false;
 }
 }
 return true;
 }
 */
