const Fastify = require('fastify')
const fjwt = require('fastify-jwt')
const buildGetJwks = require('get-jwks')

const fastify = Fastify()
const getJwks = buildGetJwks()
fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-cors'), {
  origin: true,
  credentials: true
})

fastify.register(fjwt, {
  decode: { complete: true },
  secret: (request, token, callback) => {
    const { header: { kid, alg }, payload: { iss } } = token
    getJwks.getPublicKey({ kid, domain: 'http://test.app.localhost:3000', alg })
      .then(publicKey => {
         callback(null, publicKey), callback
      })
  },
  cookie: {
    cookieName: 'token'
  }
})

fastify.get('/books', (request, reply) => {
  return require('./books.json')
})

fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.listen(3042)
