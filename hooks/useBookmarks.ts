'use client';
import { useState, useEffect, useCallback } from 'react';
import { getBookmarks, toggleBookmark } from '@/lib/storage';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const toggle = useCallback((slug: string) => {
    toggleBookmark(slug);
    setBookmarks(getBookmarks());
  }, []);

  const isBookmarked = (slug: string) => bookmarks.includes(slug);

  return { bookmarks, toggle, isBookmarked };
}
