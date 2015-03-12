define(['altair/facades/declare',
    'liquidfire/modules/spectre/db/Store'
], function (declare, Store) {


    return declare([Store], {

        _tokenCache:    {},
        _cacheTtl:      1000 * 60 * 5, //5 minute cache ttl
        findOneByToken: function (token) {


            if (this._tokenCache[token]) {
                return this._tokenCache[token].promise;
            }

            this._tokenCache[token] = {
                needsLoginDateSet: true,
                clearCacheOnSave: false,
                promise: null
            };

            this._tokenCache[token].promise = this.findOne().where('token', '===', token);

            //clear cache in a few
            setTimeout(function () {

                this._tokenCache[token] = null;

            }.bind(this), this._cacheTtl);

            //update loginDate
            this._tokenCache[token].promise.then(function (user) {

                if (user && this._tokenCache[token].needsLoginDateSet) {

                    this._tokenCache[token].needsLoginDateSet = false;

                    user.set('loginDate', new Date());
                    user.save();

                }

            }.bind(this));

            return this._tokenCache[token].promise;

        },

        save: function (user) {

            var token = user.get('token');

            //if we have already been saved
            if (this._tokenCache[token] && this._tokenCache[token].clearCacheOnSave) {
                this._tokenCache[token] = null;
            } else if (this._tokenCache[token]) {
                this._tokenCache[token].clearCacheOnSave = true;
            }


            return this.inherited(arguments);
        }

    });

});