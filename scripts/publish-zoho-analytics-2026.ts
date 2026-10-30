/**
 * One-time, idempotent CMS publication for the Zoho Analytics 2026 news article.
 *
 * Run only with a production DATABASE_URL supplied through the environment:
 *   node --env-file=.env.production.local --conditions=react-server --import tsx scripts/publish-zoho-analytics-2026.ts
 *
 * Does not read secrets from GitHub, and does not require a public import endpoint.
 * Preserves the existing production database and never overwrites another post.
 */
import 'server-only';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {query,closeDB} from '../src/lib/cms/db';
import {createPost,editPost} from '../src/lib/cms/posts';
import type {User} from '../src/lib/cms/model';

type ArticleSource={
 title:string;slug:string;excerpt:string;html:string;imageFile:string;imageAlt:string;
 categorySlugs:string[];seo:Record<string,unknown>;
};
async function main(){
 if(!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL||''))throw new Error('Real PostgreSQL DATABASE_URL required; local fallback refused');
 if((process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'')!=='https://toolvaluelab.com')throw new Error('The production canonical origin must be https://toolvaluelab.com');
 const source=JSON.parse(await readFile(path.join(process.cwd(),'editorial/zoho-analytics-agentic-ai-2026.json'),'utf8')) as ArticleSource;
 const image='/'+source.imageFile.replace(/^\/+/, '');
 if(source.slug!=='zoho-analytics-2026-ai-agents-update')throw new Error('Wrong article source');
 await access(path.join(process.cwd(),'public',image));
 const existing=(await query<{id:number;status:string}>(`SELECT id,status FROM cms_posts WHERE document->>'slug'=$1 OR published_document->>'slug'=$1 LIMIT 1`,[source.slug])).rows[0];
 if(existing){
   if(existing.status!=='published')throw new Error(`Post #${existing.id} already exists as ${existing.status}; publish it in the admin rather than overwriting it.`);
   console.log(JSON.stringify({result:'already_published',id:existing.id,slug:source.slug}));
   return;
 }
 const author=(await query<User>(`SELECT id,email,name,slug,role,description FROM cms_users WHERE NOT disabled ORDER BY CASE WHEN role='owner' THEN 0 WHEN role='editor' THEN 1 ELSE 2 END,id LIMIT 1`)).rows[0];
 if(!author)throw new Error('Create an authorized CMS editor first with npm run cms:user');
 const rows=(await query<{id:number;slug:string}>(`SELECT id,slug FROM cms_terms WHERE kind='category' AND slug=ANY($1::text[])`,[source.categorySlugs])).rows;
 if(rows.length!==new Set(source.categorySlugs).size)throw new Error('Required editorial categories are missing.');
 const base=(process.env.NEXT_PUBLIC_SITE_URL||'https://toolvaluelab.com').replace(/\/$/,'');
 const document={
   title:source.title,slug:source.slug,excerpt:source.excerpt,html:source.html,
   featuredImage:image,imageAlt:source.imageAlt,
   categories:rows.map(r=>r.id),tags:[],
   seo:{...source.seo,canonical:`${base}/${source.slug}/`,ogImage:base+image,twitterImage:base+image},
 };
 const created=await createPost(author,'post',document);
 const published=await editPost(author,created.id,created.version,document,'publish');
 if(published.status!=='published')throw new Error('Unexpected publication state');
 console.log(JSON.stringify({result:'published',id:published.id,slug:source.slug,status:published.status,featuredImage:image}));
}
main().catch(err=>{console.error('Zoho article publication failed:',err instanceof Error?err.message:'Unknown error');process.exitCode=1;}).finally(closeDB);
