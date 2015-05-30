define(['altair/facades/declare',
        'altair/Lifecycle',
        'apollo/_HasSchemaMixin',
        'altair/events/Emitter',
        'altair/mixins/_AssertMixin'
], function (declare, Lifecycle, _HasSchemaMixin, Emitter, _AssertMixin) {

    return declare([Lifecycle, _HasSchemaMixin, Emitter, _AssertMixin], {

        _js: null,

        /**
         * We will attach any js to the current web server's router. we will statically route /public/__sockets
         *
         * @param server
         * @returns {*|Promise}
         */
        configureWebServer: function (server, options) {

            var router = server.router(),
                routes = server.appConfig.routes,
                _options = options || {},
                dfd;

            if (this._js) {

                //everything will be
                server.serveStatically(this.parent.resolvePath('public'), '/public/_sockets');

                if (_options.includeMedia !== false) {
                    dfd = router.attachMedia(routes, { js: this._js });
                }

            }

            return this.when(dfd).then(function () {
                return this;
            }.bind(this));

        }



    });

});