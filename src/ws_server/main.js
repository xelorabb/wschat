const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: true})
const port = 3000

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`)

  // Sends server time to client
  socket.emit('server-time', Date.now())

  // Broadcasts a new client joined
  socket.broadcast.emit('join-bc', socket.id)

  // Broadcasts a client leaved
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`)
    socket.broadcast.emit('leave-bc', socket.id)
  })

  // Broadcasts a message from a client
  socket.on('send-message', (message) => {
    console.log(`${message.sender} sended '${message.value}'`)
    socket.broadcast.emit('send-message-bc', message)
  })
})

server.listen(port, () => {
  console.log(`Websocket server listening at http://localhost:${port}`)
})
