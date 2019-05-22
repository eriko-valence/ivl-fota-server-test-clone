<template>
  <div>

    <b-table :busy="isLoading" striped hover :items="allGroups" :fields="fields">
      <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong>Loading...</strong>
      </div>
      <template slot="actionDelete" slot-scope="row">
        <b-button @click="deleteGroupConfirm(row.item)" pill variant="outline-danger">Delete</b-button>
      </template>
      <template slot="actionEdit" slot-scope="row">
        <b-button @click="editGroupModal(row.item)" pill>Edit</b-button>
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
        <h6>{{this.deleteError}}</h6>
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
        <b-form-select v-model="editGroupFirmware" :options="ddFirmware" class="mb-3"></b-form-select>
      </div>
      <b-button @click="updateGroupInMFOX()" pill variant="success">Edit</b-button>
      <b-button @click="cancelEditGroup()" pill>Cancel</b-button>
    </b-modal>

    <b-modal id="modal-prevent" ref="modal" title="Create New Group" @ok="handleOk" @shown="handleLoadModal">
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="inputGroupName" placeholder="Enter group name"></b-form-input>
        <b-form-select v-model="selectedFirmware" :options="ddFirmware" class="mb-3">
          <template slot="first">
            <option :value="null" disabled>-- Please select a firmware --</option>
          </template>
        </b-form-select>
      </form>
    </b-modal>
</div>
</template>

