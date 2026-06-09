'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Category } from '@/lib/notes';
import { getProgress } from '@/lib/storage';

interface Props {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
}

const NAV_LINKS = [
  { href: '/', icon: '\ud83c\udfe0', label: 'Home' },
  { href: '/dashboard/', icon: '\ud83d\udcca', label: 'Dashboard' },
  { href: '/roadmap/', icon: '\ud83d\uddfa', label: 'Roadmap' },
  { href: '/flashcards/', icon: '\ud83c\udccf', label: 'Flashcards' },
  { href: '/quiz/', icon: '\ud83c\udfaf', label: 'Interview Quiz' },
  { href: '/mindmap/', icon: '\ud83d\udcd0', label: 'Mind Map' },
  { href: '/custom-notes/', icon: '\ud83d\udcdd', label: 'My Notes' },
];

function ProgressDot({ slug }: { slug: string }) {
  const [status, setStatus] = useState<string>('unread');
  useEffect(() => {
    setStatus(getProgress()[slug]?.status ?? 'unread');
  }, [slug]);
  if (status === 'done') return <span className="w-2 h-2 rounded-full bg-green-500 ml-auto shrink-0" />;
  if (status === 'reading') return <span className="w-2 h-2 rounded-full bg-blue-500 ml-auto shrink-0" />;
  return null;
}

export default function Sidebar({ categories, isOpen, onClose, onSearch }: Props) {
  const pathname = usePathname();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    const slug = pathname?.split('/notes/')[1]?.replace(/\/$/, '');
    if (slug) {
      const cat = categories.find((c) => c.notes.some((n) => n.slug === slug));
      if (cat) setExpandedCats((prev) => new Set(Array.from(prev).concat(cat.slug)));
    }
  }, [pathname, categories]);

  const toggleCat = (slug: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname === href.slice(0, -1);
  const isNoteActive = (slug: string) => pathname?.includes('/notes/' + slug);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={'fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40 flex flex-col transform transition-transform duration-300 ease-in-out ' + (isOpen ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0 lg:static lg:z-auto'}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 shrink-0">
          <span className="text-xl">&#9749;</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm truncate">Java Interview Notes</div>
            <div className="text-xs text-gray-500">Senior Dev Guide</div>
          </div>
          <button className="lg:hidden text-gray-500 hover:text-white" onClick={onClose}>&#10005;</button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 shrink-0">
          <button
            onClick={() => { onSearch(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-colors"
          >
            <span>&#128269;</span>
            <span>Search notes&hellip;</span>
            <kbd className="ml-auto text-xs border border-gray-700 rounded px-1 text-gray-600">K</kbd>
          </button>
        </div>

        {/* Top nav */}
        <div className="px-3 pt-2 space-y-0.5 shrink-0">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' + (isActive(link.href) ? 'bg-orange-500/20 text-orange-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="px-3 py-2 shrink-0">
          <div className="border-t border-gray-800 pt-2">
            <p className="text-xs uppercase tracking-wider text-gray-600 px-3 pb-1">Notes</p>
          </div>
        </div>

        {/* Notes nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <button
                onClick={() => toggleCat(cat.slug)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </span>
                <span className={'transition-transform duration-200 ' + (expandedCats.has(cat.slug) ? 'rotate-90' : '')}>&#8250;</span>
              </button>

              {expandedCats.has(cat.slug) && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  {cat.notes.map((note) => (
                    <Link
                      key={note.slug}
                      href={'/notes/' + note.slug + '/'}
                      onClick={onClose}
                      className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ' + (isNoteActive(note.slug) ? 'bg-orange-500/20 text-orange-300 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')}
                    >
                      <span className="text-xs">{note.icon}</span>
                      <span className="flex-1 leading-tight text-xs">{note.title}</span>
                      <ProgressDot slug={note.slug} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <p className="text-xs text-gray-600 text-center">
            {categories.reduce((s, c) => s + c.notes.length, 0)} notes &bull; 100 Q&amp;As
          </p>
        </div>
      </aside>
    </>
  );
}
