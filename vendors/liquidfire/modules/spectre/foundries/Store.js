//only to be used through the entity extension
define(['altair/facades/declare',
        'lodash',
        'altair/plugins/node!path',
        'altair/plugins/node!fs',
        'altair/facades/mixin',
        'altair/mixins/_DeferredMixin'],

    function (declare, _, pathUtil, fs, mixin, _DeferredMixin) {

        return declare(_DeferredMixin, {

            forge: function (path, options, config) {

                var schemaPath = pathUtil.join(path, '..', 'schema.json'),
                    storePath  = pathUtil.join(path, '../../../stores/', path.split(pathUtil.sep).pop()),
                    tableName;

                if (!fs.existsSync(storePath  + '.js')) {
                    storePath = 'db/Store';
                }

                //first thing we must do is load the schema and make sure it has a tableName
                return this.parseConfig(schemaPath).then(this.hitch(function (schema) {

                    if (!schema.tableName) {
                        throw new Error('The entity at ' + path + ' needs a tableName in its schema.json. It should be on the same level as properties and be the name of the table/collection where this entity is saved.');
                    }

                    var _options = mixin({
                        database:   this.nexus('cartridges/Database'),
                        schema:     this.nexus('cartridges/Apollo').createSchema(schema),
                        entityPath: path
                    }, options || {});

                    if (!_options.database) {
                        throw new Error('You must enable the database cartridge for entities to work.');
                    }

                    return this.parent.forge(storePath, _options, config);


                }));


            }

        });

    });