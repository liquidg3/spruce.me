define(['altair/facades/declare',
        'altair/cartridges/extension/extensions/_Base',
        'lodash'],

    function (declare,
              _Base,
              _) {


        return declare([_Base], {

            name:   'socket-entity',
            _handles: ['entity'],
            extend: function (Module) {

                Module.extendOnce({
                    getSocketValues: function (options) {
                        return this.getValues(options, { methods: ['toSocketValue', 'toHttpResponseValue', 'toDatabaseValue']});
                    }
                });

                return this.inherited(arguments);
            }

        });


    });