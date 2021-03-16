## nodejs-jwt-auth

Experimenting with JWT

### How it is implemented

As the title suggests I've used JWT to implement authentication and
authorization.
No secret key is involved, a pair of public and private key has to be created and that is what is used to verify the tokens.
An access token / refresh token strategy has been implemented, the
first has a lower lifespan than the second, when authentication or
authorization change the refresh token gets deleted, and the access
token validation no longer succeeds, the user has to login again with
their username and password.

### How it is structured

You will notice three folders: auth-server, books-server, frontend.

#### Auth server

This is the source of truth for authentication and authorization, it
is responsible of managing the lifecycle of the JWTs.
It leverages JWT stateless nature by offering a public key, by means
of which users can verify their tokens, without calling this server
(except for the first call when the public key is cached).

#### Books server

A simple server added to show that calls could fetch its resources
without calling every time to the auth server, but instead
just checking against the public key.

#### Frontend

I've added this to allow for quickly testing of the features
implemented in this spike.

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
