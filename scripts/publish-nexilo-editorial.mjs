import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

async function pingGoogleIndexing(url) {
  try {
    const token = await getGoogleToken();
    if (!token) return;
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });
    console.log(`[Google Indexing API] ${url} -> HTTP ${res.status}`);
  } catch (e) {
    console.warn(`[Google Indexing API Warning] ${e.message}`);
  }
}

async function findExistingWpPost(slug) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: WP_HOST,
      path: `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any`,
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER,
        'User-Agent': 'Nexilo-Publisher/1.0'
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const posts = JSON.parse(body);
          if (Array.isArray(posts) && posts.length > 0) {
            resolve(posts[0].id);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

export async function publishNexiloArticle(jsonFilePath) {
  const fullPath = path.resolve(jsonFilePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const existingId = await findExistingWpPost(data.slug);

  const wpCategories = (data.categorySlugs || []).map(s => categoryMap[s] || 24);
  if (wpCategories.length === 0) wpCategories.push(24);

  const payload = JSON.stringify({
    title: data.title,
    slug: data.slug,
    content: data.html || data.content,
    excerpt: data.excerpt,
    status: 'publish',
    categories: wpCategories
  });

  const apiPath = existingId ? `/wp-json/wp/v2/posts/${existingId}` : '/wp-json/wp/v2/posts';
  console.log(`[NexiloLabs] ${existingId ? `Updating Post ID ${existingId}` : 'Creating New Post'} for slug: ${data.slug}`);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: WP_HOST,
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER,
        'User-Agent': 'Nexilo-Publisher/1.0',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', async () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[NexiloLabs] Successfully published: ${json.link}`);
            await pingGoogleIndexing(json.link);
            resolve({ success: true, id: json.id, link: json.link, status: json.status });
          } else {
            reject(new Error(`WP API Error ${res.statusCode}: ${json.message || body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

if (process.argv[1]?.endsWith('publish-nexilo-editorial.mjs') && process.argv[2]) {
  publishNexiloArticle(process.argv[2])
    .then(r => console.log('Publish result:', r))
    .catch(e => { console.error('Error:', e); process.exit(1); });
}
