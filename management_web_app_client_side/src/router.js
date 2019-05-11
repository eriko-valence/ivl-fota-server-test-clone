import Vue from 'vue'
import Router from 'vue-router'
//import Home from './components/Home.vue'
import FirmwareManagement from './views/FirmwareManagement.vue'
import GroupManagement from './views/GroupManagement.vue'
import DeviceManagement from './views/DeviceManagement.vue'
import authentication from './authentication'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    /*
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: {
        requiresAuthentication: true
      }
    },*/
    {
      path: '/firmware',
      name: 'FirmwareManagement',
      component: FirmwareManagement,
      meta: {
        requiresAuthentication: true
      }
    },
    {
      path: '/groupmanagement',
      name: 'GroupManagement',
      component: GroupManagement,
      meta: {
        requiresAuthentication: true
      }
    },
    {
      path: '/devicemanagement',
      name: 'DeviceManagement',
      component: DeviceManagement,
      meta: {
        requiresAuthentication: true
      }
    }
  ]
})

// Global route guard
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuthentication)) {
    // this route requires auth, check if logged in
    if (authentication.isAuthenticated()) {
      // only proceed if authenticated.
      next();
    } else {
      authentication.signIn();
    }
  } else {
    next();
  }
});

export default router;