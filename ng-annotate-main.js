"use strict";
const esprima = require("esprima").parse;
const is = require("simple-is");
const alter = require("alter");
const traverse = require("ast-traverse");

// Short form:
// *.controller("MyCtrl", function($scope, $timeout) {});
function isShortDef(node, re) {
    return is.string(node.name) && (!re || re.test(node.name));
}

// Long form:
// angular.module(*).controller("MyCtrl", function($scope, $timeout) {});
function isLongDef(node) {
    return node.type === "CallExpression" &&
        node.callee &&
        node.callee.object && node.callee.object.name === "angular" &&
        node.callee.property && node.callee.property.name === "module";
}

function matchCallee(node, re) {
    const callee = node.callee;
    if (callee.type !== "MemberExpression") {
        return false;
    }
    const obj = callee.object;
    const prop = callee.property;
    if (!obj || !prop) {
        return false;
    }
    return (obj.$chained || isShortDef(obj, re) || isLongDef(obj)) && is.someof(prop.name, ["config", "factory", "directive", "filter", "run", "controller", "service"]);
}

function matchFunctionSignature(node) {
    const args = node.arguments;
    return (is.someof(node.callee.property.name, ["config", "run"]) ?
        args.length === 1 :
        args.length === 2 && args[0].type === "Literal") &&
        last(args).type === "FunctionExpression" && last(args).params.length > 0;
}

function matchArraySignature(node) {
    const args = node.arguments;
    return (is.someof(node.callee.property.name, ["config", "run"]) ?
        args.length === 1 :
        args.length === 2 && args[0].type === "Literal") &&
        last(args).type === "ArrayExpression" && last(args).elements.length >= 1 && last(last(args).elements).type === "FunctionExpression";
}

function last(arr) {
    return arr[arr.length - 1];
}

function insertArray(node, fragments) {
    const functionExpression = last(node.arguments);
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

function replaceArray(node, fragments) {
    const array = last(node.arguments);
    const functionExpression = last(array.elements);

    if (functionExpression.params.length === 0) {
        return removeArray(node, fragments);
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

function removeArray(node, fragments) {
    const array = last(node.arguments);
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
    traverse(ast, {post: function(node, parent) {
        if (node.type !== "CallExpression") {
            return;
        }
        if (!matchCallee(node, re)) {
            return;
        }
        node.$chained = true;

        if (mode === "rebuild" && matchArraySignature(node)) {
            replaceArray(node, fragments);
        } else if (mode === "remove" && matchArraySignature(node)) {
            removeArray(node, fragments);
        } else if (is.someof(mode, ["add", "rebuild"]) && matchFunctionSignature(node)) {
            insertArray(node, fragments);
        }
    }});

    const out = alter(src, fragments);

    return {
        src: out,
    };
}
