define(['altair/facades/declare',
        'apollo/propertytypes/_Base',
        'altair/mixins/_DeferredMixin',
        'altair/plugins/node!mongodb'],

    function (declare, _Base, _DeferredMixin, mongodb) {

        return declare([_Base, _DeferredMixin], {

            key:                'entity',
            makeValuesSingular: true,
            options:            {
                entity: {
                    type:    'string',
                    options: {
                        label:       'Entity Type',
                        required:    true,
                        description: 'The name of the related entity.'
                    }
                },
                query:  {
                    type:    'object',
                    options: {
                        label:       'Query',
                        description: 'Pass a Database/Statement compatible query and I\'ll use it to filter results'
                    }
                },
                dbRef: {
                    type: 'boolean',
                    options: {
                        label: 'Use dbref',
                         description: 'I will store/load dbrefs instead of id\'s.'
                    }
                }
            },


            /**
             * Resolve whatever is passed through nexus if it's a string
             *
             * @param value
             * @param options
             * @param config
             */
            toJsValue: function (value, options, config) {

                if(value && value.name) {
                    return value;
                }

                return (!value) ? null : this.nexus(options.entity).then(function (store) {
                    return store.findOne().where(store.schema().primaryProperty().name, '===', value).execute();
                });

            },

            toDatabaseValue: function (value, options, config) {

                if(_.isString(value)) {

                    return (value) ? value: null;

                } else if(value.primaryValue && !options.dbRef) {

                    return value.primaryValue();

                } else if(value.primaryValue && options.dbRef) {

                    var tableName   = value.schema().option('tableName'),
                        BSON        = mongodb.BSONPure;

                    return new BSON.DBRef(tableName, new BSON.ObjectID(value.primaryValue()));

                } else {

                    return null;
                }

            },

            toViewValue: function (value, options, config) {

                return this.toJsValue(value, options, config).then(function (results){

                    return results.has('name') ? results.get('name') : results.name;

                });

            },


            toDatabaseQueryValue: function (value, options, config) {

                return this.toDatabaseValue(value, options, config);

            },

            template: function (options) {
                return 'liquidfire:Spectre/views/entity';
            },

            /**
             * Before we render, we have to populate choices (which means searching a data store for entities)
             *
             * @param renderer
             * @param template
             * @param context
             * @returns {Deferred}
             */
            render: function (template, context) {

                var entityType = context.options.entity,
                    choices = {};

                if(!context.options.required) {
                    choices[""] = "";
                }

                return this.nexus(entityType).then(function (store) {

                    return store.find().where(context.options.query).execute();

                }).then(function (cursor) {

                    return cursor.each().step(function (entity) {
                        choices[entity.primaryValue()] = entity.has('name') ? entity.get('name') : entity.name; //nexus name if no name property exists
                    });

                }).then(this.hitch(function () {

                    context.options.choices = choices;
                    return this.parent.render(template, context);

                }));


            }



        });
    });
