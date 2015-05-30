define(['altair/facades/declare',
    'altair/facades/all',
    'altair/mixins/_DeferredMixin',
    'dojo/_base/lang',
    'lodash'],
    function (declare, all, _DeferredMixin, lang, _) {

        var delegateMethods = ['find', 'findOne', 'delete', 'update', 'count'],
            extension = {},
            Store = declare([_DeferredMixin], {


                _tableName:    '',
                _entityName:   '',
                _entitySchema: null,
                _database:     null,
                _entityPath:   '',

                constructor: function (options) {

                    this._database      = options.database;
                    this._entitySchema  = options.schema;
                    this._tableName     = this._entitySchema.option('tableName');
                    this._entityPath    = options.entityPath;
                    this._entityName    = options.entityName || this._entityPath.split('/').pop(); //default entity name (if no "name" is specified in schema)
                    this.name           = this._entityName;

                },

                /**
                 * Schema attached to every entity we create
                 *
                 * @returns {null}
                 */
                schema: function () {
                    return this._entitySchema;
                },

                /**
                 * Save an entity back to the database
                 *
                 * @param entity
                 */
                save: function (entity, options, config) {

                    var _config = config || {},
                        action = entity.primaryValue() ? 'update' : 'insert';

                    if (_config.action) {
                        action = _config.action;
                    }

                    return all(entity.getValues({}, { methods: ['toDatabaseValue'] })).then(function (values) {

                        return this.parent.emit('liquidfire:Spectre::will-save-entity', {
                            store: this,
                            action: action,
                            entity: entity,
                            values: values,
                            options: options
                        });

                    }.bind(this)).then(function (e) {

                        if (!e.active) {
                            return false;
                        }

                        var values = e.get('values');

                        //does this entity have a primary key?
                        if (action === 'update') {

                            //if so, update
                            return this._database.update(this._tableName).set(values).where(entity.primaryProperty().name, '===', entity.primaryValue()).execute(options);

                        }
                        //otherwise lets create
                        else {

                            //create record
                            return this._database.create(this._tableName).set(values).execute(options);

                        }

                    }.bind(this)).then(function (values) {

                        //event was cancelled
                        if (values === false) {
                            return;
                        }

                        //the new values should have an Id now
                        entity.mixin(values);

                        this.parent.emit('liquidfire:Spectre::did-save-entity', {
                            store: this,
                            action: action,
                            entity: entity,
                            options: options
                        });

                        //pass pack the updated entity
                        return entity;

                    }.bind(this));


                },

                /**
                 * Create an entity with the values
                 *
                 * @param values
                 * @returns {*|Promise}
                 */
                create: function (values) {

                    var options = {
                        _schema: this._entitySchema,
                        values:  values
                    }, entity;

                    this.parent.emit('liquidfire:Spectre::will-create-entity', {
                        store: this,
                        options: options
                    });

                    entity          = this.forgeSync(this._entityPath, options, { type: 'entity', name: this._entityName });
                    entity.store    = this;

                    this.parent.emit('liquidfire:Spectre::did-creat-entity', {
                        store: this,
                        entity: entity,
                        options: options
                    });

                    return entity;

                },

                deleteMany: function () {
                    return this._database['delete'](this._tableName);
                },

                'delete': function (entity, options) {

                    return this.parent.emit('liquidfire:Spectre::will-delete-entity', {
                        entity: entity,
                        options: options,
                        store: this
                    }).then(function (e) {

                        if (e.active) {
                            return this._database['delete'](this._tableName).where(entity.primaryProperty().name, '===', entity.primaryValue()).execute();
                        } else {
                            return false;
                        }

                    }.bind(this)).then(function () {

                        return this.parent.emit('liquidfire:Spectre::did-delete-entity', {
                            entity: entity,
                            options: options,
                            store: this
                        });

                    }.bind(this));


                },

                _didFindCallback: function (e) {

                    var cursor = e.get('results');

                    cursor.foundry = this.hitch('create');

                },

                _didFindOneCallback: function (e) {

                    var record = e.get('results'),
                        entity;

                    if (record) {

                        entity = this.create(record);
                        e.set('results', entity);

                    }

                },

                /**
                 * Before any query is executed I'm going to see if the schema can help transform values to get them ready
                 * to hit the database.
                 *
                 * @param e {altair.events.Event}
                 * @private
                 */
                _willExecuteQuery: function (e) {

                    var statement = e.get('statement'),
                        where = statement.clauses().where,
                        schema = this.schema(),
                        transform;

                    transform = function (value, key, all, path) {

                        var tranformed,
                            subKey;

                        if (!path) {
                            path = key;
                        }

                        if (schema.has(key)) {

                            //query can be something like $!== , $<, $>, etc. If that is the case, dive in and loop through that portion
                            if (_.isObjectLiteral(value) && Object.keys(value)[0][0] === '$') {

                                _.each(Object.keys(value), function (_key) {
                                    transform(value[_key], key, all, path + '.' + _key);
                                }, this);


                            } else {

                                tranformed = schema.applyOnProperty(['toDatabaseQueryValue', 'toDatabaseValue', 'noop'], key, value, {
                                    many: _.isArray(value) //retain any array passed through
                                }, {
                                    statement: statement,
                                    store:     this,
                                    path:      path !== key ? path + '.' + key : path
                                });

                                lang.setObject(path, tranformed, where);

                            }


                        }


                    };

                    if (where) {

                        try {

                            _.each(where, transform, this);

                        } catch (err) {
                            this.err(err);
                        }

                    }

                }

            });


        /**
         * Extend the store with all methods on the on the database cartridge we are trying to extend
         */
        _.each(delegateMethods, function (named) {

            extension[named] = function () {

                var args = Array.prototype.slice.call(arguments),
                    willCallbackName = '_will' + _.capitalize(named) + 'Callback',
                    didCallbackName = '_did' + _.capitalize(named) + 'Callback',
                    statement;

                args.unshift(this._tableName);

                statement = this._database[named].apply(this._database, args);

                if (this[willCallbackName]) {
                    statement.on('will-execute').then(this.hitch(willCallbackName));
                }

                //global callback
                statement.on('will-execute').then(this.hitch('_willExecuteQuery'));

                if (this[didCallbackName]) {
                    statement.on('did-execute').then(this.hitch(didCallbackName));
                }

                return statement;

            };

        });

        Store.extendOnce(extension);

        return Store;

    });