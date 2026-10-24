import Link from 'next/link';
import { authorOf, type WPPost } from '@/lib/content';
import { publishedDate } from '@/lib/editorial';
import { ClockIcon } from './Icons';

export function PostMeta({ post }: { post: WPPost }) {
  const author = authorOf(post);
  return <div className="byline">
    <Link href={`/author/${author.slug}/`}>{author.name}</Link>
    <time className="post-date" dateTime={`${post.date_gmt}Z`}>
      <ClockIcon />{publishedDate(post.date)}
    </time>
  </div>;
}
