import App from './App.vue'
import './assets/tailwind.css'
import { createApp } from 'vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'



library.add(faPaperPlane)

createApp(App)
  .component("fas", FontAwesomeIcon)
  .mount('#app')
