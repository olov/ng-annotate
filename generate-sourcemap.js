"use strict";

const charProps = require("char-props");
const SourceMapGenerator = require("source-map").SourceMapGenerator;
const stableSort = require("stable");

function findStartOfLines(str) {
	const matchLineWithContent = /^(\s*)[^\s]/gm;
	const indices = [];
	let match;
	while (match = matchLineWithContent.exec(str)) {
		indices.push(match.index + match[1].length);
	}
	return indices;
}

function SourceMapper(src, out, fragments, sourceRoot) {
	this.generator = new SourceMapGenerator();
	this.inIndex = 0;
	this.outIndex = 0;
	this.lineStarts = findStartOfLines(src);
	this.fragments = stableSort(fragments, function (a, b) { return a.start - b.start; });
	this.inProps = charProps(src);
	this.outProps = charProps(out);
}

SourceMapper.prototype.generate = function () {
	while (this.fragments.length > 0 || this.lineStarts.length > 0) {
		if (this.isNextMappingAFragment())
			this.addNextFragmentMapping();
		else
			this.addNextLineMapping();
	}
	return this.generator.toString();
}

SourceMapper.prototype.isNextMappingAFragment = function () {
	return !this.lineStarts.length ||
		this.fragments.length && this.fragments[0].start < this.lineStarts[0];
}

SourceMapper.prototype.addNextFragmentMapping = function () {
	this.outIndex += this.fragments[0].start - this.inIndex;
	this.inIndex = this.fragments[0].start;
	this.addMapping();

	this.outIndex += this.fragments[0].str.length
	this.inIndex = this.fragments[0].end;
	this.addMapping();

	this.fragments.shift();
}

SourceMapper.prototype.addNextLineMapping = function () {
	this.outIndex += this.lineStarts[0] - this.inIndex;
	this.inIndex = this.lineStarts[0];
	this.addMapping();

	this.lineStarts.shift();
}

SourceMapper.prototype.addMapping = function () {
	this.generator.addMapping({
		source: "source.js",
		original: {
			line: this.inProps.lineAt(this.inIndex) + 1,
			column: this.inProps.columnAt(this.inIndex)
		},
		generated: {
			line: this.outProps.lineAt(this.outIndex) + 1,
			column: this.outProps.columnAt(this.outIndex)
		}
	});
}

module.exports = function generateSourcemap(src, out, fragments, sourceRoot) {
	return new SourceMapper(src, out, fragments, sourceRoot).generate();
}
