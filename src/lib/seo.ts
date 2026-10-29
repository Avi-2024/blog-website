import {getCategory,getTags,getUser} from './content';
import {cmsSettings} from './cms-settings';
import {isReadOnlyPreview} from './preview-mode';
import type { Metadata } from 'next';
import type { WPPost,WPPage,WPSEO,WPCategory } from './content';
import { stripHtml } from './editorial';
import { SITE_NAME,SITE_URL,SITE_DESCRIPTION } from './site';
import { cover,postPath,authorOf } from './content';
// Metadata comes from the live custom CMS published document.
// No imported snapshot can override newer editorial metadata.
export function isIndexable(post:WPPost|WPPage,canonical:string){const seo=post.nexilo_seo;return !seo?.robots?.includes('noindex')&&(!seo?.canonical||seo.canonical===canonical);}
function common(seo:WPSEO|undefined,title:string,url:string,description?:string):Metadata{

 return {title:{absolute:stripHtml(seo?.title||title)},description:seo?.description||description,alternates:{canonical:seo?.canonical||url},
 robots:process.env.STAGING_NOINDEX!=='false'?{index:false,follow:false}:{index:!seo?.robots?.includes('noindex'),follow:!seo?.robots?.includes('nofollow'),noarchive:seo?.robots?.includes('noarchive'),nosnippet:seo?.robots?.includes('nosnippet'),noimageindex:seo?.robots?.includes('noimageindex'),'max-snippet':-1,'max-video-preview':-1,'max-image-preview':'large'},
 openGraph:{title:stripHtml(seo?.ogTitle||seo?.title||title),description:seo?.ogDescription||seo?.description||description,url:seo?.canonical||url,siteName:SITE_NAME,images:seo?.ogImage?[{url:seo.ogImage}]:[]},
 twitter:{card:'summary_large_image',title:stripHtml(seo?.twitterTitle||seo?.ogTitle||title),description:seo?.twitterDescription||seo?.description||description,images:seo?.twitterImage?[seo.twitterImage]:seo?.ogImage?[seo.ogImage]:[]}};
}
export function postMetadata(post:WPPost):Metadata{const base=common(post.nexilo_seo,post.title.rendered,SITE_URL+postPath(post),stripHtml(post.excerpt.rendered));const image=post.nexilo_seo?.ogImage||cover(post)?.url;return {...base,openGraph:{...base.openGraph,type:'article',publishedTime:post.date_gmt+'Z',modifiedTime:post.modified_gmt+'Z',authors:[authorOf(post).name],images:image?[{url:image}]:[]}};}
export function pageMetadata(page:WPPage):Metadata{return common(page.nexilo_seo,page.title.rendered,SITE_URL+new URL(page.link).pathname);}
export const homeMetadata:Metadata={title:{absolute:'ToolValueLab | AI Tools, SaaS Reviews & Business Software'},description:SITE_DESCRIPTION,alternates:{canonical:SITE_URL+'/'},openGraph:{title:'ToolValueLab | AI Tools, SaaS Reviews & Business Software',description:SITE_DESCRIPTION,url:SITE_URL+'/',type:'website'}};

export async function homepageMetadata():Promise<Metadata>{if(isReadOnlyPreview())return {...homeMetadata,robots:{index:false,follow:false}};const settings=await cmsSettings();return settings?common(settings.homeSeo,SITE_NAME,SITE_URL+'/',SITE_DESCRIPTION):homeMetadata;}

export async function archiveMetadata(kind:'category'|'tag'|'author',slug:string,page=1):Promise<Metadata>{
 const record=kind==='category'?await getCategory(slug):kind==='tag'?(await getTags()).find(t=>decodeURIComponent(t.slug)===decodeURIComponent(slug)):await getUser(slug);
 const path=`/${kind}/${slug}/${page>1?'page/'+page+'/':''}`;const suffix=page>1?' — Page '+page:'';if(!record)return {title:'Not found',robots:{index:false,follow:false}};const baseTitle=stripHtml(record.name);const title=baseTitle+suffix;
 if(kind==='author')return {title,robots:{index:false,follow:process.env.STAGING_NOINDEX==='false'},alternates:{canonical:SITE_URL+path}};
 const seo=(record as WPCategory).nexilo_seo;
 const metadata=common(seo,title+' - '+SITE_NAME,SITE_URL+path);
 if(page>1){metadata.title={absolute:stripHtml(seo?.title||baseTitle)+' — Page '+page};metadata.alternates={canonical:SITE_URL+path};}
 if(!record||(kind==='tag'&&!seo?.robots)||('count' in record&&!record.count))metadata.robots={index:false,follow:process.env.STAGING_NOINDEX==='false'};
 return metadata;
}
