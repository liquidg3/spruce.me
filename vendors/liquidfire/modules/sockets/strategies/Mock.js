define(['altair/facades/declare',
        './_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        /**
         * Setup the socket adapter.
         *
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            this.log('mock socket startup');

            return this.inherited(arguments);

        },

        /**
         * Attach to and start http server if one is not started.
         */
        execute: function () {

            this.parent.log('executing mock socket');

        },

        /**
         * @param message string message directly from sockjs
         */
        onMessage: function (message) {

            this.parent.log('message' + message);


        }


    });

});