# liquidfire:Spectre
Where else would you go to find entities? What is an entity? It's easy;

_an entity is an object that represents a record/document in a database._

## Isn't that a model?
I think you mean "isn't that a data model?" Most modern frameworks use the term "model" to define what is truly an "entity."
A model is where you house your "business logic." It is what makes your app go. Many times a model will work with or on
an entity, but not always.

## The Layers
Before we dive in too much, lets look at the the layers we will be working with:

### Stores
In order to create or query for an Entity, you must go through a `Store`. The store layer handles all communication between you and whatever
data store you are using. It currently only supports Mongodb, but adding support for anything is really easy.

### Entities
The entities themselves are the objects that represent the record/document in the database (or whatever, really). They are meant to house
the state of a particular thing (like a user, automobile, whatevs).

## How do these work together?
Let me show you an entity (and entity store) in action.

I'm going to assume you are here: `vendors/{{vendorname}}/modules/{{modulename}}`.

1. Create `entities/user/User.js` and drop this in:

``js

define(['altair/facades/declare',
        'apollo/_HasSchemaMixin'
], function (declare, _HasSchemaMixin) {


    return declare([_HasSchemaMixin], {

    });

});

2. Create `entities/user/schema.json` and drop this in:

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

        "firstName": {
            "type":    "string",
            "options": {
                "label": "First Name"
            }
        },

        "lastName": {
            "type":    "string",
            "options": {
                "label": "Last Name"
            }
        },

        "email": {
            "type":    "string",
            "options": {
                "label": "email"
            }
        }

    }
}

```

## Using the store to find an entity
```js
this.entity('User').then(function (store) {

    //the User store is where you'll find all your users. A store as database agnostic
    return store.find().where('email', '==', 'test@test.com').execute();

}).then(function (user) {

    if(!user) {
        throw new Error('user not found!');
    } else {

        //since entities use apollo/_HasSchemaMixin, the familiar get/set/setValues/getValues/etc. are available.
        return user.set('firstName', 'tay')
                   .save(); //every entity is extended with save(), it returns a Promise.


    }

}).then(function (user) {

    //the first name is now updated
    console.log(user.get('firstName'), 'updated');

});

```

##Creating your first entity
An entity is a generic AMD module that mixes in apollo/_HasSchemaMixin.

```js

this.entity('User').then(function (store) {

    var user = store.create({
        firstName: 'tay',
        lastName: 'ro'
    });

    user.set('email', 'tay@ro.com');

    console.log(user.values);

});


```

##Overridding the store
Lets say you want a utility method on your store to do something more than just `find()` and `create()`. What if we wanted
a `findAdminUsers()`. *This is a lazy example, don't use it for reals.*

Create `stores/User.js` and drop this in:

```js
define(['altair/facades/declare',
        'liquidfire/modules/spectre/db/Store'
], function (declare, Store) {


    return declare([Store], {

        findAdminUsers: function () {

            return this.find().where('isAdmin', '===', true);

        }

    });

});

```

Now you can do the following:

this.entity('User').then(function (store) {

    return store.findAdminUsers().execute();

}).then(function (users) {

    return users.each().step(function (user) {

        console.log(user.get('firstName'), 'is an admin user');

    });

});

##Custom Statement
You can customize how a database `Statement` works from a store pretty easily. Here is a real
world example of a custom `Store` with a custom `Statement`.

```js

define(['altair/facades/declare',
        'lodash',
        'liquidfire/modules/spectre/db/Store',
        'altair/cartridges/database/Statement',
        'altair/cartridges/database/cursors/Array'
], function (declare, _, Store, Statement, ArrayCursor) {


    return declare([Store], {

        /**
         * Helper to find tickets by auction (and temporarily uses the legacy rest adapter to fetch results)
         *
         * @param auction
         * @returns {Statement}
         */
        findByAuction: function (auction) {

            var statement = new Statement(function (q) {

                return this.nexus('handbid:LegacyRest').rest().get('tickets', { auctionKey: auction.get('key') }).then(function (response) {

                    //convert array of ticket objects to ticket Entities (with .get(), .set(), .save(), .delete(), etc.)
                    var tickets = _.map(response, this.create, this),
                        cursor = new ArrayCursor(tickets, statement); //a statement always returns an array

                    return cursor;

                }.bind(this));

            }.bind(this));

            return statement;

        }


    });

});

```