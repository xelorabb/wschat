import App from './App.vue'
import './assets/tailwind.css'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n/index'
import en from '../locales/en.json'
import de from '../locales/de.json'
import { VueCookieNext } from 'vue-cookie-next'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faList,
  faComments,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faList)
library.add(faComments)
library.add(faPaperPlane)

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, de }
});

VueCookieNext.config({ expire: '1d' })

createApp(App)
  .use(i18n)
  .use(VueCookieNext)
  .component('fas', FontAwesomeIcon)
  .mount('#app')
