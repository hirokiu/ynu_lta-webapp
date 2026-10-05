<template>
  <section class="my-4">
    <h2>KIROKUN アカウント登録</h2>
    <p>パスワードまたはGoogleで登録できます。既存アカウントの移行では先にパスワードを設定し、その後Googleを追加してください。</p>
    <button v-if="features.googleRegistration" class="btn btn-outline-primary mb-3" :disabled="busy" @click="google">Googleで登録</button>
    <p v-if="featuresLoaded && !features.invitations">この環境では新規登録を停止しています。</p>
    <form v-if="features.invitations" @submit.prevent="activate">
      <label for="new-password">パスワード（12〜128文字）</label>
      <input id="new-password" type="password" class="form-control" v-model="password" minlength="12" maxlength="128" required autocomplete="new-password" />
      <label for="confirm-password">パスワード（確認）</label>
      <input id="confirm-password" type="password" class="form-control" v-model="confirmation" required autocomplete="new-password" />
      <button class="btn btn-primary mt-3" :disabled="busy">{{busy ? '登録中…' : '登録する'}}</button>
    </form>
    <p v-if="error" role="alert" class="text-danger">{{error}}</p>
  </section>
</template>
<script>
import accountFeatures from '../mixins/accountFeatures';
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  mixins: [accountFeatures],
  data: () => ({password: '', confirmation: '', invitation: '', busy: false, error: ''}),
  created() {
    this.invitation = new URLSearchParams(window.location.hash.slice(1)).get('invitation') || '';
    // Keep the invitation in memory, not the address bar/history or server request logs.
    window.history.replaceState(null, '', window.location.pathname);
  },
  methods: {
    async google() {
      if (!this.features.googleRegistration) return;
      if (this.busy) return;
      this.busy = true; this.error = '';
      try {
        const base = process.env.VUE_APP_API_BASE_URL || '/api';
        const session = await fetch(base + '/auth/invitation-google-session', {method: 'POST',
          headers: {'Content-Type': 'application/json'}, body: JSON.stringify({invitation: this.invitation})});
        const data = await session.json();
        if (!session.ok) throw new Error(data.error || '招待を確認できませんでした。');
        const result = await firebase.auth().signInWithCustomToken(data.customToken);
        if (!result.user.providerData.some(p => p.providerId === 'google.com')) {
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({prompt: 'select_account'});
          await result.user.linkWithPopup(provider);
        }
        const response = await fetch(base + '/auth/activate-google', {method: 'POST',
          headers: {'Content-Type': 'application/json', token: await result.user.getIdToken(true)},
          body: JSON.stringify({invitation: this.invitation})});
        const activated = await response.json();
        if (!response.ok) throw new Error(activated.error || '登録を完了できませんでした。');
        this.invitation = '';
        await this.$store.dispatch('fetchUser', result.user);
        this.$router.replace('/account');
      } catch (e) { this.error = 'Googleで登録できませんでした。既存アカウントの移行ではパスワード登録をご利用ください。別の利用者に紐づいたGoogleアカウントは使用できません。'; }
      finally { this.busy = false; }
    },
    async activate() {
      if (!this.features.invitations) return;
      if (this.busy) return;
      if (this.password !== this.confirmation) { this.error = 'パスワードが一致しません。'; return; }
      this.busy = true; this.error = '';
      try {
        const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/auth/activate', {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({invitation: this.invitation, password: this.password})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '登録できませんでした。');
        this.password = ''; this.confirmation = ''; this.invitation = '';
        const result = await firebase.auth().signInWithCustomToken(data.customToken);
        await this.$store.dispatch('fetchUser', result.user);
        this.$router.replace('/account');
      } catch (e) { this.error = e.message || '登録できませんでした。登録済みの場合はログインしてください。'; }
      finally { this.busy = false; }
    }
  }
};
</script>
