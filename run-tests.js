"use strict";

const ngAnnotate = require("./ng-annotate-main");
const fs = require("fs");
const diff = require("diff");

function slurp(filename) {
    return String(fs.readFileSync(filename));
}

const from = slurp("tests/original.js");
const to = slurp("tests/with_annotations.js");
const got = ngAnnotate(from, {add: true}).src;

if (got !== to) {
    const patch = diff.createPatch("with_annotations.js", got, to);
    process.stderr.write(patch);
    process.exit(-1);
}
