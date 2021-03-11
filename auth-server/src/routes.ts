namespace routes {

  const DOMAIN = process.env.DOMAIN
  const db = require('./db')

  const whoami = async (request, reply) => {
    return request.user
  }

  const listUsers = async (request, reply) => {
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

    // https://stackoverflow.com/questions/21978658/invalidating-json-web-tokens#comment45057142_23089839
    const accessToken = this.jwt.sign({
      answer: 42
    }, {
      expiresIn: '15m'
    });

    reply.setCookie('token', accessToken, {
      // TODO secure: false here should be removed
      // as I've added it just for the testing env
      // fix: have https even in test
      domain: DOMAIN, path: '/', secure: false, httpOnly: true, sameSite: true
    })
    .code(200)
    return { username }
  }

  const logout = async function(request, reply) {
    // TODO this does not work in a distributed environment, how to log out of all
    // other services?
    const accessToken = this.jwt.sign({}, {
      expiresIn: '0m'
    })
    reply.setCookie('token', accessToken, {
      // TODO secure: false here should be removed
      // as I've added it just for the testing env
      // fix: have https even in test
      domain: DOMAIN, path: '/', secure: false, httpOnly: true, sameSite: true
    })
    .code(200)
    return {}
  }

  module.exports = { whoami, listUsers, login, logout }
}
