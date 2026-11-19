const assert=require('assert'),fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('src/firebaseConfig.js','utf8').split('export const firebaseConfig')[0].replace('export function','function');
const context={};vm.runInNewContext(code,context);
const valid={apiKey:'public',authDomain:'example.firebaseapp.com',projectId:'example',appId:'app'};
assert.equal(context.parseFirebaseConfig(JSON.stringify(valid),'example').projectId,'example');
for(const [text,expected] of [['','example'],[JSON.stringify(valid),'other'],[JSON.stringify({...valid,private_key:'secret'}),'example'],[JSON.stringify({...valid,apiKey:''}),'example']])assert.throws(()=>context.parseFirebaseConfig(text,expected));
console.log('Firebase configuration validation passed');
