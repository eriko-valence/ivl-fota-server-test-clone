<template>
  <div>
    <b-card bg-variant="dark" text-variant="white" align="right">
      <b-container class="bv-example-row">
        <b-row>
          <b-col class="text-left">
            <p>{{ msg }}</p>
          </b-col>
          <b-col class="text-center" cols="5">
            <strong>Metafridge Management App</strong>
          </b-col>
          <b-col class="text-right">
            <p v-if="isAuthenticated">
              <a href="#" @click.stop="logOut()">Log out</a>
            </p>
          </b-col>
        </b-row>
      </b-container>
    </b-card>

    <b-nav class="nav-tabs">
      <b-nav-item :active="tab === 'FirmwareManagement'" @click="tab = 'FirmwareManagement'">
        <b-link :to="'firmware'">
          Firmware
        </b-link>
      </b-nav-item>
      <b-nav-item :active="tab === 'GroupManagement'" @click="tab = 'GroupManagement'">
        <b-link :active="true" :to="'groupmanagement'">
          Groups
        </b-link>
      </b-nav-item>
      <b-nav-item :active="tab === 'DeviceManagement'" @click="tab = 'DeviceManagement'">
        <b-link :active="true" :to="'devicemanagement'">
          Devices
        </b-link>
      </b-nav-item>
    </b-nav>
    <router-view />
  </div>
</template>

<script>
    import authentication from '../authentication'
    export default {
        name: 'app',
        data () {
            return {
                msg: 'Signing in...',
                tab: this.getCurrentRouteName()
            }
        },
        computed: {
            isAuthenticated() {
                return authentication.isAuthenticated();
            }
        },
        async created () {
            if (authentication.isAuthenticated()) {
                let userProfile = authentication.getUserProfile();
                this.msg = 'Hello, ' + userProfile.name
            } else {
                this.msg = 'Please sign in'
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
            },
            getCurrentRouteName() {
                return this._routerRoot._route.name;
            }
        }
    }
</script>