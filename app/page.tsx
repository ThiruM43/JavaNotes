import Link from 'next/link';
import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  const categories = getCategories();
  const totalNotes = categories.reduce((sum, c) => sum + c.notes.length, 0);

  const priorityNotes = categories
    .flatMap((c) => c.notes)
    .filter((n) => n.priority === 'high')
    .slice(0, 6);

  return (
    <AppShell categories={categories}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">☕</div>
          <h1 className="text-4xl font-bold text-white mb-2">Java Interview Notes</h1>
          <p className="text-gray-400 text-lg">Senior Developer Study Guide</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
              {totalNotes} Notes
            </span>
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
              {categories.length} Categories
            </span>
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
              PWA Ready
            </span>
          </div>
        </div>

        {/* Priority Start */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-orange-400 mb-4">🔴 Start Here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {priorityNotes.map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}/`}
                className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/50 hover:bg-gray-800/50 transition-all"
              >
                <span className="text-2xl shrink-0">{note.icon}</span>
                <div>
                  <div className="font-semibold text-white text-sm">{note.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{note.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Categories */}
        <section>
          <h2 className="text-xl font-semibold text-orange-400 mb-4">📚 All Topics</h2>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.slug} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                  <span className="ml-auto text-xs text-gray-500">{cat.notes.length} notes</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.notes.map((note) => (
                    <Link
                      key={note.slug}
                      href={`/notes/${note.slug}/`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      <span className="text-xs">{note.icon}</span>
                      <span>{note.title}</span>
                      {note.priority === 'high' && (
                        <span className="ml-auto text-xs text-red-400">🔴</span>
                      )}
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
