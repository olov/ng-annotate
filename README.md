# ng-annotate
ng-annotate adds and removes AngularJS dependency injection annotations.
It is non-intrusive so your source code stays exactly the same otherwise.
No lost comments or moved lines.

Without annotations:

    angular.module("MyMod").controller("MyCtrl", function($scope, $timeout) {
    });

With annotations:

    angular.module("MyMod").controller("MyCtrl", ["$scope", "$timeout", function($scope, $timeout) {
    }]);

Annotations are useful because with them you're able to minify your source code using your
favorite JS minifier.


## How does ng-annotate compare to ngmin?
If you are currently using ngmin then this is probably your first question. In short:
ng-annotate is much faster, finds more declarations to annotate (including ui-router),
treats your source code better, is actively maintained and has a bunch of extra features
on top of that. A much more elaborated answer can be found in
["The future of ngmin and ng-annotate"](https://github.com/btford/ngmin/issues/93).


## Installation and usage
    npm install -g ng-annotate

Then run it as `ng-annotate OPTIONS <file>`. The errors (if any) will go to stderr,
the transpiled output to stdout.

Use the `--add` (`-a`) option to add annotations where non-existing,
use `--remove` (`-r`) to remove all existing annotations,
use `--add --remove` (`-ar`) to rebuild all annotations.

Use the `-o` option to write output to file.

Provide `-` instead of an input `<file>` to read input from stdin.

Use the `--single_quotes` option to output `'$scope'` instead of `"$scope"`.

Use the `--regexp` option in case you want to restrict matching further (rarely used). See
description further down.

Use the `--plugin` option to load a user plugin with the provided path (*experimental*, 
0.9.x may change API). See [plugin-example.js](plugin-example.js) for more info.

Use the `--stats` option to print statistics on stderr (*experimental*).


## Tools support
* [Grunt](http://gruntjs.com/): [grunt-ng-annotate](https://www.npmjs.org/package/grunt-ng-annotate) by [Michał Gołębiowski](https://github.com/mzgol)
* [Browserify](http://browserify.org/): [browserify-ngannotate](https://www.npmjs.org/package/browserify-ngannotate) by [Owen Smith](https://github.com/omsmith)
* [Brunch](http://brunch.io/): [ng-annotate-uglify-js-brunch](https://www.npmjs.org/package/ng-annotate-uglify-js-brunch) by [Kagami Hiiragi](https://github.com/Kagami)
* [Gulp](http://gulpjs.com/): [gulp-ng-annotate](https://www.npmjs.org/package/gulp-ng-annotate/) by [Kagami Hiiragi](https://github.com/Kagami)
* [Broccoli](https://github.com/broccolijs/broccoli): [broccoli-ng-annotate](https://www.npmjs.org/package/broccoli-ng-annotate) by [Gilad Peleg](https://github.com/pgilad)
* [Rails asset pipeline](http://guides.rubyonrails.org/asset_pipeline.html): [ngannotate-rails](https://rubygems.org/gems/ngannotate-rails) by [Kari Ikonen](https://github.com/kikonen)
* Something missing? Contributions welcome - create plugin and submit a README pull request!


## Changes
See [CHANGES.md](CHANGES.md).


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
`.directive`, `.filter`, `.run`, `.controller`, `.provider`, `.service` and `.animation`.

For short forms it does not need to see the declaration of `myMod` so you can run it
on your individual source files without concatenating. If ng-annotate detects a short form
false positive then you can use the `--regexp` option to limit the module identifier.
Examples: `--regexp "^myMod$"` (match only `myMod`) or `--regexp "^$"` (ignore short forms).

ng-annotate understands `this.$get = function($scope) ..` and
`{.., $get: function($scope) ..}` inside a `provider`. `self` and `that` can be used as
aliases for `this`.

ng-annotate understands `return {.., controller: function($scope) ..}` inside a
`directive`.

ng-annotate understands `$provide.decorator("bar", function($scope) ..)` and other methods
on `provide` such as `factory`.

ng-annotate understands `$routeProvider.when("path", { .. })`.

ng-annotate understands `$httpProvider.interceptors.push(function($scope) ..)` and
`$httpProvider.responseInterceptors.push(function($scope) ..)`.

ng-annotate understands [ui-router](https://github.com/angular-ui/ui-router) (`$stateProvider` and
`$urlRouterProvider`).

ng-annotate understands `$modal.open` ([angular-ui/bootstrap](http://angular-ui.github.io/bootstrap/)).
*experimental*

ng-annotate understands chaining.


## Explicit annotations
You can prepend a function expression with `/* @ngInject */` to explicitly state that this
function should get annotated. ng-annotate will leave the comment intact and will thus still
be able to also remove or rewrite such annotations. Use `/* @ngInject */` as an occasional
workaround when ng-annotate doesn't support your code style but feel free to open an issue
also.

    var x = /* @ngInject */ function($scope) {};
    obj = {controller: /*@ngInject*/ function($scope) {}};
    obj.bar = /*@ngInject*/ function($scope) {};

    =>

    var x = /* @ngInject */ ["$scope", function($scope) {}];
    obj = {controller: /*@ngInject*/ ["$scope", function($scope) {}]};
    obj.bar = /*@ngInject*/ ["$scope", function($scope) {}];

Prepended to an object literal, `/* @ngInject */` will annotate all of its contained
function expressions, recursively:

	obj = /*@ngInject*/ {
	    controller: function($scope) {},
	    resolve: {
	        data: function(Service) {},
	    },
	};

	=>

	obj = /*@ngInject*/ {
	    controller: ["$scope", function($scope) {}],
	    resolve: {
	        data: ["Service", function(Service) {}],
	    },
	};


Prepended to a function statement or a single variable declaration initialized with a
function expression, `/* @ngInject */` will attach an `$injects` array to the function:

    // @ngInject
    function Foo($scope) {}

    // @ngInject
    var foo = function($scope) {}

    =>

    // @ngInject
    function Foo($scope) {}
    Foo.$injects = ["$scope"];

    // @ngInject
    var foo = function($scope) {}
    foo.$injects = ["$scope"];


## Issues and compatibility
If ng-annotate does not handle a construct you're using, if there's a bug or if you have a feature
request then please [file an issue](https://github.com/olov/ng-annotate/issues?state=open).


## Build and test
ng-annotate is written in ES6 constlet style and uses [defs.js](https://github.com/olov/defs)
to transpile to ES5. See [BUILD.md](BUILD.md) for build and test instructions.


## License
`MIT`, see [LICENSE](LICENSE) file.

ng-annotate is written by [Olov Lassus](https://github.com/olov) with the kind help by
[contributors](https://github.com/olov/ng-annotate/graphs/contributors).
[Follow @olov](https://twitter.com/olov) on Twitter for updates about ng-annotate.


## Performance
ng-annotate is designed to be very fast (in general limited by parse speed).
It traverses the AST exactly once and transforms it without the need for an AST -> source
decompilation step.


## Library (API)
ng-annotate can be used as a library. See [ng-annotate.js](ng-annotate.js) for further info about
options and return value.

    var ngAnnotate = require("ng-annotate");
    var somePlugin = require("./some/path/some-plugin");
    var res = ngAnnotate(src, {add: true, plugin: [somePlugin]})
    var errorstringArray = res.errors;
    var transformedSource = res.src;
