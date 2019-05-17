<template>
  <div>
    <b-table :busy="isLoading" striped hover :items="items" :fields="fields">
      <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong>Loading...</strong>
      </div>
      <template slot="actionDelete" slot-scope="row">
        <b-button @click="deleteFirmwareConfirm(row.item)" pill variant="outline-danger">Delete</b-button>
      </template>
    </b-table>
    <b-modal ref="modal-confirm-delete" hide-footer>
      <div class="d-block text-center">
        <h6>Are you sure you want to delete this firmware version?</h6>
      </div>
      <b-button @click="deleteFirmewareFromMFOX(firmwareVersionToDelete)" pill variant="outline-danger">Delete</b-button>
      <b-button @click="cancelDeleteFirmware()" pill>Cancel</b-button>
    </b-modal>
    <b-button v-b-modal.modal-prevent>Upload New Firmware</b-button>
    <b-modal ref="modal-delete-error" hide-footer>
      <div class="d-block text-center">
        <h6>An error occured while deleting the firmware</h6>
        <h6>{{this.firmwareDeleteError}}</h6>
      </div>
      <b-button @click="confirmDeleteFirmwareError()" pill>OK</b-button>
    </b-modal>
    <b-modal id="modal-prevent" ref="modal" title="Upload File" @ok="handleOk" @shown="handleLoadModal">
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="firmwareVersion" placeholder="Enter the firmware version"></b-form-input>
        <b-form-textarea rows="5" max-rows="10" v-model="firmwareSignature" placeholder="Enter the firmware signature"></b-form-textarea>
        <input type="file" @change="loadTextFromFile">
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
        firmwareVersion: '',
        firmwareSignature: '',
        firmware: [],
        firmwareUploadBodyMFOX: {},
        items: [],
        fields: [
          { key: 'version', label: 'Version', sortable: true, sortDirection: 'desc' },
          { key: 'uri', label: 'URI', sortable: true, class: 'text-center' },
          { key: 'signature', label: 'Signature', sortable: false, class: 'text-center' },
          { key: 'actionDelete', label: '' }
        ],
        firmwareVersionToDelete: '',
        firmwareDeleteError: '',
        isLoading: false,
      }
    },
    methods: {
      handleLoadModal() {
        this.firmwareVersion = '';
        this.firmwareSignature = '';
        this.firmwareImage = '';
        this.firmwareFileContent = '';
      },
      handleOk(evt) {
        evt.preventDefault()
        if (!this.firmwareVersion) {
            alert('Please enter the firmware version')
        } else {
            this.handleSubmit()
        }
      },
      confirmDeleteFirmwareError() {
        this.$refs['modal-delete-error'].hide();
        this.firmwareDeleteError = '';
      },
      deleteFirmwareConfirm(items) {
        this.$refs['modal-confirm-delete'].show()
        this.firmwareVersionToDelete = items.firmware_id;
      },
      deleteFirmware() {
        this.$refs['modal-confirm-delete'].hide();
      },
      cancelDeleteFirmware() {
        this.$refs['modal-confirm-delete'].hide();
      },
      handleSubmit() {
        this.firmware.push(this.firmwareVersion)
        this.firmwareUploadBodyMFOX = {
          version: this.firmwareVersion,
          signature : this.firmwareSignature,
          image    : this.firmwareImage,
          md5 : null
        };
        this.getAzureStorageSasToken(this.firmwareImage);
        this.handleLoadModal()
        this.$nextTick(() => {
          this.$refs.modal.hide()
        })
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
      getAzureStorageSasToken(blobName) {
        let apiEndpoint = `https://ivlapiadmin.azurewebsites.net/v1/upload_uri?name=${blobName}`;
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        var fileContent = this.firmwareFileContent;
        this.axios.get(apiEndpoint, {headers: {'authorization': accessToken}})
        .then((response) => {
          this.uploadFirmwareToAzureBlob(response.data.sas_uri, fileContent, blobName);
        }).catch(function (error) {
          console.log(`error: ${error}`); // eslint-disable-line
        });
      },
      uploadToMFOX() {
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/v1/firmware';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.post(apiEndpoint, this.firmwareUploadBodyMFOX, {headers: {'authorization': accessToken}})
          .then( (response) => {
            this.getAllFirmwareFromMFOX();
          }).catch(function (error) {
            console.log(`error: ${error}`); // eslint-disable-line
        });
      },
      getAllFirmwareFromMFOX() {
        this.toggleLoading(true);
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/v1/firmware';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint, {headers: {'authorization': accessToken}})
          .then((response) => {
            this.toggleLoading(false);
            this.items = response.data;
          }).catch((error) => {
            this.toggleLoading(false);
            console.log(`error: ${error}`); // eslint-disable-line
        });
      },

      deleteFirmewareFromMFOX(version) {
        this.$refs['modal-confirm-delete'].hide();
        let apiEndpoint = `https://ivlapiadmin.azurewebsites.net/v1/firmware/${version}`;
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.delete(apiEndpoint, {headers: {'authorization': accessToken}})
        .then( (response) => {
          this.getAllFirmwareFromMFOX();
        }).catch( (error) => {
          this.$refs['modal-delete-error'].show();
          this.firmwareDeleteError = error;
        });
      },
      async uploadFirmwareToAzureBlob(uploadUri, fileContent) {
        const {
          AnonymousCredential,
          StorageURL,
          ServiceURL,
          BlockBlobURL,
          Aborter
        } = require("@azure/storage-blob");
        const anonymousCredential = new AnonymousCredential();
        const pipeline = StorageURL.newPipeline(anonymousCredential);
        const serviceURL = new ServiceURL(
          // When using AnonymousCredential, following url should include a valid SAS or support public access
          uploadUri,
          pipeline
        );
        const content = fileContent;
        const blockBlobURL = BlockBlobURL.fromBlobURL(serviceURL);
        const uploadBlobResponse = await blockBlobURL.upload(
          Aborter.none,
          content,
          content.size
        );
        //let md5_b64 = btoa(String.fromCharCode.apply(null, uploadBlobResponse.contentMD5));
        let md5_hex = Buffer.from(uploadBlobResponse.contentMD5).toString('hex');
        this.firmwareUploadBodyMFOX.md5 = md5_hex;
        this.uploadToMFOX();
      },
      toggleLoading(state) {
        this.isLoading = state;
      }
  },
  created:
    function(){
        this.getAllFirmwareFromMFOX();
    }
  }
</script>
