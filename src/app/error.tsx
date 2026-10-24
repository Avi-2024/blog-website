'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <div className="container not-found"><h1>Unable to load this page</h1><p>The article service may be temporarily unavailable.</p><button onClick={reset}>Try again</button></div>;}
