namespace routes {

  const DOMAIN = process.env.DOMAIN
  const jwtTokens = require('./jwt-tokens')
  const db = require('./db')

  const whoami = async (request, reply) => request.user

  const listUsers = async (request, reply) => db.read('users')

  const login = async function(request, reply) {
    const { username, password } = request.body
    const dbUser = db.read('users', username)
    if (!username || !password || !dbUser || dbUser.password !== password) {
      // don't leak info about our users
	    reply.code(404)
      return { message: 'username not found or password not valid' }
    }

    // TODO also remember to add different roles to tokens,
    // so you could show how to query the books server
    // without touching the auth server
    const { accessToken, refreshToken } = jwtTokens.create(this.jwt)
    setCookiesInResponse(reply, accessToken, refreshToken)

    return { username }
  }

  const logout = async function(request, reply) {
    // TODO this does not work in a distributed environment, how to log out of all
    // other services?
    const accessToken = this.jwt.sign({}, { expiresIn: '0m' })
    const refreshToken = this.jwt.sign({}, { expiresIn: '0m' })
    setCookiesInResponse(reply, accessToken, refreshToken)
    return {}
  }

  const refreshAccessToken = async function(request, reply) {
    // TODO check if refresh token is in database
    const { accessToken, refreshToken } = jwtTokens.newTokens(this.jwt)
    // TODO update refresh token
    setCookiesInResponse(reply, accessToken, refreshToken)
    return { oh: 'hai' }
  }

  const setCookiesInResponse = (reply, accessToken, refreshToken) => {
    reply
      .setCookie('token', accessToken, {
        // TODO secure: false here should be removed
        // as I've added it just for the testing env
        // fix: have https even in test
        domain: DOMAIN, path: '/', secure: false, httpOnly: true, sameSite: true
      })
      .setCookie('refreshToken', refreshToken, {
        // TODO secure: false here should be removed
        // as I've added it just for the testing env
        // fix: have https even in test

        // TODO should the path be different?
        // like /refresh?
        domain: DOMAIN, path: '/', secure: false, httpOnly: true, sameSite: true
      })
      .code(200)
  }

  module.exports = {
    whoami,
    listUsers,
    login,
    logout,
    refreshAccessToken,
    setCookiesInResponse
  }
}
