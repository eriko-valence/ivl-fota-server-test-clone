<template>
  <div>

        <b-card bg-variant="dark" text-variant="white" align="right">
        <b-container class="bv-example-row">
            <b-row>
            <b-col class="text-left"><p>{{msg}}</p></b-col>
            <b-col class="text-center" cols="5"><strong>Metafridge Management App</strong></b-col>
            <b-col class="text-right">
                <p v-if="isAuthenticated"><a href="#" v-on:click.stop="logOut()">Log out</a></p>
            </b-col>
            </b-row>
        </b-container>
        </b-card>

<b-nav class="nav-tabs">
  <b-nav-item v-bind:active="tab === 1" v-on:click="tab = 1"><b-link v-bind:to="'firmware'">Firmware</b-link></b-nav-item>
  <b-nav-item v-bind:active="tab === 2" v-on:click="tab = 2"><b-link :active="true" v-bind:to="'groupmanagement'">Groups</b-link></b-nav-item>
  <b-nav-item v-bind:active="tab === 3" v-on:click="tab = 3"><b-link :active="true" v-bind:to="'devicemanagement'">Devices</b-link></b-nav-item>
</b-nav>
<router-view/>
  </div>
  </template>

<script>
import authentication from '../authentication'
export default {
  name: 'app',
    data () {
    return {
      msg: "Signing in...",
      tab: 1
    }
  },
  async created () {
    if (authentication.isAuthenticated()) {
      let userProfile = authentication.getUserProfile();
      this.msg = "Hello, " + userProfile.name
    } else {
      this.msg = "Please sign in"
    }
  },
  computed: {
    isAuthenticated() {
      return authentication.isAuthenticated();
    }
  },
  methods: {
    logOut() {
      authentication.signOut();
    },
    getToken() {
      authentication.acquireToken();
    },
    getProfile() {
      authentication.getUserProfile();
    }
  }
}
</script>