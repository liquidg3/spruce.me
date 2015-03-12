define(['altair/facades/declare',
        'altair/Lifecycle',
        'lodash',
        'altair/events/Emitter'
], function (declare, Lifecycle, _, Emitter) {

    return declare([Lifecycle, Emitter], {

        _channels:      {}, //chat channels grouped by user id
        _userStore:     null,
        _messageStore:  null,
        _search:        null,
        _messageModel:  null,
        _fileMover:     null, //help us move files into place
        startup: function (options) {

            //listeners
            this.on('liquidfire:Sockets::did-connect').then(this.onDidReceiveConnection.bind(this));
            this.on('liquidfire:Spectre::did-save-entity', {
                'entity.name': 'spruce:*/entities/Message'
            }).then(this.onDidSaveMessage.bind(this));

            this.defered = this.all({
                _userStore:     this.entity('User'),
                _messageStore:  this.entity('Message'),
                _search:        this.model('liquidfire:Spectre/models/Search', null, { parent: this }),
                _fileMover:     this.forge('liquidfire:Files/file/Mover')
            }).then(function (deps) {

                declare.safeMixin(this, deps);

                this._messageModel = this.nexus('message');

                return this;

            }.bind(this));


            //pass call to parent
            return this.inherited(arguments);

        },

        /**
         * Someone connected.
         *
         * @param e
         */
        onDidReceiveConnection: function (e) {

            var connection = e.get('connection');

            connection.on('authenticate', this.hitch('authenticate', connection));
            connection.on('un-subscribe-all', this.hitch('unSubscribeAll', connection));
            connection.on('un-subscribe', this.hitch('unSubscribe', connection));
            connection.on('disconnect', this.hitch('onDisconnect', connection));
            connection.on('subscribe', this.hitch('subscribe', connection));
            connection.on('messages', this.hitch('messages', connection));
            connection.on('message', this.hitch('message', connection));
            connection.on('user', this.hitch('userById', connection));

        },

        /**
         * Authenticate a user on a socket connection
         *
         * @param connection
         * @param data
         * @param cb
         */
        authenticate: function (connection, token, cb) {

            this._userStore.findOneByToken(token).execute().then(function (user) {

                if (user) {

                    connection.user = user;
                    cb(null, true);

                } else {

                    cb('Invalid token');

                }

            });


        },

        /**
         * Subscribe to a chat "channel" (just a user for now)
         *
         * @param connection
         * @param data
         * @param cb
         */
        subscribe: function (connection, id, cb) {

            if (!this._channels[id]) {
                this._channels[id] = [];
            }

            this.unSubscribe(connection, id, function () {

                this._channels[id].push(connection);

                if (cb) {
                    cb();
                }

            }.bind(this));



        },

        unSubscribe: function (connection, id, cb) {

            if (this._channels[id]) {

                this._channels[id] = _.filter(this._channels[id], function (con) {
                    return con !== console;
                })

            }

            if (cb) {
                cb();
            }

        },

        unSubscribeAll: function (connection, cb) {


            var clean = {};

            _.each(this._channels, function (cons, id) {

                clean[id] = _.filter(cons, function (item) {
                    return item !== connection;
                });

            }, this);

            this._channels = clean;

            if (cb) {
                cb();
            }

        },

        onDisconnect: function (connection) {

            this.unSubscribeAll(connection);
        },

        onDidSaveMessage: function (e) {

            var message = e.get('entity'),
                meta    = message.meta || {},
                ignoreConnection = meta.connection, //ignore any connection set on the message (they are the senders)
                ids     = [message.values.to, message.values.from],
                values;

            //is anyone subscribed to the "to" or the "from"?
            for(var k in ids) {

                var id = ids[k];

                if (this._channels[id]) {

                    values = values || message.getSocketValues();

                    _.each(this._channels[id], function (connection) {

                        if (connection !== ignoreConnection) {

                            connection.emit('message', {
                                message: values
                            });
                        }


                    });

                }


            }

        },

        /**
         * All messages to and from the current user.
         *
         * @param connection
         * @param options
         * @param cb
         */
        messages: function (connection, options, cb) {

            if (!connection.user) {
                cb('You must be logged in to view messages');
                return;
            }

            if (!cb) {
                this.log('messages missing callback!');
                return;
            }

            var userId = options.user || connection.user.get('_id');

            //someone is viewing someone else's messages
            if (options.user && !this.nexus('perms').canViewOtherUsersMessages(connection.user)) {
                cb('You do not have permissions.');
                return;
            }

            this._search.find('Message', {
                sort: {
                    dateSent: 'DESC'
                },
                page: options.page || 0,
                perPage: options.perPage || 25,
                query: {
                    '$OR': [
                        { to: userId },
                        { from: userId }
                    ]
                },
                transform: function (message) {
                    return message.getSocketValues();
                }
            }).then(function (response) {

                //this is to save the hassle for all the clients... we always
                //expect newest at the bottom in a chat
                response.results.reverse();

                cb(null, response);

            }).otherwise(function (err) {
                cb(err.message);
            });

        },

        userById: function (connection, id, cb) {

            //no callback or ID means bail
            if (!cb || !id) {
                return;
            }

            return this._userStore.findOne().where('_id', '===', id).execute().then(function (user) {

                var values;

                if (user) {
                    values = user.getSocketValues();
                    delete values.password;
                    delete values.token;
                }

                cb(null, { user: values });

            });

        },

        /**
         * Send a message
         *
         * @param connection
         * @param data
         * @param cb
         * @returns {*}
         */
        message: function (connection, data, cb) {

            //construct message
            var to      = data.to,
                from    = connection.user,
                body    = data.body,
                image   = data.image,
                dfd;


            //save image if we have to
            if (image) {
                dfd = this._fileMover.saveBase64(image, '.jpg');
            }

            return this.when(dfd).then(function (photo) {

                //send message, pass through connection so it is not included in broadcast
                return this._messageModel.sendMessage(to, from, body, photo, {
                    connection: connection
                });

            }.bind(this)).then(function (message) {

                var values = message.getSocketValues();

                cb(null, values);

            }).otherwise(function (err) {

                cb(err.message);

            });

        }



    });

});