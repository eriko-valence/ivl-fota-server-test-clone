<template>
  <div>
    <b-table :busy="isLoading" striped hover :items="allDevices" :fields="fields">
      <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong>Loading...</strong>
      </div>

    <template slot="group" scope="row">
      <b-form-select @change="updateDeviceInMFOX(row.item)" v-model="row.item.group_id" :options="ddGroups" class="mb-3"></b-form-select>
    </template>
    </b-table>

    <b-modal ref="modal-error" :header-bg-variant="headerBgVariant" :header-text-variant="headerTextVariant" hide-footer>
      <template slot="modal-title">
        Error
      </template>
      <div class="d-block text-center">
        <h6>{{this.deleteError}}</h6>
      </div>
      <b-button class="mt-3" variant="outline-danger" block @click="confirmFirmwareError()">OK</b-button>
    </b-modal>
  </div>
</template>

<script>
import authentication from '../authentication'
import shared from '../shared'

export
  default {
    data() {
      return {
        inputDeviceId: '',
        firmware: [],
        allFirmware: [],
        deviceUploadBodyMFOX: {},
        allDevices: [],
        selectedGroup: null,
        editGroup: [],
        ddGroups: [],
        deleteError: '',
        variants: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark'],
        headerBgVariant: 'danger',
        headerTextVariant: 'light',
        fields: [
          { key: 'deviceid', label: 'Fridge ID', sortable: true, sortDirection: 'desc' },
          { key: 'ShortSN', label: 'Short SN', sortable: true, sortDirection: 'desc' },
          { key: 'MFID', label: 'MF', sortable: true, sortDirection: 'desc' },
          { key: 'group', label: 'Group', sortable: true,},
          { key: 'desired_fw', label: 'Desired FW Version', sortable: true, class: 'text-center' },
          { key: 'reported_fw', label: 'Reported FW Version', sortable: true, class: 'text-center' },
          { key: 'last_reported', label: 'Last Report Date', sortable: true, class: 'text-center' }
        ],
        isLoading: false
      }
    },
    methods: {
      uploadToMFOX() {
        authentication.getAccessToken()
          .then( (token) => {
            let apiEndpoint = `${shared.getObjectKey(process.env, 'VUE_APP_API_ENDPOINT_URL')}/v1/devices`
            let accessToken = `Bearer ${token}`;
            this.axios.post(apiEndpoint, this.deviceUploadBodyMFOX, {headers: {'authorization': accessToken}})
            .then( (response) => {
              console.log(`response: ${response}`); // eslint-disable-line
              this.getAllDevices();
            }).catch( (error) => {
                console.log(error);
                this.deleteError = shared.getErrorResponseMessage(error);
                this.$refs['modal-error'].show();
            });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });
      },
      getAllDevices() {
        authentication.getAccessToken()
          .then( (token) => {
            this.toggleLoading(true);
            let apiEndpoint1 = `${shared.getObjectKey(process.env, 'VUE_APP_API_ENDPOINT_URL')}/v1/devices`
            let accessToken1 = `Bearer ${token}`;
            this.axios.get(apiEndpoint1, {headers: {'authorization': accessToken1}})
              .then((response) => {
                this.toggleLoading(false);
                this.allDevices = response.data;
              }).catch( (error) => {
                if (error.toString().includes("404")) {
                  this.allDevices = [];
                }
                this.toggleLoading(false);
                console.log(error);
                this.deleteError = shared.getErrorResponseMessage(error);
                this.$refs['modal-error'].show();
            });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });
      },
      getAllGroups() {
        authentication.getAccessToken()
          .then( (token) => {
            let apiEndpoint2 = `${shared.getObjectKey(process.env, 'VUE_APP_API_ENDPOINT_URL')}/v1/groups`
            let accessToken2 = `Bearer ${token}`;
            this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
            .then((response) => {                
              //populate group drop down list array
              var arrayLength = response.data.length;
              for (var i = 0; i < arrayLength; i++) {
                  this.ddGroups.push({ value: response.data[i]['group_id'], text: response.data[i]['name'] });
              }
            }).catch(function (error) {
              console.log(`error: ${error}`); // eslint-disable-line
            });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });
      },
      toggleLoading(state) {
        this.isLoading = state;
      },
      updateDeviceInMFOX(item) {
        authentication.getAccessToken()
          .then( (token) => {
            let deviceUpdateBodyMFOX = {
              deviceid: item.deviceid,
              group_id : item.group_id
            };
            let apiEndpoint = `${shared.getObjectKey(process.env, 'VUE_APP_API_ENDPOINT_URL')}/v1/devices/${item.deviceid}`
            let accessToken = `Bearer ${token}`;
            this.axios.put(apiEndpoint, deviceUpdateBodyMFOX, {headers: {'authorization': accessToken}})
            .then( (response) => {
              console.log(`response: ${response}`); // eslint-disable-line
              this.getAllDevices();
            }).catch( (error) => {
                console.log(error);
                this.deleteError = shared.getErrorResponseMessage(error);
                this.$refs['modal-error'].show();
            });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });
      },
      confirmFirmwareError() {
        this.$refs['modal-error'].hide();
        this.deleteError = '';
      }
    },
    created:
      function(){
        this.getAllDevices();
        this.getAllGroups();
      }
  }
</script>
