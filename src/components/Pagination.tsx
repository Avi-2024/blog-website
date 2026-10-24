import Link from 'next/link';
export function Pagination({current,hasNext,base='/page/',total}:{current:number;hasNext:boolean;base?:string;total?:number}){
 const root=base==='/page/'?'/':base.replace(/page\/$/,'');const href=(n:number)=>n===1?root:`${base}${n}/`;
 return <nav className="pagination" data-variant={base==='/page/'?'home':'archive'} aria-label="Article pages">{current>1&&<Link href={href(current-1)} aria-label="Previous page">←</Link>}
 {total?Array.from({length:total},(_,i)=>i+1).filter(n=>n===1||n===total||Math.abs(n-current)<=2).map(n=><Link key={n} href={href(n)} aria-current={n===current?'page':undefined}>{n}</Link>):<span>Page {current}</span>}
 {hasNext&&<Link href={href(current+1)} aria-label="Next page">→</Link>}</nav>;
}
