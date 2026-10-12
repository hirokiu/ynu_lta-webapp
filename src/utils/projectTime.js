import Vue from 'vue';
import moment from 'moment-timezone';
export const timeSettings = Vue.observable({timezone: 'Asia/Tokyo'});
export function setProjectTimezone(zone) {
  timeSettings.timezone = moment.tz.zone(zone) ? zone : 'Asia/Tokyo';
}
export function formatProjectTime(value) {
  return value ? moment(value).tz(timeSettings.timezone).format('YYYY-MM-DD HH:mm:ss Z') : '';
}
export default function projectMoment(value) {
  // Explicit-offset timestamps retain their instant; date-only input uses the project zone.
  return moment.tz(value, timeSettings.timezone);
}
projectMoment.locale = moment.locale;
export const timezoneNames = moment.tz.names();
