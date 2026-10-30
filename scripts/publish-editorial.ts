/**
 * Trusted server-side CMS publisher for a reviewed editorial JSON file.
 * Usage: node --conditions=react-server --import tsx scripts/publish-editorial.ts editorial/<slug>.json [--dry-run]
 * Requires production DATABASE_URL in the environment. Never expose it in logs or source.
 * Idempotent: existing published slug is returned; drafts are never overwritten.
 */
import 'server-only';
import {readFile,access} from 'node:fs/promises';
import {resolve,relative,sep,join} from 'node:path';
import {query,closeDB} from '../src/lib/cms/db';
import {createPost,editPost} from '../src/lib/cms/posts';
import {documentSchema,type User} from '../src/lib/cms/model';

type Source={
 title:string;slug:string;excerpt:string;html:string;imageFile:string;imageAlt:string;
 categorySlugs:string[];seo:Record<string,unknown>;
};

async function main(){
 if(!process.env.DATABASE_URL?.startsWith('postgresql://'))throw Error('Production PostgreSQL DATABASE_URL required');
 const filename=process.argv[2],dryRun=process.argv.includes('--dry-run');
 if(!filename||!/^editorial\/[a-z0-9-]+\.json$/.test(filename))throw Error('Provide a reviewed editorial/<slug>.json file');
 const source=JSON.parse(await readFile(resolve(filename),'utf8')) as Source;
 if(!source.slug||filename!==`editorial/${source.slug}.json`)throw Error('Slug and editorial filename disagree');
 if(!/^featured\/[a-z0-9-]+\.svg$/.test(source.imageFile))throw Error('Expected an original approved featured SVG');
 const image='/'+source.imageFile;
 const asset=resolve(join('public',source.imageFile));
 if(relative(resolve('public'),asset).startsWith('..'+sep))throw Error('Invalid media path');
 await access(asset);
 if(!source.imageAlt?.trim()||!source.html?.includes('<h2>'))throw Error('Article content or image alt missing');
 const base='https://toolvaluelab.com';
 const document=documentSchema.parse({
  title:source.title,slug:source.slug,excerpt:source.excerpt,html:source.html,
  featuredImage:image,imageAlt:source.imageAlt,categories:[],tags:[],
  seo:{...source.seo,canonical:`${base}/${source.slug}/`,ogImage:base+image,twitterImage:base+image,robots:[]}
 });
 const existing=(await query<{id:number;status:string}>(
  "SELECT id,status FROM cms_posts WHERE document->>'slug'=$1 OR published_document->>'slug'=$1 LIMIT 1",
  [document.slug]
 )).rows[0];
 if(existing){
  if(existing.status!=='published')throw Error(`Existing draft or scheduled post #${existing.id}; no overwrite`);
  console.log(JSON.stringify({result:'already_published',id:existing.id,slug:document.slug}));
  return;
 }
 const author=(await query<User>(
  "SELECT id,email,name,slug,role,description FROM cms_users WHERE NOT disabled AND role IN ('owner','editor','author') ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END,id LIMIT 1"
 )).rows[0];
 if(!author)throw Error('No authorized CMS author available');
 const terms=(await query<{id:number;slug:string}>(
  "SELECT id,slug FROM cms_terms WHERE kind='category' AND slug=ANY($1::text[])",
  [source.categorySlugs]
 )).rows;
 if(terms.length!==new Set(source.categorySlugs).size)throw Error('Missing editorial categories');
 document.categories=terms.map(t=>t.id);
 if(dryRun){console.log(JSON.stringify({result:'validated',slug:document.slug,authorRole:author.role,categories:source.categorySlugs,image}));return;}
 const created=await createPost(author,'post',document);
 const published=await editPost(author,created.id,created.version,document,'publish');
 if(published.status!=='published')throw Error('CMS did not confirm published state');
 console.log(JSON.stringify({result:'published',id:published.id,slug:document.slug,status:published.status,image}));
}
main().catch(e=>{console.error('Editorial publication failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1;}).finally(closeDB);
