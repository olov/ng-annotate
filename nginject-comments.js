// nginject-comments.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2014 Olov Lassus <olov.lassus@gmail.com>

"use strict";

const is = require("simple-is");
const fmt = require("simple-fmt");

module.exports = {
    init: ngInjectCommentsInit,
};

function ngInjectCommentsInit(ctx) {
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

        if (target.type === "ObjectExpression") {
            nestedObjectValues(target).forEach(function(n) {
                ctx.addModuleContextIndependentSuspect(n, ctx);
            });
        } else {
            ctx.addModuleContextIndependentSuspect(target, ctx);
        }
    }
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
