(function (a) {

    var app = a.module('spruce', ['liquidfire', 'ngDialog', 'ngRoute']);

    /**
     * Routing
     */
    app.config(['$routeProvider', function ($routeProvider) {

        $routeProvider.when('/admin/dashboard', {
            templateUrl: '/public/js/admin/templates/dashboard.html',
            controller:  'DashboardController'
        }).when('/admin/users', {
            templateUrl: '/public/js/admin/templates/users.html',
            controller:  'UsersController'
        }).otherwise({
            redirectTo: '/admin/dashboard'
        });

    }]);

    /**
     * Main admin controller
     */
    app.controller('AdminController', ['$scope' , 'ngDialog', '$http', '$route', 'altairSocket', function($scope, ngDialog, $http, $route, socket) {

        //no user by default
        $scope.user = null;

        //so route is available in scope
        $scope.$route = $route;

        $scope.init = function (token) {

            if (token) {

                $http.defaults.headers.common.Authorization = 'Basic ' + token;
                this.refreshProfile();
                socket.emit('authenticate', token, function () {

                });

            }

        };


        $scope.refreshProfile = function () {

            $http.get('/v1/rest/profile.json').success(function (data, status, headers, config) {
                $scope.user = data;
            });

        };

        /**
         * Edit the profile of the logged in user
         */
        $scope.editProfile = function () {

            var user = $scope.user;

            ngDialog.open({
                template:   '/public/js/admin/templates/profile.html',
                controller: ['$scope', function ($scope) {
                    $scope.model = user;
                    $scope.action = '/v1/rest/profile.json';
                }]
            });

        };

    }]);

    /**
     * Dashboard controller
     */
    app.controller('DashboardController', ['$scope', function ($scope) {

    }]);

    /**
     * User List
     */
    app.controller('UsersController', ['$scope', 'altairRest', function ($scope, altairRest) {

        $scope.action                   = '/v1/rest/user.json';
        $scope.model                    = {}; //so no user is selected by default
        $scope.editUser               = function (user) {
            $scope.showChat = false;
            $scope.model    = user;

        };
        $scope.showRole                 = true;
        $scope.editFormPopulateEvent    = 'edit-user';
        $scope.onSubmit                 = function ($scope) {

        };

        $scope.showChat = false;

        $scope.showChatForUser = function (user) {
            $scope.showChat = true;
            $scope.model = user
        };


        $scope.deleteUser = function (user) {

            if (confirm ('Are you sure you want to delete ' + user.name)) {

                altairRest.delete('/v1/rest/user/:id', {
                    id: user._id
                }).then(function (results) {

                    console.log(results);

                });
            }


        };



    }]);

    /**
     * Date Filter
     */
    app.filter('moment', function () {
        return function (input, momentFn /*, param1, param2, etc... */) {
            var args = Array.prototype.slice.call(arguments, 2),
                momentObj = moment(input);
            return momentObj[momentFn].apply(momentObj, args);
        };
    });

    app.controller('ChatController', ['$scope', 'altairRest', 'altairSocket', function ($scope, altairRest, socket) {

        $scope.rest = altairRest;

        $scope.sendChat = function (to, message) {

            if (!message) {
                return;
            }

            $scope.rest.post('/v1/rest/users/:id/message.json', {
                id: to,
                body: message
            }).then(function (message) {

                //add the message once
                if ($scope.messages.filter(function (m) {
                        return m._id === message._id;
                    }).length === 0) {

                    $scope.messages.push(message);
                    $scope.scrollToEnd();

                }

            }).catch(function (err) {

                console.log(err);
                alert(err.message || 'Unknown Error!');

            });

        };

        $scope.scrollToEnd = function () {

            setTimeout(function () {
                var $c = $(".chatui-talk-scroll");
                $c.animate({ scrollTop: $c[0].scrollHeight},.5);
            }, 50);

        };


        $scope.$watch('model', function () {


            if ($scope.model && $scope.model._id && $scope.showChat) {

                $scope.refresh();

            } else {

                $scope.messages = [];

            }

        });

        socket.on('message', function (e) {

            $scope.$apply(function () {

                var message = e.get('message');

                if ($scope.messages.filter(function (m) {
                        return m._id === message._id;
                    }).length === 0) {

                    $scope.messages.push(message);
                    $scope.scrollToEnd();

                }


            });

        });


        $scope.refresh = function () {

            socket.emit('un-subscribe-all', function () {
                socket.emit('subscribe', $scope.model._id);
            });

            socket.emit('messages', {
                user: $scope.model._id
            }, function (err, response) {

                if (err) {
                    alert(err);
                } else {

                    $scope.$apply(function () {
                        $scope.messages = response.results;
                        $scope.scrollToEnd();
                    });

                }

            });


        };

    }]);

}(angular));

