<template>
  <div>
    <hLargeIconHeader text="Groups" :icon="'people'"></hLargeIconHeader>

    <div>
      <div class="search-field input-group mb-4 mt-4">
        <input
          type="text"
          class="form-control"
          placeholder="Search by groupId"
          v-model="searchInput"
        />
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button" @click="search">Search</button>
        </div>
      </div>
    </div>

    <p v-if="loadError" role="alert">{{ loadError }}</p>
    <div class="list preview-layout mt-4" :class="{'has-preview': currentGroup}">
      <div class="preview-table">
        <div class="my-3"><router-link class="btn btn-sm btn-outline-primary" to="/addGroup">Add Group</router-link></div>
        <list-range :total="groups.length" :count="groups.length" :loading="loading" :error="loadError" />
        <table class="table table-hover">
          <thead class="thead-light">
            <tr>
              <th style="width: 25%">groupId</th>
              <th style="width: 25%">member count</th>
              <th style="width: 50%">members</th>
            </tr>
          </thead>
          <tbody>
            <tr
              :class="{ active: index == currentIndex }"
              v-for="(group, index) in groups"
              :key="index"
              @click="setActive(group, index)"
              @dblclick="goToGroup(group)"
            >
              <td class="td-wrap">
                <tdGroupNameLink :data="{group}"></tdGroupNameLink>
              </td>
              <td class="td-wrap">{{group.userIds.length}}</td>
              <td class="td-wrap">{{group.userIds.join(", ")}}</td>
            </tr>
          </tbody>
        </table>
        <list-range :total="groups.length" :count="groups.length" :loading="loading" :error="loadError" />
        <div class="my-3"><router-link class="btn btn-sm btn-outline-primary" to="/addGroup">Add Group</router-link></div>
      </div>

      <div class="preview-column">
        <div v-if="currentGroup" class="list-preview" role="region" aria-label="選択した項目のプレビュー" tabindex="0">
          <tableDetailsHeader
            icon="person"
            :text="currentGroup.groupId"
            :href="'/groups/' + currentGroup.groupId"
          />

          <table class="table">
            <trDetail label="groupId" :codeDetail="currentGroup.groupId" />
            <trDetail label="createdAt" :time="currentGroup.createdAt" />
            <trDetail label="updatedAt" :time="currentGroup.updatedAt" />
          </table>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import ListRange from "./ListRange";
import moment from "../utils/projectTime";

import GroupDataService from "../services/GroupDataService";

import tdGroupNameLink from "./table/td/tdGroupNameLink";
import hLargeIconHeader from "./h/hLargeIconHeader";
import tableDetailsHeader from "./table/tableDetailsHeader";
import trDetail from "./table/tr/trDetail";

export default {
  name: "group-list",
  components: {
    ListRange,
    tdGroupNameLink,
    hLargeIconHeader,
    tableDetailsHeader,
    trDetail
  },
  data() {
    return {
      groups: [], loading: false, loadError: "", requestId: 0,
      currentGroup: null,
      currentIndex: -1,
      searchInput: ""
    };
  },
  methods: {
    getCalendar(dt) {
      if (!dt) return "";
      return moment(dt).calendar();
    },
    retrieveGroups() { this.search(); },

    refreshList() {
      this.retrieveGroups();
      this.currentGroup = null;
      this.currentIndex = -1;
    },

    setActive(group, index) {
      this.currentGroup = group;
      this.currentIndex = index;
    },
    goToGroup(group) {
      window.location.href = "/groups/" + group.groupId;
    },

    async search() {
      const requestId = ++this.requestId;
      this.loading = true; this.loadError = "";
      try {
        const response = await (this.searchInput ? GroupDataService.findByGroupId(this.searchInput) : GroupDataService.getAll());
        if (requestId !== this.requestId) return;
        this.groups = response.data; this.setActive(null, -1);
      } catch (e) { if (requestId === this.requestId) this.loadError = "取得できませんでした。再試行してください。"; }
      finally { if (requestId === this.requestId) this.loading = false; }
    }
  },
  mounted() {
    moment.locale("en-ca");
    this.retrieveGroups();
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