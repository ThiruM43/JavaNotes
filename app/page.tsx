import Link from 'next/link';
import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';
import CategoryProgress from '@/components/CategoryProgress';

export default function HomePage() {
  const categories = getCategories();
  const totalNotes = categories.reduce((s, c) => s + c.notes.length, 0);

  const mustKnow = categories
    .flatMap((c) => c.notes.map((n) => ({ ...n, category: c.title })))
    .filter((n) => n.priority === 'high')
    .slice(0, 6);

  return (
    <AppShell categories={categories}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">&#9749;</div>
          <h1 className="text-3xl font-bold text-white mb-2">Java Interview Notes</h1>
          <p className="text-gray-400">Senior Developer Study Guide &bull; PWA</p>
          <div className="flex justify-center flex-wrap gap-3 mt-4">
            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">{totalNotes} Notes</span>
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">100 Q&amp;As</span>
            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">Flashcards</span>
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">Code Playground</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <Link href="/dashboard/" className="group bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-xl p-4 text-center transition-all">
            <div className="text-3xl mb-2">&#128202;</div>
            <div className="text-sm font-medium text-white">Dashboard</div>
            <div className="text-xs text-gray-500 mt-0.5">Track progress</div>
          </Link>
          <Link href="/flashcards/" className="group bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-xl p-4 text-center transition-all">
            <div className="text-3xl mb-2">&#127183;</div>
            <div className="text-sm font-medium text-white">Flashcards</div>
            <div className="text-xs text-gray-500 mt-0.5">100 Q&amp;A cards</div>
          </Link>
          <Link href="/quiz/" className="group bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-xl p-4 text-center transition-all">
            <div className="text-3xl mb-2">&#127919;</div>
            <div className="text-sm font-medium text-white">Quiz Mode</div>
            <div className="text-xs text-gray-500 mt-0.5">Random questions</div>
          </Link>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">&#9201;</div>
            <div className="text-sm font-medium text-white">Pomodoro</div>
            <div className="text-xs text-gray-500 mt-0.5">Timer widget below</div>
          </div>
        </div>

        <CategoryProgress categories={categories} />

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-orange-400 mb-3">Must Know</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mustKnow.map((note) => (
              <Link
                key={note.slug}
                href={'/notes/' + note.slug + '/'}
                className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/50 hover:bg-gray-800/50 transition-all"
              >
                <span className="text-xl shrink-0">{note.icon}</span>
                <div>
                  <div className="font-medium text-white text-sm">{note.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{note.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-orange-400 mb-3">All Topics</h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.slug} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                  <span className="ml-auto text-xs text-gray-600">{cat.notes.length}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {cat.notes.map((note) => (
                    <Link
                      key={note.slug}
                      href={'/notes/' + note.slug + '/'}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <span className="text-xs">{note.icon}</span>
                      <span className="flex-1 truncate">{note.title}</span>
                      {note.priority === 'high' && <span className="text-xs text-red-400 shrink-0">high</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
