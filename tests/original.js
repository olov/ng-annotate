"use strict";

// long form
angular.module("MyMod").controller("MyCtrl", function($scope, $timeout) {
});

// w/ dependencies
angular.module("MyMod", ["OtherMod"]).controller("MyCtrl", function($scope, $timeout) {
});

// simple
myMod.controller("foo", function($scope, $timeout) {
});
myMod.service("foo", function($scope, $timeout) {
});
myMod.factory("foo", function($scope, $timeout) {
});
myMod.directive("foo", function($scope, $timeout) {
});
myMod.filter("foo", function($scope, $timeout) {
});

// no dependencies => no need to wrap the function in an array
myMod.controller("foo", function() {
});
myMod.service("foo", function() {
});
myMod.factory("foo", function() {
});
myMod.directive("foo", function() {
});
myMod.filter("foo", function() {
});

// run, config don't take names
myMod.run(function($scope, $timeout) {
});
angular.module("MyMod").run(function($scope) {
});
myMod.config(function($scope, $timeout) {
});
angular.module("MyMod").config(function() {
});

// directive return object
myMod.directive("foo", function($scope) {
    return {
        controller: function($scope, $timeout) {
            bar;
        }
    }
});
myMod.directive("foo", function($scope) {
    return {
        controller: function() {
            bar;
        }
    }
});

// provider $get
myMod.provider("foo", function() {
    this.$get = function($scope, $timeout) {
        bar;
    };
});
myMod.provider("foo", function() {
    this.$get = function() {
        bar;
    };
});
myMod.provider("foo", function() {
    return {
        $get: function($scope, $timeout) {
            bar;
        }};
});
myMod.provider("foo", function() {
    return {
        $get: function() {
            bar;
        }};
});
myMod.provider("foo", {
    $get: function($scope, $timeout) {
        bar;
    }
});
myMod.provider("foo", {
    $get: function() {
        bar;
    }
});

// chaining
myMod.directive("foo", function($a, $b) {
    a;
}).factory("foo", function() {
        b;
    }).config(function($c) {
        c;
    }).filter("foo", function($d, $e) {
        d;
    });

angular.module("MyMod").directive("foo", function($a, $b) {
    a;
}).provider("foo", function() {
        return {
            $get: function($scope, $timeout) {
                bar;
            }};
    }).factory("foo", function() {
        b;
    }).config(function($c) {
        c;
    }).filter("foo", function($d, $e) {
        d;
    });
