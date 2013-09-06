# ng-annotate
ng-annotate adds and removes AngularJS dependency injection annotations.
It is non-intrusive so your source code stays exactly the same otherwise.
No lost comments or moved lines.

Without annotations:

    angular.module("MyMod").controller("MyCtrl", function($scope, $timeout) {
    });

With annotations:

    angular.module("MyMod").controller("MyCtrl", ["$scope","$timeout", function($scope, $timeout) {
    }]);

Annotations are useful because with them you're able to minify your source code using your
favorite JS minifier.


## Installation and usage
    npm install -g ng-annotate

Then run it as `ng-annotate OPTIONS file.js`. The errors (if any) will go to stderr,
the transpiled source to stdout, so redirect it like `ng-annotate file.js > output.js`.

Use the `--add` (`-a`) option to add annotations where non-existing,
use `--remove` (`-r`) to remove all existing annotations,
use `--add --remove` (`-ar`) to rebuild all annotations.

See description of the `--regexp` options further down.


## Why?
 * Keep your code base clutter free from annotations but add them in your build step
 prior to minimizing
 * De-clutter an existing code base by removing annotations, non-intrusively
 * If you must store annotations in the repo (for any reason) then checkout,
 remove them, code and refactor without annotations, add them back and commit.
 Alternatively checkout, code and refactor (ignoring annotations), rebuild them and commit.


## Declaration forms
ng-annotate understands the two common declaration forms:

Long form:

    angular.module("MyMod").controller("MyCtrl", function($scope, $timeout) {
    });

Short form:

    myMod.controller("MyCtrl", function($scope, $timeout) {
    });

It's not limited to `.controller` of course. It understands `.config`, `.factory`,
`.directive`, `.filter`, `.run`, `.controller` and `.service`.

For short forms it does not need to see the declaration of `myMod` so you can run it
on your individual source files without concatenating. If ng-annotate detects a short form
false positive then you can use the `--regexp` option to limit the module identifier.
Examples: `--regexp "^myMod$"` (match only `myMod`) or `--regexp "^$"` (ignore short forms).

ng-annotate understands `this.$get = function($scope)` and
`{.., $get: function($scope), ..}` inside a `provider`.

ng-annotate understands `return {.., controller: function($scope), ..}` inside a
`directive`.

ng-annotate understands chaining.


## Performance
ng-annotate is designed to be very fast (in general limited by parse speed).
It traverses the AST exactly once and transforms it without the need for an AST -> source
decompilation step.


## Library (API)
ng-annotate can be used as a library. See `ng-annotate.js` for further info about
options and return value. ng-annotate uses ES6 const and let, so you must currently run node
in --harmony mode. I will publish a version of ng-annotate that is pre-transpiled using
[defs](https://github.com/olov/defs) so that the --harmony requirement goes away, if that
is of interest.

    var ngAnnotate = require("ng-annotate");
    var transformedSource = ngAnnotate(src, {add: true}).src;


## Grunt?
In the works! Feel free to contribute by creating grunt-ng-annotate, and let me know (@olov).
