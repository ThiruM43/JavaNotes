// Safe localStorage wrapper (handles SSR where localStorage is undefined)

function safe<T>(fn: () => T, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    return fn();
  } catch {
    return fallback;
  }
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    return safe(() => {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    }, fallback);
  },
  set<T>(key: string, value: T): void {
    safe(() => localStorage.setItem(key, JSON.stringify(value)), undefined);
  },
  remove(key: string): void {
    safe(() => localStorage.removeItem(key), undefined);
  },
};

// ─── Progress ────────────────────────────────────────────────────
export type ProgressStatus = 'unread' | 'reading' | 'done';

export interface ProgressMap {
  [slug: string]: { status: ProgressStatus; updatedAt: string };
}

export function getProgress(): ProgressMap {
  return storage.get<ProgressMap>('progress_v1', {});
}
export function setProgress(slug: string, status: ProgressStatus): void {
  const map = getProgress();
  map[slug] = { status, updatedAt: new Date().toISOString() };
  storage.set('progress_v1', map);
}

// ─── Bookmarks ───────────────────────────────────────────────────
export function getBookmarks(): string[] {
  return storage.get<string[]>('bookmarks_v1', []);
}
export function toggleBookmark(slug: string): boolean {
  const bm = getBookmarks();
  const idx = bm.indexOf(slug);
  if (idx >= 0) {
    bm.splice(idx, 1);
    storage.set('bookmarks_v1', bm);
    return false;
  }
  bm.push(slug);
  storage.set('bookmarks_v1', bm);
  return true;
}
export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}

// ─── Highlights ──────────────────────────────────────────────────
export interface Highlight {
  id: string;
  slug: string;
  noteTitle: string;
  text: string;
  createdAt: string;
}

export function getHighlights(): Highlight[] {
  return storage.get<Highlight[]>('highlights_v1', []);
}
export function addHighlight(h: Omit<Highlight, 'id' | 'createdAt'>): void {
  const all = getHighlights();
  all.unshift({ ...h, id: Date.now().toString(), createdAt: new Date().toISOString() });
  storage.set('highlights_v1', all.slice(0, 100)); // keep latest 100
}
export function removeHighlight(id: string): void {
  const all = getHighlights().filter((h) => h.id !== id);
  storage.set('highlights_v1', all);
}

// ─── Pomodoro sessions ────────────────────────────────────────────
export interface PomodoroSession {
  date: string; // YYYY-MM-DD
  completedPomodoros: number;
  totalMinutes: number;
}

export function getTodaySession(): PomodoroSession {
  const today = new Date().toISOString().slice(0, 10);
  const all = storage.get<Record<string, PomodoroSession>>('pomodoro_v1', {});
  return all[today] ?? { date: today, completedPomodoros: 0, totalMinutes: 0 };
}
export function savePomodoroSession(session: PomodoroSession): void {
  const all = storage.get<Record<string, PomodoroSession>>('pomodoro_v1', {});
  all[session.date] = session;
  // Keep last 30 days
  const keys = Object.keys(all).sort().slice(-30);
  const trimmed: Record<string, PomodoroSession> = {};
  keys.forEach((k) => (trimmed[k] = all[k]));
  storage.set('pomodoro_v1', trimmed);
}

// ─── Quiz scores ─────────────────────────────────────────────────
export interface CardResult {
  id: string;
  confidence: 'know' | 'shaky' | 'no';
  reviewAt: string; // ISO date
}

export function getCardResults(): Record<string, CardResult> {
  return storage.get('quiz_results_v1', {});
}
export function saveCardResult(r: CardResult): void {
  const all = getCardResults();
  all[r.id] = r;
  storage.set('quiz_results_v1', all);
}

// ─── Study streak ─────────────────────────────────────────────────
export function getStreak(): number {
  const progress = getProgress();
  const days = new Set<string>();
  Object.values(progress).forEach((p) => {
    if (p.status === 'done') days.add(p.updatedAt.slice(0, 10));
  });
  const sorted = Array.from(days).sort().reverse();
  if (!sorted.length) return 0;
  let streak = 0;
  let date = new Date();
  for (const d of sorted) {
    const diff = Math.floor((date.getTime() - new Date(d).getTime()) / 86400000);
    if (diff > 1) break;
    streak++;
    date = new Date(d);
  }
  return streak;
}
