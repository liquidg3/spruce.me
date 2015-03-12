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

                this.assert(options, 'You must configure the message model');

                this._userStore     = options.userStore;
                this._messageStore  = options.messageStore;

                this.assert(this._userStore, 'You must pass a user store to the message model');
                this.assert(this._messageStore, 'You must pass a message store to the message model');

                return this.inherited(arguments);

            },


            sendMessage: function (to, from, message, photo, meta) {

                var message = this._messageStore.create({
                    to:         to,
                    from:       from,
                    message:    message,
                    photo:      photo
                });

                message.meta = meta;

                return message.save();

            },

            /**
             * Send a welcome message to a new recruit
             *
             * @param to
             */
            sendWelcomeMessage: function (to) {

                return this._userStore.findOne().where('email', '===', 'becca@spruce.me').execute().then(function (becca) {

                    return this.sendMessage(to, becca, 'Welcome to the Spruce Selfie Review App. We designed this app for men who are looking for a little feedback on their clothes before that big date, big interview, or whenevs.');

                }.bind(this));

            }

        });

    });