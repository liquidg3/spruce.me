define(['altair/facades/declare',
        'titan/modules/alfred/models/App',
        'altair/plugins/node!cookies'
], function (declare,
             App,
             Cookies) {

    return declare([App], {

        //extra controllers
        socketController: null,

        //stores and models
        _userStore: null,
        _roleModel: null,
        messageModel: null,

        startup: function () {

            this.deferred = this.all({
                _roleModel: this.model('Role'),
                _permModel: this.model('Permission'),
                _userStore: this.entity('User'),
                _messageStore: this.entity('Message'),
            }).then(function (deps) {

                declare.safeMixin(this, deps);

                //save the role & permission model to nexus
                this._nexus.set('roles', this._roleModel);
                this._nexus.set('perms', this._permModel);
                this.messageModel = this.model('Message', {
                    userStore:      this._userStore,
                    messageStore:   this._messageStore
                });

                //make message model available everywhere
                this._nexus.set('message', this.messageModel);

                return this;

            }.bind(this));

            return this.inherited(arguments);

        },

        onDidExecuteServer: function (options) {

            //setup the socket controller
            this.controllerFoundry.forgeController('spruce:*/controllers/Socket', {}, { parent: this }).then(function (socketController) {
                this.socketController = socketController;
            });

            return this.inherited(arguments);

        },

        onDidReceiveRequest: function (e) {

            //cookies
            var cookies = new Cookies(e.get('request').raw(), e.get('response').raw());
            e.set('cookies', cookies);

            //set current user to the event
            return this.fetchCurrentUser(e).then(function (user) {
                e.set('user', user);
            });

        },

        /**
         * Gets the currently logged in user by token or cookie
         *
         * @param e
         * @returns {*}
         */
        fetchCurrentUser: function (e) {

            var cookies = e.get('cookies'),
                request = e.get('request'),
                header  = request.header('Authorization'),
                response,
                token = header ? header.split(' ').pop() : cookies.get('token');

            if (token) {
                response = this._userStore.findOneByToken(token).execute();
            }

            return this.when(response);


        }

    });

});