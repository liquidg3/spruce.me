define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/mixins/_AssertMixin',
        'lodash'],

    function (declare,
              Lifecycle,
              _AssertMixin,
              _) {


        return declare([Lifecycle, _AssertMixin], {

            startup: function (options) {

                var _options = options || this.options || {};

                this._userStore = _options.userStore;
                this._password  = _options.password;

                this.assert(this._userStore, 'You must pass the user updater model a user store.');
                this.assert(this._password, 'You need a password model.');

                return this.inherited(arguments);

            },

            update: function () {

                return this._userStore.find().execute().then(function (cursor) {

                    cursor.each().step(function (user) {

                        //only update version 0's without passwords
                        if (user.get('password') && user.get('version', 0) < 1) {

                            this._password.crypt(user.get('password')).then(function (password) {

                                user.set('version', 1);
                                user.set('password', password);
                                user.save();


                            });

                        }

                    }.bind(this));

                }.bind(this));


            }

        });

    });