define(['altair/facades/declare',
        'altair/cartridges/extension/extensions/_Base',
        'altair/Deferred',
        'altair/plugins/node!path',
        'altair/facades/mixin'],

    function (declare,
              _Base,
              Deferred,
              pathUtil,
              mixin) {

        return declare([_Base], {

            name: 'widget',
            _foundry: null,

            extend: function (Module, type) {

                Module.extendOnce({
                    widgetPath: './widgets',
                    widget: function (named, options, config) {

                        var _name = named,
                            dfd,
                            path,
                            parts,
                            instanceId,
                            _options = options || {},
                            _config = config || {};

                        //default place to look for templates
                        if (!_options.viewPaths) {

                            //look relative to ourselves and relative to the altair runtime
                            var p1 = this.resolvePath(this.viewPath || ''),
                                p2 = this.nexus('Altair').resolvePath('');

                            _options.viewPaths = [p1];

                            //if we are calling this.widget() from a controller inside a web app, these should match
                            //if we are calling it from inside a module or something else, these will probably no match.
                            //i want to always make sure that ./views/
                            if (p1 !== p2) {
                                _options.viewPaths.push(p2);
                            }
                        }

                        //if it's a nexus name, pass it off
                        if (named.search(':') > 0) {
                            return this.nexus(named, _options, _config);
                        }

                        if (named.search(/\./) === -1) {
                            dfd = new this.Deferred();
                            dfd.reject('You need to give your widget an instance id: this.widget(\'Name.instanceId\') -> this.widget(\'liquidfire:Forms/widgets/Form.create-user\')');
                        } else {

                            //break out instance id
                            parts = named.split('.');
                            _name = parts[0];
                            instanceId = parts[1];

                            path =  this.resolvePath(pathUtil.join(this.widgetPath, _name.toLowerCase(), _name));

                            _config = mixin({
                                type: 'widget',
                                name: this.name.split('/')[0] + '/widgets/' + _name
                            }, _config);


                            dfd = this.forge(path, _options, _config).then(function (widget) {
                                widget.instanceId = instanceId;
                                return _config.render ? widget.render(_config.template) : widget;
                            });
                        }

                        return dfd;

                    }
                });

                return this.inherited(arguments);
            }

        });


    });