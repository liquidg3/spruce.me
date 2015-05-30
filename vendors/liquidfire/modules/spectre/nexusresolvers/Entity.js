/**
 * Help us resolve Widgets
 *
 * {{Vendor}}:{{Module}}/widgets/{{Widget}}
 *
 *
 */
define(['altair/facades/declare',
    'altair/cartridges/nexus/_ResolverBase'
], function (declare,
             _ResolverBase) {

    return declare([_ResolverBase], {


        nexus:          null,
        adapterCache:   null,

        constructor: function (nexus) {
            this.nexus = nexus;
            if(!nexus) {
                throw "The Entity nexus resolver needs nexus.";

            }
        },

        /**
         * Find the adapter of your choosing.
         *
         * @param key
         * @param options
         * @param config
         * @returns {*}
         */
        resolve: function (key, options, config) {

            var parts   = key.split('/'),
                module  = this.nexus.resolve(parts.shift()),
                type    = parts.pop(),
                d;


            d = module.entity(type, options, config);

            return d;
        },

        /**
         * Tells us if we handle a key.
         *
         * @param key
         * @returns {boolean}
         */
        handles: function (key) {
            return key.search('/entities/') > 0;
        }

    });

});