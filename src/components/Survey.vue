<template>
  <div>
    <hLargeIconHeader :text="currentSurvey.name" :icon="'file'"></hLargeIconHeader>

    <div class="row">
      <div class="col">
        <h4>Details</h4>

        <table class="table">
          <trDetail label="name" :text="currentSurvey.name" />
          <trDetail label="title" :text="currentSurvey.title" />
          <trDetail label="_id" :codeDetail="currentSurvey._id" />
          <trDetail label="createdAt" :time="currentSurvey.createdAt" />
          <trDetail
            label="Questions"
            :number="currentSurvey.questions.length"
            numberSingular="question"
            numberPlural="questions"
          />
        </table>
      </div>

      <div class="col">
        <h4>設問テンプレート</h4>
        <button class="btn btn-outline-primary mb-2" @click="saveTemplate">設問テンプレートを保存</button>
        <p>設問・選択肢・通知文面をJSONで保存します。回答・配信先・日時は含みません。</p>
        <p v-if="templateError" role="alert" class="text-danger">{{ templateError }}</p>

        <textarea class="code-block" v-model="currentSurveyConfig" rows="25" cols="60" disabled></textarea>
      </div>
    </div>

    <div class="mt-5 mb-5">
      <h4>
        <img class="mb-2 mr-1" src="/assets/img/person-plus.svg" width="24" height="24" />
        Assign and Publish
      </h4>userId:
      <form class="edit-form">
        <div class="input-group">
          <select class="form-control" v-model="selectedAssignUserId">
            <option
              v-for="u in allUsers"
              v-bind:value="u.userId"
              v-bind:key="u.userId"
            >{{ u.userId }}</option>
          </select>

          <span>
            <button
              type="button"
              class="btn btn-primary ml-2"
              @click="assignSurvey"
            >Assign and Publish</button>
          </span>
        </div>
      </form>

      <h4 class="mt-4">
        <img class="mb-2 mr-1" src="/assets/img/person-plus.svg" width="24" height="24" />
        Schedule Once
      </h4>userId:
      <form class="edit-form">
        <div class="input-group">
          <select class="form-control" v-model="selectedScheduleOnceUserId">
            <option
              v-for="u in allUsers"
              v-bind:value="u.userId"
              v-bind:key="u.userId"
            >{{ u.userId }}</option>
          </select>
        </div>
        <div>
          publishAt:
          <datetime format="YYYY-MM-DD H:i:s" width="300px" v-model="scheduleOnceDatetime"></datetime>
        </div>
        <div class="mt-3">
          <span>
            <button type="button" class="btn btn-primary" @click="scheduleSurveyOnce">Schedule Once</button>
          </span>
        </div>
      </form>

      <h4 class="mt-4">
        <img class="mb-2 mr-1" src="/assets/img/person-plus.svg" width="24" height="24" />
        Schedule Series
      </h4>
      <form class="edit-form">
        userId:
        <div class="input-group">
          <select class="form-control" v-model="selectedScheduleSeriesUserId">
            <option
              v-for="u in allUsers"
              v-bind:value="u.userId"
              v-bind:key="u.userId"
            >{{ u.userId }}</option>
          </select>
        </div>
        groupId:
        <div class="input-group">
          <select class="form-control" v-model="selectedScheduleSeriesGroupId">
            <option
              v-for="g in allGroups"
              v-bind:value="g.groupId"
              v-bind:key="g.groupId"
            >{{ g.groupId }}</option>
          </select>
        </div>
        <div>
          scheduleStartDate:
          <datetime format="YYYY-MM-DD" width="300px" v-model="scheduleStartDate"></datetime>scheduleEndDate:
          <datetime format="YYYY-MM-DD" width="300px" v-model="scheduleEndDate"></datetime>
        </div>

        <div>
          Hours:
          <datetime format="H:i:s" width="60px" v-model="scheduleHM1"></datetime>
          <datetime format="H:i:s" width="60px" v-model="scheduleHM2"></datetime>
          <datetime format="H:i:s" width="60px" v-model="scheduleHM3"></datetime>
          <datetime format="H:i:s" width="60px" v-model="scheduleHM4"></datetime>
          <datetime format="H:i:s" width="60px" v-model="scheduleHM5"></datetime>
        </div>

        <div>
          randomizeMinutes:
          <input type="text" class="form-control" v-model="randomizeMinutes" />
        </div>

        <div class="mt-4">
          <span>
            <button
              type="button"
              class="btn btn-primary"
              @click="scheduleSurveySeries"
            >Schedule Series</button>
          </span>
        </div>
      </form>

      <h3 class="mt-5">
        <img class="mb-1 mr-1" src="/assets/img/pencil.svg" width="24" height="24" />
        Assignments
      </h3>

      <h4 class="mt-5">
        <img class="mb-1 mr-1" src="/assets/img/person.svg" width="24" height="24" />
        User assignments
      </h4>

      <table class="table table-hover">
        <thead class="thead-light">
          <tr>
            <th style="width: 20%">Assignment</th>
            <th style="width: 10%">User</th>
            <th style="width: 20%">createdAt</th>
            <th style="width: 20%">publishAt</th>
            <th style="width: 10%">Notif</th>
            <th style="width: 10%">Track</th>
            <th style="width: 20%">Answered</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(assignment, index) in userAssignments" 
            :key="index"
            @dblclick="goToAssignment(assignment)"
          >
            <tdAssignmentNameLink :data="{assignment}" />
            <td>
              <a :href="'/users/' + assignment.userId">{{ assignment.userId }}</a>
            </td>
            <td>{{ getCalendar(assignment.createdAt) }}</td>
            <td>{{ getCalendar(assignment.publishAt) }}</td>
            <td>
              <img
                class="mr-1"
                v-if="assignment.publishNotifiedAt"
                src="/assets/img/phone-vibrate.svg"
                title="publishNotifiedAt"
              />
              <img
                class="mr-1"
                v-if="assignment.expireNotifiedAt"
                src="/assets/img/phone-vibrate.svg"
                title="expireNotifiedAt"
              />
            </td>
            <td>
              <img
                class="mr-1"
                v-if="assignment.firstOpenedAt"
                src="/assets/img/envelope-open.svg"
                title="firstOpenedAt"
              />
              <img
                class="mr-1"
                v-if="assignment.dataset"
                src="/assets/img/check.svg"
                title="dataset"
              />
            </td>
            <td>{{ assignment.dataset ? getCalendar(assignment.dataset.createdAt) : "Unanswered" }}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <h4 class="mt-5">
        <img class="mb-1 mr-1" src="/assets/img/people.svg" width="24" height="24" />
        Group assignments
      </h4>

      <table class="table table-hover">
        <thead class="thead-light">
          <tr>
            <th style="width: 20%">Assignment</th>
            <th style="width: 10%">Group</th>
            <th style="width: 20%">createdAt</th>
            <th style="width: 20%">publishFrom</th>
            <th style="width: 20%">publishTo</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(assignment, index) in groupAssignments" 
            :key="index"
            @dblclick="goToAssignment(assignment)"
          >
            <tdAssignmentNameLink :data="{assignment}" />
            <td>
              <a :href="'/groups/' + assignment.groupId">{{ assignment.groupId }}</a>
            </td>
            <td>{{ getCalendar(assignment.createdAt) }}</td>
            <td>{{ getCalendar(assignment.publishFrom) }}</td>
            <td>{{ getCalendar(assignment.publishTo) }}</td>
          </tr>
        </tbody>
      </table>


      <div class="mt-4">
        <label class="mr-2">配信一覧の表示件数
          <select v-model.number="assignmentPageSize" :disabled="assignmentsLoading" @change="getAssignmentsOfSurvey(undefined, 1)">
            <option v-for="size in [10,20,50,100]" :key="size" :value="size">{{ size }}件</option>
          </select>
        </label>
        <p v-if="assignmentsError" role="alert">{{ assignmentsError }}</p>
        <button :disabled="assignmentsLoading || assignmentPage === 1" @click="getAssignmentsOfSurvey(undefined, assignmentPage - 1)">配信一覧：前へ</button>
        <span class="m-2">{{ assignmentPage }} ページ（個人・グループ合計で最大{{ assignmentPageSize }}件）</span>
        <button :disabled="assignmentsLoading || !assignmentsHasMore" @click="getAssignmentsOfSurvey(undefined, assignmentPage + 1)">次へ</button>
      </div>
      <answer-export v-if="currentSurvey._id" :key="currentSurvey._id" :survey-id="currentSurvey._id" :survey-name="currentSurvey.name" />
      <details class="mt-4">
        <summary>旧形式の個別配信データ（互換用）</summary>
        <p>旧方式で個別配信に保存されたデータを出力します。通常の回答結果は上の「回答結果のダウンロード」をご利用ください。</p>
      <p v-if="downloadError" role="alert">{{ downloadError }}</p>
      <div class="mt-4" v-if="!isGeneratingDownload && !(datasetCsv || datasetJson)">
        <span class="m-2">
          Generate
        </span>
        <span class="m-2">
          <a href="javascript:;" @click="generateCsv">CSV</a>
        </span>
        <span target="m-2">
          <a href="javascript:;" @click="generateJson">JSON</a>
        </span>
      </div>

      <div class="mt-4 export-status" v-if="isGeneratingDownload" role="status" aria-live="polite" aria-busy="true">
        <span class="export-spinner" aria-hidden="true"></span>
        <span>ダウンロード用データを作成中です。このままお待ちください。</span>
      </div>

      <div class="mt-4" v-if="!isGeneratingDownload && (datasetCsv || datasetJson)">
        <span class="m-2" v-if="datasetCsv">
          <a 
            v-bind:href="`data:text/csv;charset=utf-8,` + encodeURIComponent(datasetCsv)"
            target="_blank" 
            v-bind:download='currentSurvey.id || currentSurvey.name + ".csv"'
            >
            Download CSV
          </a>
        </span>
        <span target="m-2" v-if="datasetJson">
          <a 
            v-bind:href="`data:text/json;charset=utf-8,` + encodeURIComponent(datasetJson)"
            target="_blank" 
            v-bind:download='currentSurvey.id || currentSurvey.name + ".json"'
            >
            Download JSON
          </a>
        </span>
      </div>

      </details>

    </div>
  </div>

  <!-- <div class="edit-form">
      <h4>Edit Survey</h4>
      <form>
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" class="form-control" id="title" v-model="currentSurvey.title" />
        </div>

        <div class="form-group">
          <label>
            <strong>Status:</strong>
          </label>
          {{ currentSurvey.published ? "Published" : "Pending" }}
        </div>
      </form>

      <button
        class="badge badge-primary mr-2"
        v-if="currentSurvey.published"
        @click="updatePublished(false)"
      >UnPublish</button>
      <button v-else class="badge badge-primary mr-2" @click="updatePublished(true)">Publish</button>

      <button class="badge badge-danger mr-2" @click="deleteSurvey">Delete</button>

      <button type="submit" class="badge badge-success" @click="updateSurvey">Update</button>
      <p>{{ updateMessage }}</p>
  </div>-->
