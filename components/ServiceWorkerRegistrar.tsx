'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const base = (process.env.NEXT_PUBLIC_BASE_PATH as string) || '';
      navigator.serviceWorker.register(base + '/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
