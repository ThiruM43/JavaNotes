import fs from 'fs';
import path from 'path';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  category: string;
  source: string;
}

const SECTION_MAP: Record<string, string> = {
  'SECTION 1': 'Core Java',
  'SECTION 2': 'Collections & DSA',
  'SECTION 3': 'Concurrency',
  'SECTION 4': 'Java 8+',
  'SECTION 5': 'Spring Boot',
  'SECTION 6': 'Database & JPA',
  'SECTION 7': 'Microservices',
  'SECTION 8': 'System Design',
  'SECTION 9': 'Testing & DevOps',
  'SECTION 10': 'Behavioral',
};

function parseM09(content: string): Flashcard[] {
  const cards: Flashcard[] = [];
  let currentCategory = 'General';

  // Split into blocks on --- separators
  const blocks = content.split(/\n---+\n/);

  for (const block of blocks) {
    // Detect section heading
    const sectionMatch = block.match(/##\s+(SECTION\s+\d+)[^*\n]*/);
    if (sectionMatch) {
      const key = Object.keys(SECTION_MAP).find((k) =>
        sectionMatch[1].toUpperCase().startsWith(k)
      );
      if (key) currentCategory = SECTION_MAP[key];
      continue;
    }

    // Detect Q&A: **Q{n}. Question?**
    const qMatch = block.match(/\*\*Q(\d+)\.\s*([\s\S]+?)\*\*/);
    if (!qMatch) continue;

    const id = `m09_q${qMatch[1]}`;
    const question = qMatch[2].trim().replace(/\n/g, ' ');

    // Extract hint: > *Testing: ...*
    const hintMatch = block.match(/>\s*\*Testing:\s*([^*]+)\*/);
    const hint = hintMatch ? hintMatch[1].trim() : undefined;

    // Answer: everything after the hint (or after the question line)
    let answer = block
      .replace(/\*\*Q\d+\.\s*[\s\S]+?\*\*/, '')
      .replace(/>\s*\*Testing:[^*]+\*/g, '')
      .replace(/^\s*[-─]+\s*$/gm, '')
      .trim();

    // Clean up: remove leading/trailing empty lines
    answer = answer.replace(/^\n+/, '').replace(/\n+$/, '');

    if (question && answer) {
      cards.push({ id, question, answer, hint, category: currentCategory, source: 'M09' });
    }
  }

  return cards;
}

let _cache: Flashcard[] | null = null;

export function getAllFlashcards(): Flashcard[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), 'content', 'M09_Interview_QA_Master.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  _cache = parseM09(content);
  return _cache;
}

export function getFlashcardCategories(): string[] {
  return Array.from(new Set(getAllFlashcards().map((c) => c.category)));
}
