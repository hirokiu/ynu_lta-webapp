<template>
  <div id="app">
    <div v-if="isPreview" role="status" class="alert alert-warning mb-0 text-center">
      開発用環境です。Protoとはデータ・アカウントが異なります。
    </div>
    <nav v-if="$store.state.user.data && !['/register', '/account', '/reset-password'].includes($route.path)" class="navbar navbar-expand navbar-dark bg-dark project-navigation" aria-label="管理メニュー">
      <a href="/surveys" class="navbar-brand">KIROKUN<span v-if="$store.state.projectName"> &gt; {{ $store.state.projectName }}</span></a>
      <div class="navbar-nav mr-auto" style="flex-wrap: wrap">
        <li class="nav-item">
          <a href="/users" class="nav-link" :class="{'is-current': activeSection === 'users'}" :aria-current="activeSection === 'users' ? 'page' : null">Users</a>
        </li>
        <li class="nav-item">
          <a href="/groups" class="nav-link" :class="{'is-current': activeSection === 'groups'}" :aria-current="activeSection === 'groups' ? 'page' : null">Groups</a>
        </li>
        <li class="nav-item">
          <a href="/surveys" class="nav-link" :class="{'is-current': activeSection === 'surveys'}" :aria-current="activeSection === 'surveys' ? 'page' : null">Surveys</a>
        </li>
        <li class="nav-item">
          <a href="/assignments" class="nav-link" :class="{'is-current': activeSection === 'assignments'}" :aria-current="activeSection === 'assignments' ? 'page' : null">Assignments</a>
        </li>
        <li class="nav-item"><router-link to="/project-settings" class="nav-link" :class="{'is-current': activeSection === 'project'}" :aria-current="activeSection === 'project' ? 'page' : null">Settings</router-link></li>
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
    activeSection() {
      const name = (this.$route.name || '').toLowerCase();
      const path = this.$route.path.toLowerCase().replace(/^\/webadmin(?=\/)/, '');
      if (path === '/project-settings') return 'project';
      if (path === '/account-invite' || /^\/users?(?:\/|$)/.test(path) || name.includes('user')) return 'users';
      if (name.includes('group')) return 'groups';
      if (name.includes('survey')) return 'surveys';
      if (name.includes('assignment')) return 'assignments';
      return '';
    },
    isPreview() { return ["dev.kirokun.alchembright.com"].includes(window.location.hostname); }
  },
  
};
</script>
<style scoped>
.project-navigation .nav-link {
  border-bottom: 3px solid transparent;
  margin: 0 0.15rem;
  padding: 0.65rem 0.6rem;
  color: #e0e0e0;
}
.project-navigation .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.project-navigation .nav-link.is-current {
  border-bottom-color: #ff6268;
  color: #fff;
  font-weight: 700;
}
.project-navigation .nav-link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
