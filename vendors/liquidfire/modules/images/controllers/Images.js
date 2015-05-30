define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/events/Emitter',
        'altair/plugins/node!fs'
], function (declare, Lifecycle, Emitter, fs) {

    return declare([Lifecycle, Emitter], {

        generateThumb: function (e) {

            var values  = e.get('request').query(),
                request = e.get('request'),
                path,
                height  = Math.min(values.h, 500),
                width   = Math.min(values.w, 500),
                response = e.get('response');

            if (!values.file) {

                response.setStatus(422);

                return {
                    error: "You must pass a file."
                };


            } else {

                path = this.nexus('liquidfire:Files').resolveUploadedFilePath(values.file);

                return this.nexus('liquidfire:Images').renderThumb(path, {
                        w: width,
                        h: height
                }).then(function (thumb) {

                    response.redirect(thumb.public);

                }.bind(this)).otherwise(function (err) {

                    this.err('Image upload failed');
                    this.err(err);

                    response.setStatus(500);

                    return {
                        error: 'I could not find the file "' + values.file + '".'
                    };

                }.bind(this));


            }

        }


    });

});