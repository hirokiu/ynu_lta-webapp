<template>
  <section class="my-4">
    <h2>アカウント設定</h2>
    <p>アンケートへの回答はアプリから行います。</p>
    <button class="btn btn-primary" @click="linkGoogle" :disabled="busy">{{busy ? '確認中…' : 'Googleログインを追加'}}</button>
    <p v-if="message" role="status">{{message}}</p>
    <router-link to="/login">ログイン画面へ</router-link>
  </section>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  data: () => ({busy: false, message: ''}),
  methods: {
    async linkGoogle() {
      const user = firebase.auth().currentUser;
      if (!user) { this.message = '先にログインしてください。'; return; }
      if (user.providerData.some(p => p.providerId === 'google.com')) { this.message = 'Googleログインは登録済みです。'; return; }
      this.busy = true; this.message = '';
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({prompt: 'select_account'});
        await user.linkWithPopup(provider);
        this.message = '同じアカウントでGoogleログインが利用できるようになりました。';
      } catch (e) {
        this.message = e.code === 'auth/credential-already-in-use'
          ? 'このGoogleアカウントは別の利用者に登録されています。上松さんにお問い合わせください。'
          : 'Googleログインを追加できませんでした。再度お試しください。';
      } finally { this.busy = false; }
    }
  }
};
</script>