<script>
import authentication from '../authentication';
export
  default {
    data() {
      return {
        inputGroupName: '',
        editGroupName: '',
        editGroupId: '',
        editGroupData: {id: '', name: '', desired_fw_id: ''},
        firmware: [],
        allFirmware: [],
        groupUploadBodyMFOX: {},
        groupUpdateBodyMFOX: {name: '', desired_fw_id: ''},
        allGroups: [],
        selectedFirmware: null,
        //editGroupFirmware: { text: '', value: ''},
        editGroupFirmware: [],
        ddFirmware: [],
        deleteError: '',
        fields: [
            { key: 'name', label: 'Group name', sortable: true, sortDirection: 'desc' },
            { key: 'desired_fw', label: 'Desired Firmware', sortable: true, class: 'text-center' },
            { key: 'actionDelete', label: '' },
            { key: 'actionEdit', label: '' }
        ],
        groupIdToDelete: '',
        isLoading: false,
      }
    },
    methods: {
      handleLoadModal() {
          this.inputGroupName = '';
          this.selectedFirmware = null;
      },
      deleteGroupConfirm(items) {
          this.$refs['modal-confirm-delete'].show()
          this.groupIdToDelete = items.group_id;
      },
      deleteGroup() {
          this.$refs['modal-confirm-delete'].hide();
      },
      cancelDeleteGroup() {
          this.$refs['modal-confirm-delete'].hide();
      },
      editGroupModal(items) {
          this.groupUpdateBodyMFOX.name = '';
          this.groupUpdateBodyMFOX.desired_fw_id = '';
          this.editGroupName = items.name;
          this.editGroupId = items.group_id;
          this.editGroupFirmware = items.firmware_id;
          this.editGroupData.id = this.editGroupId;
          this.editGroupData.name = this.editGroupName;
          this.editGroupData.desired_fw_id = this.editGroupFirmware;
          this.$refs['edit-group-modal'].show()
      },
      cancelEditGroup() {
          this.$refs['edit-group-modal'].hide();
      },
      confirmDeleteGroupError() {
        this.$refs['modal-delete-error'].hide();
        this.deleteError = '';
      },
      handleOk(evt) {
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
        this.$refs['modal-confirm-delete'].hide();
        let apiEndpoint = `${process.env.VUE_APP_API_ENDPOINT_URL}/v1/groups/${group_id}`;
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.delete(apiEndpoint, {headers: {'authorization': accessToken}})
          .then( (response) => {
            console.log(`response: ${response}`); // eslint-disable-line
            this.getAllGroupsFromMFOX();
          }).catch( (error) => {
            this.deleteError = error.response.data.error;
            this.$refs['modal-delete-error'].show();
        });
    },
      updateGroupInMFOX() {
        this.$refs['edit-group-modal'].hide()
        this.groupUpdateBodyMFOX.name = this.editGroupName;
        this.groupUpdateBodyMFOX.desired_fw_id = this.editGroupFirmware;
        let apiEndpoint = `${process.env.VUE_APP_API_ENDPOINT_URL}/v1/groups/${this.editGroupId}`;
        authentication.getAccessToken()
          .then( (response) => {
            let accessToken = `Bearer ${response}`;
            this.axios.put(apiEndpoint,this.groupUpdateBodyMFOX, {headers: {'authorization': accessToken}})
              .then( (response) => {
                console.log(`response: ${response}`); // eslint-disable-line
                this.getAllGroupsFromMFOX();
              }).catch( (error) => {
                this.$refs['modal-delete-error'].show();
                this.deleteError = error;
              });
          }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
          });
        

      },
      getAllGroupsFromMFOX() {

        authentication.getAccessToken()
          .then( (token) => {
            //console.log('------------------------');
            //console.log(token);
            //console.log('------------------------');
            this.toggleLoading(true);
            let apiEndpoint1 = `${process.env.VUE_APP_API_ENDPOINT_URL}/v1/groups`;
            let accessToken1 = `Bearer ${token}`;
            this.axios.get(apiEndpoint1, {headers: {'authorization': accessToken1}})
              .then((response) => {
                this.toggleLoading(false);
                this.allGroups = response.data;
              }).catch((error) =>{
                console.log(`error: ${error}`); // eslint-disable-line
                console.log(error); // eslint-disable-line
                if (error.toString().includes("404")) {
                  this.allGroups = []
                }
                this.toggleLoading(false);
                console.log(`error: ${error}`); // eslint-disable-line
              });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });



      },
      getAllFirmwareFromMFOX() {


        authentication.getAccessToken()
          .then( (token) => {
            let apiEndpoint2 = `${process.env.VUE_APP_API_ENDPOINT_URL}/v1/firmware`;
            let accessToken2 = `Bearer ${token}`;
            //console.log('getAllGroupsFromMFOX(): ' + accessToken2);
            this.axios.get(apiEndpoint2, {headers: {'authorization': accessToken2}})
              .then((response) => {       
                //populate firmware drop down list array
                var arrayLength = response.data.length;
                for (var i = 0; i < arrayLength; i++) {
                    this.ddFirmware.push({ text: response.data[i]['version'], value: response.data[i]['firmware_id'] });
                }
              }).catch(function (error) {
                console.log(`error: ${error}`); // eslint-disable-line
              });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
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
        var reader = new FileReader();
        reader.onload = function(){
        };
        reader.readAsBinaryString(file);
      },
      uploadToMFOX() {
        authentication.getAccessToken()
          .then( (token) => {
            let apiEndpoint = `${process.env.VUE_APP_API_ENDPOINT_URL}/v1/groups`;
            let accessToken = `Bearer ${token}`;
            this.axios.post(apiEndpoint, this.groupUploadBodyMFOX, {headers: {'authorization': accessToken}})
              .then( (response) => {
                console.log(`response: ${response}`); // eslint-disable-line
                this.getAllGroupsFromMFOX();
              }).catch( (error) => {
                console.log(`error: ${error}`); // eslint-disable-line
              });
        }).catch( (error) => {
            console.log(`force user to sign out to fix the token issue: ${error}`); // eslint-disable-line
            authentication.signOut()
        });
      },
      toggleLoading(state) {
        this.isLoading = state;
      }
    },// methods
    created:
      function(){
        this.getAllGroupsFromMFOX();
        this.getAllFirmwareFromMFOX();
      }
}
</script>
