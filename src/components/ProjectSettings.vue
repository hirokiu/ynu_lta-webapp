<template>
  <section class="my-4" style="max-width: 640px">
    <h2>Settings</h2>
    <p>対応するアプリでは、ログイン後や画面に戻った際にこの名称を表示します。接続先URL、アカウント、回答データは変わりません。</p>
    <form @submit.prevent="save">
      <label for="project-display-name">表示するプロジェクト名</label>
      <input id="project-display-name" v-model="displayName" class="form-control" :disabled="busy || revision === null" required maxlength="160" />
      <p class="small mt-2">1〜80文字。アプリ更新前のバージョンには反映されません。</p>
      <label for="project-timezone">タイムゾーン</label>
      <select id="project-timezone" v-model="timezone" class="form-control" :disabled="busy || revision === null">
        <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
      </select>
      <p class="small mt-2">プロジェクト共通の設定です。管理画面の日時・回答CSV/JSONの日時に適用します。保存済みの日時や配信予定は変更しません。</p>
      <button class="btn btn-primary" :disabled="busy || revision === null">{{ busy ? '処理中…' : '保存する' }}</button>
      <button type="button" class="btn btn-outline-secondary ml-2" :disabled="busy" @click="load">再読み込み</button>
    </form>
    <p class="mt-3" role="status">{{ message }}</p>
  </section>
</template>
<script>
import {timezoneNames} from '../utils/projectTime';
import http from '../http-common';
import * as firebase from 'firebase/app';
import 'firebase/auth';
export default {
  data: () => ({displayName: '', timezone: 'Asia/Tokyo', zones: timezoneNames, revision: null, busy: false, message: ''}),
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
        this.displayName = data.displayName; this.revision = data.revision; this.timezone = data.timezone || 'Asia/Tokyo';
        this.$store.commit('SET_PROJECT_NAME', data.displayName);
        this.$store.commit('SET_PROJECT_TIMEZONE', this.timezone);
      } catch (_) { this.message = '名称を取得できませんでした。ログイン状態を確認し、再読み込みしてください。'; }
      finally { this.busy = false; }
    },
    async save() {
      this.busy = true; this.message = '';
      try {
        const {data} = await http.put('/admin/project', {displayName: this.displayName, revision: this.revision, timezone: this.timezone}, {headers: await this.headers()});
        this.displayName = data.displayName; this.revision = data.revision; this.timezone = data.timezone || 'Asia/Tokyo';
        this.$store.commit('SET_PROJECT_NAME', data.displayName);
        this.$store.commit('SET_PROJECT_TIMEZONE', data.timezone);
        this.message = '設定を保存しました。アプリのプロジェクト名は開き直すと反映されます。';
      } catch (e) {
        this.message = e.response && e.response.data && e.response.data.error || '保存できませんでした。管理者権限と通信状態をご確認ください。';
      } finally { this.busy = false; }
    }
  }
};
</script>
