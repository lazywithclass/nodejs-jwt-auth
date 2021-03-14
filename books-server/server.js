const fastify = require('fastify')()
const buildGetJwks = require('get-jwks')
const getJwks = buildGetJwks()
fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-auth'))
fastify.register(require('fastify-cors'), {
  origin: true,
  credentials: true
})

fastify.register(require('fastify-jwt'), {
  decode: { complete: true },
  secret: (request, token, callback) => {
    const { header: { kid, alg }, payload: { iss } } = token
    getJwks.getPublicKey({ kid, domain: `${process.env.DOMAIN}:3000`, alg })
      .then(publicKey => {
         callback(null, publicKey), callback
      })
  },
  cookie: {
    cookieName: 'token'
  }
})

const verifyJWT = async (request, reply, done) => {
  const token = request.cookies.token
  if (!token) {
    console.log('No token found in the cookie')
    reply.code(401).send({ message: 'Unauthorized' })
    return done(new Error())
  }

  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ message: 'Unauthorized' })
    return done(new Error())
  }

  return done()
}

const verifyReader = async (request, reply, done) => {
  const token = request.cookies.token
  try {
    const audience = fastify.jwt.decode(token).payload.aud
    if (audience.indexOf('admin') != -1) {
      return done()
    }

    if (audience.indexOf('reader') == -1) {
      console.log('Unauthorized access for reader resource')
      reply.code(401).send({ message: 'Unauthorized' })
      return done(new Error())
    }
  } catch (err) {
    console.log(err)
  }

  return done()
}

fastify.decorate('verifyJWT', verifyJWT)
fastify.decorate('verifyReader', verifyReader)

fastify.after(() => {
  fastify.route({
    method: 'GET',
    url: '/books',
    preHandler: fastify.auth([
      fastify.verifyJWT,
      fastify.verifyReader
    ], { run: 'all' }),
    handler: (request, reply) => require('./books.json')
  })
})

fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.listen(3042)
