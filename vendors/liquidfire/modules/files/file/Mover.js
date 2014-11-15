define(['altair/facades/declare',
        'altair/mixins/_DeferredMixin',
        'altair/plugins/node!fs',
        'altair/plugins/node!path',
        'altair/plugins/node!tmp',
        'altair/plugins/node!mkdirp'
], function (declare,
             _DeferredMixin,
             fs,
             pathUtil,
             tmp,
             mkdirp) {

    return declare([_DeferredMixin], {

        /**
         * Will place a file in the designated uploadsDir on this.parent
         *
         * @param from
         * @param options
         * @return {altair.Promise}
         */
        place: function (from, options) {

            var uploadDir           = this.parent.get('uploadDir');

            if(!uploadDir) {
                throw new Error('You must set an uploadDir to the liquidfire:Files module.');
            }

            return this.generateUniqueName(uploadDir, pathUtil.extname(from)).then(function (path) {

                return this.promise(mkdirp, pathUtil.dirname(path)).then(function () {
                    return path;
                });


            }.bind(this)).then(function (path) {

                var is, os, dfd = new this.Deferred();

                is = fs.createReadStream(from);
                os = fs.createWriteStream(path);

                is.on('end', function () {
                    dfd.resolve(path);
                });

                is.on('error', function (err) {
                    dfd.reject(err);
                });

                os.on('error', function (err) {
                    dfd.reject(err);
                });

                is.pipe(os);

                return dfd;

            }.bind(this)).then(function (path) {

                var relative = pathUtil.join(path.replace(pathUtil.join(uploadDir, '/'), ''));

                return {
                    absolute: path,
                    relative: relative,
                    uploadDir: uploadDir,
                    filename: pathUtil.basename(path)
                }

            });

        },

        generateUniqueName: function (at, extension) {

            return this.promise(tmp, 'tmpName', { postfix: extension, dir: at, prefix: '' });

        }

    });

});