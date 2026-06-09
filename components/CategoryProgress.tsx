'use client';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/storage';
import type { Category } from '@/lib/notes';

export default function CategoryProgress({ categories }: { categories: Category[] }) {
  const [pct, setPct] = useState<Record<string, number>>({});

  useEffect(() => {
    const prog = getProgress();
    const result: Record<string, number> = {};
    for (const cat of categories) {
      const done = cat.notes.filter((n) => prog[n.slug]?.status === 'done').length;
      result[cat.slug] = cat.notes.length ? Math.round((done / cat.notes.length) * 100) : 0;
    }
    setPct(result);
  }, [categories]);

  const overall = categories.reduce((s, c) => s + c.notes.length, 0);
  const totalDone = Object.values(pct).reduce((s, p, i) => {
    const cat = categories[i];
    return s + Math.round((p / 100) * (cat?.notes.length ?? 0));
  }, 0);
  const overallPct = overall ? Math.round((totalDone / overall) * 100) : 0;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-orange-400">Overall Progress</h2>
        <span className="text-xs text-gray-400">{totalDone}/{overall} done</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-700"
          style={{ width: overallPct + '%' }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((cat) => (
          <div key={cat.slug} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span>{cat.icon}</span>
                <span className="truncate max-w-[90px]">{cat.title}</span>
              </span>
              <span className="text-xs text-gray-500 shrink-0">{pct[cat.slug] ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: (pct[cat.slug] ?? 0) + '%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
