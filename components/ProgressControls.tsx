'use client';
import { useEffect, useState } from 'react';
import { getProgress, setProgress, ProgressStatus } from '@/lib/storage';
import { useBookmarks } from '@/hooks/useBookmarks';

interface Props {
  slug: string;
  noteTitle: string;
}

const STATUS_CONFIG = {
  unread: { label: 'Mark Reading', next: 'reading' as ProgressStatus, color: 'text-gray-400 hover:text-blue-400', icon: '○' },
  reading: { label: 'Mark Done', next: 'done' as ProgressStatus, color: 'text-blue-400 hover:text-green-400', icon: '◐' },
  done: { label: 'Mark Unread', next: 'unread' as ProgressStatus, color: 'text-green-400 hover:text-gray-400', icon: '●' },
};

export default function ProgressControls({ slug, noteTitle }: Props) {
  const [status, setStatus] = useState<ProgressStatus>('unread');
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarked = isBookmarked(slug);

  useEffect(() => {
    const map = getProgress();
    setStatus(map[slug]?.status ?? 'unread');
  }, [slug]);

  const handleProgress = () => {
    const cfg = STATUS_CONFIG[status];
    setProgress(slug, cfg.next);
    setStatus(cfg.next);
  };

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      {/* Progress */}
      <button
        onClick={handleProgress}
        title={cfg.label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium
          ${status === 'unread' ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400' : ''}
          ${status === 'reading' ? 'border-blue-500/50 text-blue-400 hover:border-green-500 hover:text-green-400' : ''}
          ${status === 'done' ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:border-gray-600 hover:text-gray-400' : ''}
        `}
      >
        <span>{cfg.icon}</span>
        <span>{status === 'unread' ? 'Unread' : status === 'reading' ? 'Reading' : 'Done'}</span>
      </button>

      {/* Bookmark */}
      <button
        onClick={() => toggle(slug)}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        className={`p-1.5 rounded-lg border transition-all ${
          bookmarked
            ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
            : 'border-gray-700 text-gray-500 hover:border-yellow-500 hover:text-yellow-400'
        }`}
      >
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  );
}
