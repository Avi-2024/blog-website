import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const WP_HOST = 'nexilolabs.com';
const WP_USER = 'wpusername9227';
const WP_APP_PASS = 'H3Cp 8FvZ PSDX o78G JIlj V34h';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');

export async function publishArticleToWordPress(jsonFilePath, status = 'publish') {
  const fullPath = path.resolve(jsonFilePath);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  const categoryMap = {
    'ai-tools': 24,
    'business-software': 26,
    'career-digital-skills': 25,
    'smartphones-apps': 27
  };

  const wpCategories = (data.categorySlugs || []).map(slug => categoryMap[slug] || 24);
  if (wpCategories.length === 0) wpCategories.push(24);

  const payload = JSON.stringify({
    title: data.title,
    slug: data.slug,
    content: data.html,
    excerpt: data.excerpt,
    status: status,
    categories: wpCategories
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: WP_HOST,
      path: '/wp-json/wp/v2/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER,
        'User-Agent': 'Antigravity-Publisher/1.0',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
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

if (process.argv[1]?.endsWith('publish-to-wordpress.mjs') && process.argv[2]) {
  publishArticleToWordPress(process.argv[2], process.argv[3] || 'publish')
    .then(r => console.log('Successfully published to WordPress:', r))
    .catch(e => { console.error('Failed to publish to WordPress:', e); process.exit(1); });
}
