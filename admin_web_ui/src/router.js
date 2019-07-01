import Vue from 'vue'
import Router from 'vue-router'
//import Home from './components/Home.vue'
import FirmwareManagement from './views/FirmwareManagement.vue'
import GroupManagement from './views/GroupManagement.vue'
import DeviceManagement from './views/DeviceManagement.vue'
import authentication from './authentication'
import Unauthorized from './components/Unauthorized.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: Unauthorized
    },
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
  console.log('#####################################################>global route guard');
  if (to.matched.some(record => record.meta.requiresAuthentication)) {
    console.log('#####################################################>authentication required');
    // this route requires auth, check if logged in
    if (authentication.isAuthenticated()) {
      console.log('#####################################################>authenticated');
      // only proceed if authenticated.
      next();
    } else {
      authentication.signIn();
    }
  } else {
    console.log('#####################################################>authentication not required');
    next();
  }
});

export default router;