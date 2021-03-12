namespace server {

  // TODO redis instead of this so we could leverage the TTL to
  // automagically invalidate refresh tokens
  const db = require('./db')
  const routes = require('./routes')
  const jwtTokens = require('./jwt-tokens')
  const fastify = require('fastify')({ logger: true })
  fastify.register(require('fastify-cors'), {
    origin: true,
    credentials: true
  })
  fastify.register(require('fastify-cookie'))
  fastify.register(require('fastify-jwt'), {
    secret: process.env.JWT_SECRET,
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
      reply.code(401).send({ error: 'Unauthorized' })
      return done(new Error())
    }

    const token = request.cookies.token
    if (!token) {
      reply.code(401).send({ error: 'Unauthorized' })
      return done(new Error())
    }

    try {
      await request.jwtVerify()
    } catch (err) {
      if (err.message == 'Authorization token expired') {
        // I am not particularly proud of this
        // I would've loved to redirect to /refresh and then come
        // back here to finish the job

        // TODO check in the db for valid credentials

        const { accessToken, refreshToken } = jwtTokens.create(fastify.jwt)
        routes.setCookiesInResponse(reply, accessToken, refreshToken)
        return done()
      }

      reply.code(401).send({ error: 'Unauthorized' })
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
    // TODO is it a good idea to expose a /refresh route?
    // shouldn't the behaviour be transparent?
    fastify.route({
      method: 'GET',
      url: '/refresh',
      preHandler: fastify.auth([fastify.verifyJWT]),
      handler: routes.refreshAccessToken
    })
    fastify.post('/login', routes.login)
    fastify.post('/logout', routes.logout)
  })

  // TODO Should I put this into after?
  fastify.listen(3000, err => { if (err) throw err })
}
