<template>
  <div id="app">
    <el-menu
        :default-active="$router.currentRoute.path"
        mode="horizontal"
        :router="true"
        background-color="#1e1e1e"
        text-color="#ffffff"
        active-text-color="#409eff"
        class="compact-menu"
    >
      <el-menu-item index="/">MeetingAssist</el-menu-item>
      <el-menu-item index="/setting">Settings</el-menu-item>
    </el-menu>
    <router-view class="router-view"/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
@import '/src/styles/AppStyles.css';
</style>