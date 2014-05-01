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
myMod.animation("foo", function($scope, $timeout) {
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
myMod.animation("foo", function() {
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

// provider, provider $get
myMod.provider("foo", function($scope) {
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
    }).animation("foo", function($f, $g) {
        e;
    });

angular.module("MyMod").directive("foo", function($a, $b) {
    a;
}).provider("foo", function() {
        return {
            $get: function($scope, $timeout) {
                bar;
            }};
    }).value("foo", "bar")
    .constant("foo", "bar")
    .factory("foo", function() {
        b;
    }).config(function($c) {
        c;
    }).filter("foo", function($d, $e) {
        d;
    }).animation("foo", function($f, $g) {
        e;
    });

// $provide
angular.module("MyMod").directive("foo", function($a, $b) {
    $provide.decorator("foo", function($scope, $timeout) {
        a;
    });
    $provide.factory("bar", function($timeout, $scope) {
        b;
    });
    $provide.animation("baz", function($scope, $timeout) {
        c;
    });
});

// ui-router
$stateProvider.state("myState", {
    resolve: {
        simpleObj: function() {
            a;
        },

        promiseObj: function($scope, $timeout) {
            b;
        },

        translations: "translations",
    },
    views: {
        viewa: {
            controller: function($scope, myParam) {},
            templateProvider: function($scope) {},
            dontAlterMe: function(arg) {},
            resolve: {
                myParam: function($stateParams) {
                    return $stateParams.paramFromDI;
                }
            },
        },
        viewb: {
            dontAlterMe: function(arg) {},
            templateProvider: function($scope) {},
            controller: function($scope) {},
        },
        dontAlterMe: null,
    },
    controller: function($scope, simpleObj, promiseObj, translations) {
        c;
    },
    controllerProvider: function($scope) {
        g;
    },
    templateProvider: function($scope) {
        h;
    },
    onEnter: function($scope) {
        d;
    },
    onExit: function($scope) {
        e;
    },
    dontAlterMe: function(arg) {
        f;
    },
}).state("myState2", {
    controller: function($scope) {},
}).state({
    name: "myState3",
    controller: function($scope, simpleObj, promiseObj, translations) {
        c;
    },
});
$urlRouterProvider.when("", function($match) { a; });
$urlRouterProvider.otherwise("", function($location) { a; });
$urlRouterProvider.rule(function($location) { a; });
$urlRouterProvider.anythingreally(function($location) { a; }).chained(function($location) { a; });
