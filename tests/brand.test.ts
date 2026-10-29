import test from 'node:test';
import assert from 'node:assert/strict';
import {SITE_NAME, SITE_URL, NAV_ITEMS, publicUrl} from '../src/lib/site';

test('new publication uses the ToolValueLab identity and valid canonical origin', () => {
  assert.equal(SITE_NAME, 'ToolValueLab');
  assert.ok(new URL(SITE_URL).hostname);
  assert.equal(publicUrl('/category/ai-tools/'), new URL('/category/ai-tools/', SITE_URL).toString());
  assert.ok(NAV_ITEMS.some(item => item.href === '/category/ai-tools/'));
  assert.ok(NAV_ITEMS.every(item => item.href.startsWith('/')));
});
