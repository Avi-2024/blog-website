import test from 'node:test';
import assert from 'node:assert/strict';
import {isReadOnlyPreview} from '../src/lib/preview-mode';

test('missing preview database enables only a read-only visual fallback',()=>{
 assert.equal(isReadOnlyPreview({VERCEL_ENV:'preview',DATABASE_URL:undefined}),true);
 assert.equal(isReadOnlyPreview({VERCEL_ENV:'preview',DATABASE_URL:'   '}),true);
 assert.equal(isReadOnlyPreview({VERCEL_ENV:'production',DATABASE_URL:undefined}),false);
 assert.equal(isReadOnlyPreview({VERCEL_ENV:'development',DATABASE_URL:undefined}),false);
 assert.equal(isReadOnlyPreview({VERCEL_ENV:'preview',DATABASE_URL:'postgresql://database.example/db'}),false);
});
