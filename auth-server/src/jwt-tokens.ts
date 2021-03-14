const jose = require('node-jose')
const fs = require('fs')
const redis = require('redis')
const config = require('../config.json')
const client = redis.createClient({
  port: config.redis.port,
  host: config.redis.host,
  password: config.redis.password,
})

// 7 days in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60
// 15 minutes in seconds
const ACCESS_TOKEN_TTL = 15 * 60

const redisRefreshTokenKey = username => `refresh-token-${username}`

const canCreate = (username, oldRefreshToken) => {
  return new Promise((resolve, reject) => {
    client.get(redisRefreshTokenKey(username), function(err, redisRefreshToken) {
      if (err) {
        return reject(err)
      }
      return resolve(redisRefreshToken == oldRefreshToken)
    })
  })
}

// https://stackoverflow.com/questions/21978658/invalidating-json-web-tokens#comment45057142_23089839
// TODO invalidate

// TODO based on user roles there should be a different payload in the token
// fetch the record from redis

// https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
//"Validate All Possible Claims"
// iss -> issuer
// aud -> audience
// exp -> expiration time
// typ -> types
// https://tools.ietf.org/html/rfc7519#section-4.1

// TODO also remember to add different roles to tokens,
// so you could show how to query the books server
// without touching the auth server

const create = (jwt, username) => {
  return new Promise((resolve, reject) => {
    const ks = fs.readFileSync('certs/keys.json')
    jose.JWK.asKeyStore(ks.toString()).then(keyStore => {
      const [key] = keyStore.all({ use: 'sig' })

      const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
      const payloadAccessToken = JSON.stringify({
        exp: Math.floor(((Date.now()) / 1000) + ACCESS_TOKEN_TTL),
        iat: Math.floor(Date.now() / 1000),
        sub: username,
        iss: 'http://test.app.localhost:3000'
      })
      const payloadRefreshToken = JSON.stringify({
        exp: Math.floor(((Date.now()) / 1000) + REFRESH_TOKEN_TTL),
        iat: Math.floor(Date.now() / 1000),
        sub: username,
        iss: 'http://test.app.localhost:3000'
      })

      Promise.all([
        jose.JWS.createSign(opt, key)
          .update(payloadAccessToken)
          .final(),
        jose.JWS.createSign(opt, key)
          .update(payloadRefreshToken)
          .final()
      ]).then(tokens => {
        const [accessToken, refreshToken] = tokens
        return client.set(redisRefreshTokenKey(username), refreshToken, (err, reply) => {
          if (err) {
            return reject(err)
          }

          return client.expire(redisRefreshTokenKey(username), REFRESH_TOKEN_TTL, (err, reply) => {
            if (err) {
              return reject(err)
            }
            return resolve({ accessToken, refreshToken })
          })
        })
      })
    })
  })
}

const remove = username => {
  client.del(redisRefreshTokenKey(username), (err, reply) => {
    if (err) {
      console.log('Could not remove refresh token from redis', err)
    }
  })
}

module.exports = {
  canCreate,
  create,
  remove
}
