namespace tokens {

  const jose = require('node-jose')
  const jwt = require('jsonwebtoken')
  const jwkToPem = require('jwk-to-pem')
  const fs = require('fs')
  const redis = require('redis')
  const config = require('../config.json')
  const db = require('./db')
  const redisClient = redis.createClient({
    port: config.redis.port,
    host: config.redis.host,
    password: config.redis.password,
  })

  // 7 days in seconds
  const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60
  // 15 minutes in seconds
  const ACCESS_TOKEN_TTL = 15 * 60

  const redisRefreshTokenKey = username => `refresh-token-${username}`

  const isRefreshTokenPresent = (username) => {
    return new Promise((resolve, reject) => {
      return redisClient.get(redisRefreshTokenKey(username), function(err, redisRefreshToken) {
        if (err) {
          return reject(err)
        }
        return resolve(redisRefreshToken)
      })
    })
  }

  const canCreate = (username, oldRefreshToken) => {
    return new Promise((resolve, reject) => {
      redisClient.get(redisRefreshTokenKey(username), function(err, redisRefreshToken) {
        if (err) {
          return reject(err)
        }
        return resolve(redisRefreshToken == oldRefreshToken)
      })
    })
  }

  // this function has been "ruined" by the lack of Promises in node-redis,
  // I've tried wrapping it but failed, so it's a bit ugly
  const create = (jwt, username) => {
    return new Promise((resolve, reject) => {
      const ks = fs.readFileSync('certs/keys.json')
      jose.JWK.asKeyStore(ks.toString()).then(keyStore => {
        const [key] = keyStore.all({ use: 'sig' })

        const dbUser = db.read('users', username)
        if (!dbUser) {
          return reject(new Error(`Could not find user with '${username}' as username`))
        }

        const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
        const payloadAccessToken = JSON.stringify({
          exp: Math.floor(((Date.now()) / 1000) + ACCESS_TOKEN_TTL),
          iat: Math.floor(Date.now() / 1000),
          sub: username,
          aud: dbUser.roles,
          iss: `http://${process.env.DOMAIN}:3000`
        })
        const payloadRefreshToken = JSON.stringify({
          exp: Math.floor(((Date.now()) / 1000) + REFRESH_TOKEN_TTL),
          iat: Math.floor(Date.now() / 1000),
          sub: username,
          iss: `http://${process.env.DOMAIN}:3000`
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
          return redisClient.set(redisRefreshTokenKey(username), refreshToken, (err, reply) => {
            if (err) {
              return reject(err)
            }

            return redisClient.expire(redisRefreshTokenKey(username), REFRESH_TOKEN_TTL, (err, reply) => {
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
    return new Promise((resolve, reject) => {
      return redisClient.del(redisRefreshTokenKey(username), (err, reply) => {
        if (err) {
          console.log('Could not remove refresh token from redis', err)
          return reject(err)
        }
        return resolve(username)
      })
    })
  }

  // expects date to be ms since epoch up to the time at which
  // we want to remove tokens
  const removeUpToDate = (removeUpTo, done) => {
    const msNow = new Date().getTime()
    const usernames = Object.keys(db.read('users'))

    return Promise.all(usernames.map(async u => {
      return new Promise((resolve, reject) => {
        return redisClient.get(redisRefreshTokenKey(u), (err, token) => {
          if (!token) {
            console.log(`No token found for username '${u}'`)
            return resolve(u)
          }

          const ks = require('../certs/keys.json')
          // I've tried using
          // jose.JWK.asKeyStore(ks.toString()).then(keyStore => {
          // const [key] = keyStore.all({ alg: 'RS256' })
          // but then key is missing some properties, I couldn't find
          // a way to get all of them using keyStore APIs
          const key = ks.keys[0]
          var pem = jwkToPem(key)
          return jwt.verify(token, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {
            if (err) {
                console.log(err)
                return reject(err)
            }

            if ((decodedToken.iat * 1000) < removeUpTo) {
              return redisClient.del(redisRefreshTokenKey(u), function(err) {
                if (err) {
                  console.log(`Failed to remove ${redisRefreshTokenKey(u)}`)
                  return reject(err)
                }
                return resolve(u)
              })
            }
            return resolve(u)
          })
        })
      })
    }))
  }

  const changeRolesTo = (username, newRoles) => {
    const dbUser = db.read('users', username)
    dbUser.roles = newRoles
    db.write('users', username, dbUser)
    return new Promise((resolve, reject) => {
      return remove(username)
        .then(() => resolve(username))
        .catch((err) => reject(err))
    })
  }

  module.exports = {
    canCreate,
    create,
    remove,
    isRefreshTokenPresent,
    removeUpToDate,
    changeRolesTo
  }
}
