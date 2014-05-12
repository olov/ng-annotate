"use strict";

const assert = require("assert");
const PriorityQueue = require("priorityqueuejs");

function Heap() {
    assert(this instanceof Heap);

    const q = new PriorityQueue(function(a, b) {
        return b.pos - a.pos;
    });

    function nextPos() {
        return (q.size() >= 1 ? q.peek().pos : (1 << 30));
    }

    this.pos = (1 << 30);
    this.addMany = function(arr) {
        arr.forEach(function(e) {
            q.enq(e);
        });
        this.pos = nextPos();
    };
    this.add = function(e) {
        q.enq(e);
        this.pos = nextPos();
    };
    this.getAndRemoveNext = function() {
        const e = q.deq();
        this.pos = nextPos();
        return e;
    };
}

module.exports = Heap;
