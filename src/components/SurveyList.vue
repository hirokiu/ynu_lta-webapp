<template>
  <div>
    <hLargeIconHeader text="Surveys" :icon="'files'"></hLargeIconHeader>

    <div>
      <div class="search-field input-group mb-4 mt-4">
        <input type="text" class="form-control" placeholder="Search by name" v-model="name" />
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button" @click="search">Search</button>
        </div>
      </div>
    </div>

    <p v-if="loadError" role="alert">{{ loadError }}</p>
    <p v-if="loading">読み込み中…</p>
    <list-pagination position="上" :page="page" :page-size="pageSize" :has-more="hasMore" :disabled="loading" @page-change="loadPage" @size-change="pageSize = $event; loadPage(1)"><router-link class="btn btn-sm btn-outline-primary" to="/addSurvey">Add Survey</router-link></list-pagination>
    <div class="list preview-layout mt-4" :class="{'has-preview': currentSurvey && currentSurvey._id}">
      <div class="preview-table">
        <list-range :total="total" :count="surveys.length" :page="page" :page-size="pageSize" :loading="loading" :error="loadError" />
        <table class="table table-hover">
          <thead class="thead-light">
            <tr>
              <th style="width: 40%">name</th>
              <th style="width: 40%">createdAt</th>
              <th style="width: 20%">Questions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              :class="{ active: index == currentIndex }"
              v-for="(survey, index) in surveys"
              :key="index"
              @click="setActive(survey, index)"
              @dblclick="goToSurvey(survey)"
            >
              <td class="td-wrap">
                <tdSurveyNameLink :data="{survey}"></tdSurveyNameLink>
              </td>
              <td class="td-wrap">{{ getCalendar(survey.createdAt) }}</td>
              <td class="td-wrap">{{ survey.questions.length }}</td>
            </tr>
          </tbody>
        </table>
        <list-range :total="total" :count="surveys.length" :page="page" :page-size="pageSize" :loading="loading" :error="loadError" />
        <list-pagination position="下" :page="page" :page-size="pageSize" :has-more="hasMore" :disabled="loading" @page-change="loadPage" @size-change="pageSize = $event; loadPage(1)"><router-link class="btn btn-sm btn-outline-primary" to="/addSurvey">Add Survey</router-link></list-pagination>


      </div>

      <div class="preview-column">
        <div v-if="currentSurvey && currentSurvey._id" class="list-preview" role="region" aria-label="選択した項目のプレビュー" tabindex="0">
          <tableDetailsHeader
            icon="file"
            :text="currentSurvey.name"
            :href="'/surveys/' + currentSurvey._id"
          />
          <table class="table">
            <trDetail label="title" :text="currentSurvey.title" />
            <trDetail
              label="createdAt" :time="currentSurvey.createdAt"
            />
            <trDetail label="Questions" :text="currentSurvey.questions.length" />
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ListPagination from "./ListPagination";
import ListRange from "./ListRange";
import moment from "../utils/projectTime";

import SurveyDataService from "../services/SurveyDataService";

import tdSurveyNameLink from "./table/td/tdSurveyNameLink";
import hLargeIconHeader from "./h/hLargeIconHeader";
import tableDetailsHeader from "./table/tableDetailsHeader";
import trDetail from "./table/tr/trDetail";

export default {
  name: "survey-list",
  components: {
    ListPagination,
    ListRange,
    tdSurveyNameLink,
    hLargeIconHeader,
    tableDetailsHeader,
    trDetail
  },
  data() {
    var emptySurvey = {
      title: "",
      _id: "",
      status: "",
      createdAt: "",
      questions: []
    };

    this.emptySurvey = emptySurvey;
    return {
      surveys: [],
      total: null, page: 1, pageSize: 50, hasMore: false, loading: false, loadError: "", requestId: 0,
      currentSurvey: emptySurvey,
      currentIndex: -1,
      name: "",
      title: "",
      createdAt: ""
    };
  },
  methods: {
    getCalendar(dt) {
      if (!dt) return "";
      return moment(dt).calendar();
    },
    retrieveSurveys() { this.loadPage(1); },
    async loadPage(page) {
      const requestId = ++this.requestId;
      this.loading = true; this.loadError = "";
      try {
        const response = await SurveyDataService.getPage({ page, limit: this.pageSize, t: this.name });
        if (requestId !== this.requestId) return;
        this.total = response.data.total; this.surveys = response.data.items; this.hasMore = response.data.hasMore; this.page = page;
        this.currentSurvey = this.emptySurvey; this.currentIndex = -1;
      } catch (e) { if (requestId === this.requestId) this.loadError = "取得できませんでした。再試行してください。"; }
      finally { if (requestId === this.requestId) this.loading = false; }
    },

    refreshList() {
      console.log("refreshList");
      this.retrieveSurveys();
      this.currentSurvey = null;
      this.currentIndex = -1;
    },

    setActive(survey, index) {
      if (index === this.currentIndex) {
        this.currentSurvey = this.emptySurvey;
        this.currentIndex = -1;
      } else {
        this.currentSurvey = survey;
        this.currentIndex = index;
      }
    },

    search() { this.loadPage(1); },
    goToSurvey(survey) {
      window.location.href = "/surveys/" + survey._id;
    }
  },
  mounted() {
    moment.locale("en-ca");
    this.currentSurvey = this.emptySurvey;
    this.retrieveSurveys();
  }
};
</script>

<style>
.list {
  text-align: left;
  width: 1800pt;
}
.td-wrap {
  word-break: break-word;
}
.search-field {
  width: 578pt;
}
.code-detail {
  font-family: monospace, Arial, sans-serif;
  font-size: smaller;
  color: #666;
}
.active {
  background: #eaeaea;
}
.ra {
  text-align: right;
}
.text-align-center {
  text-align: center;
}
</style>