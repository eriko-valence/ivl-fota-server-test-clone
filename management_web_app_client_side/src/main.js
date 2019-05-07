import Vue from 'vue'
import App from './App.vue'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap/dist/css/bootstrap.css'

import authentication from './authentication'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)



authentication.initialize().then(() => {
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
});
