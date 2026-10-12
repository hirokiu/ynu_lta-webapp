<template>
  <div class="list-pagination" role="group" :aria-label="label + '（' + position + '）'">
    <label>{{ sizeLabel }}
      <select :value="pageSize" :disabled="disabled" @change="$emit('size-change', Number($event.target.value))">
        <option v-for="size in [10,50,100,500]" :key="size" :value="size">{{ size }}件</option>
      </select>
    </label>
    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="disabled || page <= 1" @click="$emit('page-change', page - 1)">前へ</button>
    <span>{{ page }} ページ</span>
    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="disabled || !hasMore" @click="$emit('page-change', page + 1)">次へ</button>
    <slot />
  </div>
</template>
<script>
export default {
  props: {
    page: {type: Number, required: true}, pageSize: {type: Number, required: true}, hasMore: Boolean, disabled: Boolean,
    position: {type: String, required: true}, label: {type: String, default: '一覧ページ操作'},
    sizeLabel: {type: String, default: '1ページの表示件数'}
  }
};
</script>
<style scoped>
.list-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; padding: .6rem 0; }
.list-pagination label { margin: 0; }
.list-pagination select { margin-left: .35rem; }
</style>
