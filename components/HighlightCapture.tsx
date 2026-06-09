'use client';
import { useState, useEffect, useCallback } from 'react';
import { addHighlight } from '@/lib/storage';

interface Props {
  slug: string;
  noteTitle: string;
}

export default function HighlightCapture({ slug, noteTitle }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 10 || text.length > 500) {
      setTooltip(null);
      return;
    }
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 50,
      text,
    });
    setSaved(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const save = () => {
    if (!tooltip) return;
    addHighlight({ slug, noteTitle, text: tooltip.text });
    setSaved(true);
    setTimeout(() => {
      setTooltip(null);
      window.getSelection()?.removeAllRanges();
    }, 800);
  };

  if (!tooltip) return null;

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <button
        onClick={save}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
        }`}
      >
        {saved ? '✓ Saved!' : '🖍 Save Highlight'}
      </button>
    </div>
  );
}
