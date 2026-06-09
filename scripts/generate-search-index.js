#!/usr/bin/env node
/**
 * Prebuild script: reads all MD files from /content and writes
 * /public/search-index.json for client-side Fuse.js search.
 */
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '..', 'content');
const outputFile = path.join(__dirname, '..', 'public', 'search-index.json');

// Strip markdown syntax for plain-text indexing
function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, '') // fenced code
    .replace(/`[^`]+`/g, '')        // inline code
    .replace(/^\s*#+\s+/gm, '')     // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/>\s*/gm, '')          // blockquotes
    .replace(/[-*+]\s+/gm, '')      // list markers
    .replace(/\|[^\n]+\|/g, '')     // tables
    .replace(/\n{3,}/g, '\n\n')     // excess newlines
    .trim();
}

// Extract headings as array
function extractHeadings(md) {
  const matches = [...md.matchAll(/^#{1,4}\s+(.+)$/gm)];
  return matches.map(m => m[1].replace(/[*`]/g, '').trim());
}

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
const index = files.map(file => {
  const slug = file.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8');
  const plain = stripMarkdown(raw);
  const headings = extractHeadings(raw);
  // Store first 3000 chars of content for excerpt generation
  return { slug, headings, content: plain.slice(0, 3000) };
});

fs.writeFileSync(outputFile, JSON.stringify(index));
console.log(`✅ Search index: ${index.length} notes → public/search-index.json`);
