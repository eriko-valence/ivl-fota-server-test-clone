import Vue from 'vue'
import App from './App.vue'
import router from './router'
import BootstrapVue from 'bootstrap-vue'

import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap/dist/css/bootstrap.css'

import authentication from './authentication'

Vue.config.productionTip = false

Vue.use(BootstrapVue)



authentication.initialize().then(() => {
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
});
