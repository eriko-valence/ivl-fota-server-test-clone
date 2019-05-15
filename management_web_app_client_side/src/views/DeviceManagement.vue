<template>
  <div>
    <b-table :busy="isLoading" striped hover :items="allDevices" :fields="fields">
      <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong>Loading...</strong>
      </div>
    </b-table>
    <b-button v-b-modal.modal-prevent>Create New Device</b-button>
    <b-modal id="modal-prevent" ref="modal" title="Upload File" @ok="handleOk" @shown="handleLoadModal">
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="inputDeviceId" placeholder="Enter device id"></b-form-input>
        <b-form-select v-model="selectedGroup" :options="ddGroups" class="mb-3">
        <template slot="first">
          <option :value="null" disabled>-- Please select a group --</option>
        </template>
      </b-form-select>
      </form>
    </b-modal>
  </div>
</template>

<script>
import authentication from '../authentication'
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
        fields: [
          { key: 'deviceid', label: 'Device ID', sortable: true, sortDirection: 'desc' },
          { key: 'group', label: 'Group', sortable: true, class: 'text-center' },
          { key: 'desired_fw', label: 'Desired FW Version', sortable: true, class: 'text-center' },
          { key: 'reported_fw', label: 'Reported FW Version', sortable: true, class: 'text-center' },
          { key: 'last_report_date', label: 'Last Report Date', sortable: true, class: 'text-center' }
        ],
        isLoading: false,
      }
    },
    methods: {
      handleLoadModal() {
        this.inputDeviceId = '';
        this.selectedGroup = null;
      },
      handleOk(evt) {
        evt.preventDefault()
        if (!this.inputDeviceId) {
            alert('Please enter a device id')
        } else if (!this.selectedGroup) {
            alert('Please select a group')
        } else {
            this.handleSubmit()
        }
      },
      handleSubmit() {
        this.deviceUploadBodyMFOX = {
          deviceid: this.inputDeviceId,
          group_id : this.selectedGroup
          };
        this.handleLoadModal()
        this.$nextTick(() => {
          this.$refs.modal.hide()
        })
        this.uploadToMFOX();
      },
      uploadToMFOX() {
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/v1/devices';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.post(apiEndpoint, this.deviceUploadBodyMFOX, {headers: {'authorization': accessToken}})
        .then( (response) => {
          console.log(`response: ${response}`); // eslint-disable-line
          this.getAllDevices();
        }).catch( (error) => {
          console.log(`error: ${error}`); // eslint-disable-line
        });
      },
      getAllDevices() {
        console.log('get all devices');
        this.toggleLoading(true);
        let apiEndpoint1 = 'https://ivlapiadmin.azurewebsites.net/v1/devices';
        let accessToken1 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint1, {headers: {'authorization': accessToken1}})
          .then((response) => {
            this.toggleLoading(false);
            this.allDevices = response.data;
          }).catch(function (error) {
            this.toggleLoading(false);
            console.log(`error: ${error}`); // eslint-disable-line
        });
      },
      getAllGroups() {
        let apiEndpoint2 = 'https://ivlapiadmin.azurewebsites.net/v1/groups';
        let accessToken2 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
        .then((response) => {                
          //populate group drop down list array
          var arrayLength = response.data.length;
          for (var i = 0; i < arrayLength; i++) {
              this.ddGroups.push({ text: response.data[i]['name'], value: response.data[i]['group_id'] });
          }
        }).catch(function (error) {
          console.log(`error: ${error}`); // eslint-disable-line
        });
      },
      toggleLoading(state) {
        this.isLoading = state;
      }
    },
    created:
      function(){
        this.getAllDevices();
        this.getAllGroups();
      }
  }
</script>
