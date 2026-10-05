<template>
  <section class="my-4">
    <h2>回答者を招待</h2>
    <p>ユーザー名を指定して、7日間有効な登録リンクを発行します。既存アカウントの変更には使用できません。</p>
    <form @submit.prevent="create">
      <label for="invite-name">ユーザー名（半角小文字・数字・_・-、3〜32文字）</label>
      <input id="invite-name" class="form-control" v-model="username" pattern="[a-z0-9][a-z0-9_-]{2,31}" required autocomplete="off" :disabled="busy" />
      <button class="btn btn-primary mt-3" :disabled="busy">{{busy ? '作成中…' : '招待リンクを発行'}}</button>
    </form>
    <p v-if="error" role="alert" class="text-danger">{{error}}</p>
    <div v-if="link" class="mt-3">
      <label for="invite-link">招待リンク（この画面を閉じる前に控えてください）</label>
      <input id="invite-link" class="form-control" :value="link" readonly @focus="$event.target.select()" />
      <p>このリンクを受け取った人が登録できます。対象の回答者本人にのみ共有してください。</p>
      <p>有効期限：{{expiresAt}}</p>
    </div>
  </section>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  data: () => ({username: '', busy: false, error: '', link: '', expiresAt: ''}),
  methods: {
    async create() {
      if (this.busy) return;
      this.busy = true; this.error = ''; this.link = '';
      try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('管理者としてログインしてください。');
        const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/admin/account-invitations', {
          method: 'POST', headers: {'Content-Type': 'application/json', token: await user.getIdToken()}, body: JSON.stringify({username: this.username})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '招待を作成できませんでした。');
        this.link = window.location.origin + '/register#invitation=' + encodeURIComponent(data.invitation);
        this.expiresAt = new Date(data.expiresAt).toLocaleString('ja-JP');
      } catch (e) { this.error = e.message || '招待を作成できませんでした。'; }
      finally { this.busy = false; }
    }
  }
};
</script>
