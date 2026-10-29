import {homepageMetadata} from '@/lib/seo';
import {redirect,permanentRedirect,notFound} from 'next/navigation';
import {getAllPosts,getPages} from '@/lib/content';
import {LatestFeed} from '@/components/LatestFeed';

export const generateMetadata=homepageMetadata;
export default async function Home({searchParams}:{searchParams:Promise<{s?:string;p?:string;page_id?:string}>}){
  const {s,p,page_id}=await searchParams;
  if(s)redirect(`/search/?s=${encodeURIComponent(s.slice(0,100))}`);
  if(p||page_id){
    const id=Number(p||page_id);
    if(!Number.isSafeInteger(id)||id<1)notFound();
    const items=p?await getAllPosts():await getPages();
    const item=items.find(x=>x.id===id);
    if(!item)notFound();
    permanentRedirect(new URL(item.link).pathname);
  }
  return <LatestFeed/>;
}
