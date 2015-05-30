define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        _userStore:         null,
        _tokenGenerator:    null,
        _messageModel:      null,
        _messageStore:      null,
        _password:          null,
        _search:            null,

        startup: function (options) {

            this.on('titan:Alfred::did-receive-request', {
                'controller': this
            }).then(this.hitch('onDidReceiveRequest'));

            this.defered = this.all({
                _userStore:         this.entity('User'),
                _messageStore:      this.entity('Message'),
                _tokenGenerator:    this.model('TokenGenerator'),
                //_password:          this.model('Password'),
                _permission:        this.nexus('perms'),
                _search:            this.model('liquidfire:Spectre/models/Search', null, { parent: this })
            }).then(function (deps) {

                declare.safeMixin(this, deps);

                this._messageModel = this.nexus('message');

                return this;

            }.bind(this));

            //pass call to parent
            return this.inherited(arguments);

        },

        /**
         * For every new request, clear out the theme and optionally authorize against the current user
         *
         * @param e
         * @returns {*|Promise}
         */
        onDidReceiveRequest: function (e) {

            //there is never a theme for these pages
            e.set('theme', null);

            //load up cookies
            if (e.get('route').authorize === true) {
                return this.authorizeUser(e);
            }

        },

        /**
         * Signup a user
         *
         * @param e
         * @returns {*}
         */
        signup: function (e) {

            var request     = e.get('request'),
                response    = e.get('response'),
                values      = request.post(),
                createUser  = false,
                newUser     = false,
                statement;


            if(!values || (!values.deviceId && !values.email)) {

                response.setStatus(403);

                return {
                    error: 'You must pass me a deviceId to sign up.'
                }
            }

            statement = this._userStore.findOne();

            //was an email passed, i'm going to assume a password as well?
            if (values.email) {

                statement = statement.where('email', '===', values.email).execute().then(function (user) {

                   if (user) {

                       return this._password.compare(values.password, user.get('password')).then(function (match) {

                           if (match) {
                               return user;
                           }

                       })

                   }

                }.bind(this));


            } else {

                createUser  = true;
                statement   = statement.where('deviceId', '===', values.deviceId).execute();

            }

            return statement.then(function (user) {

                if (!user && createUser) {

                    user = this._userStore.create({
                        deviceId: values.deviceId,
                        name: 'Anonymous'
                    });

                    newUser = true;

                    return user;

                } else {

                    return user;

                }

            }.bind(this)).then(function (user) {

                if (!user) {
                    throw new Error('Invalid Login.');
                }

                //generate token
                var token = this._tokenGenerator.generate();
                user.set('token', token);

                return user.save();

            }.bind(this)).then(function(user) {


                //send welcome message
                if (newUser) {
                    this._messageModel.sendWelcomeMessage(user);
                }

                return user.getHttpResponseValues(e);

            }.bind(this)).otherwise(function (err) {

                this.log('signup error');

                response.setStatus(500);

                return {
                    error: err.message
                };

            }.bind(this));


        },

        /**
         * Will do logged-in user checks or bail on bad token
         *
         * @param e
         * @returns {*|Promise}
         */
        authorizeUser: function (e) {

            var user = e.get('user');

            //if there is no valid user token, respond with 401
            if (!user) {
                e.get('response').setStatus(401);
                e.set('body', { error: 'Login is required.' });
                e.preventDefault();
            }

            return user;

        },

        /**
         * Gets the current user by token.
         *
         * @param e
         * @returns {altair.Deferred|*}
         */
        fetchCurrentUser: function (e) {

            var request = e.get('request'),
                header = request.header('Authorization'),
                token = header ? header.split(' ').pop() : false,
                contact;

            if (!token) {

            }

            if (token) {
                contact = this._userStore.findOneByToken(token).execute();
            }

            return this.when(contact);

        },

        messageUser: function (e) {

            var req = e.get('request'),
                res = e.get('response'),
                post = req.post(),
                body = post.body,
                photo   = post.photo,
                id  = req.get('id');

            if (!body) {
                res.setStatus(401);
                return {
                    error: 'You must supply a message.'
                };
            }

            return this._userStore.findOne().where('_id', '===', id).execute().then(function (user) {

                if (!user) {

                    res.setStatus(404);
                    return {
                        error: 'Could not find recipient.'
                    }

                }

                return this._messageModel.sendMessage(user, e.get('user'), body, photo, {
                    loggedInUser: e.get('user')
                });

            }.bind(this)).then(function (message) {

                return message.getHttpResponseValues(e);

            });


        },

        /**
         * Retrieve a user's profile
         *
         * @param e
         * @returns {*}
         */
        profile: function (e) {

            var user    = e.get('user'),
                values  = user.getHttpResponseValues(e);

            delete values.password;
            delete values.token;

            return values;

        },

        /**
         * Update a user's profile
         *
         * @param e
         * @returns {{error: string}}
         */
        updateProfile: function (e) {

            var values      = e.get('request').post(),
                response    = e.get('response'),
                dfd,
                perms           = this._permission,
                user            = e.get('userToUpdate', e.get('user')),
                loggedInUser    = e.get('user');

            //these things can never be updated
            delete values._id;
            delete values.version;
            delete values.token;

            //can the logged in user update roles?
            if (!perms.canSetRole(loggedInUser)) {
                delete values.role;
            }

            if (values.password) {

                if (values.password !== values.password2) {

                    response.setStatus(400);

                    return { error: 'Your passwords do not match.' };

                } else {

                    dfd = this._password.crypt(values.password);

                }

            } else {

                dfd = new this.Deferred();
                dfd.resolve();

                delete values.password;
                delete values.password2;
            }

            dfd.then(function (password) {

                if (password) {
                    values.password = password;
                }

                return user.mixin(values, null, { methods: ['fromHttpRequestValue', 'fromFormSubmissionValue', 'noop'] });

            }).then(function (user) {

                return user.validate();

            }).then(function (user) {

                return user.save();


            }.bind(this)).then(function () {

                return this.profile(e);

            }.bind(this)).otherwise(function (err) {

                response.setStatus(403);

                return {
                    error: _.isArray(err) ? err[0] : err.message
                };

            });

        },

        /**
         * Update a random user
         * @param e
         */
        updateUser: function (e) {

            var values = e.get('request').post();

            return this._userStore.findOne().where('_id', '===', values._id).execute().then(function (user) {

                if (user) {

                    e.set('userToUpdate', user);

                    return this.updateProfile(e);

                } else {

                    return {
                        error: 'No user found'
                    }

                }

            }.bind(this));



        },

        /**
         * Searching against users.
         *
         * @param e
         * @returns {*}
         */
        users: function (e) {

            return this._search.findFromEvent('User', e, {
                transform: function (entity) {

                    var values = entity.getHttpResponseValues(e);

                    delete values.password;
                    delete values.token;

                    return values;

                }
            });
        },

        avatarForUser: function (e) {

            var request = e.get('request'),
                id = request.get('id'),
                response = e.get('response');

            return this._userStore.findOne().where('_id', '===', id).execute().then(function (user) {

                if (!user) {
                    response.setStatus(404);
                    return '';
                } else {


                    var url = '/v1/images/thumb?file=' + user.values.image + '&w=' + request.get('w', 500) + '&h=' + request.get('h', 500);

                    response.redirect(url);

                }

            });


        }

    });

});