<template>
  <div>
    <b-table :busy="isLoading" striped hover :items="allDevices" :fields="fields" head-variant="light">
      <div class="text-center text-danger my-2">
        <b-spinner class="align-middle" />
        <strong>Loading...</strong>
      </div>
      <template slot="group" scope="row">
        <b-form-select v-model="row.item.group_id" :options="ddGroups" class="mb-3" @change="updateDeviceInMFOX(row.item)" />
      </template>
    </b-table>
    <b-modal ref="modal-error" :header-bg-variant="headerBgVariant" :header-text-variant="headerTextVariant" hide-footer>
      <template slot="modal-title">
        Error
      </template>
      <div class="d-block text-center">
        <h6>{{ deleteError }}</h6>
      </div>
      <b-button class="mt-3" variant="outline-danger" block @click="confirmFirmwareError()">
        OK
      </b-button>
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
                        { key: 'group', label: 'Group', sortable: true },
                        { key: 'desired_fw', label: 'Desired FW Version', sortable: true, class: 'text-center' },
                        { key: 'reported_fw', label: 'Reported FW Version', sortable: true, class: 'text-center' },
                        { key: 'last_reported', label: 'Last Report Date', sortable: true, class: 'text-center' }
                    ],
                    isLoading: false
                }
            },
            created:
                function(){
                    this.getAllDevices();
                    this.getAllGroups();
                },
            methods: {
                uploadToMFOX() {
                    authentication.getAccessToken()
                        .then( (token) => {
                            let apiEndpoint = `${shared.getObjectKey(process.env, 'VUE_APP_API_ENDPOINT_URL')}/v1/devices`
                            let accessToken = `Bearer ${token}`;
                            this.axios.post(apiEndpoint, this.deviceUploadBodyMFOX, {headers: {'authorization': accessToken}})
                                .then( () => {
                                    this.getAllDevices();
                                }).catch( (error) => {
                                    shared.trackException(error, 'devicemanagement.uploadtofox.axios.error');
                                    this.deleteError = shared.getErrorResponseMessage(error);
                                    this.$refs['modal-error'].show();
                                });
                        }).catch( (error) => {
                            shared.trackException(error, 'devicemanagement.uploadtofox.accesstoken.error');
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
                                    if (error.toString().includes('404')) {
                                        this.allDevices = [];
                                    }
                                    this.toggleLoading(false);
                                    shared.trackException(error, 'devicemanagement.getdevices.axios.error');
                                    this.deleteError = shared.getErrorResponseMessage(error);
                                    this.$refs['modal-error'].show();
                                });
                        }).catch( (error) => {
                            shared.trackException(error, 'devicemanagement.getdevices.accesstoken.error');
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
                                    shared.trackException(error, 'devicemanagement.getgroups.axios.error');
                                });
                        }).catch( (error) => {
                            shared.trackException(error, 'devicemanagement.getgroups.accesstoken.error');
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
                                .then( () => {
                                    this.getAllDevices();
                                }).catch( (error) => {
                                    shared.trackException(error, 'devicemanagement.updatedevices.axios.error');
                                    this.deleteError = shared.getErrorResponseMessage(error);
                                    this.$refs['modal-error'].show();
                                });
                        }).catch( (error) => {
                            shared.trackException(error, 'devicemanagement.updatedevices.accesstoken.error');
                            authentication.signOut()
                        });
                },
                confirmFirmwareError() {
                    this.$refs['modal-error'].hide();
                    this.deleteError = '';
                }
            }
        }
</script>
