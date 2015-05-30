# liquidfire:Sockets
A strategy based approach to sockets. Currently only supports Socket.io (0.9.x), but implementing other socket libraries is easy enough.


## Starting a server
To start a server when you start up `Altair`, add the following to your `modules.json` or `modules-dev.json`.

```json

{
    "liquidfire:Sockets": {
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com"
                }
            },
            
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com",
                    "path": "/a-namespace"
                }
            }
        ]
    }
}

```
Now when you startup `Altair`, your socket servers will start for you. To listen in on connections at particular paths, add the following to the `startup()` of your `Controller` or `App` in `Alfred`.

```js
startup: function () {
    
    //listen in on the first socket server
    this.on('liquidfire:Sockets::did-connect', {
        path: '/'
    }).then(this.hitch('onSocketConnection'));
    
    //listen in on the second one
    this.on('liquidfire:Sockets::did-connect', {
        path: '/a-namespace'
    }).then(this.hitch('onNamespacedSocketConnection'));
    
    this.on('liquidfire:Sockets::did-connect', {
        path: '/a-namespace'
    }).then(this.hitch('onMainSocketConnection'));
    
    return this.inherited(arguments);

},

onMainSocketConnection: function (e) {

    //the connection is a native to whatever socket adapter you are using
    //right now socketio uses socket.io 0.9.x
    var connection = e.get('connection');
    
    connection.on('some-event', this.hitch('onSomeEvent', connection)); //i bound connection as the first parameter so the callback

},

onNamespacedSocketConnection: function (e) {

    var connection = e.get('connection');
    
    connection.emit('connection-made', { foo: 'bar' });
    
},

//invoked when `some-event` is emitted from a client on the server connection whose path is '\'.
onSomeEvent: function (connection, data) {

}

```
Since the socket.io adapter is currently 0.9.x, you'll need to use the [docs here](https://github.com/Automattic/socket.io/tree/0.9.17).

## Using Socket Browser Side
You can connect to your socket server from the browser from any javascript file.
```js

altair.sockets.emit('test', {
    foo: 'bar'
}, function () {
    
})

```
##SSL
Getting socket connections to work via SSL means configuring the `Sockets` module. You can do that
in your `modules.json` or your `modules-dev.json`.

```json
{
    "liquidfire:Sockets": {
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com",
                    "privateKeyPath":  "../ssl/server.com.key",
                    "certificatePath": "../ssl/server.com.crt",
                    "ca":              ["../ssl/rapidssl_ca_1.pem", "../ssl/rapidssl_ca_2.pem"]
                }
            }
        ]
    }
}

```

##Disabling JS includes
You may not want the includes that come with the `Sockets` module. Here is what includes could look like by default (versions may differ):

```html
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="/public/_sockets/js/Sockets.js"></script>
<script src="/public/_sockets/js/Socket.io.js?url=https://taysmacbookpro.local:8080false"></script>
```

If you don't want any of those included, add this to your `modules.json`.
{
    "liquidfire:Sockets": {
        "includeMedia": false,
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com",
                    "privateKeyPath":  "../ssl/server.com.key",
                    "certificatePath": "../ssl/server.com.crt",
                    "ca":              ["../ssl/rapidssl_ca_1.pem", "../ssl/rapidssl_ca_2.pem"]
                }
            }
        ]
    }
}
