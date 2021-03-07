const fastify = require('fastify')({ logger: true })
const routes = require('./routes')


fastify.get('/users', routes.listUsers)
fastify.post('/users', routes.createUser)

const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
