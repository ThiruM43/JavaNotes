'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';

interface SearchItem {
  slug: string;
  headings: string[];
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Fuse.FuseResult<SearchItem>[]>([]);
  const [index, setIndex] = useState<Fuse<SearchItem> | null>(null);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search index once
  useEffect(() => {
    if (!open || index) return;
    const base = (process.env.NEXT_PUBLIC_BASE_PATH as string) || '';
    fetch(`${base}/search-index.json`)
      .then((r) => r.json())
      .then((data: SearchItem[]) => {
        setIndex(
          new Fuse(data, {
            keys: [
              { name: 'headings', weight: 2 },
              { name: 'content', weight: 1 },
              { name: 'slug', weight: 0.5 },
            ],
            includeScore: true,
            threshold: 0.4,
            minMatchCharLength: 2,
          })
        );
      });
  }, [open, index]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  const search = useCallback(
    (q: string) => {
      if (!index || !q.trim()) return setResults([]);
      setResults(index.search(q).slice(0, 8));
      setSelected(0);
    },
    [index]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  const navigate = (slug: string) => {
    router.push(`/notes/${slug}/`);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, results.length - 1));
    if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0));
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].item.slug);
  };

  // Format slug as readable title
  const slugToTitle = (slug: string) =>
    slug.replace(/_/g, ' ').replace(/^\d+\s*/, '').replace(/^[A-Z]\d+\s*/, '').trim();

  // Highlight matching text
  const excerpt = (item: SearchItem) => {
    const text = item.content;
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return text.slice(0, 120) + '…';
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + 120);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search notes, topics, keywords…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300 text-sm">
              ✕
            </button>
          )}
          <kbd className="text-xs text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-96 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={r.item.slug}>
                <button
                  onClick={() => navigate(r.item.slug)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    i === selected ? 'bg-orange-500/20' : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{slugToTitle(r.item.slug)}</div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{excerpt(r.item)}</div>
                  {r.item.headings.slice(0, 3).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {r.item.headings.slice(0, 3).map((h: string, j: number) => (
                        <span key={j} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                          {h.slice(0, 40)}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && !results.length && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {!query && (
          <div className="px-4 py-4 text-xs text-gray-600 text-center">
            Type to search across all 27 notes · ↑↓ navigate · Enter to open
          </div>
        )}
      </div>
    </div>
  );
}
