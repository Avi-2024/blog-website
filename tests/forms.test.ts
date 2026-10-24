import test from 'node:test';import assert from 'node:assert/strict';
import {submitForm} from '../src/lib/forms';
const req=(body:object,origin='https://staging.example')=>new Request('https://staging.example/api/contact/',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
const valid={name:'Test',email:'test@example.test',message:'Staging unit test message',consent:true};
const vars=['CONTACT_ENDPOINT_URL','CONTACT_ENDPOINT_TOKEN','REDIS_REST_URL','REDIS_REST_TOKEN'];
test('form rejects unconfigured provider without claiming delivery',async()=>{delete process.env.CONTACT_ENDPOINT_URL;assert.equal((await submitForm(req(valid),'contact')).status,503);});
test('form origin, validation, rate limiting and provider acknowledgement',async t=>{
 const before=Object.fromEntries(vars.map(k=>[k,process.env[k]]));Object.assign(process.env,{CONTACT_ENDPOINT_URL:'https://adapter.example.test',CONTACT_ENDPOINT_TOKEN:'test',REDIS_REST_URL:'https://redis.example.test',REDIS_REST_TOKEN:'test'});const realFetch=globalThis.fetch;
 try {
  await t.test('cross-origin request rejected before network',async()=>assert.equal((await submitForm(req(valid,'https://untrusted.example'),'contact')).status,403));
  await t.test('missing consent rejected',async()=>assert.equal((await submitForm(req({...valid,consent:false}),'contact')).status,400));
  await t.test('honeypot submission rejected',async()=>assert.equal((await submitForm(req({...valid,website:'spam'}),'contact')).status,400));
  await t.test('invalid email rejected',async()=>assert.equal((await submitForm(req({...valid,email:'bad'}),'contact')).status,400));
  await t.test('rate limit prevents provider delivery',async()=>{let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({result:101});};assert.equal((await submitForm(req(valid),'contact')).status,429);assert.equal(calls,1);});
  await t.test('provider HTTP 200 without acknowledgement is not success',async()=>{globalThis.fetch=async(url)=>String(url).includes('redis')?Response.json({result:1}):Response.json({});assert.equal((await submitForm(req(valid),'contact')).status,503);});
  await t.test('explicit provider acknowledgement returns success',async()=>{globalThis.fetch=async(url)=>String(url).includes('redis')?Response.json({result:1}):Response.json({accepted:true});assert.equal((await submitForm(req(valid),'contact')).status,200);});
 }finally{globalThis.fetch=realFetch;for(const key of vars){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}}
});
