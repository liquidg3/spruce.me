(function (a) {

    /**
     * All the Altair helpers one could want.
     *
     * @type {module}
     */

    var app = a.module('liquidfire', ['angularFileUpload']),
        populateParams = function (url, params) { // populateParams(/v1/rest/:placeholder, { placeholder: 'users', foo: bar }) => [ /v1/rest/users, { foo: bar }]

            var notFound = {},
                keys     = Object.keys(params || {}),
                c       = 0;

            for (;c < keys.length; c++) {

                var search = ':' + keys[c];

                if (url.indexOf(search) === -1) {
                    notFound[keys[c]] = params[keys[c]];
                } else {
                    url = url.replace(search, params[keys[c]]);
                }
            }

            return [url, notFound];

        };



    /**
     * Entity list controller
     */
    app.controller('EntityListController', [ '$scope', 'AltairRest', '$rootScope', '$attrs', function ($scope, AltairRest, $rootScope, $attrs) {

        //attributes to config
        $scope.endpoint          = $attrs.endpoint;
        $scope.page              = $attrs.page || 0; //current page
        $scope.perPage           = $attrs.perPage || 25; //how many results per page;
        $scope.sortField         = $attrs.sortField || null;
        $scope.sortDirection     = $attrs.sortDirection || null;
        $scope.searchField       = $attrs.searchField || null;
        $scope.searchValue       = $attrs.searchValue|| null;
        $scope.total            = 0; //total results (not counting limits)
        $scope.isRefreshing     = false; //are we refreshing?
        $scope.error            = null; //any error that has occurred

        /**
         * Initialize the controller (called from entity-list directive)
         */
        $scope.init = function () {

            if($scope.endpoint) {
                $scope.rest = new AltairRest($scope.endpoint);
                $scope.refresh();
            }

        };

        /**
         * Refreshes everything
         */
        $scope.refresh = function () {

            $scope.isRefreshing = true;

            $scope.rest.get({
                page:           $scope.page,
                perPage:        $scope.perPage,
                sortField:      $scope.sortField,
                sortDirection:  $scope.sortDirection
            }).then(function (response) {

                $scope.total            = response.total;
                $scope.isRefreshing     = false;
                $scope.entities         = response.results;
                $scope.error            = null;

            }).catch(function (err) {

                $scope.isRefreshing = false;
                $scope.entities     = [];
                $scope.error        = err.message;

            });

        };

        //fire it up
        $scope.init();


    }]);

    /**
     * Service for making rest requests
     */
    app.factory('AltairRest', ['$http', '$q', function ($http, $q) {

        var Rest = function (endpoint) {
            this.endpoint = endpoint;
        };

        Rest.prototype.post = function (url, values, options) {

            var endpoint = typeof url === 'string' ? url : this.endpoint;

            if (typeof url === 'object') {
                values = url;
                delete url;
            }

            var dfd = $q.defer(),
                parts = populateParams(endpoint, values);

            $http.post(parts[0], parts[1]).success(function (response) {

                dfd.resolve(response);

            }).error(function (response) {

                dfd.reject(new Error(response.error));

            });

            return dfd.promise;

        };

        Rest.prototype.get = function (url, config) {

            var endpoint = typeof url === 'string' ? url : this.endpoint;

            if (typeof url === 'object') {
                config = url;
                delete url;
            }

            var dfd = $q.defer(),
                parts = populateParams(endpoint, config);

            $http.get(parts[0], {
                params: parts[1]
            }).success(function (response) {

                dfd.resolve(response);

            }).error(function (response) {

                dfd.reject(new Error(response.error));

            });


            return dfd.promise;

        };

        Rest.prototype['delete'] = function () {

            console.log('delete');

        };

        return Rest;

    }]);

    /**
     * Singleton of REST instance to be reused (todo, figure out how config works)
     */
    app.factory('altairRest', ['AltairRest', function (AltairRest) {
        return new AltairRest();
    }]);

    /**
     * Socket
     */
    app.factory('altairSocket', function () {
        return altair.sockets;
    });

    /**
     * Main form controller
     */
    app.controller('FormController', [ '$scope', '$upload', '$http', '$rootScope', '$attrs',
        function ($scope, $upload, $http, $rootScope, $attrs) {


            //pass through some attrs
            $scope.action = $scope.action || $attrs.action;
            $scope.method = $scope.method || $attrs.method ? $attrs.method.toUpperCase() : 'GET';

            //the start state of the model
            var start = a.copy($scope.model);

            /**
             * Submit the form
             *
             * @param $event
             */
            $scope.submit = function ($event) {

                $http({
                    method: $scope.method,
                    url:    $scope.action,
                    data:   $scope.model
                }).success(function (data, status, headers, config) {

                    if ($scope.onSubmit) {
                        $scope.onSubmit($scope);
                    }

                    if ($scope.closeThisDialog) {
                        $scope.closeThisDialog();
                    } else {
                        $scope.empty();
                    }


                }).error(function (data, status, headers, config) {

                    if (data && data.error) {
                        alert(data.error);
                    } else {
                        console.log(data, status, headers, config);
                        alert('An unknown error has occurred.')
                    }

                });

                $event.preventDefault();

            };

            /**
             * Empties out the form
             */
            $scope.empty = function () {
                $scope.model = null;
            };

            /**
             * Reset the form to starting value
             */
            $scope.reset = function () {

                for (var key in start) {
                    if ($scope.model.hasOwnProperty(key)) {
                        $scope.model[key] = start[key];
                    }
                }
            };

            /**
             * Helper for quick file uploading
             */
            $scope.fileSelected = function (field, files, event) {

                for (var i = 0; i < files.length; i++) {

                    $upload.upload({
                        url: '/v1/angular/upload-file.json',
                        file: files[i]
                    }).success(function (data, status, headers, config) {

                        $scope.model[field] = data;
                        $scope.$apply();

                    });

                }

            };


        }]);


}(angular));

