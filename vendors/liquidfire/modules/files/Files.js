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

        },

        /**
         * Helps you find the path to uploaded files (or their publicy accessible path)
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

            if(_options.public) {
                path = pathUtil.join(this.get('publicUploadUri', null, options), file);
            } else {
                path = pathUtil.join(this.get('uploadDir', null, options), file);
            }

            return path;
        }

    });

});