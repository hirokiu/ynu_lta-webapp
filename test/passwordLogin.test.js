const assert = require('assert');
const {passwordLogin} = require('../src/services/passwordLogin');
const response = (status, body) => ({status, ok:status>=200 && status<300, json:async()=>body});
async function run(responses, input = {}, customFails = false) {
  const calls=[];
  const auth={signInWithEmailAndPassword:async(...args)=>{calls.push(['legacy',...args]); return 'legacy';},
    signInWithCustomToken:async token=>{calls.push(['custom',token]); if(customFails) throw Error('firebase unavailable');return 'new';}};
  let error;
  try { await passwordLogin({loginId:' alice ',password:'  exact password  ',base:'/api',auth,
    request:async(url,options)=>{calls.push(['request',url,options]); const item=responses.shift(); if(item instanceof Error) throw item;return item;},...input}); }
  catch(e){error=e;}
  return {calls,error};
}
(async()=>{
  let result=await run([response(200,{usernameLogin:true}),response(200,{customToken:'token'})]);
  assert.deepEqual(result.calls.at(-1),['custom','token']);
  assert.equal(JSON.parse(result.calls[1][2].body).password,'  exact password  ');
  for(const options of [response(200,{usernameLogin:false}),response(404)]) {
    result=await run([options]);assert.deepEqual(result.calls.at(-1),['legacy','alice@humlablu.com','  exact password  ']);
  }
  result=await run([response(200,{usernameLogin:true}),response(401)],{password:'short'});
  assert.deepEqual(result.calls.at(-1),['legacy','alice@humlablu.com','short']);
  for(const failure of [response(429),response(503),response(404),response(200,{}),new Error('timeout')]) {
    result=await run([response(200,{usernameLogin:true}),failure]);
    assert(result.error); assert(!result.calls.some(c=>c[0]==='legacy'));
  }
  for(const failure of [response(503),response(200,{}),new Error('timeout')]) {
    result=await run([failure]);assert(result.error);assert(!result.calls.some(c=>c[0]==='legacy'));
  }
  result=await run([response(200,{usernameLogin:true}),response(200,{customToken:'token'})],{},true);
  assert(result.error);assert(!result.calls.some(c=>c[0]==='legacy'));
  result=await run([],{loginId:'existing@example.invalid'});
  assert.deepEqual(result.calls[0],['legacy','existing@example.invalid','  exact password  ']);
  console.log('PASS: new/legacy password routes, exact password, policy/error handling; Firebase calls mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
