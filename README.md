## nodejs-jwt-auth

Experimenting with JWT

### How to experiment with this

Make sure your the following to create the auth keys

```sh
$ cd auth-server
$ npm run setup-jwks
```

You will then need a redis instance, you can spin up one for free at redislabs.com

To start all required servers by this example just run

```sh
$ ./start-all.sh
```

Or if you prefer to start servers individually have a look inside the script.
