const jwtTokens = require('./dist/jwt-tokens')

if (process.argv.length < 2) {
  console.log('Please enter a time in ms since epoch')
  return
}
jwtTokens.removeUpToDate(parseInt(process.argv[2], 10)).then(() => {
  process.exit(0)
})
