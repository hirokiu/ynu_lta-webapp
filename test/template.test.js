const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = {};
vm.runInNewContext(fs.readFileSync('src/utils/surveyTemplate.js','utf8').replace(/export function/g,'function'), context);
const {surveyTemplate, parseTemplate, surveyStructureErrors} = context;
const original = {name:'研究テンプレート',_id:'db-id',id:'legacy',userId:'private',answers:['private'],publishedAt:'date',questions:[{index:0,type:'header',text:'開始'},{index:1,type:'single',text:'質問',values:['はい','いいえ'],_id:'question-id',skip:{ifChosen:1,goto:2}},{index:2,type:'footer',text:'完了'}]};
const clean = surveyTemplate(original);
assert(!clean._id && !clean.id && !clean.userId && !clean.answers && !clean.publishedAt);
assert(!clean.questions[1]._id);assert.equal(clean.questions[1].skip.goto,2);
assert.equal(JSON.stringify(parseTemplate(JSON.stringify(clean))),JSON.stringify(clean));
assert(original.questions[1]._id);
assert.throws(()=>parseTemplate('broken'));
assert.throws(()=>parseTemplate('[{"answer":1}]'));
assert.throws(()=>surveyTemplate({...original,questions:[{index:0,type:'single',skip:{ifChosen:0,goto:99}}]}));
assert.throws(()=>surveyTemplate({...original,questions:[{index:0,type:'single'},{index:0,type:'single'}]}));
const script = fs.readFileSync('src/components/AddSurvey.vue','utf8').split('<script>')[1].split('</script>')[0];
let calls=0, fail=true;
const c={module:{exports:{}},parseTemplate,hLargeIconHeader:{},SurveyDataService:{create:async data=>{calls++;assert(!data._id);if(fail)throw Error('offline');return {data:{_id:'new-survey'}};}}};
vm.runInNewContext(script.replace(/^import .*;$/gm,'').replace('export default','module.exports ='),c);
const def=c.module.exports,state=def.data();for(const [k,v] of Object.entries(def.methods))state[k]=v.bind(state);
(async()=>{
 await state.readTemplate({target:{files:[{size:100,text:async()=>JSON.stringify(original)}],value:'file'}});
 assert.equal(calls,0);assert.equal(state.reviewed,null);assert(!state.config.includes('private'));
 state.review();await state.saveSurvey();assert(!state.submitted);assert(state.error);assert(!state.busy);
 fail=false;await state.saveSurvey();assert(state.submitted);assert.equal(state.savedId,'new-survey');
 state.newSurvey();state.config='invalid';state.review();assert(!state.reviewed);assert(state.error);
 const before=calls;state.config=JSON.stringify({name:'broken',questions:[{index:1,type:'open'}]});state.review();await state.saveSurvey();assert(!state.reviewed);assert.equal(calls,before);
 console.log('Template isolation, round-trip, validation, import and save failure/success tests passed');
})().catch(e=>{console.error(e);process.exit(1);});

const onlyOpen = {name:'invalid',questions:[{index:1,type:'open'}]};
assert.throws(()=>parseTemplate(JSON.stringify(onlyOpen)), /header/);
assert(surveyStructureErrors(onlyOpen).some(e=>e.includes('footer')));
for (const change of [q=>q[1].index=8,q=>q[1].type='unknown',q=>q[1].values=[],q=>q[1].skip={ifChosen:-1,goto:1},q=>q[1].includeIf={ifIndex:2,ifValue:1}]) {
 const broken=JSON.parse(JSON.stringify(original));change(broken.questions);
 assert.throws(()=>parseTemplate(JSON.stringify(broken)));
}
assert.equal(surveyStructureErrors(original).length,0);
