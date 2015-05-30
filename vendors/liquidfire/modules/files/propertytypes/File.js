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

                if (_.isObject(value) && value.relative) {
                    value = value.relative;
                }

                var abs = this.parent.resolveUploadedFilePath(value);

                return {
                    absolute: abs,
                    public: this.parent.resolveUploadedFilePath(value, { public: true, absolute: false }),
                    relative: value,
                    filename: pathUtil.basename(abs)
                };
            },

            toHttpResponseValue: function (value, options, config) {

                var v = this.toJsValue(value, options, config);

                //don't expose the full path
                delete v.absolute;

                return v;


            },

            toSocketValue: function (value, options, config) {

                return this.toHttpResponseValue(value, options, config);

            },

            template: function (options) {
                return 'liquidfire:Files/views/file';
            },

            toDatabaseValue: function (value) {

                if (value && value.relative) {
                    return value.relative;
                }

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
                //was submitted as is
                else if (value && value.relative) {
                    return value.relative;
                }
                //is there an old value
                else if(config && config.old) {
                    return config.old;
                }
                //if there is no file and it's not
                else {
                    return null;
                }

            }

        });

    });
