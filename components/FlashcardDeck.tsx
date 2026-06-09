'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Flashcard } from '@/lib/flashcards';
import { getCardResults, saveCardResult } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  cards: Flashcard[];
  categories: string[];
}

type Confidence = 'know' | 'shaky' | 'no';

export default function FlashcardDeck({ cards, categories }: Props) {
  const [cat, setCat] = useState<string>('All');
  const [shuffled, setShuffled] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, Confidence>>({});
  const [session, setSession] = useState<{ know: number; shaky: number; no: number }>({ know: 0, shaky: 0, no: 0 });
  const [done, setDone] = useState(false);

  const filtered = cat === 'All' ? cards : cards.filter((c) => c.category === cat);

  const shuffle = useCallback((arr: Flashcard[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  useEffect(() => {
    const stored = getCardResults();
    const r: Record<string, Confidence> = {};
    Object.values(stored).forEach((v) => { r[v.id] = v.confidence; });
    setResults(r);
  }, []);

  useEffect(() => {
    setShuffled(shuffle(filtered));
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setSession({ know: 0, shaky: 0, no: 0 });
  }, [cat, shuffle]);

  const current = shuffled[idx];

  const rate = (conf: Confidence) => {
    if (!current) return;
    const now = new Date();
    const daysUntilReview = conf === 'know' ? 7 : conf === 'shaky' ? 2 : 1;
    const reviewAt = new Date(now.getTime() + daysUntilReview * 86400000).toISOString();
    saveCardResult({ id: current.id, confidence: conf, reviewAt });
    setResults((prev) => ({ ...prev, [current.id]: conf }));
    setSession((s) => ({ ...s, [conf]: s[conf] + 1 }));

    if (idx + 1 >= shuffled.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  const restart = () => {
    setShuffled(shuffle(filtered));
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setSession({ know: 0, shaky: 0, no: 0 });
  };

  const knowCount = Object.values(results).filter((v) => v === 'know').length;
  const shakyCount = Object.values(results).filter((v) => v === 'shaky').length;
  const noCount = Object.values(results).filter((v) => v === 'no').length;

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              cat === c ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>{idx + 1} / {shuffled.length}</span>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400">✓ {session.know}</span>
          <span className="text-yellow-400">~ {session.shaky}</span>
          <span className="text-red-400">✗ {session.no}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800 rounded-full mb-6">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all"
          style={{ width: `${((idx) / shuffled.length) * 100}%` }}
        />
      </div>

      {done ? (
        /* Session complete screen */
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-gray-400 mb-6">{shuffled.length} cards reviewed</p>
          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{session.know}</div>
              <div className="text-xs text-gray-500">Know it ✓</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{session.shaky}</div>
              <div className="text-xs text-gray-500">Shaky ~</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{session.no}</div>
              <div className="text-xs text-gray-500">Need work ✗</div>
            </div>
          </div>
          <button
            onClick={restart}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-medium transition-colors"
          >
            Study Again
          </button>
        </div>
      ) : current ? (
        /* Flashcard */
        <div>
          {/* Category badge */}
          <div className="flex justify-center mb-3">
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">{current.category}</span>
          </div>

          {/* Card */}
          <div
            className="cursor-pointer select-none"
            onClick={() => setFlipped((f) => !f)}
          >
            <div className={`bg-gray-900 border-2 rounded-2xl p-6 min-h-[280px] flex flex-col transition-all duration-150 ${
              flipped ? 'border-orange-500/50' : 'border-gray-800 hover:border-gray-700'
            }`}>
              {!flipped ? (
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-xs text-orange-400 font-semibold mb-3 uppercase tracking-wider">Question</p>
                    <h2 className="text-lg font-medium text-white leading-relaxed">{current.question}</h2>
                    {current.hint && (
                      <p className="text-sm text-gray-500 mt-3 italic">💡 Testing: {current.hint}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-4 text-center">Click to reveal answer</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <p className="text-xs text-green-400 font-semibold mb-3 uppercase tracking-wider">Answer</p>
                  <div className="text-sm text-gray-300 leading-relaxed flex-1 overflow-y-auto prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {current.answer.slice(0, 600) + (current.answer.length > 600 ? '…' : '')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rating buttons (only shown when flipped) */}
          {flipped && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => rate('no')}
                className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl font-medium text-sm transition-colors"
              >
                ✗ Need Work
              </button>
              <button
                onClick={() => rate('shaky')}
                className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-xl font-medium text-sm transition-colors"
              >
                ~ Shaky
              </button>
              <button
                onClick={() => rate('know')}
                className="flex-1 py-3 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 rounded-xl font-medium text-sm transition-colors"
              >
                ✓ Know It
              </button>
            </div>
          )}

          {!flipped && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="px-4 py-2 bg-gray-800 text-gray-400 rounded-xl text-sm disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setFlipped(true)}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Flip Card →
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* All-time stats */}
      {Object.keys(results).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center mb-3">All-time card results</p>
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-green-400">✓ {knowCount} mastered</span>
            <span className="text-yellow-400">~ {shakyCount} shaky</span>
            <span className="text-red-400">✗ {noCount} need work</span>
          </div>
        </div>
      )}
    </div>
  );
}
