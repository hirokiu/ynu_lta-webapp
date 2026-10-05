<template>
  <section class="my-4">
    <h2>回答者を招待</h2>
    <p>ユーザー名を指定して、7日間有効な登録リンクを発行します。既存アカウントの変更には使用できません。</p>
    <form @submit.prevent="create()">
      <label for="invite-name">ユーザー名（半角小文字・数字・_・-、3〜32文字）</label>
      <input id="invite-name" class="form-control" v-model="username" pattern="[a-z0-9][a-z0-9_-]{2,31}" required autocomplete="off" :disabled="busy" />
      <button class="btn btn-primary mt-3" :disabled="busy">{{busy ? '作成中…' : '招待リンクを発行'}}</button>
    </form>
    <p class="mt-3">未登録の招待は、上のユーザー名を指定して再発行・取消できます。再発行すると古いリンクは使えなくなります。取消したユーザー名は保留されます。</p>
    <button type="button" class="btn btn-outline-primary mr-2" :disabled="busy || !username" @click="create('reissue')">招待を再発行</button>
    <button type="button" class="btn btn-outline-danger" :disabled="busy || !username" @click="create('cancel')">招待を取り消す</button>
    <p class="mt-3">ご自身が招待した登録済み回答者には、本人確認のうえ1時間有効のパスワード再設定リンクを発行できます。</p>
    <button type="button" class="btn btn-outline-primary" :disabled="busy || !username" @click="create('reset')">パスワード再設定リンクを発行</button>
    <p role="status">{{message}}</p>
    <p v-if="error" role="alert" class="text-danger">{{error}}</p>
    <div v-if="link" class="mt-3">
      <label for="invite-link">発行したリンク（この画面を閉じる前に控えてください）</label>
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
  data: () => ({username: '', busy: false, error: '', link: '', expiresAt: '', message: ''}),
  methods: {
    async create(action) {
      if (action && !window.confirm(this.username + ' の招待を' + (action === 'reset' ? '対象に再設定リンクを発行しますか？' : action === 'cancel' ? '取り消しますか？' : '再発行しますか？'))) return;
      if (this.busy) return;
      this.busy = true; this.error = ''; this.link = ''; this.message = '';
      try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('管理者としてログインしてください。');
        const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + (action === 'reset' ? '/admin/password-resets' : '/admin/account-invitations' + (action ? '/' + encodeURIComponent(this.username) + '/' + action : '')), {
          method: 'POST', headers: {'Content-Type': 'application/json', token: await user.getIdToken()}, body: JSON.stringify({username: this.username})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '招待を作成できませんでした。');
        if (data.cancelled) { this.message = '招待を取り消しました。'; return; }
        this.link = window.location.origin + (data.reset ? '/reset-password#reset=' + encodeURIComponent(data.reset) : '/register#invitation=' + encodeURIComponent(data.invitation));
        this.expiresAt = new Date(data.expiresAt).toLocaleString('ja-JP');
      } catch (e) { this.error = e.message || '招待を作成できませんでした。'; }
      finally { this.busy = false; }
    }
  }
};
</script>
