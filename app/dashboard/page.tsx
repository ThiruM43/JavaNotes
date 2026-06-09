import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';
import DashboardContent from '@/components/DashboardContent';

export default function DashboardPage() {
  const categories = getCategories();
  const allNotes = categories.flatMap((c) => c.notes);
  return (
    <AppShell categories={categories}>
      <DashboardContent allNotes={allNotes} categories={categories} />
    </AppShell>
  );
}
