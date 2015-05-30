# liquidfire:Forms
An Altair module to help with form related activity (rendering, submission, etc). 'Forms' comes with 2 parts, the form
and the widget. The form is a simple [apollo/\_HasSchemaMixin](https://github.com/liquidg3/altair/tree/master/core/lib/apollo)
object with additional helpers to facilitate form related activities (enctype, method, action, etc.).

## Setup dependencies
``` json
"altairDependencies": {
    "liquidfire:Forms": ">=0.0.x"
}
```

## Form widget
Using the form widget is the way to go when working with forms. The widget will create a form for you and because there
is no real reason to create a form without rendering it you will rarely need to create a form directly.
In the example below, we'll assume that the signup(e) method is a configured action in an
[Alfred](https://github.com/hemstreet/Titan-Alfred) website.

``` js
...
signup: function (e) {

    //forge a form widget, its options are passed through directly to the form you are creating
    return this.widget('liquidfire:Forms/widgets/Form.my-great-form', {
        enctype: 'multipart/form-data',
        
        formSchema: {
            properties: {

                firstName: {
                    type: 'string',
                    options: {
                        label: 'First Name',
                        description: 'This is your first name'
                    }
                },

                lastName: {
                    type: 'string',
                    form: {
                        template: 'vendor:Module/views/my-view.ejs'
                    }
                    options: {
                        label: 'Last Name'
                    }
                },

                token: {
                    type: 'string',
                    form: {
                        include: false //will keep this property from being rendered in the form
                    },
                    options: {
                        label: 'Token'
                    }
                },

                role: {
                    type: 'string',
                    form: {
                        hidden: true
                    },
                    options: {
                        label: 'Role id?',
                        description: 'This is a bad example of why you\'d want a hidden field'
                    }
                }
            }
        },
        formValues: {
            firstName: 'Tay',
            lastName: 'Ro'
        }
    }).then(function (widget) {

        //we can save this widget for later, or just render it immediately
        return widget.render();

    }).then(function (html) {

        //i'm not doing anything
        console.log(html);

    });

},
....

```

## Creating a form directly
If you want to use a form directly (from outside the widget and rendering) you can create them easily. I haven't needed
to create a form directly because I'm always rendering them and the widget creates it for me, but here is how you can
do it, just in case.

``` js
//create a form off the forms module
this.nexus('liquidfire:Forms').form({
    schema: ...,
    values: ...
    id: 'my-great-form'
}).then(function () {

});

```

## Form Submission
Forms are fully "eventized," so when you want to listen into a form event, you do it using the `on()` syntax you are used
to. Remember, always hook into events in your module's or controller's `startup(options)`.

```js

startup: function (options) {

    //hook into the forms did-submit-form event, see package.json for all events
    this.on('liquidfire:Forms::did-submit-form', {
        'form.id': 'my-great-form'
    }).then(this.hitch('onSubmitMyGreatForm'));

    return this.inherited(arguments);

},

onSubmitMyGreatForm: function (e) {

    var form    = e.get('form'),
        values  = form.getValues();

    console.log(values);

}

```
## Form widget options
You can customize the form widget using these options. You can always check the widgets/form/config/schema.json for a
more in-depth review of the options.

View the [widget's schema](widgets/form/configs/schema.json) to see what it can do.

## Form options
These are options you can pass a form.

- **id**: (required) the id of the form
- **schema**: (required) the apollo schema that this form will use for its properties
- **enctype**: defaults to 'application/x-www-form-urlencoded'
- **action**: dropped into the "action" property of the form
- **method**: 'GET'|'POST' defaults to GET

## Form schema options
By passing a `form` block in your schema's properties, you can customize a few aspects of the form.

```json
properties: {
    firstName: {
        type: 'string',
        form: {
            include: true|false, //should be included in form
            hidden:  true|false, //will render as hidden element at bottom of the form
            template: 'optional path to custom template' //see below for details
        },
        attribs: {
            any_custom: 'attribute' //these will be rendered as attributes on the element
        },
        options: {
            ... apollo property options ...
        }
    }
}

```
##Custom Views/Templates
The form and every element can load any view you want. But before you start customizing your template settings, it is a good idea to learn how
template resolution works. In other words, we need to go over how forms decide which views to load.

Lets say you are using the schema above (with the first name field), here is how the `template/Resolver` is going to decide which templates to load. Keep
in mind it will look relative to the controller invoking `this.widget(...)`. *Note:* You can change the base path your controller looks in
for views by modifying `this.viewPath`.

These are in order of precidence (so top views load first).

- 1: `./views/form/types/{{propertyType}}.ejs` - so you can change how all `boolean` fields render 
- 2: `/vendors/liquidfire/modules/forms/widgets/views/types/{{propertyType}}.ejs` - fallback for above view (use form version if overridden version does not exist). 
- 3: `./views/form/property.ejs` - the generic template all properties will use if one does not exist for the particular type
- 4: `/vendors/liquidfire/modules/forms/widgets/views/property.ejs` - fallback for the fallback 

### Custom view for a property
Lets say you want to render a particular property with a special template. You can set the `template` property of the `form` block for
the property.

```json 
{
    "properties": {
        "firstName": {
            "type": "string",
            "form": {
                "template": "views/form/properties/first-name"
            },
            "options": {
                "label": "First Name",
            }
        },
        "lastName": {
            "type": "string",
            "form": {
                "template": "form/properties/last-name"
            },
            "options": {
                "label": "Last Name"
            }
        }
    }
}

```
Then drop your view into `./views/form/properties/first-name.ejs` and `./views/form/properties/last-name.ejs`. You can place your views wherever you want, these
are just examples.

### Custom view for the form
Since forms are rendered using [widgets](https://github.com/liquidg3/liquidfire-onyx), all the standard widget rules apply. But, if you only have access to the schema, you can 
override the template that will be used by the form widget by setting the `template` property at the top level of your schema.

```json
{
    "form": {
        "template": "views/form/signup",
    },
    "properties": {
        "firstName": {
            "type": "string",
            "form": {
                "template": "first-name"
            },
            "options": {
                "label": "First Name",
            }
        },
        "lastName": {
            "type": "string",
            "form": {
                "template": "views/form/properties/last-name"
            },
            "options": {
                "label": "Last Name"
            }
        }
    }
}
```
Then drop in your content to `./views/form/signup.ejs`.