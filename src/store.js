import Vue from "vue";
import Vuex from "vuex";
import {setProjectTimezone} from "./utils/projectTime";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    projectName: "",
    user: {
      loggedIn: false,
      data: null
    },
    token: localStorage.getItem('token') || ''
  },
  getters: {
    user(state){
      return state.user;
    },
    token(state) {
      return state.token;
    }
  },
  mutations: {
    SET_PROJECT_TIMEZONE(state, zone) { setProjectTimezone(zone); },
    SET_PROJECT_NAME(state, name) { state.projectName = name; },
    SET_USER(state, data) {
        state.user.data = data;
    },
    SET_TOKEN(state, token) {
        state.token = token;
        localStorage.setItem('token', token);
    }
  },
  actions: {
    async fetchUser({ commit, state }, user) {

      if (user) {

        await user.getIdToken().then(function(idToken) {
          // console.log("user.getIdToken().then... :");
          // console.log(idToken);
          // console.log("setting token to idToken: " + idToken);
          commit("SET_TOKEN", idToken);

      });

        var data = {
          displayName: user.displayName,
          email: user.email
        };
        commit("SET_USER", data);
        // Display metadata is optional and must not interrupt login.
        try {
          const token = await user.getIdToken();
          const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api').replace(/\/$/, '') + '/me', {headers: {token}});
          if (response.ok) {
            const metadata = await response.json();
            const project = metadata.project;
            if (state.user.data === data) {
              commit("SET_USER", {...data, username: metadata.username || metadata.userId});
              if (project) {
                commit("SET_PROJECT_TIMEZONE", project.timezone);
                if (typeof project.displayName === "string") commit("SET_PROJECT_NAME", project.displayName);
              }
            }
          }
        } catch (_) { /* Retain the current display name while offline. */ }

      } else {
        commit("SET_PROJECT_TIMEZONE", "Asia/Tokyo");
        commit("SET_PROJECT_NAME", "");
        commit("SET_USER", null);
        commit("SET_TOKEN", null);
      }
    }
  }
});