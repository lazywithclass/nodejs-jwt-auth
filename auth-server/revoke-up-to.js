const jwtTokens = require('./dist/jwt-tokens')

if (process.argv.length <= 2) {
  console.log('Missing time as parameter')
  process.exit(1)
}

jwtTokens.removeUpToDate(parseInt(process.argv[2], 10)).then(() => {
  process.exit(0)
})
