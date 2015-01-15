// nginject-comments.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2014 Olov Lassus <olov.lassus@gmail.com>

"use strict";

const is = require("simple-is");

module.exports = {
    inspectComments: inspectComments,
    inspectNode: inspectNode,
};

function inspectNode(node, ctx) {
    if (node.type === "CallExpression") {
        inspectCallExpression(node, ctx);
    } else if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        inspectFunction(node, ctx);
    }
}

function inspectCallExpression(node, ctx) {
    if (node.callee.type === "Identifier" && node.callee.name === "ngInject" && node.arguments.length === 1) {
        addSuspect(node.arguments[0], ctx);
    }
}

function inspectFunction(node, ctx) {
    if (!hasPrologueDirective("ngInject", node)) {
        return;
    }

    // which node that is the correct suspect in the case of a "ngInject" prologue directive varies
    // between adding and removing annotations. when adding, the function (declaration or expression)
    // is always the suspect. when removing, the function declaration is the suspect but in the case
    // of a function expression, its parent is (because it may be an annotated array). when rebuilding,
    // both may be suspects.

    // add function node as a suspect, unconditionally (false suspect won't cause a problem here)
    addSuspect(node, ctx);

    if (ctx.mode !== "add") {
        // remove or rebuild
        // isAnnotatedArray check is there as an extra false-positives safety net
        const maybeArrayExpression = node.$parent;
        if (ctx.isAnnotatedArray(maybeArrayExpression)) {
            addSuspect(maybeArrayExpression, ctx);
        }
    }
}

function hasPrologueDirective(prologue, node) {
    const body = node.body.body;

    let found = false;
    for (let i = 0; i < body.length; i++) {
        if (body[i].type !== "ExpressionStatement") {
            break;
        }

        const expr = body[i].expression;
        const isStringLiteral = (expr.type === "Literal" && typeof expr.value === "string");
        if (!isStringLiteral) {
            break;
        }

        if (expr.value === prologue) {
            found = true;
            break;
        }
    }

    return found;
}

function inspectComments(ctx) {
    const comments = ctx.comments;
    for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        const pos = comment.value.indexOf("@ngInject");
        if (pos === -1) {
            continue;
        }

        const target = ctx.lut.findNodeFromPos(comment.range[1]);
        if (!target) {
            continue;
        }

        addSuspect(target, ctx);
    }
}

function addSuspect(target, ctx) {
    if (target.type === "ObjectExpression") {
        // /*@ngInject*/ {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(target, ctx);
    } else if (target.type === "AssignmentExpression" && target.right.type === "ObjectExpression") {
        // /*@ngInject*/ f(x.y = {f1: function(a), .., {f2: function(b)}})
        addObjectExpression(target.right, ctx);
    } else if (target.type === "ExpressionStatement" && target.expression.type === "AssignmentExpression" && target.expression.right.type === "ObjectExpression") {
        // /*@ngInject*/ x.y = {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(target.expression.right, ctx);
    } else if (target.type === "VariableDeclaration" && target.declarations.length === 1 && target.declarations[0].init && target.declarations[0].init.type === "ObjectExpression") {
        // /*@ngInject*/ var x = {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(target.declarations[0].init, ctx);
    } else if (target.type === "Property") {
        // {/*@ngInject*/ justthisone: function(a), ..}
        target.value.$limitToMethodName = "*never*";
        ctx.addModuleContextIndependentSuspect(target.value, ctx);
    } else {
        // /*@ngInject*/ function(a) {}
        target.$limitToMethodName = "*never*";
        ctx.addModuleContextIndependentSuspect(target, ctx);
    }
}

function addObjectExpression(node, ctx) {
    nestedObjectValues(node).forEach(function(n) {
        n.$limitToMethodName = "*never*";
        ctx.addModuleContextIndependentSuspect(n, ctx);
    });
}

function nestedObjectValues(node, res) {
    res = res || [];

    node.properties.forEach(function(prop) {
        const v = prop.value;
        if (is.someof(v.type, ["FunctionExpression", "ArrayExpression"])) {
            res.push(v);
        } else if (v.type === "ObjectExpression") {
            nestedObjectValues(v, res);
        }
    });

    return res;
}
