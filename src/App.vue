<template>
  <div :class="{ 'dark' : isDarkMode}">
    <div class="flex flex-col px-6 py-6 h-screen bg-white dark:bg-gray-900">

    <!-- headline -->
    <h1 class="text-6xl w-full text-center pb-4 dark:text-gray-400">Websocket Chat</h1>

    <!-- top control panel -->
    <div class="flex items-center mb-2">

      <!-- change view button group -->
      <div class="flex flex-none justify-center rounded-lg text-sm pr-2" role="group">
        <button @click="changeActiveView('list')" :title="$t('tooltips.listView')"
                :class="{ 'bg-primary-dark' : activeView == 'list' }"
                class="bg-primary text-white hover:bg-primary-dark rounded-l-lg px-2 py-1 mx-0 outline-none">
          <fas icon="list" />
        </button>
        <button @click="changeActiveView('bubble')" :title="$t('tooltips.bubbleView')"
                :class="{ 'bg-primary-dark' : activeView == 'bubble' }"
                class="bg-primary text-white hover:bg-primary-dark rounded-r-lg px-2 py-1 mx-0 outline-none">
          <fas icon="comments" />
        </button>
      </div>

      <!-- dark mode toggle button -->
      <div class="flex-none pr-2">
        <button @mouseover="toggleDarkModeToggleIcon(true)"
                @mouseleave="toggleDarkModeToggleIcon(false)"
                @click="changeDarkMode(!isDarkMode)"
                class="text-primary dark:text-primary-light">
          <fas :icon="[darkModeToggleIcon, 'lightbulb']"></fas>
        </button>
      </div>

      <!-- language select -->
      <div class="flex-none pr-2">
        <Listbox v-model="$i18n.locale">
          <ListboxButton class="relative w-16 border rounded p-1 text-gray-700
                                dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700">
            {{ $i18n.locale }} <fas class="fa-xs text-gray-700 ml-2" icon="chevron-down"/>
          </ListboxButton>

          <ListboxOptions class="absolute w-16 overflow-auto bg-white border rounded max-h-60 dark:border-gray-700">
            <ListboxOption v-for="(lang, index) in Object.keys(this.$i18n.messages)" :key="`lang-${index}`"
                           :value="lang"
                           class="text-gray-700 hover:bg-primary hover:text-white p-1 pl-3
                                  dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700
                                  dark:hover:bg-primary dark:hover:text-white" >
              {{ lang }}
            </ListboxOption>
          </ListboxOptions>
        </Listbox>
      </div>

      <div class="flex-grow pr-2"></div>

      <!-- server time -->
      <div class="flex-none text-xs text-right dark:text-gray-400">{{ $t('server.time') }}: {{ getTimeString(serverTime) }}</div>
    </div>

    <!-- chat panel -->
    <div id="chat" class="h-60 overflow-auto">
      <template v-for="msg in messages" :key="msg.value">

        <!-- list view -->
        <template v-if="activeView == 'list'">
          <div class="p-1 odd:bg-gray-200 even:bg-white
                      dark:text-gray-400 dark:odd:bg-gray-700 dark:even:bg-gray-800">

            <div class="flex">
              <!-- list sender -->
              <span class="flex-none font-bold">{{ msg.sender == socketID ? $t('you') : msg.sender }}: </span>

              <!-- list message -->
              <span v-if="msg.sender == 'server'" class="flex-grow px-1 font-bold text-primary dark:text-primary-lighter">{{ translateServerMessage(msg.value) }}</span>
              <span v-else class="flex-grow px-1" v-html="msg.value"></span>
              <span class="flex-none text-xs italic">{{ getTimeString(msg.timestamp, 'short') }}</span>
            </div>

          </div>
        </template>

        <!-- bubble view -->
        <template v-else>

          <!-- client bubble -->
          <template v-if="msg.sender != 'server'">
            <div :class="{'justify-end': msg.sender == socketID}" class="flex">
              <div class="bg-gray-100 p-2 m-2 border rounded-xl w-7/12
                          dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">

                <!-- bubble sender -->
                <div class="text-xs text-primary dark:text-primary-lighter pb-2">
                  {{ msg.sender == socketID ? $t('you') : msg.sender }}
                </div>

                <!-- bubble message -->
                <div v-html="msg.value"></div>

                <!-- bubble timestamp -->
                <div class="text-xs text-primary dark:text-primary-lighter text-right italic pt-2">
                  {{ getTimeString(msg.timestamp, 'short') }}
                </div>

              </div>
            </div>
          </template>

          <!-- server bubble -->
          <template v-else>
            <div class="flex justify-center">
              <div class="bg-gray-100 text-center italic p-2 m-2 border rounded-xl w-2/3
                          dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                <span>{{ translateServerMessage(msg.value) }}</span>
                <span class="text-xs text-primary dark:text-primary-lighter text-right italic pl-2">
                  {{ getTimeString(msg.timestamp, 'short') }}
                </span>
              </div>
            </div>
          </template>

        </template>
      </template>
    </div>

    <!-- chat control panel -->
    <form @submit.prevent class="flex">

      <!-- message input -->
      <textarea id="messageArea"
                v-model="message"
                @keyup.enter="submitMessage($event)"
                @keydown.enter.prevent
                :placeholder="$t('placeholders.messageInput')"
                :class="{ 'border-red-600 dark:border-red-900': hasError }"
                class="flex-grow mt-2 mr-2 border rounded py-2 playholder-gray-400
                       resize-none px-3 text-gray-700 focus:outline-none
                       focus:shadow-outline
                       dark:text-gray-400 dark:bg-gray-800 dark:playholder-gray-600
                       dark:border-gray-700"
                type="text" rows="1" />

      <!-- send button -->
      <button @click="sendMessage()" :title="$t('tooltips.sendMessage')"
              class="self-start flex-none mt-2 bg-primary hover:bg-primary-dark text-white
                     font-bold py-4 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        <fas icon="paper-plane" size="lg"/>
      </button>

    </form>

    <!-- message input error message -->
    <div v-if="hasError" class="text-xs text-red-600 dark:text-red-800 pt-1">{{ $t(errorMessage) }}</div>

    <span class="pt-2 dark:text-gray-400">{{ $t('yourName') }}: {{socketID}}</span>

    <div>
      <input v-model="sendWithEnter"
             @change="updateSendWithEnterCookie()"
             type="checkbox" name="send-with-enter" />
      <label class="pl-1 dark:text-gray-400" for="send-with-enter">{{ $t('labels.sendWithEnter') }}</label>
    </div>

  </div>
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

    vm.loadCookies()

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

      clearInterval(vm.clientTimeInterval)
      vm.clientTimeInterval = setInterval(() => {
        vm.serverTime += 1000
      }, 1000)
    })
  },
  data() {
    return {
      socket: null,
      socketID: null,
      serverTime: Date.now(),
      clientTimeInterval: null,
      message: '',
      messages: [],

      // View variables
      activeView: 'list',

      // Option variables
      sendWithEnter: true,

      // Darkmode varibales
      isDarkMode: false,
      darkModeToggleIcon: 'far',

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
          value: value,
          timestamp: this.serverTime
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

        // Replaces all newlines with html <br/>
        this.message = this.message.replace(/\n/g, "<br/>")

        if(this.message != '') {
          const message = {
            sender: this.socketID,
            value: this.message,
            timestamp: this.serverTime
          }

          this.pushMessage(message)
          this.socket.emit('send-message', message)

          this.setErrorMessage()
          this.countSpamMessages()

        } else { this.setErrorMessage('empty') }
      }

      this.message = ''
    },

    // Handles message submit event
    // Send a message or make a newline by pressing enter
    // Swap bevahior with ctrl
    submitMessage: function(e) {
      const newline = () => {
        this.message += '\n'

        // Grows textarea up to 4 rows
        if(document.getElementById('messageArea').rows < 4) {
          document.getElementById('messageArea').rows += 1
        }
      }

      const sendMessage = () => {
        this.sendMessage()

        // Sets textarea back to 1 row
        document.getElementById('messageArea').rows = 1
      }

      if(this.sendWithEnter) {
        if(e.ctrlKey) { newline() }
        else { sendMessage() }
      } else {
        if(e.ctrlKey) { sendMessage() }
        else { newline() }
      }
    },

    // Changes active chat view
    changeActiveView: function(type) {
      this.activeView = type
      this.updateViewCookie()
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
    },

    // Updates i18n localization cookie
    updateLocalizationCookie: function() {
      this.updateCookie('locale', this.$i18n.locale)
    },

    // Updates view cookie
    updateViewCookie: function() {
      this.updateCookie('view', this.activeView)
    },

    // Updates send with enter cookie
    updateSendWithEnterCookie: function() {
      this.updateCookie('send_with_enter', this.sendWithEnter)
    },

    // Update is dark mode cookie
    updateIsDarkModeCookie: function() {
      this.updateCookie('is_dark_mode', this.isDarkMode)
    },

    // Cookie update helper
    updateCookie: function(key, value) {
      this.$cookie.setCookie(key, value)
    },

    // Loads all stored cookies if available
    // Otherwise set the cookies to default values
    loadCookies: function() {
      if(this.$cookie.isCookieAvailable('locale')){
        this.$i18n.locale = this.$cookie.getCookie('locale')
      } else { this.updateLocalizationCookie() }

      if(this.$cookie.isCookieAvailable('view')){
        this.activeView = this.$cookie.getCookie('view')
      } else { this.updateViewCookie() }

      if(this.$cookie.isCookieAvailable('send_with_enter')){
        this.sendWithEnter = JSON.parse(this.$cookie.getCookie('send_with_enter').toLowerCase())
      } else { this.updateSendWithEnterCookie() }

      if(this.$cookie.isCookieAvailable('is_dark_mode')){
        this.isDarkMode = JSON.parse(this.$cookie.getCookie('is_dark_mode').toLowerCase())
      } else { this.updateIsDarkModeCookie() }
    },

    // Helps to convert timestamp into readable time string
    getTimeString: function(time, style) {
      if(typeof style != 'string') {
        return new Date(time).toLocaleTimeString()
      } else {
        return new Date(time).toLocaleTimeString([], {timeStyle: style})
      }
    },

    // Changes dark mode to on or off
    changeDarkMode: function(isDarkMode) {
      this.isDarkMode = isDarkMode
      this.darkModeToggleIcon = 'far'
      this.updateIsDarkModeCookie()
    },

    // Toggles dark mode toggle button icon
    toggleDarkModeToggleIcon: function(n) {
      if(n) { this.darkModeToggleIcon = 'fas' }
      else { this.darkModeToggleIcon = 'far' }
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
