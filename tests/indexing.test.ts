import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldBlockIndexing} from '../src/lib/indexing';
import robots from '../src/app/robots';
import {SITE_URL} from '../src/lib/site';

test('noindex defaults to safe blocked state when the setting is missing', () => {
  assert.equal(shouldBlockIndexing({}), true);
  assert.equal(shouldBlockIndexing({STAGING_NOINDEX:'true',VERCEL_ENV:'production'}), true);
});
test('only explicit production allow removes the global noindex', () => {
  assert.equal(shouldBlockIndexing({STAGING_NOINDEX:'false',VERCEL_ENV:'production'}), false);
  assert.equal(shouldBlockIndexing({STAGING_NOINDEX:'false',VERCEL_ENV:'preview'}), true);
});
test('robots disallows all pages in preview, even if global switch says false', () => {
  const oldStage=process.env.STAGING_NOINDEX,oldVercel=process.env.VERCEL_ENV;
  try {
    process.env.STAGING_NOINDEX='false';
    process.env.VERCEL_ENV='preview';
    const value=robots();
    assert.deepEqual(value.rules,[{userAgent:'*',disallow:'/'}]);
  } finally {
    if(oldStage===undefined)delete process.env.STAGING_NOINDEX;else process.env.STAGING_NOINDEX=oldStage;
    if(oldVercel===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldVercel;
  }
});
test('production robots permits public crawling with an apex-domain sitemap', () => {
  const oldStage=process.env.STAGING_NOINDEX,oldVercel=process.env.VERCEL_ENV;
  try {
    process.env.STAGING_NOINDEX='false';
    process.env.VERCEL_ENV='production';
    const value=robots();
    assert.deepEqual(value.rules,[{userAgent:'*',allow:'/',disallow:['/api/','/admin/','/preview/','/search/']}]);
    assert.equal(value.sitemap,`${SITE_URL}/sitemap.xml`);
  } finally {
    if(oldStage===undefined)delete process.env.STAGING_NOINDEX;else process.env.STAGING_NOINDEX=oldStage;
    if(oldVercel===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldVercel;
  }
});
