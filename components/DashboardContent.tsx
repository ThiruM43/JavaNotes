'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getProgress, getBookmarks, getHighlights, removeHighlight,
  getTodaySession, getStreak, ProgressMap
} from '@/lib/storage';
import type { NoteMetadata, Category } from '@/lib/notes';

interface Props {
  allNotes: NoteMetadata[];
  categories: Category[];
}

function CategoryBar({ category, notes, progressMap }: { category: Category; notes: NoteMetadata[]; progressMap: ProgressMap }) {
  const done = notes.filter((n) => progressMap[n.slug]?.status === 'done').length;
  const reading = notes.filter((n) => progressMap[n.slug]?.status === 'reading').length;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-300 flex items-center gap-1.5">
          <span>{category.icon}</span><span>{category.title}</span>
        </span>
        <span className="text-xs text-gray-500">{done}/{notes.length}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div className="bg-green-500 transition-all" style={{ width: `${(done / notes.length) * 100}%` }} />
          <div className="bg-blue-500 transition-all" style={{ width: `${(reading / notes.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardContent({ allNotes, categories }: Props) {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<ReturnType<typeof getHighlights>>([]);
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setProgressMap(getProgress());
    setBookmarks(getBookmarks());
    setHighlights(getHighlights());
    setTodayPomodoros(getTodaySession().completedPomodoros);
    setStreak(getStreak());
  }, []);

  const done = Object.values(progressMap).filter((p) => p.status === 'done').length;
  const reading = Object.values(progressMap).filter((p) => p.status === 'reading').length;
  const total = allNotes.length;
  const pct = Math.round((done / total) * 100) || 0;

  const bookmarkedNotes = allNotes.filter((n) => bookmarks.includes(n.slug));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">📊 Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { value: done, label: 'Notes Done', color: 'text-green-400' },
          { value: reading, label: 'In Progress', color: 'text-blue-400' },
          { value: streak, label: 'Day Streak 🔥', color: 'text-orange-400' },
          { value: todayPomodoros, label: 'Pomodoros Today 🍅', color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Overall Progress</h2>
          <span className="text-2xl font-bold text-orange-400">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Done ({done})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Reading ({reading})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700" />Unread ({total - done - reading})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* By category */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">By Category</h2>
          {categories.map((cat) => (
            <CategoryBar key={cat.slug} category={cat} notes={cat.notes} progressMap={progressMap} />
          ))}
        </div>

        {/* Bookmarks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">⭐ Bookmarks ({bookmarkedNotes.length})</h2>
          {bookmarkedNotes.length === 0 ? (
            <p className="text-sm text-gray-500">No bookmarks yet — star notes using the ☆ button on any note.</p>
          ) : (
            <div className="space-y-1.5">
              {bookmarkedNotes.map((note) => (
                <Link key={note.slug} href={`/notes/${note.slug}/`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <span className="text-sm">{note.icon}</span>
                  <span className="text-sm text-gray-300">{note.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">🖍 My Highlights ({highlights.length})</h2>
          <div className="space-y-3">
            {highlights.map((h) => (
              <div key={h.id} className="border-l-4 border-yellow-500/50 pl-4 py-2 bg-yellow-500/5 rounded-r-lg relative">
                <p className="text-sm text-gray-300 leading-relaxed">{h.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <Link href={`/notes/${h.slug}/`} className="text-xs text-gray-500 hover:text-orange-400">{h.noteTitle}</Link>
                  <button onClick={() => { removeHighlight(h.id); setHighlights(getHighlights()); }}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/flashcards/" className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/40 transition-all">
          <span className="text-2xl">🃏</span>
          <div><div className="font-medium text-white text-sm">Flashcards</div><div className="text-xs text-gray-400">100 Q&As</div></div>
        </Link>
        <Link href="/quiz/" className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/40 transition-all">
          <span className="text-2xl">🎯</span>
          <div><div className="font-medium text-white text-sm">Interview Quiz</div><div className="text-xs text-gray-400">Random Q simulator</div></div>
        </Link>
        <Link href="/" className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/40 transition-all">
          <span className="text-2xl">📚</span>
          <div><div className="font-medium text-white text-sm">All Notes</div><div className="text-xs text-gray-400">{total} study topics</div></div>
        </Link>
      </div>
    </div>
  );
}
