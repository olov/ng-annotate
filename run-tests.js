"use strict";

const ngAnnotate = require("./ng-annotate-main");
const fs = require("fs");
const diff = require("diff");

function slurp(filename) {
    return String(fs.readFileSync(filename));
}

function test(correct, got, name) {
    if (got !== correct) {
        const patch = diff.createPatch(name, got, correct);
        process.stderr.write(patch);
        process.exit(-1);
    }
}

console.log("testing adding annotations");
const original = slurp("tests/original.js");
const annotated = ngAnnotate(original, {add: true}).src;
test(slurp("tests/with_annotations.js"), annotated, "with_annotations.js");

console.log("testing removing annotations");
const deAnnotated = ngAnnotate(annotated, {remove: true}).src;
test(original, deAnnotated, "original.js");

console.log("all ok");
