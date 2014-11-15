define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        _userStore: null,
        startup: function (options) {

            this.on('titan:Alfred::did-receive-request', {
                'controller': this
            }).then(this.hitch('onDidReceiveRequest'));

            this.defered = this.all({
                _userStore: this.entity('User')
            }).then(function (deps) {

                declare.safeMixin(this, deps);

                return this;

            }.bind(this));

            //pass call to parent
            return this.inherited(arguments);

        },

        onDidReceiveRequest: function (e) {

            //there is never a theme for these pages
            e.set('theme', null);

        },

        signup: function (e) {

            var request     = e.get('request'),
                response    = e.get('response'),
                values      = request.post();


            if(!values || !values.deviceId) {

                response.setStatus(403);

                return {
                    error: 'You must pass me a deviceId to sign up.'
                }
            }

            return this._userStore.findOne().where('deviceId', '===', values.deviceId).execute().then(function (user) {

                if (!user) {

                    user = this._userStore.create({
                        deviceId: values.deviceId,
                        name: 'Anonymous'
                    });

                    return user.save();

                } else {

                    return user;

                }

            }.bind(this)).then(function (user) {

                return this._entityValues(user, e);

            }.bind(this)).otherwise(function (err) {

                this.log('signup error');
                this.log(err)

                response.setStatus(500);

                return {
                    error: err.message
                };

            }.bind(this));


        },

        _entityValues: function (entity, e) {
            return entity.getValues({ '*': { request: e.get('request') }}, { methods: ['toHttpResponseValue', 'toDatabaseValue', 'toJsValue']});
        },

        messages: function (e) {

        }

    });

});