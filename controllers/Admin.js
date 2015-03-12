define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        _userStore:     null,
        _password:      null,
        _userUpdater:   null,

        startup: function (options) {

            //all events pertaining to a request are passed through titan:Alfred. See titan:Alfred/package.json for
            //a description of all events available.
            this.on('titan:Alfred::did-receive-request', {
                'controller': this
            }).then(this.hitch('onDidReceiveRequest'));

            this.defered = this.all({
                _userStore:         this.entity('User'),
                _password:          this.model('Password')
            }).then(function (deps) {

                declare.safeMixin(this, deps);

                //the updater
                this._userUpdater = this.model('UserUpdater', {
                    userStore: this._userStore,
                    password:  this._password
                });

                return this;

            }.bind(this));

            //pass call to parent
            return this.inherited(arguments);

        },

        /**
         * Authorize user sending current request
         *
         * @param e
         * @returns {*}
         */
        authorizeUser: function (e) {

            var route   = e.get('route'),
                user    = e.get('user');

            //if there is no valid user token and there should be, do a redirect to the login page
            if (!user && route.authorize !== false) {

                var back = e.get('url');

                e.get('response').redirect('/admin?r=' + encodeURIComponent(back));
                e.preventDefault();

            }

            return this.when(user);



        },


        /**
         * Some stuff we do on every page
         *
         * @param e
         * @returns {*}
         */
        onDidReceiveRequest: function (e) {

            //i'm getting the theme for the request
            var theme = e.get('theme');

            theme.set('errors', false)
                 .set('messages', false);

            //drop in all the css
            theme.headLink().append('/public/css/admin/plugins.css');
            theme.headLink().append('/public/css/admin/main.css');
            theme.headLink().append('/public/css/admin/themes.css');
            theme.headLink().append('/public/js/bower_components/ngDialog/css/ngDialog.min.css');
            theme.headLink().append('/public/less/admin.less');

            //drop in our js
            theme.headScript().append('/public/js/bower_components/ngDialog/js/ngDialog.min.js');
            theme.headScript().append('/public/js/bower_components/moment/moment.js');
            theme.headScript().append('/public/_angular/bower_components/ng-file-upload-shim/angular-file-upload-shim.min.js');
            theme.headScript().append('/public/_angular/bower_components/ng-file-upload-shim/angular-file-upload.min.js');
            theme.headScript().append('/public/_angular/bower_components/angular-route/angular-route.js');
            theme.headScript().append('/public/js/admin/jquery-1.11.1.min.js');
            theme.headScript().append('/public/js/admin/bootstrap.min.js');
            theme.headScript().append('/public/js/admin/plugins.js');
            theme.headScript().append('/public/js/admin/admin-controllers.js');

            //authorize user
            this.authorizeUser(e);

            var user = e.get('user');

            theme.set('user', user && user.values || {});

            if (user && e.get('view')) {
                e.get('view').set('user', user.values);
            }



        },

        /**
         * Login page
         *
         * @param e
         * @returns {*}
         */
        index: function (e) {

            var request     = e.get('request'),
                response    = e.get('response'),
                theme       = e.get('theme'),
                redirect    = request.get('r') || '/admin/dashboard',
                email       = '',
                values;

            //are we already logged in?
            if (e.get('user')) {
                response.redirect('/admin/dashboard');
                return;
            }

            //attempt to login
            if (request.method() == 'POST') {

                values = request.post();
                email  = values.email;

                return this._userStore.findOne().where('email', '===', email).execute().then(function (user) {

                    if (user) {

                        return this._password.compare(values.password, user.get('password')).then(function (match) {

                            if (match) {
                                return user;
                            }

                        });

                    }

                }.bind(this)).then(function (user) {

                    if (!user) {

                        response.setStatus(400);
                        theme.set('errors', [ 'Invalid Login' ]);

                        return e.get('view').render({
                            email: email
                        });

                    } else {

                        var token = user.get('token'),
                            cookies = e.get('cookies');

                        cookies.set('token', token);

                        response.redirect(redirect);

                    }

                });

            }

            return e.get('view').render({
                email:      email
            });

        },

        logout: function (e) {

            var cookies     = e.get('cookies'),
                response    = e.get('response');

            cookies.set('token' , '');

            response.redirect('/admin');

        },

        dashboard: function (e) {

            return '';

        }

    });

});