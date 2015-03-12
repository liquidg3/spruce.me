define(['altair/facades/declare',
        'altair/mixins/_DeferredMixin',
        'altair/plugins/node!bcrypt',
        'lodash'],

    function (declare,
              _DeferredMixin,
              bcrypt,
              _) {

        "use strict";

        return declare([_DeferredMixin], {

            /**
             * Generate a hash for the user's token
             * @returns {string}
             */
            crypt: function (password) {

                //return this.
                return this.promise(bcrypt, 'genSalt', 10).then(function (salt) {

                    return this.promise(bcrypt, 'hash', password, salt);

                }.bind(this));

                //bcrypt.genSalt(10, function (err, salt) {
                //    if (err)
                //        return callback(err);
                //
                //    bcrypt.hash(password, salt, function (err, hash) {
                //        return callback(err, hash);
                //    });
                //
                //});
            },

            compare: function (password, hash) {
                return this.promise(bcrypt, 'compare', password, hash);
            }

        });

    });