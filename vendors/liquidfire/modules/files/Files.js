define(['altair/facades/declare',
        'liquidfire/modules/apollo/mixins/_HasPropertyTypesMixin',
        'altair/mixins/_AssertMixin',
        'apollo/_HasSchemaMixin',
        'lodash',
        'altair/plugins/node!path'
], function (declare,
             _HasPropertyTypesMixin,
             _AssertMixin,
             _HasSchemaMixin,
             _,
             pathUtil) {

    return declare([_HasPropertyTypesMixin, _HasSchemaMixin, _AssertMixin], {


        startup: function (options) {

            //when Alfred starts, lets share our upload dir
            this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteAlfredWebServer'));

            return this.inherited(arguments);

        },

        /**
         * When Alfred starts, lets share our thumbnails dir
         *
         * @param e
         */
        onDidExecuteAlfredWebServer: function (e) {

            //only share publically if we have an upload uri set
            if (this.get('publicUploadUri') && this.get('uploadDir')) {
                var server = e.get('server');
                server.serveStatically(this.get('uploadDir'), this.get('publicUploadUri'));
            }

            if (!this.get('fileHost')) {

                var port        = e.get('app').options.sslPort || e.get('app').options.port,
                    protocol    = e.get('app').options.sslPort ? 'https' : 'http',
                    host        = protocol + '://' + e.get('app').options.domain;

                if (port !== 80 && port !== 443) {
                    host += ':' + port;
                }

                this.set('fileHost', host);

            }

        },

        /**
         * Helps you find the path to uploaded files (or their publicy accessible path if options { public: true } )
         *
         * @param file
         * @param options
         * @returns {*}
         */
        resolveUploadedFilePath: function (file, options) {

            this.assert(this.get('publicUploadUri'), 'You must set publicUploadDirectory on liquidfire:Files')
            this.assert(this.get('uploadDir'), 'You must set uploadDir on liquidfire:Files')

            var path,
                _options = options || {};

            if(!_.isString(file)) {
                return null;
            }


            //they want a publically accessible uri
            if(_options.public) {

                _options.absolute = false;

                //my absolute best guess on how to handle a path relative to the app that
                //is also publically available
                if (file[0] === '.') {

                    path = this.nexus('Altair').resolvePath(file);

                    //this comes back as /public/_uploads by default
                    var pub = this.get('publicUploadUri', null),
                        parts = pub.split('/'),
                        publicFolderName = parts[0] || parts[1]; //first non-empty folder name

                    //split by top level public folder (assumed public by default) and add onto it anything in the last part
                    path = '/' + publicFolderName + path.split(publicFolderName).pop(); //this should leave us with whatever is past the public facing side


                } else {

                    path = pathUtil.join(this.get('publicUploadUri', null, options), file);

                }

                path = this.get('fileHost') + path;

            } else {

                //if file starts with a . then lets look relative to the current app vs the upload dir
                if (file[0] === '.') {

                    path = (_options.absolute) ? this.nexus('Altair').resolvePath(file) : file;

                } else {

                    path = pathUtil.join(this.get('uploadDir', null, options), file);

                }


            }

            return path;
        }

    });

});