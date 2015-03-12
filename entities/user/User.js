define(['altair/facades/declare',
    'apollo/_HasSchemaMixin'
], function (declare, _HasSchemaMixin) {


    return declare([_HasSchemaMixin], {


        getValues: function (optionsByProperty, config) {

            var values = this.inherited(arguments);

            //if we are getting values for
            if (config && config.methods && config.methods[0] === 'toHttpResponseValue') {

            }


            return values;
        }


    });

});