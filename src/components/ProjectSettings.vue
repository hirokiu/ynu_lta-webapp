<template>
  <section class="my-4" style="max-width: 640px">
    <h2>プロジェクト名の設定</h2>
    <p>対応するアプリでは、ログイン後や画面に戻った際にこの名称を表示します。接続先URL、アカウント、回答データは変わりません。</p>
    <form @submit.prevent="save">
      <label for="project-display-name">表示するプロジェクト名</label>
      <input id="project-display-name" v-model="displayName" class="form-control" :disabled="busy || revision === null" required maxlength="160" />
      <p class="small mt-2">1〜80文字。アプリ更新前のバージョンには反映されません。</p>
      <button class="btn btn-primary" :disabled="busy || revision === null">{{ busy ? '処理中…' : '保存する' }}</button>
      <button type="button" class="btn btn-outline-secondary ml-2" :disabled="busy" @click="load">再読み込み</button>
    </form>
    <p class="mt-3" role="status">{{ message }}</p>
  </section>
</template>
<script>
import http from '../http-common';
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  data: () => ({displayName: '', revision: null, busy: false, message: ''}),
  watch: {'$store.state.token': function () { if (this.revision === null) this.load(); }},
  mounted() { this.load(); },
  methods: {
    async headers() {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error('先にログインしてください。');
      return {token: await user.getIdToken()};
    },
    async load() {
      if (this.busy) return;
      this.busy = true; this.message = '';
      try {
        const {data} = await http.get('/project', {headers: await this.headers()});
        this.displayName = data.displayName; this.revision = data.revision;
      } catch (_) { this.message = '名称を取得できませんでした。ログイン状態を確認し、再読み込みしてください。'; }
      finally { this.busy = false; }
    },
    async save() {
      this.busy = true; this.message = '';
      try {
        const {data} = await http.put('/admin/project', {displayName: this.displayName, revision: this.revision}, {headers: await this.headers()});
        this.displayName = data.displayName; this.revision = data.revision;
        this.$store.commit('SET_PROJECT_NAME', data.displayName);
        this.message = '保存しました。対応するアプリを開き直すと名称が反映されます。';
      } catch (e) {
        this.message = e.response && e.response.data && e.response.data.error || '保存できませんでした。管理者権限と通信状態をご確認ください。';
      } finally { this.busy = false; }
    }
  }
};
</script>
