import Vue from 'vue'
import App from './App.vue'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueClipboard from 'vue-clipboard2'

import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap/dist/css/bootstrap.css'

import authentication from './authentication'
import {AppInsights} from "applicationinsights-js"

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)
Vue.use(VueClipboard)

AppInsights.downloadAndSetup({ instrumentationKey: "7c73a36d-8123-4abc-a807-017939c70a9c" });

authentication.initialize().then(() => {
  
  AppInsights.trackEvent("main.authentication.initialize.success", null);
  console.log('main.js -> authentication -> initialize -> completed');
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
}).catch((error) => {
  AppInsights.downloadAndSetup({ instrumentationKey: "7c73a36d-8123-4abc-a807-017939c70a9c" });
  if (error) {
    AppInsights.trackEvent("main.authentication.initialize.error", error);
    AppInsights.trackException(error, 'notused', { 'step': 'main.authentication.initialize.error' });
  } else {
    AppInsights.trackException(new Error('unknown error'), 'notused', { 'step': 'main.authentication.initialize.error' });
  }
  console.log('main.js -> authentication -> initialize -> error');
  console.log('-----------------------------------------------');
  console.log(error);
  console.log('-----------------------------------------------');
})
