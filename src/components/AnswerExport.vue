<template>
  <section class="answer-export mt-5" aria-labelledby="answer-export-title">
    <h3 id="answer-export-title">回答結果のダウンロード</h3>
    <p>このSurveyに届いた回答をCSVまたはJSONで保存します。</p>
    <label for="export-scope">ダウンロードする対象</label>
    <select id="export-scope" class="form-control export-scope" v-model="scope" :disabled="busy" @change="changeScope">
      <option value="all">全員・全期間の回答を一括ダウンロード</option>
      <option value="period">指定した期間の回答をダウンロード</option>
      <option value="selected">選択した回答だけをダウンロード</option>
    </select>

    <p v-if="scope === 'all'" class="mt-3">表示ページや表示件数に関係なく、このSurveyの全員分・全期間の回答が対象です。</p>
    <div v-if="scope === 'period'" class="mt-3">
      <p>対象は回答日時です。配信日ではありません。開始日・終了日の両日を含みます（日本時間）。</p>
      <label for="export-from">回答日時の開始日</label>
      <input id="export-from" type="date" v-model="from" :disabled="busy" @change="clearDownload" />
      <label for="export-to" class="ml-3">終了日</label>
      <input id="export-to" type="date" v-model="to" :disabled="busy" @change="clearDownload" />
    </div>

    <div v-if="scope === 'selected'" class="mt-3">
      <p>回答一覧で保存したい回答にチェックしてください。ページを移動しても選択は保持されます。</p>
      <div class="answer-controls">
        <label for="answer-page-size">回答一覧の表示件数</label>
        <select id="answer-page-size" v-model.number="pageSize" :disabled="busy || loading" @change="loadPage(1)">
          <option v-for="size in [10,20,50,100]" :key="size" :value="size">{{ size }}件</option>
        </select>
        <button type="button" :disabled="busy || loading || page === 1" @click="loadPage(page - 1)">前へ</button>
        <span>{{ page }} ページ</span>
        <button type="button" :disabled="busy || loading || !hasMore" @click="loadPage(page + 1)">次へ</button>
      </div>
      <p v-if="loading" role="status">回答一覧を読み込み中です…</p>
      <p v-if="listError" role="alert">{{ listError }} <button type="button" :disabled="loading" @click="loadPage(page)">再試行</button></p>
      <p>選択中：{{ selectedIds.length }}件
        <button type="button" :disabled="busy || !selectedIds.length" @click="clearSelection">選択を解除</button>
      </p>
      <div class="answer-table-wrap">
        <table class="table">
          <thead><tr>
            <th><input type="checkbox" aria-label="このページの回答をすべて選択" :checked="allPageSelected" :disabled="busy || loading || !items.length || (!allPageSelected && pageSelectionTooLarge)" @change="togglePage($event.target.checked)" /></th>
            <th>回答者</th><th>回答日時（日本時間）</th><th>回答設問数</th>
          </tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item._id">
              <td><input type="checkbox" :aria-label="item.userId + ' ' + formatDate(item.answeredAt) + ' の回答を選択'" :checked="selectedIds.includes(item._id)" :disabled="busy || loading || (!selectedIds.includes(item._id) && selectedIds.length >= 1000)" @change="toggle(item._id, $event.target.checked)" /></td>
              <td>{{ item.userId }}</td><td>{{ formatDate(item.answeredAt) }}</td><td>{{ item.answerCount }}</td>
            </tr>
            <tr v-if="!loading && !listError && !items.length"><td colspan="4">回答がありません。</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-muted">一度に選択できる回答は1,000件までです。</p>
    </div>

    <p v-if="scope !== 'selected'" class="text-muted mt-3">一度に出力できる回答は10,000件までです。超える場合は期間を分けてください。</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="mt-3">
      <button type="button" class="btn btn-primary mr-2" :disabled="busy || !canExport" @click="generate('csv')">CSVを作成</button>
      <button type="button" class="btn btn-outline-primary" :disabled="busy || !canExport" @click="generate('json')">JSONを作成</button>
    </div>
    <div v-if="busy" class="export-status mt-3" role="status" aria-live="polite" aria-busy="true">
      <span class="export-spinner" aria-hidden="true"></span>
      <span>ダウンロード用データを作成中です。このままお待ちください。</span>
    </div>
    <div v-if="downloadUrl && !busy" class="mt-3" role="status">
      <p>{{ completedScope }}のデータを作成しました。</p>
      <a class="btn btn-success" :href="downloadUrl" :download="downloadName">{{ downloadFormat.toUpperCase() }}を保存</a>
    </div>
  </section>
</template>

<script>
import SurveyDataService from "../services/SurveyDataService";
import moment from "moment";

