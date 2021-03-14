namespace db {

  // This is an abstract version of what a db would be in the real world
  // I did not use a proper db because I thought it was out of the scope of this

  const DB_PATH = '../db.json'
  const fs = require('fs')

  const read = (domain, key) => {
    const data = getData()
    if (!domain) {
      return data
    }
    return key ? data[domain][key] : data[domain]
  }

  const write = (domain, key, value) => {
    const data = getData()
    data[domain][key] = value
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, '  '))
  }

  const remove = (domain, key) => {
    const data = getData()
    delete data[domain][key]
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, '  '))
  }

  const getData = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

  module.exports = { read, write, remove }
}
