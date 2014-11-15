define(['dojo/_base/declare',
    'apollo/propertytypes/_Base',
    'altair/plugins/node!path'],

    function (declare,
              _Base,
              pathUtil) {


        return declare([_Base], {


            key:     'file',
            options: {
                uploadDir: {
                    type:    'path',
                    options: {
                        label:       'Upload Directory',
                        description: 'Where should uploaded files be placed?'
                    }
                }
            },


            /**
             * Not quite sure what to do here yet
             *
             * @param value
             * @param options
             * @param config
             * @returns {*}
             */
            toJsValue: function (value, options, config) {

                var abs = this.parent.resolveUploadedFilePath(value);

                return {
                    absolute: abs,
                    public: this.parent.resolveUploadedFilePath(value, { public: true, absolute: false }),
                    relative: this.parent.resolveUploadedFilePath(value, { absolute: false }),
                    filename: pathUtil.basename(abs)
                };
            },

            toHttpResponseValue: function (value, options, config) {

                var v = this.toJsValue(value, options, config),
                    host;

                delete v.absolute;

                //if we have a request, lets build a full uri for the image
                if(options.request) {

                    host    = options.request.header('host');
                    v.uri   = 'http://' + host + v.public; //@TODO proper protocol

                } else {
                    this.log(this + ' does not have a request in it\'s options.');
                }

                return v;

            },

            template: function (options) {
                return 'liquidfire:Files/views/file';
            },

            toDatabaseValue: function (value) {
                return value;
            },

            fromFormSubmissionValue: function (value, options, config) {

                if (value && value.size > 0) {

                    return this.parent.forge('file/Mover').then(function (mover) {

                            return mover.place(value.path);

                        }.bind(this)).then(function (results) {

                        return results.relative;

                    });

                }
                //is there an old value
                else if(config && config.old) {
                    return config.old;
                }
                //if there is no image and it's not
                else {
                    return null;
                }

            }

        });

    });
