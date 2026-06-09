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

export default function QuizSimulator({ cards, categories }: Props) {
  const [cat, setCat] = useState('All');
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ know: 0, shaky: 0, no: 0, total: 0 });
  const [history, setHistory] = useState<Array<{ card: Flashcard; conf: Confidence }>>([]);
  const [mode, setMode] = useState<'quiz' | 'history'>('quiz');

  const pool = cat === 'All' ? cards : cards.filter((c) => c.category === cat);

  // Weighted random — cards marked "no" get 3x weight, "shaky" get 2x
  const pick = useCallback(() => {
    if (!pool.length) return;
    const results = getCardResults();
    const weighted: Flashcard[] = [];
    pool.forEach((card) => {
      const conf = results[card.id]?.confidence;
      const weight = conf === 'no' ? 3 : conf === 'shaky' ? 2 : 1;
      for (let i = 0; i < weight; i++) weighted.push(card);
    });
    const next = weighted[Math.floor(Math.random() * weighted.length)];
    setCurrent(next);
    setRevealed(false);
  }, [pool]);

  useEffect(() => { pick(); }, [cat, pick]);

  const rate = (conf: Confidence) => {
    if (!current) return;
    const daysUntilReview = conf === 'know' ? 7 : conf === 'shaky' ? 2 : 1;
    const reviewAt = new Date(Date.now() + daysUntilReview * 86400000).toISOString();
    saveCardResult({ id: current.id, confidence: conf, reviewAt });
    setHistory((h) => [{ card: current, conf }, ...h.slice(0, 9)]);
    setSessionStats((s) => ({ ...s, [conf]: s[conf] + 1, total: s.total + 1 }));
    pick();
  };

  const confIcon = (c: Confidence) => c === 'know' ? '✓' : c === 'shaky' ? '~' : '✗';
  const confColor = (c: Confidence) => c === 'know' ? 'text-green-400' : c === 'shaky' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('quiz')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'quiz' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          🎯 Quiz Mode
        </button>
        <button
          onClick={() => setMode('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'history' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          📋 History ({history.length})
        </button>
      </div>

      {mode === 'history' ? (
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No history yet — answer some questions!</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white">{h.card.question}</p>
                  <span className={`text-lg shrink-0 ${confColor(h.conf)}`}>{confIcon(h.conf)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{h.card.category}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-5 justify-center">
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

          {/* Session stats */}
          {sessionStats.total > 0 && (
            <div className="flex justify-center gap-5 text-sm mb-5">
              <span className="text-green-400">✓ {sessionStats.know}</span>
              <span className="text-yellow-400">~ {sessionStats.shaky}</span>
              <span className="text-red-400">✗ {sessionStats.no}</span>
              <span className="text-gray-500">{sessionStats.total} answered</span>
            </div>
          )}

          {current && (
            <>
              {/* Category + Q number */}
              <div className="flex justify-center gap-2 mb-4">
                <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">{current.category}</span>
                <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded-full">{current.id.replace('m09_', '').toUpperCase()}</span>
              </div>

              {/* Question card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-3">Question</p>
                <h2 className="text-lg font-medium text-white leading-relaxed">{current.question}</h2>
                {current.hint && !revealed && (
                  <p className="text-sm text-gray-500 mt-3 italic">💡 {current.hint}</p>
                )}
              </div>

              {/* Answer reveal */}
              {!revealed ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setRevealed(true)}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    Reveal Answer
                  </button>
                  <button
                    onClick={pick}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-colors"
                  >
                    Skip →
                  </button>
                </div>
              ) : (
                <>
                  {/* Answer */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-5 mb-4">
                    <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-3">Model Answer</p>
                    <div className="text-sm text-gray-300 leading-relaxed prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {current.answer.slice(0, 800) + (current.answer.length > 800 ? '…' : '')}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Self-rate */}
                  <p className="text-center text-xs text-gray-500 mb-3">How well did you answer?</p>
                  <div className="flex gap-3">
                    <button onClick={() => rate('no')} className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl font-medium text-sm transition-colors">
                      ✗ Need Work
                    </button>
                    <button onClick={() => rate('shaky')} className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-xl font-medium text-sm transition-colors">
                      ~ Shaky
                    </button>
                    <button onClick={() => rate('know')} className="flex-1 py-3 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 rounded-xl font-medium text-sm transition-colors">
                      ✓ Know It
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
