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

/* Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key */
AppInsights.downloadAndSetup({ instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY });

authentication.initialize().then(() => {
  AppInsights.trackEvent("main.authentication.initialize.success", null);
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
}).catch((error) => {
  if (error) {
    AppInsights.trackEvent("main.authentication.initialize.error", error);
    AppInsights.trackException(error, 'notused', { 'step': 'main.authentication.initialize.error' });
  } else {
    AppInsights.trackException(new Error('unknown error'), 'notused', { 'step': 'main.authentication.initialize.error' });
  }
  console.log('main.js -> authentication -> initialize -> error'); // eslint-disable-line
  console.log('-----------------------------------------------'); // eslint-disable-line
  console.log(error); // eslint-disable-line
  console.log('-----------------------------------------------'); // eslint-disable-line
})
