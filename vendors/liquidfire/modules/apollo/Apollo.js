define(['altair/facades/declare',
    'lodash',
    'altair/Lifecycle',
    'altair/events/Emitter',
    './mixins/_HasPropertyTypesMixin'],
    function (declare, _, Lifecycle, Emitter, _HasPropertyTypesMixin) {

        return declare([Lifecycle, Emitter, _HasPropertyTypesMixin], {


            /**
             * On execute, refresh all registered properties and drop them into Apollo
             *
             * @returns {altair.Deferred}
             */
            execute: function () {

                return this.refreshPropertyTypes().then(this.hitch(function () {
                    return this;
                }));

            },

            /**
             * Will refresh all registered property types
             *
             * @returns {altair.Deferred}
             */
            refreshPropertyTypes: function () {

                return this.emit('register-property-types').then(this.hitch(function (e) {

                    var types = _.flatten(e.results()),
                        apollo = this.nexus('cartridges/Apollo');

                    _.each(types, function (type) {

                        apollo.addPropertyType(type);

                    }, this);

                    return types;

                }));


            }

        });

    });