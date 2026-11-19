import Vue from 'vue'
import App from './App.vue'
import router from './router'
import * as firebase from 'firebase/app';
import 'firebase/auth';
import store from "./store";

Vue.config.productionTip = false

Vue.use(require("moment")); // TODO try removing this line (https://stackoverflow.com/a/53892036/237509)

import { firebaseConfig } from "./firebaseConfig";

firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(user => {
  store.dispatch("fetchUser", user);
});


new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');