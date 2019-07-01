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
            <p v-else>
              <a href="#" @click.stop="logIn()">Log in</a>
            </p>
          </b-col>
        </b-row>
      </b-container>
    </b-card>

    <p v-if="isAdalError">
      Unauthorized user!!!
    </p>

    <b-nav v-if="isAuthenticated" class="nav-tabs">
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
        name: 'App',
        data () {
            return {
                msg: 'Signing in...',
                tab: this.getCurrentRouteName()
            }
        },
        computed: {
            isAuthenticated() {
                return authentication.isAuthenticated();
            },
            isAdalError() {
                return authentication.isAdalError();
            }
        },
        async created () {
            if (authentication.isAuthenticated()) {
                let userProfile = authentication.getUserProfile();
                this.msg = 'Hello, ' + userProfile.name
            } else {
                this.msg = 'Please sign in'
            }
            console.log('1##############################################################');
            this.getError();
            console.log('2##############################################################');
        },
        methods: {
            logOut() {
                authentication.signOut();
            },
            logIn() {
                authentication.signIn();
            },
            getToken() {
                authentication.acquireToken();
            },
            getProfile() {
                authentication.getUserProfile();
            },
            getCurrentRouteName() {
                return this._routerRoot._route.name;
            },
            getError() {
                authentication.isAdalError();
            }
        }
    }
</script>