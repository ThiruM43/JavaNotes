import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllSlugs,
  getNoteContent,
  getNoteMetadata,
  getCategories,
} from '@/lib/notes';
import AppShell from '@/components/AppShell';
import MarkdownViewer from '@/components/MarkdownViewer';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const meta = getNoteMetadata(params.slug);
  return {
    title: meta ? `${meta.title} | Java Interview Notes` : 'Note Not Found',
    description: meta?.description,
  };
}

export default function NotePage({ params }: Props) {
  const { slug } = params;
  const meta = getNoteMetadata(slug);

  if (!meta) notFound();

  const content = getNoteContent(slug);
  const categories = getCategories();

  // Find prev/next in same category
  const catNotes = categories.find((c) => c.slug === meta.categorySlug)?.notes ?? [];
  const idx = catNotes.findIndex((n) => n.slug === slug);
  const prev = idx > 0 ? catNotes[idx - 1] : null;
  const next = idx < catNotes.length - 1 ? catNotes[idx + 1] : null;

  return (
    <AppShell categories={categories}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-gray-400">{meta.category}</span>
          <span>›</span>
          <span className="text-orange-400">{meta.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-3 mb-8 pb-6 border-b border-gray-800">
          <span className="text-4xl">{meta.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
            <p className="text-gray-400 mt-1">{meta.description}</p>
          </div>
        </div>

        {/* Content */}
        <MarkdownViewer content={content} />

        {/* Prev/Next navigation */}
        <div className="flex gap-4 mt-12 pt-6 border-t border-gray-800">
          {prev ? (
            <Link
              href={`/notes/${prev.slug}/`}
              className="flex-1 flex items-start gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/50 transition-colors"
            >
              <span className="text-gray-500">‹</span>
              <div>
                <div className="text-xs text-gray-500 mb-1">Previous</div>
                <div className="text-sm font-medium text-gray-300">{prev.title}</div>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {next ? (
            <Link
              href={`/notes/${next.slug}/`}
              className="flex-1 flex items-end gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/50 transition-colors text-right"
            >
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Next</div>
                <div className="text-sm font-medium text-gray-300">{next.title}</div>
              </div>
              <span className="text-gray-500">›</span>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </div>
    </AppShell>
  );
}
