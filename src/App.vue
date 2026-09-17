<template>
  <div id="app">
    <div v-if="isPreview" role="status" class="alert alert-warning mb-0 text-center">
      確認環境：本番データのコピーです。ここでの変更は本番に反映されず、移行時に置き換えられます。通知は送信されません。
    </div>
    <nav v-if="$store.state.user.data" class="navbar navbar-expand navbar-dark bg-dark">
      <a href="/surveys" class="navbar-brand">LTA Admin Webapp</a>
      <div class="navbar-nav mr-auto">
        <li class="nav-item">
          <a href="/users" class="nav-link">Users</a>
        </li>
        <li class="nav-item">
          <a href="/groups" class="nav-link">Groups</a>
        </li>
        <li class="nav-item">
          <a href="/surveys" class="nav-link">Surveys</a>
        </li>
        <li class="nav-item">
          <a href="/assignments" class="nav-link">Assignments</a>
        </li>
        <li class="nav-item">
          <a href="/login" class="nav-link">Log out</a>
        </li>
      </div>
    </nav>

    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "app",
  computed: {
    isPreview() { return window.location.hostname === "dev.kirokun.alchembright.com"; }
  },
  
};
</script>