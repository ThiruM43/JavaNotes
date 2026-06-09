'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import CodePlayground from './CodePlayground';
import 'highlight.js/styles/github-dark.css';
import type { Components } from 'react-markdown';
import type { ClassAttributes, HTMLAttributes } from 'react';
import type { ExtraProps } from 'react-markdown';

interface Props {
  content: string;
}

type CodeProps = ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps;

// rehype-highlight turns code children into React element trees (spans), so
// String(children) produces "[object Object]". Extract plain text recursively.
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return '';
}

function CodeRenderer({ className, children, node, ...rest }: CodeProps) {
  const lang = /language-(\w+)/.exec(className || '')?.[1] ?? '';
  const code = extractText(children).replace(/\n$/, '');
  const isBlock = code.includes('\n') || code.length > 80;

  if (isBlock && lang) {
    return <CodePlayground initialCode={code} language={lang} />;
  }

  return (
    <code className="font-mono text-sm bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded" {...rest}>
      {children}
    </code>
  );
}

const components: Components = {
  code: CodeRenderer as Components['code'],
};

export default function MarkdownViewer({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight,
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
