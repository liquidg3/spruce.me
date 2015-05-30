define(['altair/facades/declare',
        'altair/Lifecycle',
        './extensions/Entity',
        './extensions/EntitySave',
        './extensions/EntityDelete',
        './nexusresolvers/Entity',
        'lodash',
        'liquidfire/modules/apollo/mixins/_HasPropertyTypesMixin'
], function (declare,
             Lifecycle,
             EntityExtension,
             EntitySaveExtension,
             EntityDeleteExtension,
             EntityResolver,
             _,
             _HasPropertyTypesMixin) {

    return declare([Lifecycle, _HasPropertyTypesMixin], {

        _cachedStores: null,
        entityFoundry: null,
        startup: function (options) {


            var _options            = options || this.options || { installExtension: true },
                cartridge           = _options.extensionCartridge || this.nexus('cartridges/Extension'),
                resolver            = _options.entityResolver || new EntityResolver(this._nexus);

            //did someone pass strategies?
            if (_options.strategies) {
                this._strategies = _options.strategies;
            }

            //drop in resolver
            this._nexus.addResolver(resolver);

            //reset cached stores
            this._cachedStores = {};

            //should we install the extension?
            if (_options.installExtension !== false) {

                this.deferred = this.forge('./foundries/Store').then(function (foundry) {

                    this.entityFoundry = foundry;

                    var entity      = _options.entityExtension || new EntityExtension(cartridge, cartridge.altair),
                        entitySave  = _options.entitySaveExtension || new EntitySaveExtension(cartridge, cartridge.altair),
                        entityDelete  = _options.entityDeleteExtension || new EntityDeleteExtension(cartridge, cartridge.altair);

                    return cartridge.addExtensions([entity, entitySave, entityDelete]);

                }.bind(this)).then(this.hitch(function () {
                    return this;
                }));

            }

            return this.inherited(arguments);

        },

        hasCachedStore: function (named) {
            return _.has(this._cachedStores, named);
        },

        cachedStore: function (named) {
            return this._cachedStores[named];
        },

        cacheStore: function (named, store) {
            this._cachedStores[named] = store;
        }


    });

});