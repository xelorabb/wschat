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
  faPaperPlane,
  faLightbulb,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons'
import {
  faLightbulb as farLightbulb
} from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

library.add(faList)
library.add(faComments)
library.add(faPaperPlane)
library.add(faChevronDown)
library.add(faLightbulb)
library.add(farLightbulb)

const i18n = createI18n({
  locale: process.env.VUE_APP_I18N_LOCALE,
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE,
  messages: { en, de }
});

VueCookieNext.config({ expire: process.env.VUE_APP_COOKIE_EXPIRE })

createApp(App)
  .use(i18n)
  .use(VueCookieNext)
  .component('fas', FontAwesomeIcon)
  .component('Listbox', Listbox)
  .component('ListboxButton', ListboxButton)
  .component('ListboxOptions', ListboxOptions)
  .component('ListboxOption', ListboxOption)
  .mount('#app')
