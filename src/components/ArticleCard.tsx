import Link from 'next/link';
import Image from 'next/image';
import type { WPPost } from '@/lib/content';
import { categoriesOf, cover, postPath } from '@/lib/content';
import { stripHtml } from '@/lib/editorial';
import { PostMeta } from './PostMeta';
export function ArticleCard({post,priority=false}:{post:WPPost;priority?:boolean}) {
  const image = cover(post); const title = stripHtml(post.title.rendered);
  return <article className="article-card">
    {image && <Link className="article-image" href={postPath(post)} aria-label={title}><Image src={image.url} alt={image.alt} width={640} height={427} priority={priority} sizes="(max-width:640px) 92vw, 320px" /></Link>}
    <div className="article-summary">
      <div className="category-links">{categoriesOf(post).map(cat=><Link key={cat.id} href={`/category/${cat.slug}/`}>{stripHtml(cat.name)}</Link>)}</div>
      <h2><Link href={postPath(post)}>{title}</Link></h2>
      <PostMeta post={post}/>
      <p>{stripHtml(post.excerpt.rendered)}</p>
    </div>
  </article>;
}
