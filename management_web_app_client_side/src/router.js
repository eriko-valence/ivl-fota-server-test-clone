import Vue from 'vue'
import Router from 'vue-router'
import Home from './components/Home.vue'
import FirmwareManagement from './views/FirmwareManagement.vue'
import GroupManagement from './views/GroupManagement.vue'
import DeviceManagement from './views/DeviceManagement.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/firmware',
      name: 'FirmwareManagement',
      component: FirmwareManagement
    },
    {
      path: '/groupmanagement',
      name: 'GroupManagement',
      component: GroupManagement
    },
    {
      path: '/devicemanagement',
      name: 'DeviceManagement',
      component: DeviceManagement
    }
  ]
})
