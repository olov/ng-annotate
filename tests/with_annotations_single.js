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

// ui-router
$stateProvider.state("myState", {
    resolve: {
        simpleObj: function() {
            a;
        },

        promiseObj:  ['$scope', '$timeout', function($scope, $timeout){
            b;
        }],

        translations: "translations",
    },
    controller: ['$scope', 'simpleObj', 'promiseObj', 'translations', function($scope, simpleObj, promiseObj, translations) {
        c;
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
});
