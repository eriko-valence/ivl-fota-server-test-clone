<template>

<div>
    <strong>Device Management</strong>

<b-table striped hover :items="allDevices"></b-table>
<b-button v-b-modal.modal-prevent>Create New Device</b-button>
    <b-modal
      id="modal-prevent"
      ref="modal"
      title="Upload File"
      @ok="handleOk"
      @shown="handleLoadModal"
    >
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="inputDeviceId" placeholder="Enter device id"></b-form-input>

<b-form-select v-model="selectedGroup" :options="ddGroups" class="mb-3">
      <template slot="first">
        <option :value="null" disabled>-- Please select a group --</option>
      </template>
    </b-form-select>

    <span>Selected: {{ selectedGroup }}</span>

      </form>
    </b-modal>
</div>
</template>

<script>

import authentication from '../authentication'
 
  //import axios from 'axios'
  export default {
    /* define data properties */
      data() {
          return {
              inputDeviceId: '',
              firmware: [],
              allFirmware: [],
              deviceUploadBodyMFOX: {},
              allDevices: [],
              selectedGroup: '',
              ddGroups: []
           }
      },
      methods: {
          handleLoadModal() {
              console.log('handleLoadModal');
              this.inputDeviceId = '';
              this.selectedGroup = '';
          },
          handleOk(evt) {
              // Prevent modal from closing
              console.log('handleOk');
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
         async loadTextFromFile(ev) {
                this.firmwareFileContent = ev.target.files[0];
                const file = ev.target.files[0];
                this.firmwareImage = file.name;
                console.log(`file.name: ${file.name}`);
                console.log(`firmwareImage: ${this.firmwareImage}`);
                var reader = new FileReader();
                reader.onload = function(){
                };
                reader.readAsBinaryString(file);
        },
        uploadToMFOX() {
            console.log(`Step #3a: Upload group to MFOX...`);
            let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/v1/devices';
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            console.log('################################################');
            console.log(this.deviceUploadBodyMFOX);
            console.log('################################################');
            this.axios.post(apiEndpoint, this.deviceUploadBodyMFOX, {headers: {'authorization': accessToken}})
                    .then(function (response) {
                    console.log('success');
                    console.log(`Step #3b: Successfully uploaded group to MFOX...`);
                    console.log(response.data);
                    }).catch(function (error) {
                    console.log('error');
                    console.log(error);
            });
        }
    },

    /* view.js has a set of lifecycle hooks - created, mounted, updated, and destroyed */
    created: function(){
        console.log(authentication.getAccessToken());
        let apiEndpoint1 = 'https://ivlapiadmin.azurewebsites.net/v1/devices';
        let accessToken1 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint1, {headers: {'authorization': accessToken1}})
                .then((response) => {
                this.allDevices = response.data;
                console.log('successfully retrieved all devices from azure sql: ');
                console.log(this.allDevices[0]);
                //console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });

        let apiEndpoint2 = 'https://ivlapiadmin.azurewebsites.net/v1/groups';
        let accessToken2 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
                .then((response) => {                
                //populate firmware drop down list array
                var arrayLength = response.data.length;
                for (var i = 0; i < arrayLength; i++) {
                    this.ddGroups.push({ text: response.data[i]['name'], value: response.data[i]['group_id'] });
                }
                console.log('successfully retrieved all groups from azure sql: ');
                console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });
    }
  }
</script>
