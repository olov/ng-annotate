// run-tests.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2014 Olov Lassus <olov.lassus@gmail.com>

"use strict";

const ngAnnotate = require("./ng-annotate-main");
const fs = require("fs");
const diff = require("diff");

function slurp(filename) {
    return String(fs.readFileSync(filename));
}

function test(correct, got, name) {
    if (got !== correct) {
        const patch = diff.createPatch(name, correct, got);
        process.stderr.write(patch);
        process.exit(-1);
    }
}

const renameOptions = {
  "$a": "$aRenamed",
  "$b": "$bRenamed",
  "$c": "$cRenamed",
  "$d": "$dRenamed",
  "$e": "$eRenamed",
  "$f": "$fRenamed",
  "$g": "$gRenamed",
  "$h": "$hRenamed",
  "$i": "$iRenamed"
};

const original = slurp("tests/original.js");

console.log("testing adding annotations");
const annotated = ngAnnotate(original, {add: true}).src;
test(slurp("tests/with_annotations.js"), annotated, "with_annotations.js");

console.log("testing adding annotations using single quotes");
const annotatedSingleQuotes = ngAnnotate(original, {add: true, single_quotes: true}).src;
test(slurp("tests/with_annotations_single.js"), annotatedSingleQuotes, "with_annotations_single.js");

console.log("testing adding annotations and renaming");
const annotatedRenamed = ngAnnotate(original, {
  add: true,
  rename: renameOptions
}).src;
test(slurp("tests/with_annotations_renamed.js"), annotatedRenamed, "with_annotations_renamed.js");

console.log("testing adding annotations and renaming using single quotes");
const annotatedSingleRenamed = ngAnnotate(original, {
  add: true,
  single_quotes: true,
  rename: renameOptions
}).src;
test(slurp("tests/with_annotations_single_renamed.js"), annotatedSingleRenamed, "with_annotations_single_renamed.js");

console.log("testing removing annotations");
test(original, ngAnnotate(annotated, {remove: true}).src, "original.js");


const ngminOriginal = slurp("tests/ngmin-tests/ngmin_original.js");

console.log("testing adding annotations (imported tests)");
const ngminAnnotated = ngAnnotate(ngminOriginal, {add: true, regexp: "^myMod"}).src;
test(slurp("tests/ngmin-tests/ngmin_with_annotations.js"), ngminAnnotated, "ngmin_with_annotations.js");

console.log("testing removing annotations (imported tests)");
test(ngminOriginal, ngAnnotate(ngminAnnotated, {remove: true, regexp: "^myMod"}).src, "ngmin_original.js");

console.log("all ok");
