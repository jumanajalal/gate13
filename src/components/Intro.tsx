import { useEffect, useState } from 'react';
import type { CaseDef } from '../engine/types';

/** Cold open: the scene is set before the clock starts. Click anywhere to skip the typing. */
export function Intro({ c, onBegin }: { c: CaseDef; onBegin: () => void }) {
  const [n, setN] = useState(0);
  const done = n >= c.opening.length;
  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setN((x) => x + 1), n === 0 ? 500 : 1700);
    return () => window.clearTimeout(id);
  }, [n, done]);
  return (
    <section className="intro" onClick={() => setN(c.opening.length)} aria-label="Incident briefing">
      <div className="introlines" aria-live="polite">
        {c.opening.slice(0, n).map((l, i) => (
          <p key={i} className={i === 0 ? 'stamp-line' : ''}>
            {l}
          </p>
        ))}
      </div>
      <div className="introfoot">
        {done ? (
          <button
            className="pri big"
            onClick={(e) => {
              e.stopPropagation();
              onBegin();
            }}
          >
            Enter Gate 13. Start the clock
          </button>
        ) : (
          <span className="mut">Tap to skip</span>
        )}
      </div>
    </section>
  );
}
