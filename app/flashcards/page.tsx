import { getAllFlashcards, getFlashcardCategories } from '@/lib/flashcards';
import { getCategories } from '@/lib/notes';
import AppShell from '@/components/AppShell';
import FlashcardDeck from '@/components/FlashcardDeck';

export default function FlashcardsPage() {
  const cards = getAllFlashcards();
  const catOptions = getFlashcardCategories();
  const categories = getCategories();

  return (
    <AppShell categories={categories}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">🃏 Flashcards</h1>
          <p className="text-gray-400 text-sm mt-1">{cards.length} cards from Interview Q&A Master</p>
        </div>
        <FlashcardDeck cards={cards} categories={catOptions} />
      </div>
    </AppShell>
  );
}
