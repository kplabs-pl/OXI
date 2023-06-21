<template>
  <nav class="navbar navbar-expand-lg fixed-top">
    <slot name="nav-content">
      <h1 class="navbar-brand"><router-link class="homeLink" v-bind:to="'/'"> <span id="OXI">O X I</span> time series tool by <img src="/static/files/kplabs-logo-white.svg" height="35" width="124" class="logo white-logo ls-is-cached lazyloaded" alt="KP Labs"></router-link></h1>
      <div class="navbar-nav ml-auto">
        <router-link v-show="showHelpButton" class="nav-link" v-bind:to="'/help'">Help</router-link>
      </div>
    </slot>
  </nav>
</template>

<script>
export default {
  name: "BaseNavbar",
  computed: {
    showHelpButton() {
      return window.location.pathname !== '/help';
    }
  },
};
</script>

<style scoped>
.navbar { background:#000000; }
>>> .nav-link , .navbar-brand { color: #fff; cursor: pointer; margin-bottom: 0px;}
.nav-link { margin-right: 1em !important; color: #009a93}
.nav-link:hover { background: #009a93; color: #fff; }
.navbar-nav { float: right; }
.homeLink { text-decoration: none; color: inherit; }
.homeLink:hover { text-decoration: none; color: inherit; }
.logo { max-height: 30px !important; margin-bottom: 7px !important; }
#OXI {font-size: 30px; margin-right: 7px;}
</style>