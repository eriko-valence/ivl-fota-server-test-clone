<template>
<strong>Device Management</strong>
</template>

<script>

import authentication from '../authentication'
 
  //import axios from 'axios'
  export default {
    name: 'users',
    /* define data properties */
    data() {
        return {
          newUser: {},
          users: [
            {
                name: 'John Doe', 
                email: 'jdoe@email.com',
                contacted: false
            },
            {
                name: 'Jane Doe', 
                email: 'jadoe@email.com',
                contacted: false
            }
          ]
        }
    },
    /* view.js has a set of lifecycle hooks - created, mounted, updated, and destroyed */
    created: function(){
        console.log(authentication.getAccessToken());
        let apiEndpoint = 'https://ivlapiadmin.azurewebsites.net/api/Device';
        let accessToken = `Bearer ${authentication.getAccessToken()}`;
        console.log('---------------apiendpoint');
        console.log(apiEndpoint);
        console.log('---------------apiendpoint');
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
