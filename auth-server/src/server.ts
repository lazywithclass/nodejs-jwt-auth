namespace server {

  // TODO redis instead of this so we could leverage the TTL to
  // automagically invalidate refresh tokens
  const db = require('./db')
  const routes = require('./routes')
  const jwtTokens = require('./jwt-tokens')
  const fastify = require('fastify')({ logger: false })
  fastify.register(require('fastify-cors'), {
    origin: true,
    credentials: true
  })
  fastify.register(require('fastify-cookie'))
  const buildGetJwks = require('get-jwks')
  const getJwks = buildGetJwks()
  fastify.register(require('fastify-jwt'), {
    decode: { complete: true },
    secret: (request, token, callback) => {
      const { header: { kid, alg }, payload: { iss } } = token
      getJwks.getPublicKey({ kid, domain: iss, alg })
        .then(publicKey => callback(null, publicKey), callback)
    },
    cookie: {
      cookieName: 'token'
    }
  })

  fastify.register(require('fastify-auth'))

  const verifyCredentials = (request, reply, done) => {
    if (!request.body || !request.body.user) {
      return done(new Error('Missing user in request body'))
    }

    const user = db.read('users', request.body.user.username)
    // in the real world I would have encrypted stored passwords, but to
    // let you easily login with different users I've left them as plain text
    if (user.password !== request.body.password) {
      return done(new Error('Password not valid'))
    }

    return done()
  }

  const verifyJWT = async (request, reply, done) => {
    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }

    const token = request.cookies.token
    if (!token) {
      console.log('No token found in the cookie')
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }

    try {
      await request.jwtVerify()
    } catch (err) {
      if (err.message == 'Authorization token expired') {
        const username = fastify.jwt.decode(token).sub


        jwtTokens
          .canCreate(username, request.cookies.refreshToken)
          .then(canCreate => {

            if (!canCreate) {
              console.log('Preventing token from refreshing, records do not match')
              reply.code(401).send({ message: 'Unauthorized' })
              return done(new Error())
            }

            try {
              return jwtTokens.create(fastify.jwt, username)
                .then(tokens => {
                  routes.setCookiesInResponse(reply, tokens.accessToken, tokens.refreshToken)
                  return { username }
                })
            } catch (err) {
              console.log('Error creating jwt tokens', err)
              reply.code(401).send({ message: 'Unauthorized' })
              return done(new Error())
            }
          })
      }

      console.log(err)
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }

    return done()
  }

  fastify.decorate('verifyJWT', verifyJWT)
  fastify.decorate('verifyCredentials', verifyCredentials)

  // TODO at the end also provide a mean to use the endpoints with APIs, not just
  // cookies, because they're required by the frontend
  // so the example is complete

  // TODO add /api to the routes
  // https://www.fastify.io/docs/latest/Routes/#route-prefixing

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/whoami',
      preHandler: fastify.auth([fastify.verifyJWT]),
      handler: routes.whoami
    })
    fastify.route({
      method: 'GET',
      url: '/users',
      preHandler: fastify.auth([fastify.verifyJWT]),
      handler: routes.listUsers
    })
    fastify.get('/.well-known/jwks.json', routes.jwks)
    fastify.post('/login', routes.login)
    fastify.post('/logout', routes.logout)
  })

  fastify.listen(3000, err => { if (err) throw err })
}
