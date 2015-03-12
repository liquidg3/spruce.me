define(['altair/facades/declare',
    'apollo/_HasSchemaMixin'
], function (declare, _HasSchemaMixin) {


    return declare([_HasSchemaMixin], {

        mixin: function (values) {

            //legacy filed support
            if (values.message) {
                values.body = values.message;
            }

            return this.inherited(arguments);
        },

        save: function (options, config) {

            //make sure dateSent is set on first save
            if (!this.get('dateSent')) {
                this.set('dateSent', new Date());
            }

            return this.store.save(this, options, config);

        }

    });

});