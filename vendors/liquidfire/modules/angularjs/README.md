# liquidfire:AngularJS
Give your Titan:Alfred site some AngularJS muscle. It's super easy.
 
## Step 1 - Install the module
You can do this by adding the following to your app's `package.json`.
```json
{
    "altairDependencies": {
        "liquidfire:AngularJs": ">=0.0.x"    
    }
}
```
## Step 2 - Drop in markup
Jump into your `layout.ejs' and set `ng-app` attribute.
```html

<!DOCTYPE html ng-app="app">
<!--[if lt IE 7]>
<html class="no-js lt-ie9 lt-ie8 lt-ie7" ng-app="app"> <![endif]-->
<!--[if IE 7]>
<html class="no-js lt-ie9 lt-ie8" ng-app="app"> <![endif]-->
<!--[if IE 8]>
<html class="no-js lt-ie9" ng-app="app"> <![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js" ng-app="app"> <!--<![endif]-->

```

## Step 3 - Setup your controllers
The `AngularJS` library is now included on every page. You can begin creating your Angular app.

```js
(function () {

    var app = angular.module('app', []);

    app.controller('MainController', function ($scope) {

    });
    
})();


```
## Working with Forms
`liquidfire:Forms` provides a great mechanism for handling the rendering, validation, and submission of forms. It's ever more awesome
 when you can make it all work with `AngularJS`. Below is an example contact form schema that uses the ng-model attribute to
 two-way bind data to the form.
 
```json
{
    "properties": {
        "name": {
            "type": "string",
            "form": {
                "attribs": {
                    "ng-model": "user.name"
                }
            },
            "options": {
                "label": "Name",
                "required": true
            }
        },
        
        "email": {
            "type": "string",
            "form": {
                "attribs": {
                    "ng-model": "user.email"
                }
            },
            "options": {
                "label": "Name",
                "required": true
            }
        }
    
    }
}

```
Now when you render your form (via the form widget), the elements will drop in with the proper markup.

## File Uploading
File uploads suck, but we've made them easier. I'm going to assume you have already read the instructions for `liquidfire:Files` on how
to configure the file module to upload files.

###Step 1 - Include JS
Add the `angular-file-upload.js` (and shim) files to your `alfred.json`.
```json
{
    "site": {
        "strategy": "express3",
        "options":  {
            "port":   80,
            "vendor": "...",
            "domain": "...",
            "media":  {
                "css":  [...],
                "autoCompileLess": false,
                "less": [...],
                "js":   [
                    "/public/_angular/bower_components/ng-file-upload/angular-file-upload-all.min.js"
                ]
            },
            "routes": {...}

        }
    }
}

```

###Step 2 - Configure your angular app dependencies and drop in upload code.
Note: Files are uploaded seperately from the form itself.

```js

//include the dependency
var app = angular.module('appointments', ['angularFileUpload']);

app.controller('MyController', ['$scope', '$http', '$upload', function ($scope, $http, $upload) {

    /**
     * Helper for quick file uploading. Acccepts the name of the field as a string, then $files and $event
     */
    $scope.fileSelected = function (field, files) {

        for (var i = 0; i < files.length; i++) {

            $upload.upload({
                url: '/v1/angular/upload-file.json',
                file: files[i]
            }).success(function (data, status, headers, config) {

                //lazy way of setting value back to model
                $scope.$apply(function () {
                    $scope.model[field] = data;
                });

            });

        }

    };

});

Now any file you upload will be uploaded immediately.

```

###Step 3 - Configure your form

```json
{
    "properties": {
        "name": {
            "type": "string",
            "form": {
                "attribs": {
                    "ng-model": "user.name"
                }
            },
            "options": {
                "label": "Name",
                "required": true
            }
        },
        
        "email": {
            "type": "string",
            "form": {
                "attribs": {
                    "ng-model": "user.email"
                }
            },
            "options": {
                "label": "Name",
                "required": true
            }
        },
        
        "photo": {
            "type": "image",
            "form": {
                "attribs": {
                    "ng-file-select": "fileSelected('photo', $files)",
                    "accept": "image/*"
                }
            },
            "options": {
                "label": "Image"
            }
        }
    
    }
}

```
Notice that there is no `ng-model` attribute, you will have to set changes back to your model manually (we did it in the example above in a lazy way). You can also write the markup for the field manually as follows:

```html

<input accept="image/*" ng-file-select="fileSelected('photo', $files)" type="file" name="photo">
<img ng-src="/v1/images/thumb?file={{ model.image.relative }}&w=50&h=0" />

```


## EntityListController - paging through entities
When you to page through many entities, the `EntityListController` can help!

take a look at ./public/altair.js for deets for now.
