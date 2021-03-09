const express = require('express')
const app = express()

app.use('/src', express.static('./src'))

app.get('*', function(request, response, next) {
  response.sendFile(__dirname + '/index.html')
})

app.listen(8080)
