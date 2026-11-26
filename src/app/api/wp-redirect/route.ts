import {NextResponse} from 'next/server';
import {getAllPosts,getPages} from '@/lib/content';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  const url=new URL(req.url);
  const p=url.searchParams.get('p');
  const pageId=url.searchParams.get('page_id');
  const id=Number(p||pageId);
  if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Not found'},{status:404});
  const items=p?await getAllPosts():await getPages();
  const item=items.find(x=>x.id===id);
  if(!item)return NextResponse.json({error:'Not found'},{status:404});
  return NextResponse.redirect(new URL(new URL(item.link).pathname,url.origin),308);
}
