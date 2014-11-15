define(['altair/facades/declare',
    'altair/Lifecycle',
    'lodash',
    'altair/facades/all',
    'altair/events/Emitter'
], function (declare,
             Lifecycle,
             _,
             all,
             Emitter) {


    return declare([Lifecycle, Emitter], {

        startup: function () {

            //listen for render strategy event
            this.on('liquidfire:Apollo::register-property-types').then(this.hitch('registerApolloPropertyTypes'));

            return this.inherited(arguments);

        },

        /**
         * Tell Apollo about the types of properties we are registering.
         *
         * @param e
         * @returns {altair.Deferred}
         */
        registerApolloPropertyTypes: function (e) {

            return this.parseConfig('configs/property-types').then(this.hitch(function (types) {

                var _types = [],
                    _options = _.clone(e.get('options', {}));

                //pass nexus through to every property type registered this way
                _options.nexus = this._nexus;

                _.each(types, function (type) {

                    var name = type ;

                    if(name.search(':') === -1) {
                        name = this.name + '/' + type;
                    }

                    _types.push(this.forge(name, _options));

                }, this);

                return all(_types);

            })).otherwise(this.hitch(function (err) {

                this.log(err);
                this.log(new Error('You must create a valid ' + this.dir + 'configs/property-types for _HasPropertyTypesMixin to work ' + this));

                return err;

            }));

        }

    });

});
