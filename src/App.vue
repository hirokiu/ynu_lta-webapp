<template>
  <div id="app">
    <div v-if="isPreview" role="status" class="alert alert-warning mb-0 text-center">
      開発用環境です。Protoとはデータ・アカウントが異なります。
    </div>
    <nav v-if="$store.state.user.data && !['/register', '/account', '/reset-password'].includes($route.path)" class="navbar navbar-expand navbar-dark bg-dark">
      <a href="/surveys" class="navbar-brand">KIROKUN</a>
      <div class="navbar-nav mr-auto" style="flex-wrap: wrap">
        <li class="nav-item"><router-link to="/project-settings" class="nav-link">プロジェクト設定<span v-if="$store.state.projectName">：{{ $store.state.projectName }}</span></router-link></li>
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
    isPreview() { return ["dev.kirokun.alchembright.com"].includes(window.location.hostname); }
  },
  
};
</script>