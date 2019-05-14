<template>

<div>
    <strong>Group Management</strong>

<b-table  striped hover :items="allGroups" :fields="fields">
      <template slot="actionDelete" slot-scope="row">
        <b-button @click="deleteGroupConfirm(row.item)" pill variant="outline-danger">
         <!-- <b-button v-b-modal.confirm-delete pill variant="outline-danger">Delete</b-button> -->
          Delete
        </b-button>
      </template>
            <template slot="actionEdit" slot-scope="row">
        <b-button @click="editGroupModal(row.item)" pill>
          Edit
        </b-button>
      </template>
</b-table>
<b-button v-b-modal.modal-prevent>Create New Group</b-button>

  <b-modal ref="modal-confirm-delete" hide-footer>

    <div class="d-block text-center">
      <h6>Are you sure you want to delete this group?</h6>
    </div>
    <b-button @click="deleteGroup()" pill variant="outline-danger">Delete</b-button>
    <b-button @click="cancelDeleteGroup()" pill>Cancel</b-button>
  </b-modal>

  <b-modal ref="modal-delete-error" hide-footer>

    <div class="d-block text-center">
      <h6>An error occured while deleting the group</h6>
      <h6>{{this.groupDeleteError}}</h6>
    </div>
    <b-button @click="confirmDeleteGroupError()" pill>OK</b-button>
  </b-modal>

  <b-modal ref="modal-confirm-delete" hide-footer>

    <div class="d-block text-center">
      <h6>Are you sure you want to delete this group ?</h6>
    </div>
    <b-button @click="deleteGroupFromMFOX(groupIdToDelete)" pill variant="outline-danger">Delete</b-button>
    <b-button @click="cancelDeleteGroup()" pill>Cancel</b-button>
  </b-modal>

    <b-modal ref="edit-group-modal" hide-footer>

    <div class="d-block text-center">
      <h6>Edit the following group fields</h6>
      <b-form-input v-model="editGroupName" placeholder="Enter group name"></b-form-input>
      <b-form-select v-model="editGroupFirmware" :options="ddFirmware" class="mb-3">
        <!--
      <template slot="first">
        <option :value="null" disabled>-- Please select a firmware --</option>
      </template>
      -->
    </b-form-select>
    <span> {{ddFirmware}} </span>
    <span> {{editGroupFirmware}} </span>
    </div>
    <b-button @click="editGroup()" pill variant="success">Edit</b-button>
    <b-button @click="cancelEditGroup()" pill>Cancel</b-button>
  </b-modal>

    <b-modal
      id="modal-prevent"
      ref="modal"
      title="Create New Group"
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
    <span> {{ddFirmware}} </span>

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
              editGroupName: '',
              firmware: [],
              allFirmware: [],
              groupUploadBodyMFOX: {},
              allGroups: [],
              selectedFirmware: '',
              //editGroupFirmware: { text: '', value: ''},
              editGroupFirmware: [],
              ddFirmware: [],
              fields: [
                  { key: 'name', label: 'Group name', sortable: true, sortDirection: 'desc' },
                  { key: 'desired_fw', label: 'Desired Firmware', sortable: true, class: 'text-center' },
                  { key: 'actionDelete', label: '' },
                  { key: 'actionEdit', label: '' }
              ],
              groupDeleteError: '',
              groupIdToDelete: ''
           }
      },
      methods: {
          handleLoadModal() {
              console.log('handleLoadModal');
              this.inputGroupName = '';
              this.selectedFirmware = '';
          },
          deleteGroupConfirm(items) {

              this.$refs['modal-confirm-delete'].show()
              console.log('delete confirmation!');
              this.groupIdToDelete = items.group_id;

              console.log(items);
          },
          deleteGroup(items) {
              this.$refs['modal-confirm-delete'].hide();
              console.log('deleting group!!!!');
          },
          cancelDeleteGroup(items) {
              this.$refs['modal-confirm-delete'].hide();
              console.log('cancel deleting group!!!!');
          },
          editGroupModal(items) {
              this.editGroupName = items.name;
              //this.editGroupFirmware.text = "text",
              //this.editGroupFirmware.value = "value",
              this.editGroupFirmware = items.firmware_id;
              this.$refs['edit-group-modal'].show()
              console.log('delete confirm!');
              console.log(items);
          },
          editGroup(items) {
              this.$refs['edit-group-modal'].hide();
              console.log('updating group!!!!');
          },
          cancelEditGroup(items) {
              this.$refs['edit-group-modal'].hide();
              console.log('cancel updating group!!!!');
          },
          editGroup(items) {
              console.log('edit!');
              console.log(items);
          },
          confirmDeleteGroupError() {
            this.$refs['modal-delete-error'].hide();
            this.firmwareDeleteError = '';
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
           handleOkDelete(evt) {
              // Prevent modal from closing
              console.log('handleOkDelete');
              evt.preventDefault()
              if (!this.inputGroupName) {
                  alert('Please enter group 1')
              } else if (!this.selectedFirmware) {
                  alert('Please enter group 2')
              } else {
                 this.handleSubmit()
              }
          },
          deleteGroupFromMFOX(group_id) {
            console.log(`group to delete: ${group_id}`);
            this.$refs['modal-confirm-delete'].hide();
            console.log(`Step #6a: Delete group from MFOX...`);
            let apiEndpoint = `https://ivlapiadmin.azurewebsites.net/v1/groups/${group_id}`;
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            this.axios.delete(apiEndpoint, {headers: {'authorization': accessToken}})
                    .then( (response) => {
                    console.log('success');
                    console.log(`Step #6b: Successfully deleted group from MFOX...`);
                    this.getAllGroupsFromMFOX();

                    }).catch( (error) => {
                    console.log('error');
                    console.log(error);
                    this.$refs['modal-delete-error'].show();
                    this.groupDeleteError = error;
            });
        },
        getAllGroupsFromMFOX() {

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

        },

        getAllFirmwareFromMFOX() {

          let apiEndpoint2 = 'https://ivlapiadmin.azurewebsites.net/v1/firmware';
          let accessToken2 = `Bearer ${authentication.getAccessToken()}`;
          this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
                  .then((response) => {                
                  //populate firmware drop down list array
                  var arrayLength = response.data.length;
                  for (var i = 0; i < arrayLength; i++) {
                      this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['firmware_id'] });
                      //this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['version'] });
                  }
                  console.log('successfully retrieved all firmware from azure sql: ');
                  console.log(response.data);
                  }).catch(function (error) {
                  console.log('error');
                  console.log(error);
          });

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
                    .then( (response) => {
                    console.log('success');
                    console.log(`Step #3b: Successfully uploaded group to MFOX...`);
                    this.getAllGroupsFromMFOX();

                    console.log(response.data);
                    }).catch( (error) => {
                    console.log('error');
                    console.log(error);
            });
        }
    },

    /* view.js has a set of lifecycle hooks - created, mounted, updated, and destroyed */
    created: function(){
        this.getAllGroupsFromMFOX();
        this.getAllFirmwareFromMFOX();
        /*
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
        });*/
        /*
        let apiEndpoint2 = 'https://ivlapiadmin.azurewebsites.net/v1/firmware';
        let accessToken2 = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
                .then((response) => {                
                //populate firmware drop down list array
                var arrayLength = response.data.length;
                for (var i = 0; i < arrayLength; i++) {
                    this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['firmware_id'] });
                    //this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['version'] });
                }
                console.log('successfully retrieved all firmware from azure sql: ');
                console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });
        */
    }
  }
</script>
