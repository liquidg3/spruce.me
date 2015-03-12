define(['altair/facades/declare',
        'altair/plugins/node!crypto',
        'lodash'],

    function (declare,
              crypto,
              _) {

        "use strict";

        return declare(null, {

            /**
             * Generate a hash for the user's token
             * @returns {string}
             */
            generate: function () {
                return crypto.randomBytes(20).toString('hex');
            }

        });

    });