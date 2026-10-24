import { cleanHtml } from '@/lib/editorial';
export function EditorialBody({html}:{html:string}) { return <div className="editorial-body" dangerouslySetInnerHTML={{__html:cleanHtml(html)}}/>; }
