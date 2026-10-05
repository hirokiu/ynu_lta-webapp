<template>
  <section class="my-4">
    <h2>パスワードの再設定</h2>
    <form v-if="!done" @submit.prevent="submit">
      <label for="password">新しいパスワード（12〜128文字）</label>
      <input id="password" v-model="password" type="password" class="form-control" autocomplete="new-password" minlength="12" maxlength="128" required />
      <label for="confirmation">パスワード（確認）</label>
      <input id="confirmation" v-model="confirmation" type="password" class="form-control" autocomplete="new-password" required />
      <button class="btn btn-primary mt-3" :disabled="busy">{{busy ? '再設定中…' : 'パスワードを再設定'}}</button>
    </form>
    <p role="status">{{message}}</p>
    <router-link to="/login">ログイン画面へ</router-link>
  </section>
</template>
<script>
export default {
  data: () => ({reset: '', password: '', confirmation: '', busy: false, done: false, message: ''}),
  created() {
    this.reset = new URLSearchParams(window.location.hash.slice(1)).get('reset') || '';
    window.history.replaceState(null, '', window.location.pathname);
  },
  methods: {
    async submit() {
      if (this.busy) return;
      if (this.password !== this.confirmation) { this.message = 'パスワードが一致しません。'; return; }
      this.busy = true; this.message = '';
      try {
        const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/auth/reset-password', {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({reset: this.reset, password: this.password})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '再設定できませんでした。管理者にお問い合わせください。');
        this.done = true; this.reset = ''; this.message = data.message;
      } catch (e) { this.message = e.message || '再設定できませんでした。'; }
      finally { this.password = ''; this.confirmation = ''; this.busy = false; }
    }
  }
};
</script>
