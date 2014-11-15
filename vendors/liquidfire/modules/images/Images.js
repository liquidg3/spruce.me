define(['altair/facades/declare',
        'liquidfire/modules/apollo/mixins/_HasPropertyTypesMixin',
        'altair/modules/adapters/mixins/_HasAdaptersMixin',
        'altair/plugins/node!path'
], function (declare,
             _HasPropertyTypesMixin,
             _HasAdaptersMixin,
             pathUtil) {

    return declare([_HasPropertyTypesMixin, _HasAdaptersMixin], {


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

            //only serve if we have a public uri set
            if(this.get('publicThumbnailUri') && this.get('thumbnailDir')) {
                var server = e.get('server');
                server.serveStatically(this.get('thumbnailDir'), this.get('publicThumbnailUri'));
            }

        },


        /**
         * Render a thumbnail using the selected adapter (if one in
         * @param path
         * @param options
         * @param config
         * @returns {*}
         */
        renderThumb: function (path, options, config) {

            var adapter = this.adapter();

            if(!adapter) {
                throw new Error('No image adapter selected (for thumbnail rendering).');
            }

            return adapter.renderThumb(path, options, config);
        },

        /**
         * Find a thumbnail by name and some options
         *
         * @param file
         * @param options { public: true\false, absolute: true\false }
         * @returns {*}
         */
        resolveThumbnailFilePath: function (file, options) {

            var path,
                _options = options || {};

            if(_options.public) {
                path = pathUtil.join(this.get('publicThumbnailUri', null, options), file);
            } else {
                path = pathUtil.join(this.get('thumbnailDir', null, options), file);
            }

            return path;
        }

    });

});