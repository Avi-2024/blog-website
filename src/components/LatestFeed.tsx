import Link from 'next/link';
import {ArticleCard} from './ArticleCard';
import {Sidebar} from './Sidebar';
import {Pagination} from './Pagination';
import {getAllPosts} from '@/lib/content';
import {NAV_ITEMS} from '@/lib/site';

export async function LatestFeed({title='Latest ToolValueLab articles'}:{title?:string}){
  const posts=await getAllPosts();
  return <div className="container content-layout">
    <div>
      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-hero-eyebrow">AI TOOLS · SAAS · BUSINESS SOFTWARE</p>
        <h1 id="home-title">{title==='Latest ToolValueLab articles'?'Find tools worth your time and money.':title}</h1>
        <p>Practical guides, side-by-side comparisons and clear explanations to help you choose software with confidence.</p>
        <nav className="home-topic-links" aria-label="Browse topics">{NAV_ITEMS.slice(1).map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      </section>
      <h2 className="home-section-heading">Latest guides and comparisons</h2>
      {posts.length===0&&<p className="cms-empty-public">Our first in-depth guides are being prepared. Explore the topics above, and check back for new articles.</p>}
      {posts.slice(0,8).map((p,i)=><ArticleCard key={p.id} post={p} priority={i===0}/>)}
      <Pagination current={1} hasNext={posts.length>8} total={Math.ceil(posts.length/8)}/>
    </div>
    <Sidebar/>
  </div>;
}
