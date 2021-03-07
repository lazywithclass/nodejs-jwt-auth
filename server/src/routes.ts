const db = {
  users: {}
}

const listUsers = async (request, reply) => {
  return db.users
}

const createUser = (request, reply) => {
  const {username, password} = request.body
  if (db.users[username]) {
    reply.code(409)
    return { message: "user already exists"}
  }

  db.users[username] = { username, password }

  return username
}

module.exports = { listUsers, createUser}
