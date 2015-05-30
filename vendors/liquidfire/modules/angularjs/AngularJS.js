/**
 * A bunch of helpful AngularJS related functionality
 *
 * @author:     Taylor Romero, Inc
 * @license:    MIT
 * @vendor:     liquidfire
 * @module:     AngularJS
 * @nexus:      this.nexus("liquidfire:AngularJS")
 */

define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/mixins/_AssertMixin',
        'altair/events/Emitter',
        'lodash'
], function (declare,
             Lifecycle,
             _AssertMixin,
             Emitter,
             _) {

    return declare([Lifecycle, Emitter, _AssertMixin], {


        startup: function (options) {

            //drop in routes for uploads
            this.on('titan:Alfred::will-execute-app').then(this.hitch('onWillExecuteAlfredApp'));

            //when Alfred starts, lets share our public dir
            this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteAlfredWebServer'));

            return this.inherited(arguments);

        },

        onWillExecuteAlfredApp: function (e) {

            var options = e.get('options');

            options.routes['post /v1/angular/upload-file.json'] = {
                action: 'liquidfire:AngularJS/controllers/Angular::upload',
                layout: false
            };

        },

        /**
         * Make our public folder... public
         *
         * @param e
         */
        onDidExecuteAlfredWebServer: function (e) {

            var server = e.get('server'),
                filename;

            //publicize our angular folder
            server.serveStatically(this.resolvePath('public'), '/public/_angular');

            if (server.appConfig.angular && server.appConfig.angular.minified) {
                filename = '/public/_angular/bower_components/angularjs/angular.min.js';
            } else {
                filename = '/public/_angular/bower_components/angularjs/angular.js';
            }

            //loop through each route and tack on the js file
            _.each(server.appConfig.routes, function (route) {

                if(route.angular !== false) {
                    route.media.js.unshift('/public/_angular/altair.js');
                    route.media.js.unshift(filename);
                }

            }, this);

        }


    });
});