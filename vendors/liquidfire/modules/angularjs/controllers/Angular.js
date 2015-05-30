define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        startup: function (options) {


            this._mover = this.forgeSync('liquidfire:Files/file/Mover');

            //pass call to parent
            return this.inherited(arguments);

        },

        upload: function (e) {

            var values = e.get('request').post(),
                request = e.get('request'),
                response = e.get('response');

            if (!values.file || !values.file.size || !values.file.path) {

                response.setStatus(401);

                return {
                    error: "You must select a file."
                };


            } else {

                return this._mover.place(values.file.path).then(function (file) {

                    return {
                        relative: file.relative,
                        public: file.public
                    };

                }).otherwise(function (err) {

                    response.setStatus(401);
                    return {
                        error: err.message
                    };

                });

            }

        }


    });

});