export default {
  props: { surveyId: { type: String, required: true }, surveyName: { type: String, default: "survey" } },
  data() {
    return { scope: "all", from: "", to: "", page: 1, pageSize: 50, hasMore: false, items: [],
      selectedIds: [], loading: false, listError: "", error: "", busy: false, requestId: 0,
      downloadUrl: null, downloadFormat: "", downloadName: "", completedScope: "", disposed: false };
  },
  computed: {
    allPageSelected() { return this.items.length > 0 && this.items.every(item => this.selectedIds.includes(item._id)); },
    pageSelectionTooLarge() { return new Set([...this.selectedIds, ...this.items.map(item => item._id)]).size > 1000; },
    canExport() {
      if (this.scope === "selected") return this.selectedIds.length > 0;
      if (this.scope === "period") return !!this.from && !!this.to && this.from <= this.to;
      return true;
    }
  },
  methods: {
    formatDate(value) { return value ? moment(value).utcOffset(9).format("YYYY-MM-DD HH:mm:ss") : "—"; },
    clearDownload() { if (this.downloadUrl) URL.revokeObjectURL(this.downloadUrl); this.downloadUrl = null; this.error = ""; },
    changeScope() { this.clearDownload(); if (this.scope === "selected") this.loadPage(1); },
    clearSelection() { this.selectedIds = []; this.clearDownload(); },
    toggle(id, checked) {
      this.clearDownload();
      if (checked && !this.selectedIds.includes(id)) {
        if (this.selectedIds.length >= 1000) { this.error = "一度に選択できる回答は1,000件までです。"; return; }
        this.selectedIds = [...this.selectedIds, id];
      } else if (!checked) this.selectedIds = this.selectedIds.filter(value => value !== id);
    },
    togglePage(checked) {
      this.clearDownload();
      const pageIds = this.items.map(item => item._id);
      const next = checked ? Array.from(new Set([...this.selectedIds, ...pageIds])) : this.selectedIds.filter(id => !pageIds.includes(id));
      if (next.length > 1000) { this.error = "一度に選択できる回答は1,000件までです。"; return; }
      this.selectedIds = next;
    },
    async loadPage(page) {
      const requestId = ++this.requestId;
      this.loading = true; this.listError = "";
      try {
        const response = await SurveyDataService.getResultsPage(this.surveyId, { page, limit: this.pageSize });
        if (requestId !== this.requestId || this.disposed) return;
        this.items = response.data.items; this.hasMore = response.data.hasMore; this.page = page;
      } catch (e) { if (requestId === this.requestId && !this.disposed) { this.items = []; this.listError = "回答一覧を取得できませんでした。"; } }
      finally { if (requestId === this.requestId && !this.disposed) this.loading = false; }
    },
    async generate(format) {
      if (this.busy) return;
      this.clearDownload();
      if (!this.canExport) { this.error = this.scope === "selected" ? "回答を選択してください。" : "開始日と終了日を正しく指定してください。"; return; }
      const options = { scope: this.scope, format };
      let label = "全員・全期間";
      if (this.scope === "period") {
        options.from = this.from + "T00:00:00.000+09:00";
        options.to = this.to + "T23:59:59.999+09:00";
        label = this.from + " ～ " + this.to + "（日本時間）";
      } else if (this.scope === "selected") {
        options.ids = this.selectedIds.slice(); label = "選択した" + options.ids.length + "件の回答";
      }
      this.busy = true;
      try {
        const response = await SurveyDataService.exportResults(this.surveyId, options);
        if (this.disposed) return;
        const empty = format === "csv" ? !response.data : response.data.length === 0;
        if (empty) { this.error = "対象の回答がありません。条件を変更してください。"; return; }
        this.downloadUrl = URL.createObjectURL(new Blob([format === "csv" ? response.data : JSON.stringify(response.data)],
          { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json" }));
        this.downloadFormat = format; this.downloadName = this.surveyName + "_results." + format; this.completedScope = label;
      } catch (e) {
        const status = e.response && e.response.status;
        this.error = status === 413 ? "回答が10,000件を超えています。期間を分けて出力してください。" :
          status === 422 ? "選択した回答が更新・削除された可能性があります。一覧を更新して選び直してください。" : "出力できませんでした。再試行してください。";
      } finally { if (!this.disposed) this.busy = false; }
    }
  },
  beforeDestroy() { this.disposed = true; this.clearDownload(); }
};
</script>

<style scoped>
.answer-export { border: 1px solid #cbd5df; border-radius: 6px; padding: 24px; max-width: 1050px; background: #f8fafc; }
.export-scope { max-width: 480px; }
.answer-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 16px 0; }
.answer-table-wrap { overflow-x: auto; }
.answer-export input[type="checkbox"] { width: 18px; height: 18px; }
</style>
