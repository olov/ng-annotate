"use strict";

// long form
angular.module("MyMod").controller("MyCtrl", ['$scope', '$timeout', function($scope, $timeout) {
}]);

// w/ dependencies
angular.module("MyMod", ["OtherMod"]).controller("MyCtrl", ['$scope', '$timeout', function($scope, $timeout) {
}]);

// simple
myMod.controller("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);
myMod.service("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);
myMod.factory("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);
myMod.directive("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);
myMod.filter("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);
myMod.animation("foo", ['$scope', '$timeout', function($scope, $timeout) {
}]);

// object property
var myObj = {};
myObj.myMod = angular.module("MyMod");
myObj.myMod.controller("foo", ['$scope', '$timeout', function($scope, $timeout) { a }]);

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
myMod.run(['$scope', '$timeout', function($scope, $timeout) {
}]);
angular.module("MyMod").run(['$scope', function($scope) {
}]);
myMod.config(['$scope', '$timeout', function($scope, $timeout) {
}]);
angular.module("MyMod").config(function() {
});

// directive return object
myMod.directive("foo", ['$scope', function($scope) {
    return {
        controller: ['$scope', '$timeout', function($scope, $timeout) {
            bar;
        }]
    }
}]);
myMod.directive("foo", ['$scope', function($scope) {
    return {
        controller: function() {
            bar;
        }
    }
}]);

// provider, provider $get
myMod.provider("foo", ['$scope', function($scope) {
    this.$get = ['$scope', '$timeout', function($scope, $timeout) {
        bar;
    }];
}]);
myMod.provider("foo", function() {
    this.$get = function() {
        bar;
    };
});
myMod.provider("foo", function() {
    return {
        $get: ['$scope', '$timeout', function($scope, $timeout) {
            bar;
        }]};
});
myMod.provider("foo", function() {
    return {
        $get: function() {
            bar;
        }};
});
myMod.provider("foo", {
    $get: ['$scope', '$timeout', function($scope, $timeout) {
        bar;
    }]
});
myMod.provider("foo", {
    $get: function() {
        bar;
    }
});

// chaining
myMod.directive("foo", ['$a', '$b', function($a, $b) {
    a;
}]).factory("foo", function() {
        b;
    }).config(['$c', function($c) {
        c;
    }]).filter("foo", ['$d', '$e', function($d, $e) {
        d;
    }]).animation("foo", ['$f', '$g', function($f, $g) {
        e;
    }]);

angular.module("MyMod").directive("foo", ['$a', '$b', function($a, $b) {
    a;
}]).provider("foo", function() {
        return {
            $get: ['$scope', '$timeout', function($scope, $timeout) {
                bar;
            }]};
    }).value("foo", "bar")
    .constant("foo", "bar")
    .bootstrap(element, [], {})
    .factory("foo", function() {
        b;
    }).config(['$c', function($c) {
        c;
    }]).filter("foo", ['$d', '$e', function($d, $e) {
        d;
    }]).animation("foo", ['$f', '$g', function($f, $g) {
        e;
    }]);

// $provide
angular.module("MyMod").directive("foo", ['$a', '$b', function($a, $b) {
    $provide.decorator("foo", ['$scope', '$timeout', function($scope, $timeout) {
        a;
    }]);
    $provide.factory("bar", ['$timeout', '$scope', function($timeout, $scope) {
        b;
    }]);
    $provide.animation("baz", ['$scope', '$timeout', function($scope, $timeout) {
        c;
    }]);
}]);

// $routeProvider
$routeProvider.when("path", {
    controller: ['$scope', function($scope) {
        a;
    }]
}).when("path2", {
        controller: ['$scope', function($scope) {
            b;
        }],
        resolve: {
            zero: function() {
                a;
            },
            more: ['$scope', '$timeout', function($scope, $timeout) {
                b;
            }],
            something: "else",
        },
        dontAlterMe: function(arg) {},
    });

// ui-router
$stateProvider.state("myState", {
    resolve: {
        simpleObj: function() {
            a;
        },

        promiseObj: ['$scope', '$timeout', function($scope, $timeout) {
            b;
        }],

        translations: "translations",
    },
    views: {
        viewa: {
            controller: ['$scope', 'myParam', function($scope, myParam) {}],
            templateProvider: ['$scope', function($scope) {}],
            dontAlterMe: function(arg) {},
            resolve: {
                myParam: ['$stateParams', function($stateParams) {
                    return $stateParams.paramFromDI;
                }]
            },
        },
        viewb: {
            dontAlterMe: function(arg) {},
            templateProvider: ['$scope', function($scope) {}],
            controller: ['$scope', function($scope) {}],
        },
        dontAlterMe: null,
    },
    controller: ['$scope', 'simpleObj', 'promiseObj', 'translations', function($scope, simpleObj, promiseObj, translations) {
        c;
    }],
    controllerProvider: ['$scope', function($scope) {
        g;
    }],
    templateProvider: ['$scope', function($scope) {
        h;
    }],
    onEnter: ['$scope', function($scope) {
        d;
    }],
    onExit: ['$scope', function($scope) {
        e;
    }],
    dontAlterMe: function(arg) {
        f;
    },
}).state("myState2", {
    controller: ['$scope', function($scope) {}],
}).state({
    name: "myState3",
    controller: ['$scope', 'simpleObj', 'promiseObj', 'translations', function($scope, simpleObj, promiseObj, translations) {
        c;
    }],
});
$urlRouterProvider.when("", ['$match', function($match) { a; }]);
$urlRouterProvider.otherwise("", ['$location', function($location) { a; }]);
$urlRouterProvider.rule(['$location', function($location) { a; }]);
$urlRouterProvider.anythingreally(['$location', function($location) { a; }]).chained(['$location', function($location) { a; }]);

// explicit annotations
var x = /* @ngInject */ ['$scope', function($scope) {
}];

var obj = {};
obj.bar = /*@ngInject*/ ['$scope', function($scope) {}];

obj = {
    controller: /*@ngInject*/ ['$scope', function($scope) {}],
};

// @ngInject
function foo($scope) {
}
foo.$injects = ['$scope'];

// @ngInject
// otherstuff
function Foo($scope) {
}
Foo.$injects = ['$scope'];

// @ngInject
// has trailing semicolon
var foo = function($scope) {
};
foo.$injects = ['$scope'];

// @ngInject
// lacks trailing semicolon
var foo = function($scope) {
}
foo.$injects = ['$scope'];
