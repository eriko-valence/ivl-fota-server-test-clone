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
        
    </div>
</template>

<script>
import authentication from '../authentication'
export default {
  name: 'app',
    data () {
    return {
      msg: "Signing in..."
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