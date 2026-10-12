<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">Login</div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger">{{error}}</div>
            <div v-if="isDev || usernameLogin" class="mb-3">
              <button type="button" class="btn btn-outline-primary" :disabled="googleBusy" @click="googleLogin">{{ googleBusy ? 'ログイン中…' : 'Googleでログイン' }}</button>
              <div v-if="googleUid" role="status" class="mt-2">
                <p>本人認証が完了しました。管理者権限はまだ付与されていません。</p>
                <label for="firebase-uid">管理者設定用UID（上松さんからお知らせください）</label>
                <input id="firebase-uid" class="form-control" readonly :value="googleUid" />
              </div>
            </div>
            <form action="#" @submit.prevent="submit">
              <div class="form-group row">
                <label for="email" class="col-md-4 col-form-label text-md-right">ユーザー名 / メールアドレス</label>

                <div class="col-md-6">
                  <input
                    id="email"
                    type="text"
                    class="form-control"
                    name="email"
                    value
                    required
                    autofocus
                    v-model="form.email"
                  />
                </div>
              </div>

              <div class="form-group row">
                <label for="password" class="col-md-4 col-form-label text-md-right">Password</label>

                <div class="col-md-6">
                  <input
                    id="password"
                    type="password"
                    class="form-control"
                    name="password"
                    required
                    v-model="form.password"
                  />
                </div>
              </div>

              <div class="form-group row mb-0">
                <div class="col-md-8 offset-md-4">
                  <button type="submit" class="btn btn-primary">Login</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as firebase from "firebase/app";
import "firebase/auth";
import {passwordLogin} from "../services/passwordLogin";

export default {
  data() {
    return {
      form: {
        email: "",
        password: ""
      },
      isDev: process.env.VUE_APP_FIREBASE_PROJECT_ID === "kirokun-dev",
      usernameLogin: false,
      googleBusy: false,
      googleUid: "",
      error: null
    };
  },
  async created() {
    try {
      const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/auth/options');
      this.usernameLogin = response.ok && (await response.json()).usernameLogin === true;
    } catch (_) { this.usernameLogin = false; }
  },
  methods: {
    async finishLogin(user) {
      await this.$store.dispatch('fetchUser', user);
      const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/admin/surveys?limit=1', {headers: {token: await user.getIdToken()}});
      if (response.ok) this.$router.replace({name: 'Users'});
      else if (this.usernameLogin) {
        const me = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/me', {headers: {token: await user.getIdToken()}});
        if (me.ok) this.$router.replace('/account');
        else throw new Error('この環境の利用権限がありません。');
      } else throw new Error('管理者としての利用権限がありません。');
    },
    async googleLogin() {
      if (this.googleBusy) return;
      this.googleBusy = true; this.googleUid = ""; this.error = null;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await firebase.auth().signInWithPopup(provider);
        this.googleUid = result.user.uid;
        await this.finishLogin(result.user);
      } catch (e) {
        this.error = e.code === "auth/unauthorized-domain"
          ? "Firebaseの承認済みドメインに、この画面のホスト名を追加してください。"
          : "Googleログインを完了できませんでした。ポップアップの許可とアカウントを確認してください。";
      } finally { this.googleBusy = false; }
    },
    async submit() {
      this.error = null;
      try {
        const result = await passwordLogin({loginId: this.form.email, password: this.form.password,
          base: process.env.VUE_APP_API_BASE_URL || '/api', auth: firebase.auth()});
        this.form.password = '';
        await this.finishLogin(result.user);
      } catch (e) { this.error = e.message || 'ログインできませんでした。'; }
    }
  },
  beforeMount() {
    firebase.auth().signOut()
  }
};
</script>
