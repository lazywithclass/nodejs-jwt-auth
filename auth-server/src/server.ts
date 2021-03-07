namespace server {

  const fastify = require('fastify')({ logger: true })
  fastify.register(require('fastify-jwt'), { secret: process.env.JWT_SECRET })
  fastify.register(require('fastify-cookie'))

  const routes = require('./routes')
  fastify.get('/users', routes.listUsers.bind(fastify))
  fastify.post('/users', routes.createUser.bind(fastify))
  fastify.post('/login', routes.login.bind(fastify))

  fastify.listen(3000, err => { if (err) throw err })

}
