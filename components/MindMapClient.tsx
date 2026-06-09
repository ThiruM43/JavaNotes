'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NNode { slug: string; title: string; category: string; icon: string }
interface CNode { slug: string; title: string; icon: string; count: number }

const CAT_COLORS: Record<string, string> = {
  'quick-start':    '#f97316',
  'core-java':      '#3b82f6',
  dsa:              '#10b981',
  spring:           '#22c55e',
  database:         '#8b5cf6',
  microservices:    '#ec4899',
  'system-design':  '#f59e0b',
  'interview-prep': '#ef4444',
  'modern-java':    '#06b6d4',
  glossary:         '#6b7280',
};

function loadD3(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).d3) { resolve((window as any).d3); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
    s.onload = () => resolve((window as any).d3);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function MindMapClient({ nodes, cats }: { nodes: NNode[]; cats: CNode[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadD3().then((d3) => {
      if (cancelled || !svgRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const W = svgRef.current.clientWidth || 800;
      const H = svgRef.current.clientHeight || 600;

      const allNodes: any[] = [
        { id: '__center__', label: 'Java Notes', type: 'center', r: 28 },
        ...cats.map((c: CNode) => ({ id: c.slug, label: c.icon + ' ' + c.title, type: 'cat', catSlug: c.slug, r: 22 })),
        ...nodes.map((n: NNode) => ({ id: n.slug, label: n.title, type: 'note', catSlug: n.category, slug: n.slug, r: 9 })),
      ];

      const links: any[] = [
        ...cats.map((c: CNode) => ({ source: '__center__', target: c.slug })),
        ...nodes.map((n: NNode) => ({ source: n.category, target: n.slug })),
      ];

      const sim = d3.forceSimulation(allNodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id)
          .distance((l: any) => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            return src === '__center__' ? 150 : 65;
          }).strength(0.6))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide().radius((d: any) => d.r + 5));

      const g = svg.append('g');

      svg.call(
        d3.zoom()
          .scaleExtent([0.25, 3])
          .on('zoom', (event: any) => g.attr('transform', event.transform))
      );

      const link = g.append('g').selectAll('line')
        .data(links).join('line')
        .attr('stroke', '#374151').attr('stroke-width', 1).attr('stroke-opacity', 0.45);

      const node = g.append('g').selectAll('g')
        .data(allNodes).join('g')
        .attr('cursor', (d: any) => d.type === 'note' ? 'pointer' : 'grab')
        .call(d3.drag()
          .on('start', (event: any, d: any) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event: any, d: any) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event: any, d: any) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
        )
        .on('click', (_: any, d: any) => { if (d.type === 'note') router.push('/notes/' + d.slug + '/'); })
        .on('mouseover', (event: MouseEvent, d: any) => {
          if (d.type === 'note') {
            const rect = svgRef.current!.getBoundingClientRect();
            setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 14, text: d.label });
          }
        })
        .on('mouseout', () => setTooltip(null));

      node.append('circle')
        .attr('r', (d: any) => d.r)
        .attr('fill', (d: any) => {
          if (d.type === 'center') return '#f97316';
          const c = CAT_COLORS[d.catSlug] ?? '#6b7280';
          return d.type === 'cat' ? c : c + '30';
        })
        .attr('stroke', (d: any) => {
          if (d.type === 'center') return '#fb923c';
          return CAT_COLORS[d.catSlug] ?? '#6b7280';
        })
        .attr('stroke-width', (d: any) => d.type === 'note' ? 1 : 2);

      node.filter((d: any) => d.type !== 'note').append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', 'white').attr('font-size', (d: any) => d.type === 'center' ? 11 : 9)
        .attr('pointer-events', 'none')
        .each(function(this: SVGTextElement, d: any) {
          const words = d.label.split(' ');
          const el = d3.select(this);
          if (words.length <= 2) {
            el.text(d.label);
          } else {
            el.append('tspan').attr('x', 0).attr('dy', '-0.55em').text(words.slice(0, 2).join(' '));
            el.append('tspan').attr('x', 0).attr('dy', '1.2em').text(words.slice(2).join(' '));
          }
        });

      sim.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
        node.attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')');
      });

      setLoaded(true);
    }).catch(() => setLoaded(true));

    return () => { cancelled = true; };
  }, [nodes, cats, router]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 shrink-0">
        <div>
          <h1 className="text-base font-bold text-white">Mind Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">{nodes.length} notes &bull; click any note node to open &bull; drag to rearrange &bull; scroll to zoom</p>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-[160px] sm:max-w-none">
          {Object.entries(CAT_COLORS).map(([k, v]) => (
            <span key={k} title={k} className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: v }} />
          ))}
        </div>
      </div>
      <div className="relative flex-1 bg-gray-950 overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">Loading D3 graph…</div>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-800 border border-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg max-w-[200px] z-10 shadow-lg"
            style={{ left: tooltip.x + 10, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
