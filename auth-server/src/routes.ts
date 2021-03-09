namespace routes {

  const DOMAIN = process.env.DOMAIN
  const db = require('./db')

  const root = async function(request, reply) {
    return request.user
  }

  const listUsers = async function(request, reply) {
    return db.read('users')
  }

  const login = async function(request, reply) {
    const { username, password } = request.body
    const dbUser = db.read('users', username)
    if (!username || !password || !dbUser || dbUser.password !== password) {
      // don't leak info about our users
	    reply.code(404)
      return { message: "username not found or password not valid" }
    }

    const accessToken = this.jwt.sign({
      data: 'foobar',
      expiresIn: '15m'
    });

    reply.setCookie('token', accessToken, {
      domain: DOMAIN, path: '/', secure: true, httpOnly: true, sameSite: true
    })
    .code(200)
    return { username }
  }

  module.exports = { root, listUsers, login }

}
