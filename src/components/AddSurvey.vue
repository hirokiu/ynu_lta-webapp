<template>
  <div class="submit-form">
    <hLargeIconHeader text="Surveyを新規作成" :icon="'file-plus'" />
    <p>JSONを読み込み、名前や設問を確認・編集してから保存してください。既存Surveyは変更されません。保存だけでは配信されません。</p>
    <div v-if="!submitted">
      <label for="template-file">JSONを読み込む（最大2MB）</label>
      <input id="template-file" type="file" accept=".json,application/json" class="form-control-file mb-3" :disabled="busy || reading" @change="readTemplate" />
      <p v-if="notice" role="status">{{ notice }}</p>
      <label for="config">設問テンプレートのJSON（編集できます）</label>
      <textarea id="config" v-model="config" rows="20" class="form-control code-block" :disabled="busy || reading" @input="reviewed = null; error = ''" />
      <p class="mt-2">nameは管理用の名前、titleは表示用タイトルです。通知文面も引き継ぐため確認してください。回答・配信情報・内部IDは保存対象から除外します。</p>
      <button class="btn btn-outline-primary mr-2" :disabled="busy || reading" @click="review">内容を確認</button>
      <section v-if="reviewed" class="card card-body mt-3" aria-label="保存内容の確認">
        <h4>{{ reviewed.name }}</h4><p>{{ reviewed.title }}</p>
        <p>設問・見出し：{{ reviewed.questions.length }}件</p>
        <ol><li v-for="q in reviewed.questions" :key="q.index">{{ q.title || q.text || '（本文なし）' }}（{{ q.type }}）<p v-if="q.values">選択肢：{{ q.values.join(' / ') }}</p></li></ol>
        <button class="btn btn-success" :disabled="busy || reading" @click="saveSurvey">{{ busy ? '保存中…' : '新しいSurveyとして保存' }}</button>
      </section>
    </div>
    <div v-else role="status"><h4>新しいSurveyを保存しました。配信はしていません。</h4><router-link v-if="savedId" :to="'/surveys/' + savedId">保存したSurveyを開く</router-link><button class="btn btn-outline-primary ml-3" @click="newSurvey">続けて新規作成</button></div>
    <p v-if="error" role="alert" class="text-danger mt-3">{{ error }}</p>
  </div>
</template>
<script>
import SurveyDataService from "../services/SurveyDataService";
import hLargeIconHeader from "./h/hLargeIconHeader";
import { parseTemplate } from "../utils/surveyTemplate";
export default {
  name: "add-survey", components: { hLargeIconHeader },
  data() { return { config: '', reviewed: null, busy: false, reading: false, submitted: false, savedId: '', error: '', notice: '' }; },
  methods: {
    async readTemplate(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.error = ''; this.notice = ''; this.reviewed = null;
      this.reading = true;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('ファイルは2MB以下にしてください。');
        const value = parseTemplate(await file.text());
        this.config = JSON.stringify(value, null, 2);
        this.notice = '読み込みました。まだ保存されていません。名前・設問を編集して「内容を確認」を押してください。';
      } catch (e) { this.error = e.message; }
      finally { this.reading = false; event.target.value = ''; }
    },
    review() {
      this.error = ''; this.reviewed = null;
      try { this.reviewed = parseTemplate(this.config); }
      catch (e) { this.error = e.message; }
    },
    async saveSurvey() {
      if (this.busy || this.reading || !this.reviewed) return;
      this.busy = true; this.error = '';
      try {
        const payload = parseTemplate(this.config);
        if (JSON.stringify(payload) !== JSON.stringify(this.reviewed)) throw new Error('編集内容をもう一度確認してください。');
        const response = await SurveyDataService.create(payload);
        if (!response.data || !response.data._id) throw new Error('保存結果を確認できませんでした。Survey一覧を確認してから再試行してください。');
        this.savedId = response.data._id; this.submitted = true;
      } catch (e) { this.error = e.response ? '保存できませんでした。ログイン状態・接続を確認してください。' : e.message; }
      finally { this.busy = false; }
    },
    newSurvey() { this.config = ''; this.reviewed = null; this.submitted = false; this.savedId = ''; this.error = ''; this.notice = ''; }
  }
};
</script>
<style scoped>.submit-form { max-width: 1100px; margin: auto; } .code-block { font-family: monospace; }</style>
