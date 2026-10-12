<template>
  <div class="assignment-list-page">
    <hLargeIconHeader text="Assignments" :icon="'pencil'"></hLargeIconHeader>

    <div>
      <div class="search-field input-group mb-4 mt-4">
        <input
          type="text"
          class="form-control"
          placeholder="Search by survey name, user id, or group id"
          v-model="searchInput"
        />
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button" @click="search">Search</button>
        </div>
      </div>
    </div>

    <button type="button" class="btn btn-outline-secondary mb-3" :aria-expanded="filtersOpen ? 'true' : 'false'" aria-controls="assignment-filter-panel" @click="filtersOpen = !filtersOpen">
      条件で絞り込む {{ filtersOpen ? '▲ 閉じる' : '▼ 開く' }}
    </button>
    <div id="assignment-filter-panel" v-show="filtersOpen">
    <fieldset class="assignment-filters">
      <legend>条件で絞り込む</legend>
      <label>Survey名<input class="form-control" v-model="surveyName" @keyup.enter="search" /></label>
      <label>対象者ID<input class="form-control" v-model="userId" @keyup.enter="search" /></label>
      <label>グループ名<input class="form-control" v-model="groupId" @keyup.enter="search" /></label>
      <label>開封状態<select class="form-control" v-model="opened"><option value="">すべて</option><option value="yes">開封済み</option><option value="no">未開封</option></select></label>
      <label>公開通知<select class="form-control" v-model="notified"><option value="">すべて</option><option value="yes">送信記録あり</option><option value="no">送信記録なし</option></select></label>
      <button class="btn btn-outline-primary" @click="search">絞り込む</button>
    </fieldset>
    <p>入力した条件と期間のすべてに一致する配信を表示します。通知の送信記録は、端末への到着確認を意味しません。</p>
    <label>表示する期間
      <select v-model="periodMode" @change="retrieveAssignments"><option value="all">全期間</option><option value="period">期間を指定</option></select>
    </label>
    <p>全期間では過去の配信も表示します。表示件数を超える分は「次へ」で確認できます。</p>
    <div v-if="periodMode === 'period'" class="search-field input-group mb-4 mt-4">
      <label>From:</label>
      <datetime class="ml-2 mr-2" format="YYYY-MM-DD" width="316px" v-model="filterFrom" @input="retrieveAssignments"></datetime>
      <label>To:</label>
      <datetime class="ml-2 mr-2" format="YYYY-MM-DD" width="316px" v-model="filterTo" @input="retrieveAssignments"></datetime>
    </div>

    </div>

    <p v-if="loadError" role="alert">{{ loadError }}</p>
    <p v-if="loading">読み込み中…</p>
    <p v-if="!loading && !loadError && !assignments.length">条件に一致する配信はありません。期間や検索条件を確認してください。</p>
    <list-pagination position="上" :page="page" :page-size="pageSize" :has-more="hasMore" :disabled="loading" @page-change="loadPage" @size-change="pageSize = $event; loadPage(1)"></list-pagination>
    <div class="list preview-layout assignment-layout mt-4" :class="{'has-preview': currentAssignment}">
      <div class="preview-table">
        <list-range :total="total" :count="assignments.length" :page="page" :page-size="pageSize" :loading="loading" :error="loadError" />
        <table class="table table-hover">
          <thead class="thead-light">
            <tr>
              <th style="width: 20%">Assignment</th>
              <th style="width: 22%">publish</th>
              <th style="width: 14%">Assignee</th>
              <th style="width: 25%">Survey</th>
              <th style="width: 8%">Notif</th>
              <th style="width: 8%">Track</th>
            </tr>
          </thead>
          <tbody>
            <tr
              :class="{ active: index == currentIndex }"
              v-for="(assignment, index) in assignments"
              :key="index"
              @click="setActive(assignment, index)"
              @dblclick="goToAssignment(assignment)"
            >
              <!-- <tr v-bind:class="{ 'table-success': assignment.dataset }" v-for="(assignment, index) in assignments" :key="index"> -->

              <tdAssignmentNameLink :data="{assignment}" />
              <td :class="{'td-gray': isToHappen(assignment.publishAt || assignment.publishFrom)}">
                {{ getCalendar(assignment.publishAt || assignment.publishFrom) }}
                <template v-if="!assignment.publishAt && assignment.publishTo"><br />– {{ getCalendar(assignment.publishTo) }}</template>
              </td>
              <td class="td-wrap">
                <span v-if="assignment.userId" >
                  <img class="mb-2 mr-2" src="/assets/img/person.svg" width="12" height="12" />
                  <a :href="'/users/' + assignment.userId">{{ assignment.userId }}</a>
                </span>
                <span v-if="assignment.groupId" >
                  <img class="mb-2 mr-2" src="/assets/img/people.svg" width="12" height="12" />
                  <a :href="'/groups/' + assignment.groupId">{{ assignment.groupId }}</a>
                </span>
              </td>
              <td class="td-wrap">
                <a :href="'/surveys/' + assignment.survey._id">{{ assignment.survey.name }}</a>
              </td>
              <td>
                <img class="mr-1" v-if="assignment.publishNotifiedAt" src="assets/img/phone-vibrate.svg" title="publishNotifiedAt"/>
                <img class="mr-1" v-if="assignment.expireNotifiedAt"  src="assets/img/phone-vibrate.svg" title="expireNotifiedAt"/>
              </td>
              <td>
                <img class="mr-1" v-if="assignment.firstOpenedAt" src="assets/img/envelope-open.svg" title="firstOpenedAt"/>
                <img class="mr-1" v-if="assignment.dataset" src="assets/img/check.svg" title="dataset"/>
              </td>
            </tr>
          </tbody>
        </table>
        <list-range :total="total" :count="assignments.length" :page="page" :page-size="pageSize" :loading="loading" :error="loadError" />
        <list-pagination position="下" :page="page" :page-size="pageSize" :has-more="hasMore" :disabled="loading" @page-change="loadPage" @size-change="pageSize = $event; loadPage(1)"></list-pagination>
      </div>

      <div class="preview-column" v-if="currentAssignment">
        <div class="list-preview" role="region" aria-label="選択した項目のプレビュー" tabindex="0">
          <tableDetailsHeader
            icon="pencil"
            :text="(currentAssignment.userId ? currentAssignment.userId : currentAssignment.groupId) + ' @ ' + currentAssignment.survey.name"
            :href="'/assignments/' + currentAssignment._id"
          />
          <table class="table">
            <trDetail
              label="User"
              :text="currentAssignment.userId"
              :href="'/users/' + currentAssignment.userId"
            />
            <trDetail
              label="Survey"
              :text="currentAssignment.survey.name"
              :href="'/surveys/' + currentAssignment.survey._id"
              :subtext="currentAssignment.survey.title"
              :number="currentAssignment.survey.questions.length"
              numberSingular="question"
              numberPlural="questions"
            />
            <trDetail label="createdAt" :time="currentAssignment.createdAt" />
            <trDetail label="publishAt" :time="currentAssignment.publishAt" />
            <trDetail
              label="Answered"
              :text="currentAssignment.dataset ? undefined : 'Unanswered'"
              :time="currentAssignment.dataset ? currentAssignment.dataset.createdAt : undefined"
            />
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ListPagination from "./ListPagination";
import ListRange from "./ListRange";
import AssignmentDataService from "../services/AssignmentDataService";

