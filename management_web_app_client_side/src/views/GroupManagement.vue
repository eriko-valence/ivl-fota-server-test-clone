<template>

<div>
    <strong>Group Management</strong>

<b-table striped hover :items="allGroups"></b-table>
<b-button v-b-modal.modal-prevent>Create New Group</b-button>
    <b-modal
      id="modal-prevent"
      ref="modal"
      title="Upload File"
      @ok="handleOk"
      @shown="handleLoadModal"
    >
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="inputGroupName" placeholder="Enter group name"></b-form-input>

<b-form-select v-model="selectedFirmware" :options="ddFirmware" class="mb-3">
      <template slot="first">
        <option :value="null" disabled>-- Please select a firmware --</option>
      </template>
    </b-form-select>

    <span>Selected: {{ selectedFirmware }}</span>

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
              inputGroupName: '',
              firmware: [],
              allFirmware: [],
              groupUploadBodyMFOX: {},
              allGroups: [],
              selectedFirmware: '',
              ddFirmware: []
           }
      },
      methods: {
          handleLoadModal() {
              console.log('handleLoadModal');
              this.inputGroupName = '';
              this.selectedFirmware = '';
          },
          handleOk(evt) {
              // Prevent modal from closing
              console.log('handleOk');
              evt.preventDefault()
              if (!this.inputGroupName) {
                  alert('Please enter group 1')
              } else if (!this.selectedFirmware) {
                  alert('Please enter group 2')
              } else {
                 this.handleSubmit()
              }
          },
          handleSubmit() {
                this.groupUploadBodyMFOX = {
                  name: this.inputGroupName,
                  desired_fw_id : this.selectedFirmware
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
            let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/v1/groups';
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            console.log('################################################');
            console.log(this.groupUploadBodyMFOX);
            console.log('################################################');
            this.axios.post(apiEndpoint, this.groupUploadBodyMFOX, {headers: {'authorization': accessToken}})
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
        let apiEndpoint1 = 'https://ivlapiadmin.azurewebsites.net/v1/groups';
        let accessToken1 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint1, {headers: {'authorization': accessToken1}})
                .then((response) => {
                this.allGroups = response.data;
                console.log('successfully retrieved all groups from azure sql: ');
                console.log(this.allGroups[0]);
                //console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });

        let apiEndpoint2 = 'https://ivlapiadmin.azurewebsites.net/v1/firmware';
        let accessToken2 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
                .then((response) => {                
                //populate firmware drop down list array
                var arrayLength = response.data.length;
                for (var i = 0; i < arrayLength; i++) {
                    this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['firmware_id'] });
                }
                console.log('successfully retrieved all firmware from azure sql: ');
                console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });
    }
  }
</script>
