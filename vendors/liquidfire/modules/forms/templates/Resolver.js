define(['altair/facades/declare',
    'altair/mixins/_DeferredMixin',
    'altair/plugins/node!path',
    'altair/facades/all',
    'altair/mixins/_AssertMixin',
    'lodash'
], function (declare,
             _DeferredMixin,
             pathUtil,
             all,
             _AssertMixin,
             _) {

    return declare([_DeferredMixin, _AssertMixin], {

        /**
         * Finds you the templates that should be used for every property on as schema.
         *
         * @param schema
         * @param templatePaths
         * @param fallbackPath
         * @returns {altair.Promise}
         */
        templatesFromSchema: function (schema, templatePaths, fallbackPath) {

            var candidates = {
                    form: null,
                    properties: {}
                },
                properties = schema.properties(),
                layout     = 'layout',
                apollo     = this.nexus('cartridges/Apollo');

            if(!fallbackPath) {
                throw new Error('You must pass a fallbackPath to you template resolver.');
            }

            //does the schema have a form block?
            if (schema.get('form')) {

                var f = schema.get('form');

                if (f.template) {
                    layout = f.template;
                }

            }

            //main form's template
            candidates.form = [
                pathUtil.join(fallbackPath, layout)
            ];

            _.each(templatePaths, function (path) {
                candidates.form.push(pathUtil.join(path, layout));
            });

            candidates.form = this.nexus('liquidfire:Onyx').resolveCandidates(candidates.form);

            _.each(properties, function (prop, name) {

                var _candidates = [],
                    template    = (prop.form) ? prop.form.template : false,
                    type        = apollo.propertyType(prop.type);


                this.assert(type, 'you must specify a valid type for your property. you passed "' + prop.type + '".');

                //fallback goes in first (last in, first out) start with generic property.ejs
                //*********************************************
                _candidates = _candidates.concat([
                    pathUtil.join(fallbackPath, 'views', 'property'),
                ]);

                //check in default places in template paths as well
                _.each(templatePaths, function (path) {

                    _candidates = _candidates.concat([
                        pathUtil.join(path, 'views', 'form', 'property'),
                    ]);

                });

                //*********************************************
                //now look for property type specific
                _candidates = _candidates.concat([
                    pathUtil.join(fallbackPath, 'views','types', prop.type)
                ]);

                //check in passed paths by type
                _.each(templatePaths, function (path) {

                    _candidates = _candidates.concat([
                        pathUtil.join(path, 'views', 'form', 'types', prop.type)
                    ]);

                });

                //is it a hidden field?
                if(prop.form && prop.form.hidden) {

                    _candidates.push(pathUtil.join(fallbackPath, 'views', 'partials', 'hidden'));

                    //check in default places in template paths as well
                    _.each(templatePaths, function (path) {

                        _candidates = _candidates.concat([
                            pathUtil.join(path, 'views', 'form', 'partials', 'hidden')
                        ]);

                    });


                }


                //does this prop have a template()?
                if(type.template) {
                    _candidates = _candidates.concat(type.template(prop.options));
                }


                //*********************************************

                if(template && template.search(':') === -1) {

                    //they may be pointing to a view that is inside the fallbackPath
                    _candidates.push(pathUtil.join(fallbackPath, template));

                    //default paths (property.ejs, types/string.ejs)
                    _.each(templatePaths, function (path) {

                        //did they pass a template as prop.form.template and it's NOT a nexus id
                        _candidates.push(pathUtil.join(path, template));

                    });

                }


                //is there a form.template specified in the schema?
                if(template && template.search(':') > 0) {

                    //set both absolute and relative paths
                    _candidates.push(this.resolvePath(template));

                }

                candidates.properties[name] = this.nexus('liquidfire:Onyx').resolveCandidates(_candidates);

            }, this);


            return all({
                form: this.when(candidates.form),
                properties: this.all(candidates.properties)
            });

        }



    });

});