const create = (jwt) => {
  // https://stackoverflow.com/questions/21978658/invalidating-json-web-tokens#comment45057142_23089839
  const accessToken = jwt.sign({
    answer: 42
  }, {
    expiresIn: '0m'
  })

  const refreshToken = jwt.sign({
    answer: 42
  }, {
    expiresIn: '7d'
  })

  return { accessToken, refreshToken }
}

module.exports = {
  create
}
