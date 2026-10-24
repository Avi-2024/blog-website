import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {mac,verifyRequest,parseEvent,previewToken,localPath,equal,readLimited} from '../src/lib/security';
const key='test-only-key-'.repeat(4),now=Date.now(),timestamp=String(Math.floor(now/1000));
const event={id:randomUUID(),type:'content.changed',postId:42,paths:['/article/','/category/ai-tools/'],occurredAt:new Date(now).toISOString()};
const raw=JSON.stringify(event);
function headers(body=raw,ts=timestamp){const nonce=randomUUID();return new Headers({'x-nexilo-timestamp':ts,'x-nexilo-nonce':nonce,'x-nexilo-signature':mac(`${ts}.${nonce}.${body}`,key)});}
test('accepts authentic signed body',()=>assert.ok(verifyRequest(raw,headers(),key,now).nonce));
test('rejects tampering',()=>assert.throws(()=>verifyRequest(raw+' ',headers(),key,now)));
test('rejects expired timestamp',()=>assert.throws(()=>verifyRequest(raw,headers(raw,String(Number(timestamp)-301)),key,now)));
test('rejects future timestamp',()=>assert.throws(()=>verifyRequest(raw,headers(raw,String(Number(timestamp)+301)),key,now)));
test('rejects missing signature',()=>assert.throws(()=>verifyRequest(raw,new Headers(),key,now)));
test('rejects another signing key',()=>assert.throws(()=>verifyRequest(raw,headers(),'other',now)));
test('event schema accepts valid content invalidation',()=>assert.deepEqual(parseEvent(raw),event));
test('rejects unbounded path arrays',()=>assert.throws(()=>parseEvent(JSON.stringify({...event,paths:Array(101).fill('/')}))));
test('rejects redirect and traversal paths',()=>{for(const path of ['//evil.com/','/\\evil.com/','/a/../x/','/%2e%2e/','/%2f%2fevil.com','/x?secret=1','/x#y','https://evil.com','/%zz'])assert.equal(localPath(path),false,path);});
test('supports Unicode and encoded legacy paths',()=>{for(const path of ['/हिन्दी/','/dall%c2%b7e/','/bilibili-%e2%82%b960/'])assert.equal(localPath(path),true);});
test('comparison handles differing UTF-8 byte lengths',()=>{assert.equal(equal('é','a'),false);assert.equal(equal('abc','abc'),true);});
function token(exp:number){const payload=Buffer.from(JSON.stringify({postId:42,userId:3,exp,nonce:randomUUID()})).toString('base64url');return payload+'.'+mac(payload,key);}
test('preview validates authorized signed claims',()=>assert.equal(previewToken(token(Math.floor(Date.now()/1000)+300),key).postId,42));
test('preview rejects expired token',()=>assert.throws(()=>previewToken(token(Math.floor(Date.now()/1000)-1),key)));
test('preview rejects excessive lifetime',()=>assert.throws(()=>previewToken(token(Math.floor(Date.now()/1000)+1000),key)));
test('preview rejects token substitution',()=>assert.throws(()=>previewToken(token(Math.floor(Date.now()/1000)+300)+'x',key)));
test('request reader enforces streaming size limit',async()=>{const req=new Request('https://example.org',{method:'POST',body:'a'.repeat(100)});await assert.rejects(readLimited(req,20));});
