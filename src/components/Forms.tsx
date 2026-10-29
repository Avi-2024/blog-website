 'use client';
import Link from 'next/link';
import { useState } from 'react';
export function EditorialForm({kind,configured}:{kind:'contact'|'newsletter';configured:boolean}){const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
 return <form className="editorial-form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setStatus('');try{const response=await fetch(`/api/${kind}/`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:f.get('name'),email:f.get('email'),message:f.get('message'),consent:f.get('consent')==='on',website:f.get('website')})});const data=await response.json();setStatus(response.ok?(kind==='contact'?'Your message has been sent.':'Your subscription request has been accepted.'):data.error||'Unable to submit.');}catch{setStatus('Connection failed. Please try again.');}finally{setBusy(false);}}}>
 {kind==='contact'&&<label>Your name<input name="name" required maxLength={120} autoComplete="name"/></label>}
 <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
 {kind==='contact'&&<label>Message<textarea name="message" required minLength={10} maxLength={5000} rows={6}/></label>}
 <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <label className="consent"><input name="consent" type="checkbox" required/> {kind==='newsletter'?'I agree to receive ToolValueLab email updates.':'I agree that ToolValueLab may use these details to respond to my inquiry.'}</label>
 <p><Link href="/privacy-policy/">Privacy policy</Link></p>
 {!configured&&<p role="status">{kind==='contact'?'Message delivery':'Email subscriptions'} is currently unavailable. Please check back later.</p>}
 <button className="pill" disabled={busy||!configured}>{busy?'Sending…':kind==='contact'?'Send message':'Subscribe'}</button><p role="status" aria-live="polite">{status}</p></form>;
}
