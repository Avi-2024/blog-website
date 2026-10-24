import { notFound } from 'next/navigation';
import { ArticleCard } from './ArticleCard';import { Sidebar } from './Sidebar';import { Pagination } from './Pagination';
import { getAllPosts,getCategory,getTags,getUser } from '@/lib/content';import { stripHtml } from '@/lib/editorial';
export async function Archive({kind,slug,page=1}:{kind:'category'|'tag'|'author';slug:string;page?:number}){
 if(!Number.isInteger(page)||page<1)notFound();const record=kind==='category'?await getCategory(slug):kind==='author'?await getUser(slug):(await getTags()).find(t=>decodeURIComponent(t.slug)===decodeURIComponent(slug));if(!record)notFound();
 const posts=(await getAllPosts()).filter(p=>kind==='author'?p.author===record.id:kind==='category'?p.categories.includes(record.id):p.tags.includes(record.id));const total=Math.ceil(posts.length/8);if(page>Math.max(total,1))notFound();
 return <div className="container content-layout"><div><h1 className="archive-title">{stripHtml(record.name)}</h1>{posts.slice((page-1)*8,page*8).map(p=><ArticleCard key={p.id} post={p}/>)}{!posts.length&&<p>No articles published here yet.</p>}<Pagination current={page} hasNext={page<total} total={total} base={`/${kind}/${slug}/page/`}/></div><Sidebar/></div>;
}
