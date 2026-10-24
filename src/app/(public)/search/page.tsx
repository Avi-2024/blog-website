import Link from 'next/link';
import { getAllPosts, postPath } from '@/lib/content';
import { stripHtml } from '@/lib/editorial';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Search',robots:{index:false,follow:true}};
export default async function Search({searchParams}:{searchParams:Promise<{s?:string;q?:string}>}){
 const query=String((await searchParams).s||(await searchParams).q||'').slice(0,100).trim();
 const posts=query?(await getAllPosts()).filter(p=>(stripHtml(p.title.rendered)+' '+stripHtml(p.content.rendered)).toLowerCase().includes(query.toLowerCase())):[];
 return <div className="container search-results"><h1>Search articles</h1><form action="/search/" method="GET"><label htmlFor="article-query">Enter keywords</label><input id="article-query" name="s" type="search" defaultValue={query} required/><button>Search</button></form>
 {query&&<p>{posts.length} result(s) for “{query}”</p>}
 {posts.map(p=><article key={p.id}><h2><Link href={postPath(p)}>{stripHtml(p.title.rendered)}</Link></h2><p>{stripHtml(p.excerpt.rendered)}</p></article>)}
 {query&&posts.length===0&&<p>No matching posts. Try a different search term.</p>}</div>;
}
