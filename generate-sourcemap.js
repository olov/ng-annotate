"use strict";

const os = require("os");
const convertSourceMap = require("convert-source-map");
const SourceMapConsumer = require("source-map").SourceMapConsumer;
const SourceMapGenerator = require("source-map").SourceMapGenerator;
const stableSort = require("stable");
const compact = require("compact-source-mappings");

// This isn't, strictly speaking, an exhaustive match for valid identifier characters
// in JavaScript: https://mathiasbynens.be/notes/javascript-identifiers
// But it's close enough for our purposes in generating source maps.
const identifierRegex = /[A-Za-z0-9$_]/;

const whitespaceRegex = /\s/;

function SourceMapper(src, fragments, inFile, sourceRoot) {
    this.generator = new SourceMapGenerator({ sourceRoot: sourceRoot });
    this.src = src;
    this.fragments = stableSort(fragments.slice(0), function(a, b) { return a.start - b.start });
    this.inFile = inFile || "source.js";

    this.generator.setSourceContent(this.inFile, src);
}

SourceMapper.prototype.generate = function() {
    let inIndex = 0;
    let inLine = 1;
    let inColumn = 0;
    let outLine = 1;
    let outColumn = 0;
    let insideWord = false;

    while (inIndex < this.src.length) {
        if (this.fragments[0] && this.fragments[0].start === inIndex) {
            this.addMapping(inLine, inColumn, outLine, outColumn);

            // iterate over input string
            for (; inIndex < this.fragments[0].end; inIndex++) {
                if (this.src[inIndex] === '\n') {
                    inLine++;
                    inColumn = 0;
                } else {
                    inColumn++;
                }
            }

            // iterate over output string
            for (let outIndex = 0; outIndex < this.fragments[0].str.length; outIndex++) {
                if (this.fragments[0].str[outIndex] === '\n') {
                    outLine++;
                    outColumn = 0;
                } else {
                    outColumn++;
                }
            }

            this.fragments.shift();
        }

        else {
            if (this.src[inIndex] === '\n') {
                inLine++;
                outLine++;
                inColumn = 0;
                outColumn = 0;
            } else {
                if (identifierRegex.test(this.src[inIndex])) {
                    if (!insideWord) {
                        insideWord = true;
                        this.addMapping(inLine, inColumn, outLine, outColumn);
                    }
                } else {
                    insideWord = false;
                    if (!whitespaceRegex.test(this.src[inIndex])) {
                        this.addMapping(inLine, inColumn, outLine, outColumn);
                    }
                }
                inColumn++;
                outColumn++;
            }
            inIndex++;
        }
    }

    return this.generator;
}

SourceMapper.prototype.addMapping = function(inLine, inColumn, outLine, outColumn) {
    this.generator.addMapping({
        source: this.inFile,
        original: {
            line: inLine,
            column: inColumn
        },
        generated: {
            line: outLine,
            column: outColumn
        }
    });
}

module.exports = function generateSourcemap(result, src, fragments, mapOpts) {
    const existingMap = convertSourceMap.fromSource(src);
    src = convertSourceMap.removeMapFileComments(src);

    const generator = new SourceMapper(src, fragments, mapOpts.inFile, mapOpts.sourceRoot).generate();

    if (mapOpts.inline) {
        if (existingMap)
            generator.applySourceMap(new SourceMapConsumer(existingMap.toObject()));
        result.src = convertSourceMap.removeMapFileComments(result.src) +
            os.EOL +
            convertSourceMap.fromObject(compact(generator.toString())).toComment();
    } else {
        result.map = generator.toString();
    }
}
