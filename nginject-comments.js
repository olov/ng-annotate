"use strict";

const is = require("simple-is");
const fmt = require("simple-fmt");

module.exports = {
    init: ngInjectCommentsInit,
};

function ngInjectCommentsInit(ctx) {
    const comments = ctx.comments;
    const triggers = [];
    for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        const pos = comment.value.indexOf("@ngInject");
        if (pos >= 0) {
            triggers.push({
                pos: comment.range[1],
                fn: visitNodeFollowingNgInjectComment,
                ctx: ctx,
            });
        }
    }

    ctx.triggers.addMany(triggers);
}

function visitNodeFollowingNgInjectComment(node, ctx) {
    // TODO objectliteral (if add or remove)

    if (ctx.replaceRemoveOrInsertArrayForTarget(node, ctx)) {
        return;
    }

    // var foo = function($scope) {}
    let d0 = null;
    const nr1 = node.range[1];
    if (node.type === "VariableDeclaration" && node.declarations.length === 1 &&
        (d0 = node.declarations[0]).init && ctx.isFunctionExpressionWithArgs(d0.init)) {
        const isSemicolonTerminated = (ctx.src[nr1 - 1] === ";");
        addRemoveInjectsArray(d0.init.params, isSemicolonTerminated ? nr1 : d0.init.range[1], d0.id.name);
    } else if (ctx.isFunctionDeclarationWithArgs(node)) {
        addRemoveInjectsArray(node.params, nr1, node.id.name);
    }


    function addRemoveInjectsArray(params, posAfterFunctionDeclaration, name) {
        const str1 = fmt("{0}.$injects", name);
        const str2 = fmt(" = {0};", ctx.stringify(params, ctx.quot));
        const str = "\n" + str1 + str2;

        ctx.triggers.add({
            pos: posAfterFunctionDeclaration,
            fn: visitNodeFollowingFunctionDeclaration,
        });

        function visitNodeFollowingFunctionDeclaration(nextNode) {
            const hasInjectsArray = (str1 === ctx.src.slice(nextNode.range[0], nextNode.range[0] + str1.length));

            if (ctx.mode === "rebuild" && hasInjectsArray) {
                ctx.fragments.push({
                    start: posAfterFunctionDeclaration,
                    end: nextNode.range[1],
                    str: str,
                });
            } else if (ctx.mode === "remove" && hasInjectsArray) {
                ctx.fragments.push({
                    start: posAfterFunctionDeclaration,
                    end: nextNode.range[1],
                    str: "",
                });
            } else if (is.someof(ctx.mode, ["add", "rebuild"]) && !hasInjectsArray) {
                ctx.fragments.push({
                    start: posAfterFunctionDeclaration,
                    end: posAfterFunctionDeclaration,
                    str: str,
                });
            }
        }
    }
}

