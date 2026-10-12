<template>
<span>
  <td v-if="!unixMs2" v-bind:class="{ 'td-gray': isToHappen(unixMs) }"> {{ getCalendar(unixMs) }} </td>
  <td v-if="unixMs2" v-bind:class="{ 'td-gray': isToHappen(unixMs) }"> {{ getCalendar(unixMs) + " –"}} <br/>{{ getCalendar(unixMs2)}} </td>
</span>
</template>

<script>

import moment from "../../../utils/projectTime";

export default {
  props: {
    unixMs: {
      type: String
    },
    unixMs2: {
      type: String
    },
  },
  methods: {
    isToHappen(unixMs) {
      return moment(unixMs).isAfter(moment());
    },
    getCalendar(dt) {
      if (!dt) return "";
      return moment(dt).calendar();
    }
  }
};
</script>

<style scoped>
.td-gray {
  color: #aaa;
}
</style>