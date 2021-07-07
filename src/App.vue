<template>
  <div class="flex flex-col px-6 py-6">

    <!-- headline -->
    <h1 class="text-6xl w-full text-center pb-4">Websocket Chat</h1>

    <!-- top control panel -->
    <div class="flex items-center mb-2">

      <!-- change view button group -->
      <div class="flex flex-none justify-center rounded-lg text-sm" role="group">
        <button @click="changeActiveView('list')" :title="$t('tooltips.listView')"
                v-bind:class="{ 'bg-blue-700' : activeView == 'list' }"
                class="bg-blue-500 text-white hover:bg-blue-700 rounded-l-lg px-2 py-1 mx-0 outline-none">
          <fas icon="list" />
        </button>
        <button @click="changeActiveView('bubble')" :title="$t('tooltips.bubbleView')"
                :class="{ 'bg-blue-700' : activeView == 'bubble' }"
                class="bg-blue-500 text-white hover:bg-blue-700 rounded-r-lg px-2 py-1 mx-0 outline-none">
          <fas icon="comments" />
        </button>
      </div>

      <div class="flex-grow px-2">
        <select v-model="$i18n.locale" :title="$t('tooltips.language')"
                class="border rounded py-1 px-1 text-gray-700 focus:outline-none focus:shadow-outline">
          <option value="en">en</option>
          <option value="de">de</option>
        </select>
      </div>

      <!-- server time -->
      <div class="flex-none text-xs text-right">{{ $t('server.time') }}: {{ new Date(serverTime).toLocaleTimeString() }}</div>
    </div>

    <!-- chat panel -->
    <div id="chat" class="h-60 overflow-auto">
      <template v-for="msg in messages" :key="msg.value">

        <!-- list view -->
        <template v-if="activeView == 'list'">
          <div class="p-1 odd:bg-gray-200 even:bg-white">

            <!-- list sender -->
            <span class="font-bold">{{ msg.sender == socketID ? $t('you') : msg.sender }}: </span>

            <!-- list message -->
            <span v-if="msg.sender == 'server'" class="font-bold text-blue-700">{{ translateServerMessage(msg.value) }}</span>
            <span v-else>{{ msg.value }}</span>

          </div>
        </template>

        <!-- bubble view -->
        <template v-else>

          <!-- client bubble -->
          <template v-if="msg.sender != 'server'">
            <div :class="{'justify-end': msg.sender == socketID}" class="flex">
              <div class="bg-gray-100 p-2 m-2 border rounded-xl w-7/12">

                <!-- bubble sender -->
                <div class="text-xs text-blue-700 pb-2">{{ msg.sender == socketID ? $t('you') : msg.sender }}</div>

                <!-- bubble message -->
                <div>{{ msg.value }}</div>

              </div>
            </div>
          </template>

          <!-- server bubble -->
          <template v-else>
            <div class="flex justify-center">
              <div class="bg-gray-100 text-center italic p-2 m-2 border rounded-xl w-2/3">
                {{ translateServerMessage(msg.value) }}
              </div>
            </div>
          </template>

        </template>
      </template>
    </div>

    <!-- chat control panel -->
    <form @submit.prevent class="flex">

      <!-- message input -->
      <input v-model="message" @keyup.enter="sendMessage()" :placeholder="$t('placeholder.messageInput')"
             :class="{ 'border-red-600': hasError}"
             class="flex-grow mt-2 mr-2 border rounded py-2 playholder-gray-400
                    px-3 text-gray-700 focus:outline-none focus:shadow-outline" type="text" />

      <!-- send button -->
      <button @click="sendMessage()" :title="$t('tooltips.sendMessage')"
              class="flex-none mt-2 bg-blue-500 hover:bg-blue-700 text-white
                     font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        <fas icon="paper-plane" />
      </button>

    </form>

    <!-- message input error message -->
    <div v-if="hasError" class="text-xs text-red-600 pt-1">{{ $t(errorMessage) }}</div>

    <span class="pt-2">{{ $t('yourName') }}: {{socketID}}</span>
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

    // Adds current client joined message to client messages
    vm.socket.on('connect', () => {
      vm.socketID = socket.id
      vm.pushMessage('server', {client: 'you', msg: 'server.messages.enter-alt'})
    })

    // Adds new client joined message to client messages
    vm.socket.on('join-bc', (socketID) => {
      vm.pushMessage('server', {client: socketID, msg: 'server.messages.enter'})
    })

    // Adds other client leaved message to client messages
    vm.socket.on('leave-bc', (socketID) => {
      vm.pushMessage('server', {client: socketID, msg: 'server.messages.leave'})
    })

    // Adds receiving message to client messages
    vm.socket.on('send-message-bc', (message) => {
      vm.pushMessage(message)
    })

    // Gets server time and start client interval to update the time
    vm.socket.on('server-time', (time) => {
      vm.serverTime = time
      setInterval(() => {
        vm.serverTime += 1000
      }, 1000)
    })
  },
  data() {
    return {
      socket: null,
      socketID: null,
      serverTime: Date.now(),
      message: '',
      messages: [],

      // View variables
      activeView: 'list',

      // Error variables
      hasError: false,
      errorMessage: '',
      errors: {
        empty: 'errors.empty',
        spam: 'errors.spam'
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

    // Changes active chat view
    changeActiveView: function(type) {
      this.activeView = type
      this.scrollBottom()
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
    },

    //Scrolls to chat bottom
    scrollBottom: function() {
      this.$nextTick(() => {
        const chat = document.getElementById('chat')
        chat.scrollTop = chat.scrollHeight
      })
    },

    // Translates the server messages
    translateServerMessage: function(value) {
      return `${value.client == 'you' ? this.$t('you') : value.client} ${this.$t(value.msg)}`
    }
  },

  watch: {
    // Scrolls to chat bottom when new message added
    messages: {
      handler() { this.scrollBottom() },
      deep: true
    }
  }
}
</script>
