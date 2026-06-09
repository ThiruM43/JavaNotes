import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';
import MindMapClient from '@/components/MindMapClient';

export default function MindMapPage() {
  const categories = getCategories();
  const nodes = categories.flatMap((cat) =>
    cat.notes.map((n) => ({ slug: n.slug, title: n.title, category: cat.slug, catTitle: cat.title, icon: cat.icon }))
  );
  const cats = categories.map((c) => ({ slug: c.slug, title: c.title, icon: c.icon, count: c.notes.length }));
  return (
    <AppShell categories={categories}>
      <MindMapClient nodes={nodes} cats={cats} />
    </AppShell>
  );
}
