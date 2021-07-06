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
      <div v-if="hasError" class="text-xs text-red-600 pt-1">No empty message allowed!</div>
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
      hasError: false
    }
  },
  methods: {
    pushMessage: function(data, value) {
      if(typeof data == 'object') { this.messages.push(data) }
      else {
        this.messages.push({
          sender: data,
          value: value
        })
      }
    },
    sendMessage: function() {
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
        this.message = ''
        this.hasError = false
      } else { this.hasError = true }
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
