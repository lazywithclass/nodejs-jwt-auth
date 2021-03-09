namespace server {

  const db = require('./db')
  const fastify = require('fastify')({ logger: true })
  fastify.register(require('fastify-cors'))
  fastify.register(require('fastify-jwt'), {
    secret: process.env.JWT_SECRET,
    cookie: {
      cookieName: 'token'
    }
  })
  fastify.register(require('fastify-cookie'))
  fastify.register(require('fastify-auth'))

  const verifyJWT = (request, reply, done) => {
    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ error: 'Unauthorized' })
      return done(new Error())
    }

    if (!request.raw.headers.auth) {
      return done(new Error('Missing token header'))
    }

    try {
      // TODO is this async?
      request.jwtVerify()
    } catch (err) {
      return done(err)
    }

    return done()
  }

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

  fastify.decorate('verifyJWT', verifyJWT)
  fastify.decorate('verifyCredentials', verifyCredentials)

  fastify.after(() => {
    const routes = require('./routes')
    fastify.get('/', routes.root)
    fastify.route({
      method: 'GET',
      url: '/users',
      preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyCredentials]),
      handler: routes.listUsers
    })

    fastify.post('/login', routes.login.bind(fastify))
  })

  // TODO Should I put this into after?
  fastify.listen(3000, err => { if (err) throw err })
}
