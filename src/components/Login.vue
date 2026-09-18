<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">Login</div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger">{{error}}</div>
            <div v-if="isDev" class="mb-3">
              <button type="button" class="btn btn-outline-primary" :disabled="googleBusy" @click="googleLogin">{{ googleBusy ? 'ログイン中…' : 'Googleでログイン（開発用）' }}</button>
              <div v-if="googleUid" role="status" class="mt-2">
                <p>本人認証が完了しました。管理者権限はまだ付与されていません。</p>
                <label for="firebase-uid">管理者設定用UID（上松さんからお知らせください）</label>
                <input id="firebase-uid" class="form-control" readonly :value="googleUid" />
              </div>
            </div>
            <form action="#" @submit.prevent="submit">
              <div class="form-group row">
                <label for="email" class="col-md-4 col-form-label text-md-right">Email</label>

                <div class="col-md-6">
                  <input
                    id="email"
                    type="email"
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

export default {
  data() {
    return {
      form: {
        email: "",
        password: ""
      },
      isDev: process.env.VUE_APP_FIREBASE_PROJECT_ID === "kirokun-dev",
      googleBusy: false,
      googleUid: "",
      error: null
    };
  },
  methods: {
    async googleLogin() {
      if (this.googleBusy) return;
      this.googleBusy = true; this.googleUid = ""; this.error = null;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await firebase.auth().signInWithPopup(provider);
        this.googleUid = result.user.uid;
      } catch (e) {
        this.error = e.code === "auth/unauthorized-domain"
          ? "Firebaseの承認済みドメインに、この画面のホスト名を追加してください。"
          : "Googleログインを完了できませんでした。ポップアップの許可とアカウントを確認してください。";
      } finally { this.googleBusy = false; }
    },
    submit() {
      firebase
        .auth()
        .signInWithEmailAndPassword(this.form.email, this.form.password)
        .then(resp => {
          void resp;
          this.$router.replace({ name: "Users" });
        })
        .catch(err => {
          console.log("login error:" + err.message);
          this.error = err.message;
        });
    }
  },
  beforeMount() {
    firebase.auth().signOut()
  }
};
</script>