</template>

<script>
import moment from "moment";
import { surveyTemplate } from "../utils/surveyTemplate";
import download from "downloadjs";
import AnswerExport from "./AnswerExport";
import datetime from "vuejs-datetimepicker";

import SurveyDataService from "../services/SurveyDataService";
import UserDataService from "../services/UserDataService";
import GroupDataService from '../services/GroupDataService';
import AssignmentDataService from "../services/AssignmentDataService";

import tdAssignmentNameLink from "./table/td/tdAssignmentNameLink";
import hLargeIconHeader from "./h/hLargeIconHeader";
import trDetail from "./table/tr/trDetail";

export default {
  components: {
    AnswerExport,
    datetime,
    tdAssignmentNameLink,
    hLargeIconHeader,
    trDetail
  },
  name: "survey",
  data() {
    return {
      templateError: "",
      currentSurvey: {
        title: "",
        _id: "",
        status: "",
        createdAt: "",
        questions: []
      },
      currentSurveyConfig: "",
      updateMessage: "",
      assignMessage: "",
      allUsers: [],
      allGroups: [],
      selectedAssignUserId: "",

      selectedScheduleOnceUserId: "",
      scheduleOnceDatetime: "",

      selectedScheduleSeriesUserId: "",
      selectedScheduleSeriesGroupId: "",
      scheduleStartDate: "",
      scheduleEndDate: "",
      scheduleHM1: "",
      scheduleHM2: "",
      scheduleHM3: "",
      scheduleHM4: "",
      scheduleHM5: "",
      randomizeMinutes: 0,

      assignments: [],
      assignmentPage: 1, assignmentPageSize: 50, assignmentsHasMore: false, assignmentsLoading: false, assignmentsError: "", assignmentRequest: 0,

      isGeneratingDownload: false,
      downloadError: "",
      datasetJson: null,
      datasetCsv: null
    };
  },
  computed: {
     userAssignments: function() {
       return this.assignments.filter(a => a.userId)
     },
     groupAssignments: function() {
       return this.assignments.filter(a => a.groupId);
     }
  },
  methods: {
    saveTemplate() {
      this.templateError = "";
      try {
        const value = surveyTemplate(this.currentSurvey);
        const filename = value.name.replace(/[^a-zA-Z0-9_\-\u3040-\u30ff\u4e00-\u9fff]/g, "_") || "survey";
        download(JSON.stringify(value, null, 2), filename + ".template.json", "application/json");
      } catch (e) { this.templateError = e.message; }
    },
    getCalendar(dt) {
      if (!dt) return "";
      return moment(dt).calendar();
    },
    getSurvey(_id) {
      SurveyDataService.getSurvey(_id)
        .then(response => {
          this.currentSurvey = response.data;
          this.currentSurveyConfig = JSON.stringify(
            this.currentSurvey,
            null,
            2
          );
        })
        .catch(e => {
          console.log(e);
        });
    },

    getUsers() {
      UserDataService.getAll()
        .then(response => {
          this.allUsers = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },

    getGroups() {
      GroupDataService.getAll()
        .then(response => {
          this.allGroups = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },

    async getAssignmentsOfSurvey(id, page = 1) {
      const request = ++this.assignmentRequest;
      this.assignmentsLoading = true; this.assignmentsError = "";
      try {
        const response = await AssignmentDataService.getPage({ surveyId: id || this.$route.params.id, page, limit: this.assignmentPageSize });
        if (request !== this.assignmentRequest) return;
        this.assignments = response.data.items; this.assignmentPage = page; this.assignmentsHasMore = response.data.hasMore;
      } catch (e) { if (request === this.assignmentRequest) this.assignmentsError = "配信一覧を取得できませんでした。"; }
      finally { if (request === this.assignmentRequest) this.assignmentsLoading = false; }
    },

    updatePublished(status) {
      console.log(status);
      var data = {
        _id: this.currentSurvey._id,
        title: this.currentSurvey.title,
        published: status
      };

      SurveyDataService.update(this.currentSurvey._id, data)
        .then(response => {
          this.currentSurvey.published = status;
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },

    updateSurvey() {
      SurveyDataService.update(this.currentSurvey._id, this.currentSurvey)
        .then(response => {
          console.log(response.data);
          this.updateMessage = "The Survey was updated successfully!";
        })
        .catch(e => {
          console.log(e);
          this.updateMessage = "Update failed.";
        });
    },

    assignSurvey() {
      SurveyDataService.assignSurvey(
        this.currentSurvey._id,
        this.selectedAssignUserId
      )
        .then(response => {
          console.log(response.data);
          this.assignMessage = "The user has been assigned the survey.";
          this.getAssignmentsOfSurvey()
        })
        .catch(e => {
          console.log(e);
          this.updateMessage = "Assignment failed.";
          alert(this.updateMessage);
        });
    },

    scheduleSurveyOnce() {
      SurveyDataService.scheduleSurveyOnce(
        this.currentSurvey._id,
        this.selectedScheduleOnceUserId,
        this.scheduleOnceDatetime
      )
        .then(response => {
          console.log(response.data);
          this.assignMessage =
            "The survey series has been scheduled at " +
            this.scheduleOnceDatetime +
            ".";
          this.getAssignmentsOfSurvey()
        })
        .catch(e => {
          console.log(e);
          this.updateMessage = "Scheduling once failed.";
          alert(this.updateMessage);
        });
    },

    scheduleSurveySeries() {
      SurveyDataService.scheduleSurveySeries(
        this.currentSurvey._id,
        this.selectedScheduleSeriesUserId,
        this.selectedScheduleSeriesGroupId,
        this.scheduleStartDate,
        this.scheduleEndDate,
        this.scheduleHM1,
        this.scheduleHM2,
        this.scheduleHM3,
        this.scheduleHM4,
        this.scheduleHM5,
        this.randomizeMinutes
      )
        .then(response => {
          console.log(response.data);
          this.assignMessage = "The survey series has been scheduled.";
          this.getAssignmentsOfSurvey()
        })
        .catch(e => {
          console.log(e);
          this.updateMessage = "Scheduling series failed.";
          alert(this.updateMessage);
        });
    },

    deleteSurvey() {
      SurveyDataService.delete(this.currentSurvey._id)
        .then(response => {
          console.log(response.data);
          this.$router.push({ name: "surveys" });
        })
        .catch(e => {
          console.log(e);
        });
    },

    goToAssignment(assignment) {
      window.location.href = "/assignments/" + assignment._id;
    },

    generateCsv() { return this.generateLegacyDownload("csv"); },
    generateJson() { return this.generateLegacyDownload("json"); },
    async generateLegacyDownload(format) {
      if (this.isGeneratingDownload) return;
      this.isGeneratingDownload = true; this.downloadError = "";
      try {
        const method = format === "csv" ? "getCsv" : "getJson";
        const response = await SurveyDataService[method](this.currentSurvey._id);
        if (format === "csv") this.datasetCsv = response.data;
        else this.datasetJson = JSON.stringify(response.data);
      } catch (e) { this.downloadError = "出力できませんでした。再試行してください。"; }
      finally { this.isGeneratingDownload = false; }
    },


  },
  
  mounted() {
    moment.locale("en-ca");
    this.updateMessage = "";
    this.assignMessage = "";
    this.getSurvey(this.$route.params.id);
    this.getUsers();
    this.getGroups();
    this.getAssignmentsOfSurvey(this.$route.params.id);
  }
};
</script>

<style>
.export-status { display: flex; align-items: center; gap: 0.75rem; }
.export-spinner {
  display: inline-block; width: 1.5rem; height: 1.5rem; flex-shrink: 0;
  border: 3px solid #d8dce0; border-top-color: #245b91; border-radius: 50%;
  animation: export-spin 0.8s linear infinite;
}
@keyframes export-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .export-spinner { animation: none; } }

.edit-form {
  max-width: 300px;
}
.list {
  max-width: 100%;
}
.code-block {
  font-family: monospace, Arial, sans-serif;
  font-size: smaller;
  background: #ddd;
  color: #666;
}
.code-detail {
  font-family: monospace, Arial, sans-serif;
  font-size: smaller;
  color: #666;
}
.td-wrap {
  word-break: break-word;
}
.h-spacer {
  margin-right: 200;
}
</style>