const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const moment = require('moment');
function component(file, services) {
 const source=fs.readFileSync(`src/components/${file}.vue`,'utf8').split('<script>')[1].split('</script>')[0];
 const imports=Array.from(source.matchAll(/^import (\w+) from .*;$/gm),m=>m[1]);
 const context={module:{exports:{}},moment,console,URL,Blob,...Object.fromEntries(imports.map(name=>[name,{}])),...services};
 context.moment=moment;
 vm.runInNewContext(source.replace(/^import .*;$/gm,'').replace('export default','module.exports ='),context);
 const definition=context.module.exports;
 const state={};Object.assign(state,definition.data.call(state));
 for(const [key,method] of Object.entries(definition.methods)) state[key]=method.bind(state);
 return state;
}
(async()=>{
 const calls=[];
 const state=component('AssignmentList',{AssignmentDataService:{getPage:params=>new Promise((resolve,reject)=>calls.push({params,resolve,reject}))}});
 const old=state.loadPage(1), latest=state.loadPage(2);
 calls[1].resolve({data:{items:[{_id:'new'}],hasMore:false}});await latest;
 calls[0].resolve({data:{items:[{_id:'old'}],hasMore:true}});await old;
 assert.equal(state.assignments[0]._id,'new');assert.equal(state.page,2);assert.equal(state.loading,false);
 assert.equal(calls[1].params.limit,50);assert(calls[1].params.from.endsWith('Z'));
 const failed=state.loadPage(3);calls[2].reject(Error('offline'));await failed;assert(state.loadError);assert.equal(state.loading,false);
 const survey=component('Survey',{SurveyDataService:{getResultsCsv:async()=>{throw Error('offline');}}});
 survey.currentSurvey={_id:'synthetic'};survey.exportFrom='2026-01-01';await survey.generateResultsCsv();assert(survey.exportError);assert.equal(survey.isGeneratingResultsDownload,false);
 survey.exportFrom='';await survey.generateResultsCsv();assert(survey.exportError);assert.equal(survey.isGeneratingResultsDownload,false);
 console.log('UI paging race and download error tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
