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
import TOC from '@/components/TOC';
import ProgressControls from '@/components/ProgressControls';
import HighlightCapture from '@/components/HighlightCapture';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const meta = getNoteMetadata(params.slug);
  return {
    title: meta ? meta.title + ' | Java Interview Notes' : 'Not Found',
    description: meta?.description,
  };
}

function extractTOC(content: string) {
  const matches = [...content.matchAll(/^(#{1,3})\s+(.+)$/gm)];
  return matches.map((m) => ({
    level: m[1].length,
    text: m[2].replace(/[`*[\]]/g, '').trim(),
    id: m[2]
      .toLowerCase()
      .replace(/[`*[\]]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim(),
  }));
}

export default function NotePage({ params }: Props) {
  const { slug } = params;
  const meta = getNoteMetadata(slug);
  if (!meta) notFound();

  const content = getNoteContent(slug);
  const categories = getCategories();
  const tocItems = extractTOC(content);

  const words = content.split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 200));
  const lines = content.split('\n').length;

  const catNotes = categories.find((c) => c.slug === meta.categorySlug)?.notes ?? [];
  const idx = catNotes.findIndex((n) => n.slug === slug);
  const prev = idx > 0 ? catNotes[idx - 1] : null;
  const next = idx < catNotes.length - 1 ? catNotes[idx + 1] : null;

  return (
    <AppShell categories={categories}>
      <div className="flex gap-6 max-w-6xl mx-auto px-4 py-6">
        <div className="flex-1 min-w-0">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            <span>&rsaquo;</span>
            <Link href="/dashboard/" className="hover:text-gray-300">{meta.category}</Link>
            <span>&rsaquo;</span>
            <span className="text-gray-300">{meta.title}</span>
          </nav>

          <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{meta.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{meta.title}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{meta.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-xs text-gray-500">&#128336; ~{readMin} min read</span>
              <span className="text-xs text-gray-500">&#128195; {words.toLocaleString()} words</span>
              <span className="text-xs text-gray-500">&#35; {lines} lines</span>
            </div>
          </div>
          <div className="shrink-0">
            <ProgressControls slug={slug} noteTitle={meta.title} />
          </div>

          <MarkdownViewer content={content} />

          <div className="flex gap-4 mt-10 pt-6 border-t border-gray-800">
            {prev ? (
              <Link
                href={'/notes/' + prev.slug + '/'}
                className="flex-1 flex items-start gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/40 transition-colors"
              >
                <span className="text-gray-600">&lsaquo;</span>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Previous</div>
                  <div className="text-sm font-medium text-gray-300">{prev.title}</div>
                </div>
              </Link>
            ) : <div className="flex-1" />}

            {next ? (
              <Link
                href={'/notes/' + next.slug + '/'}
                className="flex-1 flex items-end gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500/40 transition-colors text-right"
              >
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-0.5">Next</div>
                  <div className="text-sm font-medium text-gray-300">{next.title}</div>
                </div>
                <span className="text-gray-600">&rsaquo;</span>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>

        <TOC items={tocItems} />
      </div>

      <HighlightCapture slug={slug} noteTitle={meta.title} />
    </AppShell>
  );
}
