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
import shared from './shared'

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)
Vue.use(VueClipboard)

authentication.initialize().then(() => {
  console.log('###############################################> authentication.initialize().then(() => ');
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
}).catch((error) => {
  shared.trackException(error, 'main.authentication.initialize.error');
})
