<template>
<div>
<b-table striped hover :items="items"></b-table>
<b-button v-b-modal.modal-prevent>Upload New Firmware</b-button>
    <b-modal
      id="modal-prevent"
      ref="modal"
      title="Upload File"
      @ok="handleOk"
      @shown="handleLoadModal"
    >
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
 
  //import axios from 'axios'
  export default {
    /* define data properties */
      data() {
          return {
              firmwareVersion: '',
              firmwareSignature: '',
              firmware: [],
              firmwareUploadBodyMFOX: {},
              items: []
           }
      },
      methods: {
          handleLoadModal() {
              console.log('handleLoadModal');
              this.firmwareVersion = '';
              this.firmwareSignature = '';
              this.firmwareImage = '';
              this.firmwareFileContent = '';
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
                console.log(`file.name: ${file.name}`);
                console.log(`firmwareImage: ${this.firmwareImage}`);
                var reader = new FileReader();
                reader.onload = function(){
                };
                reader.readAsBinaryString(file);
        },
        getAzureStorageSasToken(blobName) {
            let apiEndpoint = `https://ivlapiadmin.azurewebsites.net/v1/upload_uri?name=${blobName}`;
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            console.log(`Step #1a: Acquire azure storage sas token for blob ${blobName}....`);
            console.log(`Step #1b: Api endpoint: ${apiEndpoint}`);
            console.log(`Step #1c: this.firmwareFileContent: ${this.firmwareFileContent}`);
            var fileContent = this.firmwareFileContent;
            var blobName = this.firmwareImage;
            this.axios.get(apiEndpoint, {headers: {'authorization': accessToken}})
                    .then((response) => {
                    console.log(`Step #1d: this.firmwareFileContent: ${fileContent}`);
                    console.log(`Step #1e: Successfully acquired sas token: ${response.data.sas_uri}`);
                    this.uploadFirmwareToAzureBlob(response.data.sas_uri, fileContent, blobName);
                    //this.uploadToMFOX();
                    }).catch(function (error) {
                    console.log('error');
                    console.log(error);
            });
        },
        uploadToMFOX() {
            console.log(`Step #3a: Upload firmware metadata to MFOX...`);
            let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/api/Firmware';
            let accessToken = `Bearer ${authentication.getAccessToken()}`;
            console.log('################################################');
            console.log(this.firmwareUploadBodyMFOX);
            console.log(this.firmwareUploadBodyMFOX.md5);
            console.log('################################################');
            this.axios.post(apiEndpoint, this.firmwareUploadBodyMFOX, {headers: {'authorization': accessToken}})
                    .then(function (response) {
                    console.log('success');
                    console.log(`Step #3b: Successfully uploaded firmware metadata to MFOX...`);
                    console.log(response.data);
                    }).catch(function (error) {
                    console.log('error');
                    console.log(error);
            });
        },
        async uploadFirmwareToAzureBlob(uploadUri, fileContent, blobName) {
          console.log(`Step #2a: Upload firmware to azure storage blob container...`);
          console.log(this);

                const {
                AnonymousCredential,
                StorageURL,
                ServiceURL,
                ContainerURL,
                BlobURL,
                BlockBlobURL,
                Aborter
                } = require("@azure/storage-blob");

                //let upload_uri = `https://ivlapiadmin.azurewebsites.net/v1/upload_uri?name=${blobName}`;

                // Enter your storage account name and shared key
                const account = "ivlapidevice916d";

                // Use SharedKeyCredential with storage account and account key
                //const sharedKeyCredential = new sharedKeyCredential('test', 'test');
                //const sharedKeyCredential = new SharedKeyCredential(account, accountKey);
                const anonymousCredential = new AnonymousCredential();
                const pipeline = StorageURL.newPipeline(anonymousCredential);

                //let blobUrlSas = 'https://ivlapidevice916d.blob.core.windows.net/fota?st=2019-05-07T17%3A09%3A13Z&se=2019-05-08T17%3A09%3A13Z&sp=racwl&sv=2018-03-28&sr=c&sig=G8hvIiYFJmEVLJUGHSv45FAjoM71FrvTyWJkLsz9LpQ%3D';
                //uploadUri = 'https://ivlapidevice916d.blob.core.windows.net/fota?st=2019-05-08T17%3A23%3A56Z&se=2019-05-09T17%3A23%3A56Z&sp=racwl&sv=2018-03-28&sr=c&sig=%2FYqYsF%2BiWm18xHGMJNFksGqNwM8Qm4Gigcs3FQ%2FQlq4%3D';
                //uploadUri =        'https://ivlapidevice916d.blob.core.windows.net/fota?st=2019-05-08T20%3A55%3A11Z&se=2019-05-08T21%3A55%3A11Z&sp=racwl&sv=2018-03-28&sr=c&sig=Jog7XGBVnCE%2FLh1%2Bj3BwVZKxHqsQ3a7tAMxVTiD%2BEBM%3D';
                //uploadUri = 'https://ivlapidevice916d.blob.core.windows.net/fota/fota/01.json?st=2019-05-08T22%3A56%3A37Z&se=2019-05-09T22%3A56%3A37Z&sp=racwl&sv=2018-03-28&sr=b&sig=pBCqqYYj%2BvuDiGoPzHTqqoIpNSg3ah2qRdDgRzdzcqs%3D';

                const serviceURL = new ServiceURL(
                    // When using AnonymousCredential, following url should include a valid SAS or support public access
                    uploadUri,
                    pipeline
                );

                //const reader = new FileReader();
                //reader.onload = e => this.$emit("load", e.target.result);
                //console.log(`this.firmwareImage: ${this.firmwareImage}`);
                //reader.onload = async e => {
                  //var text = reader.result;

                  let containerName = "fota";
                  let url = 'https://ivlapidevice916d.blob.core.windows.net';
                  const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
                  const content = fileContent;
                  //const blobName = blobImageName;
                  const blobURL = BlobURL.fromContainerURL(containerURL, blobName);
                  const blockBlobURL = BlockBlobURL.fromBlobURL(serviceURL);
                  console.log('------------------------------------');
                  console.log(`uploadUri: ${uploadUri}`);
                  console.log(`serviceURL:  ${serviceURL}`);
                                    console.log(`serviceURL:  ${serviceURL.url}`);
                                    console.log(serviceURL);
                  console.log(`blobName: ${blobName}`)
                  console.log(`containerName: ${containerName}`);
                  console.log(`content: ${content}`);
                  console.log(content);
                  console.log(`containerURL: ${containerURL.url}`);
                  console.log(`blobURL: ${blobURL.url}`);
                  console.log(blobURL);
                  console.log(`blockBlobURL: ${blockBlobURL.url}`);
                  console.log(blockBlobURL);
                  console.log('------------------------------------');
                  const uploadBlobResponse = await blockBlobURL.upload(
                    //const uploadBlobResponse = await serviceURL.upload(
                      Aborter.none,
                      content,
                      content.size
                );

                //}
                console.log('----------------------------');
                //var string = btoa(new TextDecoder('windows-1251').decode(uploadBlobResponse.contentMD5));

//var u8 = new Uint8Array([65, 66, 67, 68]);
//var decoder = new TextDecoder('utf8');
//var b64encoded = btoa(decoder.decode(uploadBlobResponse.contentMD5));
//var str2 = decodeURIComponent(escape(window.atob(uploadBlobResponse.contentMD5)));
//console.log(uploadBlobResponse);

let md5_b64 = btoa(String.fromCharCode.apply(null, uploadBlobResponse.contentMD5));
let md5_hex = Buffer.from(uploadBlobResponse.contentMD5).toString('hex');

console.log(this.firmwareUploadBodyMFOX);
this.firmwareUploadBodyMFOX.md5 = md5_hex;
console.log(this.firmwareUploadBodyMFOX);

                console.log('----------------------------');
                //reader.readAsText(this.firmwareFileContent);

                // Create a blob

                //console.log(
                //    `Upload block blob ${blobName} successfully`,
                //    uploadBlobResponse.requestId
                //);
                console.log(`Step #2b: Succssfully uploaded firmware to azure storage blob container... ${uploadBlobResponse.requestId}`);
                this.uploadToMFOX();

        }
    },

    /* view.js has a set of lifecycle hooks - created, mounted, updated, and destroyed */
    created: function(){
        console.log(authentication.getAccessToken());
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/api/Firmware';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        this.axios.get(apiEndpoint, {headers: {'authorization': accessToken}})
                .then((response) => {
                console.log('success');
                this.items = response.data;
                console.log(response.data);
                }).catch(function (error) {
                console.log('error');
                console.log(error);
        });
    }
  }
</script>
