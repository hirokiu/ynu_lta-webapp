const assert=require('assert'),vm=require('vm'),fs=require('fs');
const source=fs.readFileSync('src/utils/projectTime.js','utf8').replace(/^import .*;$/gm,'').replace(/export default /g,'').replace(/export /g,'');
const context={Vue:require('vue'),moment:require('moment-timezone')};vm.createContext(context);vm.runInContext(source,context);
context.setProjectTimezone('Asia/Tokyo');assert.equal(context.formatProjectTime('2026-01-01T00:00:00Z'),'2026-01-01 09:00:00 +09:00');
context.setProjectTimezone('America/New_York');assert.equal(context.formatProjectTime('2026-01-01T00:00:00Z'),'2025-12-31 19:00:00 -05:00');assert.equal(context.formatProjectTime('2026-07-01T00:00:00Z'),'2026-06-30 20:00:00 -04:00');
const start=context.projectMoment('2026-03-08').startOf('day'),end=context.projectMoment('2026-03-08').endOf('day');assert.equal(end.valueOf()-start.valueOf()+1,23*3600000);assert.equal(start.toISOString(),'2026-03-08T05:00:00.000Z');
context.setProjectTimezone('bad');assert(context.formatProjectTime('2026-01-01T00:00:00Z').endsWith('+09:00'));console.log('PASS project timezone, UTC offsets and DST date range');
