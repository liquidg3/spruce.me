liquidfire-files
================

Makes it easy to deal with files in Altair. Also provides helpers for file uploads in Alfred. 

#Step 1 - Configure module
You need to make sure I have a place to upload files, you can do this inside your `modules.json`. If you created an App using the Lodge, then
you really just need to make one change. Change `liquidfire:Files.disabled` -> `liquidfire:Files` 

Make sure you have the following in your `modules.json`.

```json

"liquidfire:Files": {
    "uploadDir": "../uploads"
},

```

This will tell me to look one level up from the current working directory.

#Step 2 - Create `uploads` dir
Make sure it's a level above that of your App.


#Step 3 - Create `file` type in any schema
In whatever schema that matters, set the property `type` to `file`.

```json
{
    "name":       "Users",
    "tableName":  "users",
    "properties": {

        "_id": {
            "type":    "primary",
            "options": {
                "label": "Id"
            }
        },

        "email": {
            "type": "string",
            "options": {
                "label": "Email",
                "required": true
            }

        },

        "firstName": {
            "type":    "string",
            "options": {
                "label":  "First Name",
                "required": true
            }
        },

        "lastName": {
            "type":    "string",
            "options": {
                "label":  "Last Name",
                "required": true
            }
        },

        "contract": {
            "type": "file",
            "options": {
                "label": "Contract"
            }
        }
    }

}


```

#Step 3 - Render / Submit the form
Now anytime you render a form with a schema that has a file field, it will work. To upload via JS, see the documentation inside of `liquidfire:AngularJS`.
