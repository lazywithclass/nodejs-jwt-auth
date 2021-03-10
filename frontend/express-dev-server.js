const express = require('express')
const app = express()

app.use('/src', express.static('./src'))

// rewrite rule for html5 mode
app.get('*', function(request, response, next) {
  response.sendFile(__dirname + '/index.html')
})

app.listen(8080)
