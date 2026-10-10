import { useEffect, useState } from 'react';

const reduced = () => typeof window === 'undefined' || typeof window.matchMedia === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Terminal-style line-by-line reveal. Shows everything at once for reduced-motion users. */
export function Typed({ lines, ms = 260 }: { lines: string[]; ms?: number }) {
  const [n, setN] = useState(() => (reduced() ? lines.length : 0));
  useEffect(() => {
    if (n >= lines.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), ms);
    return () => window.clearTimeout(id);
  }, [n, lines.length, ms]);
  return (
    <div>
      {lines.slice(0, n).map((l, i) => (
        <div key={i} className="tl">
          {l || '\u00a0'}
        </div>
      ))}
      {n < lines.length && <span className="cursor">_</span>}
    </div>
  );
}
