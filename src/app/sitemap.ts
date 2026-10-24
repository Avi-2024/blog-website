import {connection} from 'next/server';
import type { MetadataRoute } from 'next';
import { getAllPosts,getPages,getCategories } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { isIndexable } from '@/lib/seo';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 await connection();
 const [posts,pages,cats]=await Promise.all([getAllPosts(),getPages(),getCategories()]);
 return [
  {url:`${SITE_URL}/`,changeFrequency:'daily',priority:1},
  ...posts.filter(p=>isIndexable(p,`${SITE_URL}${new URL(p.link).pathname}`)).map(p=>({url:`${SITE_URL}${new URL(p.link).pathname}`,lastModified:new Date(p.modified_gmt?p.modified_gmt+'Z':p.modified+'+05:30'),changeFrequency:'weekly' as const,priority:0.8})),
  ...pages.filter(p=>isIndexable(p,`${SITE_URL}${new URL(p.link).pathname}`)).map(p=>({url:`${SITE_URL}${new URL(p.link).pathname}`,lastModified:new Date(p.modified_gmt?p.modified_gmt+'Z':p.modified+'+05:30'),changeFrequency:'monthly' as const,priority:0.5})),
  ...cats.filter(x=>x.count>0&&!x.nexilo_seo?.robots?.includes('noindex')&&(!x.nexilo_seo?.canonical||x.nexilo_seo.canonical===`${SITE_URL}/category/${x.slug}/`)).map(c=>({url:`${SITE_URL}/category/${c.slug}/`,changeFrequency:'weekly' as const,priority:0.5})),
  // If source WordPress marks any URL noindex, exclude it before production release.
 ];
}
