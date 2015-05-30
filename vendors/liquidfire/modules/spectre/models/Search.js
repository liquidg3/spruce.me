define(['altair/facades/declare',
        'altair/mixins/_DeferredMixin',
        'altair/mixins/_AssertMixin',
        'altair/facades/mixin',
        'lodash'],

    function (declare,
              _DeferredMixin,
              _AssertMixin,
              mixin,
              _) {

        "use strict";

        return declare([_DeferredMixin, _AssertMixin], {

            find: function (entityType, options) {

                var _options = options || {},
                    page     = parseInt(_options.page, 10),
                    sort     = _options.sort,
                    event    = _options.event,
                    query    = _options.query,
                    findOptions = _options.findOptions || {},
                    searchField = _options.searchField,
                    searchValue = _options.searchValue,
                    transform = _options.transform || function (entity) {
                        return entity.getValues();
                    },
                    perPage  = parseInt(_options.perPage, 10);

                if (_.isNaN(page)) {
                    page = 0;
                }

                if (_.isNaN(perPage)) {
                    perPage = 10;
                }

                this.assertNumeric(page, 'You must pass a "page" option to search.');
                this.assertNumeric(perPage, 'You must pass a "perPage" option to search.');

                //max per page
                perPage = Math.min(perPage, 100);

                return this.parent.entity(entityType).then(function (store) {

                    //create statement, starting with skip & limit
                    var statement = store.find(findOptions).skip(page * perPage).limit(perPage);

                    //if a sort was passed, sort by each
                    if (sort) {

                        _.each(sort, function (direction, field) {
                            statement.sortBy(field, direction);
                        });

                    }

                    //custom query
                    if (query) {
                        statement.where(query);
                    }

                    //are we searching?
                    if (searchField) {
                        statement.where(searchField, '===', searchValue);
                    }

                    return statement.execute();


                }).then(function (cursor) {

                    var results = [],
                        total    = cursor.total(),
                        count    = cursor.count(),
                        stepping = cursor.each().step(function (entity) {

                        results.push(transform(entity));

                    }).then(function () {
                        return this.all(results);
                    }.bind(this));

                    return this.all({
                        total: total,
                        count: count,
                        page: page,
                        perPage: perPage,
                        startIndex: page * perPage,
                        endIndex: page * perPage + count - 1,
                        totalPages: Math.ceil(total / perPage),
                        results: stepping
                    });

                }.bind(this));

            },

            /**
             * Find entities based of an event (i check the request object)
             *
             * @param entityType
             * @param e
             * @param options
             * @returns {*}
             */
            findFromEvent: function (entityType, e, options) {

                var request = e.get('request'),
                    _options = {
                        perPage:    request.get('perPage'),
                        page:       request.get('page'),
                        findOptions: {
                            event: e
                        },
                        searchField: request.get('searchField'),
                        searchValue: request.get('searchValue'),
                        transform:  function (entity) {
                            return entity.getHttpResponseValues(e);
                        }
                    };

                if (request.get('sortField')) {
                    _options.sort = {};
                    _options.sort[request.get('sortField')] = request.get('sortDirection', 'ASC');
                }

                return this.find(entityType, mixin(_options, options || {}))


            }


        });

    });