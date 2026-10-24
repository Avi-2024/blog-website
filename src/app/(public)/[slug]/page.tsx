import {LatestFeed} from '@/components/LatestFeed';

import {cache} from 'react';import {notFound,permanentRedirect} from 'next/navigation';import type {Metadata} from 'next';import {getPage,getPostBySlug,assertPublic,resolveRedirect} from '@/lib/content';import {stripHtml} from '@/lib/editorial';import {postMetadata,pageMetadata} from '@/lib/seo';import {EditorialBody} from '@/components/EditorialBody';import {EditorialForm} from '@/components/Forms';import {ArticleView} from '@/components/ArticleView';
const resolve=cache(async(slug:string)=>{const [page,post]=await Promise.all([getPage(slug),getPostBySlug(slug)]);const item=page||post;if(!item)return null;if(!await assertPublic(item.id))return null;return {page,post};});
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const data=await resolve(slug);return data?.page?pageMetadata(data.page):data?.post?postMetadata(data.post):{title:'Not found',robots:{index:false}};}
export default async function Content({params}:Props){const {slug}=await params;const data=await resolve(slug);if(!data){const path=await resolveRedirect(slug);if(path)permanentRedirect(path);notFound();}
if(data.page){const page=data.page;if(slug==='blog')return <LatestFeed title={stripHtml(page.title.rendered)}/>;if(slug==='contact-page')return <div className="container form-page"><h1>Contact us</h1><h2>Get in touch</h2><EditorialForm kind="contact" configured={Boolean(process.env.CONTACT_ENDPOINT_URL&&process.env.CONTACT_ENDPOINT_TOKEN)}/></div>;
return <article className={`cms-page cms-${slug}`}><h1 className={slug==='about-us'?'sr-only':'container'}>{stripHtml(page.title.rendered)}</h1><EditorialBody html={page.content.rendered}/></article>;}
return <ArticleView post={data.post!}/>;}