import moment, {timeSettings} from "../utils/projectTime";
import datetime from "vuejs-datetimepicker";
import tdAssignmentNameLink from "./table/td/tdAssignmentNameLink";
import hLargeIconHeader from "./h/hLargeIconHeader";
import tableDetailsHeader from "./table/tableDetailsHeader";
import trDetail from "./table/tr/trDetail";

export default {
  name: "assignment-list",
  components: {
    ListPagination,
    ListRange,
    datetime,
    tdAssignmentNameLink,
    hLargeIconHeader,
    tableDetailsHeader,
    trDetail
  },
  data() {
    return {
      filtersOpen: false,
      assignments: [],
      total: null, page: 1, pageSize: 50, hasMore: false, loading: false, loadError: "", requestId: 0,
      currentIndex: -1,
      currentAssignment: null,
      searchInput: "", surveyName: "", userId: "", groupId: "", opened: "", notified: "",
      periodMode: "all",
      filterFrom: moment()
        .startOf("day")
        .format("YYYY-MM-DD"),
      filterTo: moment()
        .endOf("day")
        .format("YYYY-MM-DD")
    };
  },
  computed: { timezone() { return timeSettings.timezone; } },
  watch: { timezone() { this.retrieveAssignments(); } },
  methods: {
    getCalendar(dt) {
      if (!dt) return "";
      return moment(dt).calendar();
    },
    retrieveAssignments() { this.loadPage(1); },
    async loadPage(page) {
      const requestId = ++this.requestId;
      this.loading = true; this.loadError = "";
      try {
        const response = await AssignmentDataService.getPage({ page, limit: this.pageSize, t: this.searchInput, surveyName: this.surveyName, userId: this.userId, groupId: this.groupId, opened: this.opened, notified: this.notified,
          ...(this.periodMode === "period" ? {from: moment(this.filterFrom).startOf("day").toISOString(),
          to: moment(this.filterTo).endOf("day").toISOString()} : {}) });
        if (requestId !== this.requestId) return;
        this.total = response.data.total; this.assignments = response.data.items; this.hasMore = response.data.hasMore; this.page = page;
        this.currentAssignment = null; this.currentIndex = -1;
      } catch (e) { if (requestId === this.requestId) this.loadError = "取得できませんでした。期間を確認して再試行してください。"; }
      finally { if (requestId === this.requestId) this.loading = false; }
    },

    refreshList() {
      console.log("refreshList");
      this.retrieveAssignments();
    },

    setActive(assignment, index) {
      this.currentAssignment = assignment;
      this.currentIndex = index;
    },
    goToAssignment(assignment) {
      window.location.href = "/assignments/" + assignment._id;
    },

    search() { this.loadPage(1); },
    isToHappen(stamp) {
      return moment(stamp).isAfter(moment());
    }
  },
  mounted() {
    moment.locale("en-ca");
    this.retrieveAssignments();
  }
};
</script>

<style scoped>
.assignment-filters { display: flex; flex-wrap: wrap; gap: .8rem; align-items: end; }
.assignment-filters legend { font-size: 1rem; }
.assignment-filters label { max-width: 100%; }
.list.assignment-layout { width: 100%; grid-template-columns: minmax(0, 1fr); }
.list.assignment-layout.has-preview { grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr); }
.assignment-list-page .search-field { width: 100%; max-width: 100%; flex-wrap: wrap; }
.table { width: 100%; table-layout: fixed; }
.table th, .table td { overflow-wrap: anywhere; }
.td-gray { color: #aaa; }
.active { background: #eaeaea; }
@media (max-width: 767px) {
  .list.assignment-layout.has-preview { grid-template-columns: minmax(0, 1fr); }
  .table th, .table td { padding: .4rem; }
}
</style>
