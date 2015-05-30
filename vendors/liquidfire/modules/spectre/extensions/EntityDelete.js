define(['altair/facades/declare',
    'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              _Base) {

        return declare([_Base], {

            name:   'entity-delete',
            _handles: ['entity'],
            extend: function (Module) {

                Module.extendOnce({
                    store: null,
                    'delete': function (options) {
                        return this.store.delete(this, options);
                    }
                });

                return this.inherited(arguments);
            }

        });


    });