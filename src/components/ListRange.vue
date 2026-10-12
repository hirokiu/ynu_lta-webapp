<template>
  <p class="list-range" role="status">
    <span v-if="loading">件数を確認中…</span>
    <span v-else-if="error">件数を取得できませんでした。</span>
    <span v-else-if="total !== null">{{ label }}全{{ number(total) }}件中 {{ number(start) }}〜{{ number(end) }}件を表示</span>
  </p>
</template>
<script>
export default {
  props: {
    total: { type: Number, default: null }, count: { type: Number, default: 0 },
    page: { type: Number, default: 1 }, pageSize: { type: Number, default: 50 },
    loading: Boolean, error: String, label: { type: String, default: "" }
  },
  computed: {
    start() { return this.count ? (this.page - 1) * this.pageSize + 1 : 0; },
    end() { return this.count ? this.start + this.count - 1 : 0; }
  },
  methods: { number(value) { return value.toLocaleString("ja-JP"); } }
};
</script>
<style scoped>
.list-range { margin: .65rem 0; color: #495057; font-size: .95rem; font-variant-numeric: tabular-nums; }
</style>
