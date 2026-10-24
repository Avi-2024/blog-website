import {notFound} from 'next/navigation';
import {getAllPosts} from '@/lib/content';
import {ArticleCard} from '@/components/ArticleCard';
import {Sidebar} from '@/components/Sidebar';
import {Pagination} from '@/components/Pagination';
import {SITE_URL} from '@/lib/site';
export async function generateMetadata({params}:{params:Promise<{segments:string[]}>}){const {segments}=await params;return {title:'Date archive',robots:{index:false,follow:true},alternates:{canonical:SITE_URL+'/'+segments.join('/')+'/'}};}
export default async function DateArchive({params}:{params:Promise<{segments:string[]}>}){
 const {segments}=await params;const match=segments.join('/').match(/^(\d{4})\/(\d{2})(?:\/(\d{2}))?(?:\/page\/(\d+))?$/);if(!match)notFound();
 const [,year,month,day,number]=match;const prefix=[year,month,day].filter(Boolean).join('-');const page=Number(number||1);const posts=(await getAllPosts()).filter(p=>p.date.startsWith(prefix));const total=Math.ceil(posts.length/8);if(!posts.length||!Number.isSafeInteger(page)||page<1||page>total)notFound();
 const base='/'+[year,month,day].filter(Boolean).join('/')+'/page/';
 return <div className="container content-layout"><div><h1 className="archive-title">{prefix}</h1>{posts.slice((page-1)*8,page*8).map(p=><ArticleCard key={p.id} post={p}/>)}<Pagination current={page} total={total} hasNext={page<total} base={base}/></div><Sidebar/></div>;
}
