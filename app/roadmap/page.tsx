import Link from 'next/link';
import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';

const LAYER_META = [
  { key: 'spine',     label: 'Spine',        icon: '📖', desc: 'Read first — understand the concept',   color: 'text-orange-400' },
  { key: 'vocab',     label: 'Vocabulary',   icon: '🔤', desc: 'Lock in every term',                    color: 'text-blue-400'   },
  { key: 'code',      label: 'Code + Depth', icon: '💻', desc: 'Real code, examples, memory diagrams',  color: 'text-green-400'  },
  { key: 'interview', label: 'Interview',    icon: '🎯', desc: 'Practice saying answers out loud',      color: 'text-purple-400' },
];

interface NoteLink { slug: string; title: string }
interface TopicPath {
  icon: string;
  title: string;
  spine: NoteLink[];
  vocab: NoteLink[];
  code: NoteLink[];
  interview: NoteLink[];
}

const TOPICS: TopicPath[] = [
  {
    icon: '☕', title: 'Core Java',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '01_Core_Java', title: 'Core Java Overview' }],
    vocab:     [{ slug: 'T01_Core_Java_OOP_Terms', title: 'T01 · OOP Terms' }, { slug: 'T02_Memory_GC_Terms', title: 'T02 · Memory & GC' }],
    code:      [{ slug: 'M01_Core_Java_Master', title: 'M01 · Core Java Master' }, { slug: 'M03_Concurrency_Java8_Master', title: 'M03 · Concurrency & Java 8' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '🌲', title: 'Data Structures & Algorithms',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '02_Data_Structures_Algorithms', title: 'DSA Overview' }],
    vocab:     [{ slug: 'T03_Collections_Threading_Java8_Terms', title: 'T03 · Collections & Threading' }],
    code:      [{ slug: 'M02_Collections_DSA_Master', title: 'M02 · Collections & DSA Master' }],
    interview: [{ slug: 'DSA_Coding_Patterns', title: 'DSA Coding Patterns' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '🌱', title: 'Spring Framework',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '03_Spring_Framework', title: 'Spring Framework Overview' }],
    vocab:     [{ slug: 'T05_Spring_REST_Security_Microservices_Terms', title: 'T05 · Spring & REST Terms' }],
    code:      [{ slug: 'M04_Spring_Master', title: 'M04 · Spring Master' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '🗄️', title: 'JPA / Database',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '04_JPA_Hibernate_Database', title: 'JPA & Hibernate Overview' }],
    vocab:     [{ slug: 'T04_Exception_JDBC_SQL_JPA_Terms', title: 'T04 · JDBC & JPA Terms' }, { slug: 'T06_Patterns_DevOps_Production_AdvancedJVM_Terms', title: 'T06 · Patterns & JVM' }],
    code:      [{ slug: 'M05_JPA_Database_Master', title: 'M05 · JPA & Database Master' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '🔧', title: 'Microservices',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '05_Microservices_Messaging_Testing', title: 'Microservices Overview' }],
    vocab:     [{ slug: 'T05_Spring_REST_Security_Microservices_Terms', title: 'T05 · Microservices Terms' }, { slug: 'T06_Patterns_DevOps_Production_AdvancedJVM_Terms', title: 'T06 · DevOps Terms' }],
    code:      [{ slug: 'M06_Microservices_Integration_Master', title: 'M06 · Microservices Master' }, { slug: 'M07_Testing_DevOps_Production_Master', title: 'M07 · Testing & DevOps' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '🏗️', title: 'System Design',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: 'Java_Senior_Interview_ShortNotes', title: 'Senior Interview Notes' }],
    vocab:     [{ slug: 'T06_Patterns_DevOps_Production_AdvancedJVM_Terms', title: 'T06 · Patterns & Advanced JVM' }],
    code:      [{ slug: 'M08_System_Design_Master', title: 'M08 · System Design Master' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
  {
    icon: '✨', title: 'Modern Java',
    spine:     [{ slug: 'THREE_LEVEL_NOTES', title: 'Three Level Notes' }, { slug: '00_MASTER_INDEX', title: 'Master Index' }],
    vocab:     [{ slug: 'T03_Collections_Threading_Java8_Terms', title: 'T03 · Java 8 Terms' }],
    code:      [{ slug: 'M10_Modern_Java_Master', title: 'M10 · Modern Java Master' }],
    interview: [{ slug: 'M09_Interview_QA_Master', title: 'M09 · Q&A Master' }, { slug: 'QUICK_REFERENCE', title: 'Quick Reference' }],
  },
];

function NoteChip({ slug, title }: NoteLink) {
  return (
    <Link
      href={'/notes/' + slug + '/'}
      className="block px-2 py-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-xs text-gray-300 hover:text-white transition-colors leading-tight"
    >
      {title}
    </Link>
  );
}

export default function RoadmapPage() {
  const categories = getCategories();

  return (
    <AppShell categories={categories}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Learning Roadmap</h1>
          <p className="text-sm text-gray-400">Follow the 4 layers in order for each topic. Spine first, interview last.</p>
        </div>

        {/* Layer legend — scrollable on mobile */}
        <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {LAYER_META.map((l, i) => (
            <div key={l.key} className="flex items-center gap-1.5 shrink-0 bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5">
              <span className="text-xs font-bold text-gray-600">{i + 1}</span>
              <span className="text-sm">{l.icon}</span>
              <span className={'text-xs font-medium ' + l.color}>{l.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-5">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

              {/* Topic header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                <span className="text-xl">{topic.icon}</span>
                <span className="font-semibold text-white text-sm sm:text-base">{topic.title}</span>
              </div>

              {/* 4 layers — 2×2 on mobile, 4×1 on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4">
                {([
                  { meta: LAYER_META[0], notes: topic.spine },
                  { meta: LAYER_META[1], notes: topic.vocab },
                  { meta: LAYER_META[2], notes: topic.code },
                  { meta: LAYER_META[3], notes: topic.interview },
                ] as const).map(({ meta, notes }, idx) => (
                  <div
                    key={meta.key}
                    className={
                      'p-3 sm:p-4 ' +
                      (idx % 2 === 0 && idx < 2 ? 'border-r border-gray-800 ' : '') +
                      (idx === 0 ? 'border-b border-gray-800 lg:border-b-0 ' : '') +
                      (idx === 1 ? 'border-b border-gray-800 lg:border-b-0 lg:border-r border-gray-800 ' : '') +
                      (idx === 2 ? 'border-r border-gray-800 lg:border-r border-gray-800 ' : '') +
                      ''
                    }
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-gray-600">{idx + 1}</span>
                      <span className="text-sm">{meta.icon}</span>
                      <span className={'text-xs font-semibold ' + meta.color}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 leading-snug hidden sm:block">{meta.desc}</p>
                    <div className="space-y-1">
                      {(notes as NoteLink[]).map((n) => (
                        <NoteChip key={n.slug} slug={n.slug} title={n.title} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          THREE_LEVEL_NOTES is the spine for all topics — read it once, revisit as you go deeper.
        </p>
      </div>
    </AppShell>
  );
}
