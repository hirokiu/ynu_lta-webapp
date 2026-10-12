<template>
  <section class="my-4" style="max-width: 640px">
    <h2>Settings</h2>
    <p>対応するアプリでは、ログイン後や画面に戻った際にこの名称を表示します。接続先URL、アカウント、回答データは変わりません。</p>
    <form @submit.prevent="save">
      <label for="project-display-name">表示するプロジェクト名</label>
      <input id="project-display-name" v-model="displayName" class="form-control" :disabled="busy || revision === null" required maxlength="160" />
      <p class="small mt-2">1〜80文字。アプリ更新前のバージョンには反映されません。</p>
      <label for="project-subtitle">アプリに表示するサブタイトル</label>
      <input id="project-subtitle" v-model="subtitle" class="form-control" :disabled="busy || revision === null" maxlength="240" />
      <p class="small mt-2">120文字以内の1行。空欄で保存すると非表示になります。対応アプリでプロジェクト名の下に表示します。</p>
      <button class="btn btn-primary" :disabled="busy || revision === null">{{ busy ? '処理中…' : '保存する' }}</button>
      <button type="button" class="btn btn-outline-secondary ml-2" :disabled="busy" @click="load">再読み込み</button>
    </form>
    <p class="mt-3" role="status">{{ message }}</p>
  </section>
</template>
<script>
const timezoneNames = ['Asia/Tokyo'];
import http from '../http-common';
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  data: () => ({displayName: '', subtitle: '', timezone: 'Asia/Tokyo', zones: timezoneNames, revision: null, busy: false, message: ''}),
  watch: {'$store.state.user.data': function (user) { if (user && this.revision === null) this.load(); }},
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
        this.subtitle = data.subtitle || ''; this.displayName = data.displayName; this.revision = data.revision; this.timezone = data.timezone || 'Asia/Tokyo';


      } catch (_) { this.message = '名称を取得できませんでした。ログイン状態を確認し、再読み込みしてください。'; }
      finally { this.busy = false; }
    },
    async save() {
      this.busy = true; this.message = '';
      try {
        const {data} = await http.put('/admin/project', {subtitle: this.subtitle, displayName: this.displayName, revision: this.revision}, {headers: await this.headers()});
        this.subtitle = data.subtitle || ''; this.displayName = data.displayName; this.revision = data.revision; this.timezone = data.timezone || 'Asia/Tokyo';


        this.message = '設定を保存しました。アプリの名称・サブタイトルは開き直すと反映されます。';
      } catch (e) {
        this.message = e.response && e.response.data && e.response.data.error || '保存できませんでした。管理者権限と通信状態をご確認ください。';
      } finally { this.busy = false; }
    }
  }
};
</script>
