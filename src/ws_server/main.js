const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: true})
const winston = require('winston')
const port = 3000

// Define winston logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: 'error',
      filename: 'logs/error.log',
      maxsize: 5242880
    }),
    new winston.transports.File({
      filename: 'logs/all.log',
      maxsize: 5242880
    })
  ],
  format: winston.format.combine(
    winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    winston.format.json()
  )
})

io.on('connection', (socket) => {
  logger.log('info', 'connected', {socket: {id: socket.id}})

  // Sends server time to client
  socket.emit('server-time', Date.now())

  // Broadcasts a new client joined
  socket.broadcast.emit('join-bc', socket.id)

  // Broadcasts a client leaved
  socket.on('disconnect', () => {
    logger.log('info', 'disconnected', {socket: {id: socket.id}})
    socket.broadcast.emit('leave-bc', socket.id)
  })

  // Broadcasts a message from a client
  socket.on('send-message', (message) => {
    logger.log('info', 'message sended', {socket: {id: socket.id}, value: message.value})
    socket.broadcast.emit('send-message-bc', message)
  })
})

server.listen(port, () => {
  console.log(`Websocket server listening at http://localhost:${port}`)
})
