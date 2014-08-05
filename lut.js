"use strict";

const assert = require("assert");
const traverse = require("ordered-ast-traverse");
const is = require("simple-is");

module.exports = Lut;

function Lut(ast, src) {
    assert(this instanceof Lut);

    const sparselut = new Array(src.length);
    const lut = [];
    let p = 0;
    const t0 = Date.now();
    traverse(ast, {pre: function(node) {
        //        assert (node.range[0] >= p);
        p = node.range[0];
        if (!sparselut[p]) {
            sparselut[p] = node;
        }
    }});
    for (let i in sparselut) {
        lut.push(sparselut[i]);
    }
    const t1 = Date.now();
    //    console.error(t1-t0)

    // lut is a compact array with nodes,
    // sorted on node.range[0] (unique)
    this.lut = lut;
}

Lut.prototype.findNodeFromPos = findNodeFromPos;

// binary search lut to find node beginning at pos
// or as close after pos as possible. null if none
function findNodeFromPos(pos) {
    const lut = this.lut;
    assert(is.finitenumber(pos) && pos >= 0);

    let left = 0;
    let right = lut.length - 1;
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        assert(mid >= 0 && mid < lut.length);
        if (pos > lut[mid].range[0]) {
            left = mid + 1.
        }
        else {
            right = mid;
        }
    }
    if (left > right) {
        assert(last(lut).range[0] < pos);
        return null;
    }

    const found = left;
    const foundPos = lut[found].range[0];
    assert(foundPos >= pos);
    if (found >= 1) {
        const prevPos = lut[found - 1].range[0];
        assert(prevPos < pos);
    }

    return lut[found];
}

function last(arr) {
    return arr[arr.length - 1];
}
