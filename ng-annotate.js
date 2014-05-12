// ng-annotate.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2014 Olov Lassus <olov.lassus@gmail.com>

"use strict";
const fs = require("fs");
const fmt = require("simple-fmt");
const tryor = require("tryor");
const ngAnnotate = require("./ng-annotate-main");
const version = require("./package.json").version;
const optimist = require("optimist")
    .usage("ng-annotate v" + version + "\n\nUsage: ng-annotate OPTIONS file.js")
    .options("a", {
        alias: "add",
        boolean: true,
        describe: "add dependency injection annotations where non-existing",
    })
    .options("r", {
        alias: "remove",
        boolean: true,
        describe: "remove all existing dependency injection annotations",
    })
    .options("single_quotes", {
        boolean: true,
        describe: "use single quotes (') instead of double quotes (\")",
    })
    .options("regexp", {
        describe: "detect short form myMod.controller(...) iff myMod matches regexp",
    });

const argv = optimist.argv;

function exit(msg) {
    if (msg) {
        process.stderr.write(msg);
        process.stderr.write("\n");
    }
    process.exit(-1);
}

(function verifyOptions() {
    if (argv._.length !== 1) {
        optimist.showHelp();
        exit("error: no input file provided");
    }

    if (!argv.add && !argv.remove) {
        optimist.showHelp();
        exit("error: missing option --add and/or --remove");
    }
})();

const filename = argv._.shift();

if (!fs.existsSync(filename)) {
    exit(fmt('error: file not found {0}', filename));
}

const src = String(fs.readFileSync(filename));

const config = tryor(function() {
    return JSON.parse(String(fs.readFileSync("ng-annotate-config.json")));
}, {});

function addOption(opt) {
    if (opt in argv) {
        config[opt] = argv[opt];
    }
}

["add", "remove", "regexp", "single_quotes"].forEach(addOption);

const ret = ngAnnotate(src, config);

if (ret.errors) {
    process.stderr.write(ret.errors.join("\n") + "\n");
    process.exit(1);
}

if (ret.src) {
    process.stdout.write(ret.src);
}
