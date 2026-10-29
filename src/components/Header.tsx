 'use client';
import Link from 'next/link';import {useState,useRef} from 'react';import {usePathname} from 'next/navigation';import {NAV_ITEMS} from '@/lib/site';
import {MenuIcon} from './Icons';
export function Header({nav=NAV_ITEMS,announcement='Get Our Best Posts Delivered to Your Inbox.'}:{nav?:ReadonlyArray<{label:string;href:string}>;announcement?:string}){const [menu,setMenu]=useState(false),[search,setSearch]=useState(false);const searchButton=useRef<HTMLButtonElement>(null);const path=usePathname();return <>
 <div className="announcement"><div className="container"><span>{announcement} <Link href="/newsletter/">Subscribe Now.</Link></span></div></div>
 <header className="site-header" onKeyDown={e=>{if(e.key==='Escape'){setSearch(false);setMenu(false);searchButton.current?.focus();}}}><div className="container header-inner">
 <Link className="brand" href="/" aria-label="ToolValueLab homepage"><span className="brand-wordmark">Tool<span>Value</span>Lab</span></Link>
 <button type="button" className="menu-toggle" aria-label={menu?'Close navigation':'Open navigation'} aria-controls="primary-navigation" aria-expanded={menu} onClick={()=>setMenu(!menu)}><MenuIcon open={menu}/></button>
 <nav id="primary-navigation" className={menu?'navigation open':'navigation'} aria-label="Main navigation">{nav.map(x=><Link aria-current={path===x.href?'page':undefined} key={x.href} href={x.href} onClick={()=>setMenu(false)}>{x.label}</Link>)}</nav>
 <button ref={searchButton} type="button" className="search-toggle" aria-label={search?'Close search':'Open search'} aria-expanded={search} aria-controls="header-search" onClick={()=>setSearch(!search)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg></button>
 <Link className="pill header-subscribe" href="/newsletter/"><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg> Subscribe</Link></div>
 {search&&<form id="header-search" role="search" className="container header-search" action="/search/"><label htmlFor="site-search" className="sr-only">Search articles</label><input autoFocus id="site-search" type="search" name="s" placeholder="Type Here & Search..." maxLength={100} required/><button className="pill">Search</button></form>}
 </header></>;}
