<template>
  <div class="flex flex-col px-6 py-6">
    <h1 class="text-6xl w-full text-center pb-4">Websocket Chat</h1>
    <form @submit.prevent class="flex flex-col">
      <div id="chat" class="h-60 overflow-auto">
        <div v-for="msg in messages" :key="msg.value" class="even:bg-gray-200 odd:bg-white">
          <span class="font-bold">{{msg.sender == socketID ? 'You' : msg.sender}}: </span>

          <span v-if="msg.sender == 'server'" class="font-bold text-blue-800">{{msg.value}}</span>
          <span v-else>{{msg.value}}</span>
        </div>
      </div>
      <div class="flex">
        <input v-model="message" @keyup.enter="sendMessage()" placeholder="Type your message ..."
               v-bind:class="{ 'border-red-600': hasError}"
               class="flex-grow mt-2 mr-2 hadow appearance-none border rounded py-2 playholder-gray-400
                      px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" />

        <button @click="sendMessage()" title="send message"
                class="flex-none mt-2 bg-blue-500 hover:bg-blue-700 text-white
                       font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          <fas icon="paper-plane" />
        </button>
      </div>
      <div v-if="hasError" class="text-xs text-red-600 pt-1">{{ errorMessage }}</div>
    </form>
    <span class="pt-2">Your Name: {{socketID}}</span>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  name: 'App',
  created() {
    const vm = this
    const socket = io('http://localhost:3000', {
      reconnection: false,
      transports: ["websocket"]
    })

    vm.socket = socket

    vm.socket.on('connect', () => {
      vm.socketID = socket.id
      vm.pushMessage('server', `You entered the chat`)
    })

    vm.socket.on('join-bc', (socketID) => {
      vm.pushMessage('server', `${socketID} entered the chat`)
    })

    vm.socket.on('leave-bc', (socketID) => {
      vm.pushMessage('server', `${socketID} leaved the chat`)
    })

    vm.socket.on('send-message-bc', (message) => {
      vm.pushMessage(message)
    })
  },
  data() {
    return {
      socket: null,
      socketID: null,
      message: '',
      messages: [],

      // Error variables
      hasError: false,
      errorMessage: '',
      errors: {
        empty: 'No empty message allowed!',
        spam: 'Don\'t spam, please'
      },

      // Spam variables
      spamTimeout: null,
      spamTimeoutActive: false,
      spamCounter: 0,
      lastMessageTime: 0
    }
  },
  methods: {
    // Adds message to client messages array
    // If data is an object then value is ignored
    // Otherwise data is the socket id
    pushMessage: function(data, value) {
      if(typeof data == 'object') { this.messages.push(data) }
      else {
        this.messages.push({
          sender: data,
          value: value
        })
      }
    },

    // Sends a chat message to server and adds it to client
    // Checks spam and empty messages
    sendMessage: function() {
      if(this.spamTimeoutActive) {
        this.setErrorMessage('spam')
      } else {
        // Using this, because v-model.trim don't trim strings with only
        // whitespaces to an empty string
        this.message = this.message.trim()

        if(this.message != '') {
          const message = {
            sender: this.socketID,
            value: this.message
          }

          this.pushMessage(message)
          this.socket.emit('send-message', message)

          this.setErrorMessage()
          this.countSpamMessages()

        } else { this.setErrorMessage('empty') }
      }

      this.message = ''
    },

    // If a message is passed, set an error message
    // Otherwise, clean up
    setErrorMessage: function(message) {
      if(typeof message == 'string') {
        this.hasError = true
        this.errorMessage = this.errors[message]
      }
      else {
        this.hasError = false
        this.errorMessage = ''
      }
    },

    // Counts how many messages were written in less than 1 second
    // A timeout is started after 5 spam messages
    countSpamMessages: function() {
      if(Date.now() - this.lastMessageTime <= 1000) { this.spamCounter++; }
      this.lastMessageTime = Date.now()

      if(this.spamCounter >= 5){ this.initSpamTimeout() }
    },

    // Starts a 10 second spam timeout
    initSpamTimeout: function() {
      this.spamTimeoutActive = true
      this.spamTimeout = setTimeout(() => {
        this.spamTimeoutActive = false
        this.spamCounter = 0
        clearTimeout(this.spamTimeout)
      }, 10000)
    }
  },

  watch: {
    // Scrolls to chat bottom
    messages: {
      handler() {
        this.$nextTick(() => {
          const chat = document.getElementById('chat')
          chat.scrollTop = chat.scrollHeight
        })
      },
      deep: true
    }
  }
}
</script>
