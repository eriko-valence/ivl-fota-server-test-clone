<template>
  <div class="home">
  <b-card no-body>
  <b-tabs small card vertical>
    <b-tab content-class="mt-3" active>
      <template slot="title">
        <b-link :to="{ path: '/firmware'}" replace>Firmware Management</b-link>
      </template>
      <router-view></router-view>
    </b-tab>
    <b-tab>
      <template slot="title">
        <b-link :to="{ path: '/groupmanagement'}" replace>Group Management</b-link>
      </template>
      <router-view></router-view>
    </b-tab>
    <b-tab>
      <template slot="title">
        <b-link :to="{ path: '/devicemanagement'}" replace>Device Management</b-link>
      </template>
      <router-view></router-view>
    </b-tab>
  </b-tabs>
  </b-card>
  </div>
</template>
