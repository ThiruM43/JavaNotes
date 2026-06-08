'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Category } from '@/lib/notes';

interface SidebarProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ categories, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(categories.map((c) => c.slug))
  );

  const toggleCategory = (slug: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const isActive = (slug: string) => pathname?.includes(`/notes/${slug}`);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-40 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-800 shrink-0">
          <span className="text-2xl">☕</span>
          <div>
            <div className="font-bold text-white text-sm">Java Interview Notes</div>
            <div className="text-xs text-gray-400">Senior Dev Study Guide</div>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Home link */}
        <div className="px-3 pt-3 shrink-0">
          <Link
            href="/"
            onClick={onClose}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${pathname === '/' ? 'bg-orange-500/20 text-orange-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            🏠 Home
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <button
                onClick={() => toggleCategory(cat.slug)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </span>
                <span className={`transition-transform duration-200 ${expandedCats.has(cat.slug) ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>

              {expandedCats.has(cat.slug) && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {cat.notes.map((note) => (
                    <Link
                      key={note.slug}
                      href={`/notes/${note.slug}/`}
                      onClick={onClose}
                      className={`flex items-start gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${isActive(note.slug)
                          ? 'bg-orange-500/20 text-orange-300 font-medium'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                    >
                      <span className="text-xs mt-0.5">{note.icon}</span>
                      <span className="leading-tight">{note.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <p className="text-xs text-gray-500 text-center">
            {categories.reduce((sum, c) => sum + c.notes.length, 0)} notes • Study hard! 💪
          </p>
        </div>
      </aside>
    </>
  );
}
