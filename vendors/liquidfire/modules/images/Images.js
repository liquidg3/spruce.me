define(['altair/facades/declare',
        'liquidfire/modules/apollo/mixins/_HasPropertyTypesMixin',
        'altair/modules/adapters/mixins/_HasAdaptersMixin',
        'altair/plugins/node!path',
        'altair/mixins/_AssertMixin'
], function (declare,
             _HasPropertyTypesMixin,
             _HasAdaptersMixin,
             pathUtil,
             _AssertMixin) {

    return declare([_HasPropertyTypesMixin, _HasAdaptersMixin, _AssertMixin], {


        startup: function (options) {

            var _options = options || this.options || {};

            //when Alfred starts, lets share our upload dir
            this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteAlfredWebServer'));

            //setup endpoint for the thumb generator
            this.on('titan:Alfred::will-execute-app').then(this.hitch('onWillExecuteAlfredApp'));

            return this.inherited(arguments);

        },

        /**
         * Setup the alfred route to generate thumbs.
         *
         * @param e
         */
        onWillExecuteAlfredApp: function (e) {

            var options = e.get('options');

            options.routes['/v1/images/thumb'] = {
                action: 'liquidfire:Images/controllers/Images::generateThumb',
                layout: false
            };

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

            try {
                return adapter.renderThumb(path, options, config);
            } catch (e) {
                var dfd = new this.Deferred();
                dfd.reject(e);
                return dfd;
            }
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

            this.assert(this.get('publicThumbnailUri'), 'You must set a publicThumbnailUri in your modules.json to generate thumbnails.');
            this.assert(this.get('thumbnailDir'), 'You must set a thumbnailDir in your modules.json to generate thumbnails.');


            if(_options.public) {
                path = pathUtil.join(this.get('publicThumbnailUri', null, options), file);
            } else {
                path = pathUtil.join(this.get('thumbnailDir', null, options), file);
            }

            return path;
        }

    });

});