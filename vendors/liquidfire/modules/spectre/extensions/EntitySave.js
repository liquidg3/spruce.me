define(['altair/facades/declare',
    'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              _Base) {

        return declare([_Base], {

            name:   'entity-save',
            _handles: ['entity'],
            extend: function (Module) {

                Module.extendOnce({
                    store: null,
                    save: function (options, config) {
                        return this.store.save(this, options, config);
                    }
                });

                return this.inherited(arguments);
            }

        });


    });