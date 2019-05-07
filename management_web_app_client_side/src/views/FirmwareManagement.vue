<template>
<div>
<strong>Firmware Management</strong>
<b-button v-b-modal.modal-prevent>Launch demo modal</b-button>
    <!-- Modal Component -->
    <b-modal
      id="modal-prevent"
      ref="modal"
      title="Upload File"
      @ok="handleOk"
      @shown="handleLoadModal"
    >
      <form @submit.stop.prevent="handleSubmit">
        <b-form-input v-model="firmwareVersion" placeholder="Enter the firmware version"></b-form-input>
        <b-form-input v-model="firmwareSignature" placeholder="Enter the firmware signature"></b-form-input>
        <input type="file" @change="loadTextFromFile">
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
              firmwareVersion: '',
              firmwareSignature: '',
              firmware: [],
              firmwareUploadBodyMFOX: {}
           }
      },
      methods: {
          handleLoadModal() {
              console.log('handleLoadModal');
              this.firmwareVersion = '';
              this.firmwareSignature = '';
              this.firmwareImage = '';
          },
          handleOk(evt) {
              // Prevent modal from closing
              console.log('handleOk');
              evt.preventDefault()
              if (!this.firmwareVersion) {
                  alert('Please enter the firmware version')
              } else {
                 this.handleSubmit()
              }
          },
          handleSubmit() {
              console.log('handleSubmitModal');
              console.log(this.firmware);
              this.firmware.push(this.firmwareVersion)

                this.firmwareUploadBodyMFOX = {
                  version: this.firmwareVersion,
                  signature : this.firmwareSignature,
                  image    : this.firmwareImage
                };

                console.log(this.firmwareUploadBodyMFOX);

                this.uploadToMFOX();

              this.handleLoadModal()
              this.$nextTick(() => {
                this.$refs.modal.hide()
              })
         },
         async loadTextFromFile(ev) {
                const {
                AnonymousCredential,
                StorageURL,
                ServiceURL,
                ContainerURL,
                BlobURL,
                BlockBlobURL,
                Aborter
                } = require("@azure/storage-blob");

                console.log('loadTextFromFile');
                const file = ev.target.files[0];
                this.firmwareImage = file.name;
                const reader = new FileReader();
                console.log(file);

                // Enter your storage account name and shared key
                const account = "ivlapidevice916d";

                // Use SharedKeyCredential with storage account and account key
                //const sharedKeyCredential = new sharedKeyCredential('test', 'test');
                //const sharedKeyCredential = new SharedKeyCredential(account, accountKey);
                const anonymousCredential = new AnonymousCredential();
                const pipeline = StorageURL.newPipeline(anonymousCredential);

                let blobUrlSas = 'https://ivlapidevice916d.blob.core.windows.net/fota?st=2019-05-07T17%3A09%3A13Z&se=2019-05-08T17%3A09%3A13Z&sp=racwl&sv=2018-03-28&sr=c&sig=G8hvIiYFJmEVLJUGHSv45FAjoM71FrvTyWJkLsz9LpQ%3D';

                const serviceURL = new ServiceURL(
                    // When using AnonymousCredential, following url should include a valid SAS or support public access
                    blobUrlSas,
                    pipeline
                );

                // Create a blob
                let containerName = "fota";
                const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
                const content = "hello";
                const blobName = "newblob" + new Date().getTime();
                const blobURL = BlobURL.fromContainerURL(containerURL, blobName);
                const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
                const uploadBlobResponse = await blockBlobURL.upload(
                    Aborter.none,
                    content,
                    content.length
                );
                console.log(
                    `Upload block blob ${blobName} successfully`,
                    uploadBlobResponse.requestId
                );

                //const anonymousCredential = new AnonymousCredential();

                // Use TokenCredential with OAuth token
                //const tokenCredential = new TokenCredential("token");
                //tokenCredential.token = "renewedToken"; // Renew the token by updating token field of token credential

                reader.onload = e => this.$emit("load", e.target.result);
                reader.readAsText(file);
        },
        uploadToMFOX() {

            let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/api/Firmware';
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            this.axios.post(apiEndpoint, this.firmwareUploadBodyMFOX, {headers: {'authorization': accessToken}})
                    .then(function (response) {
                    console.log('success');
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
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/api/Firmware';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint, {headers: {'authorization': accessToken}})
                .then(function (response) {
                console.log('success');
                console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });
    }
  }
</script>
