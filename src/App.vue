<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>

body {
  font-family: 'Open Sans', sans-serif !important;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #fff;
  margin-top: 55px !important;
  background: #000;
}
.container { 
  display: inline-block; 
  padding-top: 75px !important; 
  padding-right: 15px; 
  padding-left: 15px; 
  text-align: center;
}
</style>