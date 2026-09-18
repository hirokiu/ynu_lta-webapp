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
 for (const [key,getter] of Object.entries(definition.computed || {})) Object.defineProperty(state,key,{get:()=>getter.call(state)});
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
 const sizes=component('SurveyList',{SurveyDataService:{getPage:async params=>{assert.equal(params.limit,20);assert.equal(params.page,1);return {data:{items:[],hasMore:false}};}}});
 sizes.pageSize=20;await sizes.loadPage(1);assert.equal(sizes.page,1);
 const downloads=[];
 const answers=component('AnswerExport',{SurveyDataService:{
  exportResults:(id,options)=>new Promise(resolve=>downloads.push({id,options,resolve})),
  getResultsPage:async(id,params)=>({data:{items:[{_id:'answer-'+params.page,userId:'example'}],hasMore:true}})
 }});
 answers.surveyId='survey-id';answers.surveyName='Survey';
 answers.scope='selected';await answers.loadPage(1);answers.toggle('answer-1',true);
 await answers.loadPage(2);answers.toggle('answer-2',true);assert.equal(answers.selectedIds.length,2);
 answers.togglePage(false);assert.deepStrictEqual(Array.from(answers.selectedIds),['answer-1']);answers.togglePage(true);
 const selected=answers.generate('csv');assert(answers.busy);await answers.generate('csv');assert.equal(downloads.length,1);
 assert.deepStrictEqual(Array.from(downloads[0].options.ids),['answer-1','answer-2']);
 downloads[0].resolve({data:'回答者ID\nexample'});await selected;assert(!answers.busy);assert(answers.downloadUrl);
 answers.scope='all';answers.from='2026-01-01';answers.to='2026-01-02';answers.changeScope();assert.equal(answers.downloadUrl,null);
 const all=answers.generate('json');assert.deepStrictEqual(Object.keys(downloads[1].options).sort(),['format','scope']);
 downloads[1].resolve({data:[]});await all;assert(answers.error);assert.equal(answers.downloadUrl,null);
 answers.scope='period';const period=answers.generate('csv');assert.equal(downloads[2].options.from,'2026-01-01T00:00:00.000+09:00');assert.equal(downloads[2].options.to,'2026-01-02T23:59:59.999+09:00');
 downloads[2].resolve({data:'csv'});await period;answers.clearDownload();
 answers.from='';await answers.generate('csv');assert(answers.error);assert.equal(downloads.length,3);
 const failing=component('AnswerExport',{SurveyDataService:{exportResults:async()=>{throw {response:{status:422}};}}});
 await failing.generate('csv');assert(failing.error.includes('選択'));assert(!failing.busy);
 console.log('Paging, cross-page selection, export scope and busy/error state tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
