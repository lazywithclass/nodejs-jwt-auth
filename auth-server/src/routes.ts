namespace routes {

  const DOMAIN = process.env.DOMAIN
  const fs = require('fs')
  const jose = require('node-jose')
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
      return { message: 'Username not found or password not valid' }
    }

    try {
      return jwtTokens.create(this.jwt, username)
        .then(tokens => {
          setCookiesInResponse(reply, tokens.accessToken, tokens.refreshToken)
          return { username }
        })
    } catch (err) {
      console.log('Error creating jwt tokens', err)
      reply.code(401)
      return { message: 'Unauthorized' }
    }
  }

  const logout = async function(request, reply) {
    const username = this.jwt.decode(request.cookies.token).payload.sub
    await jwtTokens.remove(username)
    const accessToken = this.jwt.sign({}, { expiresIn: '0m' })
    const refreshToken = this.jwt.sign({}, { expiresIn: '0m' })
    setCookiesInResponse(reply, accessToken, refreshToken)
    return {}
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
        domain: DOMAIN, path: '/', secure: false, httpOnly: true, sameSite: true
      })
      .code(200)
  }

  const jwks = async function(request, reply) {
    const ks = fs.readFileSync('certs/keys.json')
    const keyStore = await jose.JWK.asKeyStore(ks.toString())
    return keyStore.toJSON()
  }

  module.exports = {
    whoami,
    listUsers,
    login,
    logout,
    setCookiesInResponse,
    jwks
  }
}
