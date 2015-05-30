define(['altair/facades/declare',
        'altair/facades/mixin',
        'altair/facades/when',
        'altair/plugins/node!path',
        'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              mixin,
              when,
              pathUtil,
              _Base) {

        return declare([_Base], {

            name: 'entity',
            constructor: function (cartridge, altair) {

                if (!cartridge) {
                    throw new Error('You must pass your extension the Extension cartridge');
                }

                if (!this.name) {
                    throw new Error('You must define a .name for your extension.');
                }

            },

            /**
             * Our "entity" method actually returns a store with find, create, etc.
             * @param Module
             * @returns {*}
             */

            extend: function (Module) {

                Module.extendOnce({
                    entityPath: './entities',
                    entity: function (named, options, config) {

                        var base = this.parent ? this.parent.entityPath : this.entityPath,//if we have a parent, assume we want to use it as the base path
                            _p,
                            spectre = this.nexus('liquidfire:Spectre'),
                            d,
                            _options = options || {},
                            _c = mixin({
                                type: 'entity-store'
                            }, config || {}),
                            foundry = spectre.entityFoundry;

                        //if it's a nexus name, pass it off
                        if (named.search(':') > 0) {
                            return this.nexus(named, options, config);
                        }
                        //build the path if it's not a nexus id
                        else {
                            _p = this.resolvePath(pathUtil.join(base, named.toLowerCase(), named));
                        }

                        var key = this.name.split('/')[0] + '/entities/' + named;

                        if (spectre.hasCachedStore(key)) {

                            d = when(spectre.cachedStore(key));

                        } else {

                            _options.entityName = this.name.split('/')[0] + '/entities/' + named;

                            d = foundry.forge(_p, _options, _c).then(function (store) {
                                spectre.cacheStore(named, store);
                                return store;
                            });

                            spectre.cacheStore(key, d);

                        }

                        return d;

                    }
                });

                return this.inherited(arguments);
            }

        });


    });