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

  // this function has been "ruined" by the lack of Promises in node-redis,
  // I've tried wrapping it but failed, so it's a bit ugly
  const verifyJWT = async (request, reply, done) => {
    const token = request.cookies.token
    if (!token) {
      console.log('No token found in the cookie')
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }

    const username = fastify.jwt.decode(token).payload.sub
    try {
      const isPresent = await jwtTokens.isRefreshTokenPresent(username)
      if (!isPresent) {
        console.log('No refresh token found in database')
        reply.code(401).send({ message: 'Unauthorized' })
        return done(new Error())
      }
      await request.jwtVerify()
      return done()
    } catch (err) {
      if (err.message == 'Authorization token expired') {
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
  }

  const verifyAdmin = async (request, reply, done) => {
    const token = request.cookies.token
    const audience = fastify.jwt.decode(token).payload.aud
    if (audience.indexOf('admin') == -1) {
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }
    return done()
  }

  fastify.decorate('verifyJWT', verifyJWT)
  fastify.decorate('verifyCredentials', verifyCredentials)
  fastify.decorate('verifyAdmin', verifyAdmin)

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
      handler: routes.listUsers,
      preHandler: fastify.auth([
        fastify.verifyJWT,
        verifyAdmin
      ], { run: 'all' }),
    })
    fastify.get('/.well-known/jwks.json', routes.jwks)
    fastify.post('/login', routes.login)
    fastify.post('/logout', routes.logout)
  })

  fastify.listen(3000, err => { if (err) throw err })
}
