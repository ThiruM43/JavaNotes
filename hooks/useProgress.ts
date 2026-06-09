'use client';
import { useState, useEffect, useCallback } from 'react';
import { getProgress, setProgress, ProgressStatus, ProgressMap } from '@/lib/storage';

export function useProgress(slug?: string) {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  useEffect(() => {
    setProgressMap(getProgress());
  }, []);

  const setStatus = useCallback((s: string, status: ProgressStatus) => {
    setProgress(s, status);
    setProgressMap(getProgress());
  }, []);

  const status: ProgressStatus = slug ? (progressMap[slug]?.status ?? 'unread') : 'unread';

  const stats = {
    total: 0,
    done: 0,
    reading: 0,
    unread: 0,
  };
  Object.values(progressMap).forEach((p) => {
    stats.total++;
    stats[p.status]++;
  });

  return { status, progressMap, setStatus, stats };
}
