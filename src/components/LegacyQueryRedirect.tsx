'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function LegacyQueryRedirect() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    const p = params.get('p');
    const pageId = params.get('page_id');
    if (s) {
      router.replace(`/search/?s=${encodeURIComponent(s.slice(0, 100))}`);
    } else if (p && /^\d+$/.test(p)) {
      window.location.replace(`/api/wp-redirect/?p=${encodeURIComponent(p)}`);
    } else if (pageId && /^\d+$/.test(pageId)) {
      window.location.replace(`/api/wp-redirect/?page_id=${encodeURIComponent(pageId)}`);
    }
  }, [router]);
  return null;
}
