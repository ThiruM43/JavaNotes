import { getAllFlashcards, getFlashcardCategories } from '@/lib/flashcards';
import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';
import QuizSimulator from '@/components/QuizSimulator';

export default function QuizPage() {
  const cards = getAllFlashcards();
  const catOptions = getFlashcardCategories();
  const categories = getCategories();

  return (
    <AppShell categories={categories}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎯 Interview Simulator</h1>
          <p className="text-gray-400 text-sm mt-1">Random questions — practice speaking your answers out loud</p>
        </div>
        <QuizSimulator cards={cards} categories={catOptions} />
      </div>
    </AppShell>
  );
}
