'use client';
import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  items: TocItem[];
}

export default function TOC({ items }: Props) {
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <>
      {/* Desktop sticky TOC */}
      <aside className="hidden xl:block w-56 shrink-0">
        <div className="sticky top-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">On this page</p>
          <nav className="space-y-0.5 max-h-[80vh] overflow-y-auto">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-xs py-1 transition-colors leading-tight
                  ${item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-3' : 'pl-5'}
                  ${active === item.id
                    ? 'text-orange-400 font-medium'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {item.text.slice(0, 50)}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile TOC toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="xl:hidden fixed bottom-24 left-4 z-40 w-10 h-10 bg-gray-800 border border-gray-700 rounded-full shadow flex items-center justify-center text-gray-400 hover:text-white"
        title="Table of contents"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h12M4 14h8" />
        </svg>
      </button>

      {open && (
        <div className="xl:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute left-4 bottom-36 w-72 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Table of Contents</p>
            <nav className="space-y-1 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block text-sm py-1 transition-colors
                    ${item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-3' : 'pl-5'}
                    ${active === item.id ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
                >
                  {item.text.slice(0, 55)}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
