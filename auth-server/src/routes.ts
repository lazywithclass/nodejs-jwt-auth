namespace routes {

  // just to fool the cookies, ideally this would be something that comes
  // from the env or something that gets changed in the build process, with
  // a default for dev
  const DOMAIN = 'test.app.localhost'
  const db = require('./db')

  const listUsers = async function(request, reply) {
    return db.read('users')
  }

  const createUser = async function(request, reply) {
    const { username, password } = request.body
    if (db.read('users', username)) {
      reply.code(409)
      return { message: "user already exists"}
    }

    db.write('users', username, { username, password })

    const accessToken = this.jwt.sign({
      data: 'foobar',
      expiresIn: '15m'
    });
    // const refreshToken = this.jwt.sign({
    //   data: 'foobar',
    //   expiresIn: '7d'
    // });

    // which token should be added to httponly?

    reply.setCookie('token', accessToken, {
      domain: DOMAIN,
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: true // CSRF protection
    })
    .code(200)
    return { username }
  }

  const login = async function(request, reply) {
    const { username, password } = request.body
    const dbUser = db.read('users', username)
    if (!username || !password || dbUser.password !== password) {
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

  module.exports = { listUsers, createUser, login }

}
