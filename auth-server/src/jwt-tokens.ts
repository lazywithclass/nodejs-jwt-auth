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

// TODO encrypt token

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
// sub -> subject
// iss -> issuer
// aud -> audience
// exp -> expiration time
// typ -> types

// TODO also remember to add different roles to tokens,
// so you could show how to query the books server
// without touching the auth server

const create = (jwt, username) => {
  const accessToken = jwt.sign({
    sub: username,
  }, {
    expiresIn: ACCESS_TOKEN_TTL
  })

  const refreshToken = jwt.sign({
    sub: username
  }, {
    expiresIn: REFRESH_TOKEN_TTL
  })

  return new Promise((resolve, reject) => {
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
