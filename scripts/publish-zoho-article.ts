/**
 * One-time, operator-approved CMS publication of the existing Zoho news article.
 * This script never runs in CI or as part of next build, and does not create API
 * endpoints, credentials, or users. Run it from an authorized local environment
 * with the existing Neon DATABASE_URL. Without --publish it is read-only.
 */
import 'server-only';
import {readFile,access} from 'node:fs/promises';
import {query,closeDB} from '../src/lib/cms/db';
import {createPost,editPost} from '../src/lib/cms/posts';
import type {User} from '../src/lib/cms/model';

type Source={
 title:string;slug:string;excerpt:string;html:string;imageFile:string;
 imageAlt:string;categorySlugs:string[];
 seo:{title:string;description:string;canonical:string;ogTitle:string;ogDescription:string;ogImage:string;twitterTitle:string;twitterDescription:string;twitterImage:string;robots:string[]};
};
const slug='zoho-analytics-2026-ai-agents-update';
const canonical='https://toolvaluelab.com';
async function publish() {
 const doPublish=process.argv.includes('--publish');
 if(!process.env.DATABASE_URL?.startsWith('postgresql://'))
   throw new Error('Set a valid DATABASE_URL locally; it is never read from GitHub');
 if(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'')!==canonical)
   throw new Error('NEXT_PUBLIC_SITE_URL must be the canonical production domain');
 const doc=JSON.parse(await readFile('editorial/zoho-analytics-agentic-ai-2026.json','utf8')) as Source;
 if(doc.slug!==slug)throw new Error('Unexpected article slug');
 const image='/'+doc.imageFile.replace(/^\/+/, '');
 if(image!=='/featured/zoho-analytics-agentic-ai-2026.svg')throw new Error('Unexpected featured image');
 await access('public'+image);
 const existing=(await query<{id:number;status:string}>(
   `SELECT id,status FROM cms_posts WHERE document->>'slug'=$1 OR published_document->>'slug'=$1 LIMIT 1`,[slug])).rows[0];
 if(existing){
   console.log(JSON.stringify({result:existing.status==='published'?'already_published':'existing_nonpublished_article',id:existing.id,status:existing.status,slug}));
   if(existing.status!=='published')throw new Error('Article exists but is not published: review/publish it in /admin/ instead of overwriting');
   return;
 }
 const cat=(await query<{id:number;slug:string}>(
   `SELECT id,slug FROM cms_terms WHERE kind='category' AND slug=ANY($1::text[])`,[doc.categorySlugs])).rows;
 if(cat.length!==new Set(doc.categorySlugs).size)throw new Error('Missing required categories');
 const author=(await query<User>(
   `SELECT id,email,name,slug,role,description FROM cms_users WHERE NOT disabled ORDER BY CASE WHEN role='owner' THEN 0 WHEN role='editor' THEN 1 ELSE 2 END,id LIMIT 1`)).rows[0];
 if(!author)throw new Error('An active CMS user is required. Configure one with the existing cms:user command first');
 const record={
   title:doc.title,slug:doc.slug,html:doc.html,excerpt:doc.excerpt,
   featuredImage:image,imageAlt:doc.imageAlt,categories:cat.map(x=>x.id),tags:[],
   seo:{...doc.seo,canonical:`${canonical}/${slug}/`,ogImage:canonical+image,twitterImage:canonical+image}
 };
 if(!doPublish){
   console.log(JSON.stringify({result:'ready_for_manual_publish',slug,author:author.name,categories:cat.map(x=>x.slug),image,command:'npm run article:publish:zoho -- --publish'}));
   return;
 }
 const draft=await createPost(author,'post',record);
 const result=await editPost(author,draft.id,draft.version,record,'publish');
 if(result.status!=='published')throw new Error('CMS did not confirm publication');
 console.log(JSON.stringify({result:'published',postId:result.id,slug,image,canonical:`${canonical}/${slug}/`}));
}
publish().catch(e=>{
 console.error('Publication failed:',e instanceof Error?e.message:'unknown failure');
 process.exitCode=1;
}).finally(()=>closeDB());
