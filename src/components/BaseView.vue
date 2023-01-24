<template>
  <div>
    <BaseNavbar>
      <template v-slot:nav-content>
        <slot name="navbar-content">
        </slot>
      </template>
    </BaseNavbar>
    <slot name="main-content"></slot>
  </div>
</template>

<script>
export default {
  name: "BaseView"
};
</script>

<style scoped>
.title { color: #be9a55; font-weight: bold; }
.info { text-align: left; }
.subh { color: #be9a55; font-weight: 500; }
</style>