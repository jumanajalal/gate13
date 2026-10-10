import type { CaseDef } from '../engine/types';
import { detectConflicts, type State } from '../engine/game';

export function Timeline({ s, c }: { s: State; c: CaseDef }) {
  const events = Object.values(s.events).sort((a, b) => (b.t ?? 0) - (a.t ?? 0));
  const notes = detectConflicts(s.events, c);
  const conflicted = new Set(c.conflicts.filter((x) => s.events[x.a] && s.events[x.b]).flatMap((x) => [x.a, x.b]));
  return (
    <section aria-label="Evidence timeline">
      <h2>Timeline</h2>
      <div className="card">
        {events.length === 0 && <p>Inspect evidence to build the timeline.</p>}
        {events.map((e) => {
          const bad = conflicted.has(e.key);
          const cls = bad ? 'c-bad' : e.status === 'confirmed' ? 'c-ok' : 'c-un';
          const word = bad ? 'CONFLICT' : e.status === 'confirmed' ? 'CONFIRMED' : 'UNCONFIRMED';
          const when = e.when && e.when !== 'flag' ? e.when : e.t === null ? '' : `T-${e.t}`;
          return (
            <div className="ev" key={e.key}>
              <b>{when}</b>
              <span>
                {e.label} <span className={'chip ' + cls}>{word}</span>
              </span>
            </div>
          );
        })}
        {notes.map((n) => (
          <p key={n} className="c-bad">
            {n}
          </p>
        ))}
      </div>
    </section>
  );
}
