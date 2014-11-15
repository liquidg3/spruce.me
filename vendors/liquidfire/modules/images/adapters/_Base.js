define(['altair/facades/declare',
        'altair/mixins/_DeferredMixin'
], function (declare,
             _DeferredMixin) {

    return declare([_DeferredMixin], {

        renderThumb: function (source, options, config) {
            throw new Error('renderThumb on ' + this + ' implemented.');
        }

    });

});