import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const WP_HOST = 'nexilolabs.com';
const WP_USER = 'wpusername9227';
const WP_APP_PASS = 'H3Cp 8FvZ PSDX o78G JIlj V34h';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');

const categoryMap = {
  'ai-tools': 24,
  'business-software': 26,
  'career-digital-skills': 25,
  'smartphones-apps': 27
};

function base64Url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

async function getGoogleToken() {
  const keyPath = 'C:/Users/abis3/Downloads/gen-lang-client-0133457856-7352fb77f4c9.json';
  if (!fs.existsSync(keyPath)) return null;
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const toSign = base64Url(header) + '.' + base64Url(payload);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(toSign);
  const signature = sign.sign(key.private_key, 'base64url');
  const jwt = toSign + '.' + signature;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const data = await res.json();
  return data.access_token;
}

export async function pingGoogleIndexing(url) {
  try {
    const token = await getGoogleToken();
    if (!token) return { status: 0, ok: false };
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });
    console.log(`[Google Indexing API] ${url} -> HTTP ${res.status}`);
    return { status: res.status, ok: res.ok };
  } catch (e) {
    console.warn(`[Google Indexing API Warning] ${e.message}`);
    return { status: 0, ok: false, error: e.message };
  }
}

function wpRequest(method, reqPath, bodyObj = null) {
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = {
      'Authorization': AUTH_HEADER,
      'User-Agent': 'Nexilo-Publisher/1.0'
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request({
      hostname: WP_HOST,
      path: reqPath,
      method,
      headers
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function flushRankMathSitemapCache() {
  try {
    const res = await wpRequest('POST', '/wp-json/rankmath/v1/updateSettings', {
      type: 'sitemap',
      settings: { items_per_page: '200' },
      fieldTypes: { items_per_page: 'text' },
      updated: ['items_per_page'],
      isReset: false
    });
    console.log(`[Rank Math Sitemap Cache] Flushed -> HTTP ${res.status}`);
  } catch (e) {
    console.warn('[Rank Math Sitemap Cache Warning]', e.message);
  }
}

async function findExistingWpPost(slug) {
  try {
    const res = await wpRequest('GET', `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any`);
    const posts = JSON.parse(res.body);
    if (Array.isArray(posts) && posts.length > 0) {
      return posts[0].id;
    }
  } catch {
    // ignore
  }
  return null;
}

async function findExistingWpMedia(slugBase) {
  try {
    const res = await wpRequest('GET', `/wp-json/wp/v2/media?slug=${encodeURIComponent(slugBase)}&per_page=5`);
    const items = JSON.parse(res.body);
    if (Array.isArray(items) && items.length > 0) {
      return items[0].id;
    }
  } catch {
    // ignore
  }
  return null;
}

function wpUploadBinary(filename, mimeType, buffer) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: WP_HOST,
      path: '/wp-json/wp/v2/media',
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'User-Agent': 'Nexilo-Publisher/1.0',
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

export async function uploadWpMedia(imagePath, title, altText) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const resolved = path.isAbsolute(imagePath) ? imagePath : path.resolve(repoRoot, imagePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`[NexiloLabs Media Warning] Image not found: ${resolved}`);
    return null;
  }

  const filename = path.basename(resolved);
  const slugBase = path.basename(filename, path.extname(filename)).toLowerCase();
  const existingMediaId = await findExistingWpMedia(slugBase);
  if (existingMediaId) {
    console.log(`[NexiloLabs Media] Reusing existing media ID ${existingMediaId} for ${filename}`);
    return existingMediaId;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg'
    ? 'image/jpeg'
    : ext === '.webp'
      ? 'image/webp'
      : 'image/png';

  const buffer = fs.readFileSync(resolved);
  const res = await wpUploadBinary(filename, mimeType, buffer);
  const media = JSON.parse(res.body);
  if (res.status < 200 || res.status >= 300 || !media?.id) {
    console.warn(`[NexiloLabs Media Warning] Upload failed HTTP ${res.status}: ${media?.message || res.body}`);
    return null;
  }

  try {
    await wpRequest('POST', `/wp-json/wp/v2/media/${media.id}`, {
      title: title || slugBase,
      alt_text: altText || title || slugBase
    });
  } catch (e) {
    console.warn(`[NexiloLabs Media Alt Warning] ${e.message}`);
  }
  console.log(`[NexiloLabs Media] Uploaded ${filename} -> ID ${media.id}`);
  return media.id;
}

async function setRankMathFocusKeyword(postId, focusKeyword) {
  if (!postId || !focusKeyword) return;
  try {
    const res = await wpRequest('POST', '/wp-json/rankmath/v1/updateMeta', {
      objectType: 'post',
      objectID: postId,
      meta: {
        rank_math_focus_keyword: focusKeyword
      }
    });
    console.log(`[Rank Math Meta] Post ${postId} focusKeyword="${focusKeyword}" -> HTTP ${res.status}`);
  } catch (e) {
    console.warn(`[Rank Math Meta Warning] ${e.message}`);
  }
}

export async function publishNexiloArticle(jsonFilePath) {
  const fullPath = path.resolve(jsonFilePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const htmlContent = data.html || data.content;
  if (!htmlContent || !data.title || !data.slug) {
    return { skipped: true, reason: 'Missing title, slug, or html content', slug: data.slug };
  }

  const existingId = await findExistingWpPost(data.slug);
  let featuredMediaId = data.featuredMediaId || null;
  if (!featuredMediaId && data.imagePath) {
    featuredMediaId = await uploadWpMedia(data.imagePath, data.title, data.excerpt || data.title);
  }

  const wpCategories = (data.categorySlugs || []).map(s => categoryMap[s] || 24);
  if (wpCategories.length === 0) wpCategories.push(24);

  const apiPath = existingId ? `/wp-json/wp/v2/posts/${existingId}` : '/wp-json/wp/v2/posts';
  console.log(`[NexiloLabs] ${existingId ? `Updating Post ID ${existingId}` : 'Creating New Post'} for slug: ${data.slug}`);

  const postPayload = {
    title: data.title,
    slug: data.slug,
    content: htmlContent,
    excerpt: data.excerpt || '',
    status: 'publish',
    categories: wpCategories
  };
  if (featuredMediaId) {
    postPayload.featured_media = featuredMediaId;
  }

  const res = await wpRequest('POST', apiPath, postPayload);

  const json = JSON.parse(res.body);
  if (res.status >= 200 && res.status < 300) {
    console.log(`[NexiloLabs] Successfully published: ${json.link}`);
    if (data.focusKeyword) {
      await setRankMathFocusKeyword(json.id, data.focusKeyword);
    }
    await flushRankMathSitemapCache();
    await pingGoogleIndexing(json.link);
    return { success: true, id: json.id, link: json.link, status: json.status, featuredMediaId };
  }
  throw new Error(`WP API Error ${res.status}: ${json.message || res.body}`);
}

if (process.argv[1]?.endsWith('publish-nexilo-editorial.mjs') && process.argv[2]) {
  publishNexiloArticle(process.argv[2])
    .then(r => console.log('Publish result:', r))
    .catch(e => { console.error('Error:', e); process.exit(1); });
}
