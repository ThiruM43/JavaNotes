import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content');

export interface NoteMetadata {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface Category {
  slug: string;
  title: string;
  icon: string;
  notes: NoteMetadata[];
}

const NOTE_CONFIG: Record<string, Omit<NoteMetadata, 'slug'>> = {
  '00_MASTER_INDEX': {
    title: 'Master Index',
    category: 'Quick Start',
    categorySlug: 'quick-start',
    description: 'Study guide, roadmap and top 50 questions',
    priority: 'high',
    icon: '🗺️',
  },
  STUDY_ROADMAP: {
    title: 'Study Roadmap',
    category: 'Quick Start',
    categorySlug: 'quick-start',
    description: '2-week sprint plan',
    priority: 'high',
    icon: '📅',
  },
  QUICK_REFERENCE: {
    title: 'Quick Reference',
    category: 'Quick Start',
    categorySlug: 'quick-start',
    description: 'Cheat sheet for key concepts',
    priority: 'high',
    icon: '⚡',
  },
  '01_Core_Java': {
    title: 'Core Java',
    category: 'Core Java',
    categorySlug: 'core-java',
    description: 'OOP, Memory, Collections, Generics, Exceptions, Threads, Java 8+',
    priority: 'high',
    icon: '☕',
  },
  M01_Core_Java_Master: {
    title: 'Core Java Master',
    category: 'Core Java',
    categorySlug: 'core-java',
    description: 'Deep dive: OOP, JVM internals, Strings, Exceptions',
    priority: 'high',
    icon: '☕',
  },
  M02_Collections_DSA_Master: {
    title: 'Collections & DSA Master',
    category: 'Core Java',
    categorySlug: 'core-java',
    description: 'Collections framework, data structures deep dive',
    priority: 'high',
    icon: '📦',
  },
  M03_Concurrency_Java8_Master: {
    title: 'Concurrency & Java 8 Master',
    category: 'Core Java',
    categorySlug: 'core-java',
    description: 'Threads, Streams, Lambdas, Optionals',
    priority: 'high',
    icon: '⚙️',
  },
  '02_Data_Structures_Algorithms': {
    title: 'Data Structures & Algorithms',
    category: 'DSA',
    categorySlug: 'dsa',
    description: 'Big O, Arrays, Trees, Graphs, Sorting, DP, Patterns',
    priority: 'high',
    icon: '🌲',
  },
  DSA_Coding_Patterns: {
    title: 'DSA Coding Patterns',
    category: 'DSA',
    categorySlug: 'dsa',
    description: 'Sliding window, two pointers, BFS/DFS patterns',
    priority: 'high',
    icon: '🧩',
  },
  '03_Spring_Framework': {
    title: 'Spring Framework',
    category: 'Spring',
    categorySlug: 'spring',
    description: 'IoC/DI, AOP, Spring Boot, MVC/REST, Security',
    priority: 'high',
    icon: '🌱',
  },
  M04_Spring_Master: {
    title: 'Spring Master',
    category: 'Spring',
    categorySlug: 'spring',
    description: 'Spring Boot internals, Security, Actuator',
    priority: 'high',
    icon: '🌱',
  },
  '04_JPA_Hibernate_Database': {
    title: 'JPA & Hibernate',
    category: 'Database',
    categorySlug: 'database',
    description: 'JPA, Hibernate, Entity Mapping, Transactions, SQL',
    priority: 'high',
    icon: '🗄️',
  },
  M05_JPA_Database_Master: {
    title: 'JPA & Database Master',
    category: 'Database',
    categorySlug: 'database',
    description: 'N+1 problem, caching, advanced Hibernate',
    priority: 'high',
    icon: '🗄️',
  },
  '05_Microservices_Messaging_Testing': {
    title: 'Microservices, Messaging & Testing',
    category: 'Microservices',
    categorySlug: 'microservices',
    description: 'Microservices, Kafka, RabbitMQ, JUnit 5, Mockito',
    priority: 'medium',
    icon: '🔧',
  },
  M06_Microservices_Integration_Master: {
    title: 'Microservices & Integration Master',
    category: 'Microservices',
    categorySlug: 'microservices',
    description: 'Service mesh, API gateway, event-driven architecture',
    priority: 'medium',
    icon: '🔧',
  },
  M07_Testing_DevOps_Production_Master: {
    title: 'Testing, DevOps & Production Master',
    category: 'Microservices',
    categorySlug: 'microservices',
    description: 'CI/CD, Docker, Kubernetes, monitoring',
    priority: 'medium',
    icon: '🚀',
  },
  M08_System_Design_Master: {
    title: 'System Design Master',
    category: 'System Design',
    categorySlug: 'system-design',
    description: 'Scalability, caching, databases, distributed systems',
    priority: 'high',
    icon: '🏗️',
  },
  M09_Interview_QA_Master: {
    title: 'Interview Q&A Master',
    category: 'Interview Prep',
    categorySlug: 'interview-prep',
    description: '100+ interview questions with answers',
    priority: 'high',
    icon: '🎯',
  },
  Java_Senior_Interview_ShortNotes: {
    title: 'Senior Interview Short Notes',
    category: 'Interview Prep',
    categorySlug: 'interview-prep',
    description: 'Concise answers for senior Java interviews',
    priority: 'high',
    icon: '📝',
  },
  THREE_LEVEL_NOTES: {
    title: 'Three Level Notes',
    category: 'Interview Prep',
    categorySlug: 'interview-prep',
    description: 'Junior / Mid / Senior level answers',
    priority: 'medium',
    icon: '📊',
  },
  M10_Modern_Java_Master: {
    title: 'Modern Java Master',
    category: 'Modern Java',
    categorySlug: 'modern-java',
    description: 'Java 9-21: modules, records, sealed classes, virtual threads',
    priority: 'medium',
    icon: '✨',
  },
  T01_Core_Java_OOP_Terms: {
    title: 'Core Java & OOP Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'Key terms and definitions',
    priority: 'low',
    icon: '📖',
  },
  T02_Memory_GC_Terms: {
    title: 'Memory & GC Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'JVM memory, garbage collection terminology',
    priority: 'low',
    icon: '📖',
  },
  T03_Collections_Threading_Java8_Terms: {
    title: 'Collections, Threading & Java 8 Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'Collections, concurrency, Java 8 terminology',
    priority: 'low',
    icon: '📖',
  },
  T04_Exception_JDBC_SQL_JPA_Terms: {
    title: 'Exception, JDBC, SQL & JPA Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'Database and exception terminology',
    priority: 'low',
    icon: '📖',
  },
  T05_Spring_REST_Security_Microservices_Terms: {
    title: 'Spring, REST, Security & Microservices Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'Spring and microservices terminology',
    priority: 'low',
    icon: '📖',
  },
  T06_Patterns_DevOps_Production_AdvancedJVM_Terms: {
    title: 'Patterns, DevOps & Advanced JVM Terms',
    category: 'Glossary',
    categorySlug: 'glossary',
    description: 'Design patterns, DevOps, advanced JVM terminology',
    priority: 'low',
    icon: '📖',
  },
};

const CATEGORY_ORDER = [
  'quick-start',
  'core-java',
  'dsa',
  'spring',
  'database',
  'microservices',
  'system-design',
  'interview-prep',
  'modern-java',
  'glossary',
];

const CATEGORY_ICONS: Record<string, string> = {
  'quick-start': '🚀',
  'core-java': '☕',
  dsa: '🌲',
  spring: '🌱',
  database: '🗄️',
  microservices: '🔧',
  'system-design': '🏗️',
  'interview-prep': '🎯',
  'modern-java': '✨',
  glossary: '📖',
};

export function getAllNotes(): NoteMetadata[] {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'));
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const config = NOTE_CONFIG[slug];
      if (!config) return null;
      return { slug, ...config };
    })
    .filter(Boolean) as NoteMetadata[];
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getNoteContent(slug: string): string {
  const filePath = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return '# Not found';
  return fs.readFileSync(filePath, 'utf-8');
}

export function getNoteMetadata(slug: string): NoteMetadata | null {
  const config = NOTE_CONFIG[slug];
  if (!config) return null;
  return { slug, ...config };
}

export function getCategories(): Category[] {
  const notes = getAllNotes();
  const categoryMap = new Map<string, Category>();

  for (const note of notes) {
    if (!categoryMap.has(note.categorySlug)) {
      categoryMap.set(note.categorySlug, {
        slug: note.categorySlug,
        title: note.category,
        icon: CATEGORY_ICONS[note.categorySlug] || '📄',
        notes: [],
      });
    }
    categoryMap.get(note.categorySlug)!.notes.push(note);
  }

  return CATEGORY_ORDER.filter((slug) => categoryMap.has(slug)).map(
    (slug) => categoryMap.get(slug)!
  );
}
