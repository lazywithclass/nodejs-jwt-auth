const jwtTokens = require('./dist/jwt-tokens')

if (process.argv.length <= 3) {
  console.log('Missing roles / username parameter')
  process.exit(1)
}

const username = process.argv[2]
const roles = JSON.parse(process.argv[3])
jwtTokens.changeRolesTo(username, roles).then(() => {
  process.exit(0)
})
