require('dotenv').config({path: `${__dirname}/../../.env`})

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: true})
const winston = require('winston')
const port = process.env.WS_SERVER_PORT

// Define winston logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: 'error',
      filename: `${process.env.LOG_DIR}/error.log`,
      maxsize: process.env.LOG_FILE_MAX_SIZE
    }),
    new winston.transports.File({
      filename: `${process.env.LOG_DIR}/all.log`,
      maxsize: process.env.LOG_FILE_MAX_SIZE
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

    message.timestamp = Date.now() // Overrides client time with current server time
    socket.emit('server-time', Date.now()) // Update client time with current server time
    socket.broadcast.emit('send-message-bc', message)
  })
})

server.listen(port, () => {
  console.log(`Websocket server listening at http://localhost:${port}`)
})
