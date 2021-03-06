define(['altair/facades/declare',
    'altair/facades/hitch',
    'altair/facades/mixin',
    'altair/plugins/node!express',
    'altair/plugins/node!http',
    'altair/plugins/node!https',
    'altair/plugins/node!body-parser',
    'altair/plugins/node!multiparty',
    'altair/plugins/node!fs',
    'altair/facades/when',
    '../theme/Theme',
    '../theme/View',
    '../http/Request',
    '../http/Response',
    'lodash',
    './_Base'
], function (declare, hitch, mixin, express, http, https, bodyParser, multiparty, fs, when, Theme, View, Request, Response, _, _Base) {

    return declare([_Base], {

        _app:      null,
        _server:   null,
        _sslServer:   null,
        appConfig: null,
        ssl:       null, //the ssl options to pass to https.createServer
        Theme:     Theme,
        View:      View,
        Request:   Request,
        Response:  Response,
        startup:   function (options) {

            var _options = options || this.options || {};

            //no routes, no good
            if (!_options.routes) {
                throw new Error('every web server needs routes.');
            }

            //dependency injection
            if (_options.Theme) {
                this.Theme = _options.Theme;
            }

            if (_options.View) {
                this.View = _options.View;
            }

            //create express app
            this._app = express();

            //configure express
            this.configureApp(_options);
            this.configureSsl(_options);

            return this.inherited(arguments);

        },


        /**
         * Instance of express.
         * @returns {alfred.strategies._Base._app|*}
         */
        app: function () {
            return this._app;
        },

        /**
         * Setus up any SSL related setting required for the https library. If no sslPort is supplied, it is ignored.
         *
         * @param app
         */
        configureSsl: function (app) {

            if (app.sslPort) {

                this.assert(app.privateKeyPath, 'in order to use SSL, you need to supply a privateKeyPath');
                this.assert(app.certificatePath, 'in order to use SSL, you need to supply a certificatePath');

                var read = fs.readFileSync,
                    altair = this.nexus('Altair');

                this.ssl = {
                    key: read(altair.resolvePath(app.privateKeyPath)),
                    cert: read(altair.resolvePath(app.certificatePath))
                };

                //is there a ca?
                if (app.ca) {

                    this.ssl.ca = [];

                    this.assertArray(app.ca, 'Ca must be an array of paths');

                    _.each(app.ca, function (path) {

                        this.ssl.ca.push(altair.resolvePath(path));

                    }, this);

                } else {
                    this.ssl.ca = null;
                }

            }

        },

        /**
         * Configures express using the site's app.json
         *
         * @param app fully populated app.json
         * @returns {alfred.strategies._Base}
         */
        configureApp: function (app) {

            //in case someone wants to reconfigure the app (minus routes of course since those are set during startup)
            this.appConfig = app;

            this.parent.emit('will-configure-express-middle', {
                strategy:   this,
                express:    this._app
            });

            this._app.use(bodyParser.json());       // to support JSON-encoded bodies
            this._app.use(bodyParser.urlencoded({extended: true}));

            this.parent.emit('will-configure-express-routes', {
                strategy:   this,
                express:    this._app
            });


            //serve this dir statically
            this.serveStatically(app.path + 'public', '/public');

            //loop through each route
            _.each(app.routes, function (route, url) {

                var verb = 'all',
                    _url = url,
                    parts;

                if (url.search(' ') > 0) {
                    parts = url.split(' ');
                    verb = parts[0];
                    _url = parts[1];
                }

                //set the path callback
                this._app[verb](_url, this.hitch(function (req, res, next) {
                    this.handleRequest(_url, route, req, res, next);
                }));


            }, this);


            return this;

        },

        /**
         * Serve some files to the browser (images, js, etc.)
         *
         * @param path
         * @param uri
         * @returns {alfred.strategies._Base}
         */
        serveStatically: function (path, uri) {
            this._app.use(uri, express.static(path));
            return this;
        },

        /**
         * Called on every request
         *
         * @param route
         * @param _req
         * @param _res
         * @param next
         */
        handleRequest: function (url, route, _req, _res, next) {

            var _route = route,
                app = this.appConfig,
                router = app.router,
                module = this.parent,
                renderer = module.nexus('liquidfire:Onyx'),
                req = new this.Request(_req),
                res = new this.Response(_res),
                layout = _route.layout,
                theme = layout ? new this.Theme(app.path, _route.layout, renderer, _route) : undefined,
                view = _route.view && _.isString(_route.view) ? new this.View(app.path + _route.view, renderer) : _route.view,
                dfd,
                currentEvent = module.coerceEvent('noop', {
                    request:    req,
                    response:   res
                }),
                multiForm;

            //pretend that post always worked! yay!!
            if (req.method() === 'POST' && req.header('content-type') && req.header('content-type').search('multipart') === 0) {

                multiForm = new multiparty.Form();

                dfd = this.promise(multiForm, 'parse', req.raw()).then(function (results) {

                    var _values = mixin(results[0], results[1]),
                        values = {};

                    _.each(_values, function (v, k) {
                        if(k.search(/\[\]/) > 0) {
                            values[k.replace('[]', '')] = v;
                        } else {
                            values[k] = v.pop();
                        }
                    });


                    req.raw().body = values;

                });


            }

            //give us time to parts multipart forms
            this.when(dfd).then(function () {

                //emit the event, then pass it to the controller
                currentEvent = module.coerceEvent('did-receive-request', {
                    url:        url,
                    request:    req,
                    response:   res,
                    theme:      theme,
                    route:      _route,
                    router:     router,
                    view:       view,
                    controller: _route.controller,
                    callback:   _route.callback,
                    routes:     app.routes
                });

                return module.emit(currentEvent);


            }).then(function (e) {


                if (e.active) {

                    return when(e.get('callback')(e)).then(function (response) {

                        //in case the theme has been modified
                        theme = e.get('theme');

                        return response;

                    });

                } else {
                    return e.get('body');
                }


            }).then(function (results) {

                //we may not emit this event
                var event = module.coerceEvent('will-render-theme', {
                    body:     results,
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });

                if (theme) {

                    currentEvent = event;
                    return module.emit(event);

                } else {

                    return event;

                }


            }).then(function (e) {

                var body = e.get('body'),
                    theme;

                //if there is a theme, set its body and render it
                if (e.get('theme') && _.isString(body)) {

                    body = e.get('theme').setBody(body).render();

                } else {

                    //clear out the theme if we are responding with an object (so did-render-theme will not hit)
                    theme = null;

                }

                return when(body);


            }).then(function (results) {

                //we may not emit this event
                var event = module.coerceEvent('did-render-theme', {
                    body:     results,
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });

                if (theme) {

                    currentEvent = event;
                    return module.emit(event);

                } else {

                    return event;

                }


            }).then(function (e) {

                currentEvent = module.coerceEvent('will-send-response', {
                    body:     e.get('body'),
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });

                return module.emit(currentEvent);


            }).then(function (e) {

                var body = e.get('body');

                if (!res.beenSent()) {
                    res.send(body);
                }

                currentEvent = module.coerceEvent('did-send-response', {
                    body:     body,
                    path:     url,
                    request:  req,
                    response: res,
                    route:    _route,
                    router:   router,
                    routes:   app.routes
                });

                return module.emit(currentEvent);

            }).otherwise(this.hitch(function (err) {

                this.onError(err, currentEvent);

            }));


        },

        onError: function (err, e) {

            this.log(err);

            var response = e && e.get('response'),
                theme    = e && e.get('theme');

            if (response) {

                response.setStatus(500);

                //if there is a theme, ouput the stack for now
                if (theme) {

                    response.send(err.stack);

                }
                //no theme, send back an object
                else {

                    response.send({
                        error: err.message
                    });

                }

            }


        },

        /**
         * Starts the server.
         *
         * @returns {*}
         */
        execute: function () {

            this.deferred = new this.Deferred();

            try {

                if (this.get('port')) {

                    this.log('starting alfred on port ' + this.get('port'));
                    this._server = http.createServer(this._app);
                    this._server.on('error', hitch(this, function (err) {
                        this.onError(err);
                        this.deferred.reject(err);
                    }));

                    if (this.get('listenOnStart')) {
                        this._server.listen(this.get('port'), this.get('domain'));
                    }
                }

                if (this.ssl) {

                    this.log('starting ssl alfred on port ' + this.get('sslPort'));
                    this._sslServer = https.createServer(this.ssl, this._app);
                    this._sslServer.on('error', hitch(this, function (err) {
                        this.onError(err);
                        this.deferred.reject(err);
                    }));

                    if (this.get('listenOnStart')) {
                        this._sslServer.listen(this.get('sslPort'), this.get('domain'));
                    }

                }


            } catch (e) {
                this.log(e);
                this.deferred.reject(e);
            }

            return this.inherited(arguments);
        },

        /**
         * The http server I am using.
         *
         * @returns {httpServer}
         */
        http: function () {
            return this._server;
        },

        /**
         * The htts server I am using
         *
         * @returns {null}
         */
        https: function () {
            return this._sslServer;
        },

        /**
         * Close the server.
         *
         * @returns {*}
         */
        teardown: function () {

            this.log('tearing down server');

            var all = [this.promise(this._server, 'close')];

            if (this._sslServer) {
                all.push(this.promise(this._sslServer, 'close'));
            }

            return this.all(all);

        }

    });

});
