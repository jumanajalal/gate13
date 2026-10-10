import type { CaseDef, Obj } from '../engine/types';
import type { State } from '../engine/game';

/** x%, y%, rotation: nine loose positions so the props look dropped on a desk. */
const SLOTS: [number, number, number][] = [
  [3, 3, -3], [36, 1, 2], [69, 3, -2],
  [2, 35, 2], [35, 34, -2], [70, 36, 3],
  [3, 67, -2], [36, 68, 3], [70, 66, -3],
];

const CAPTION: Record<string, string> = {
  pass: 'Boarding pass', paper: 'Notice', terminal: 'Terminal', receipt: 'Receipt', tag: 'Bag tag', person: 'Witness', map: 'Map', clock: 'Clock card',
};

export function Desk({ c, s, onOpen }: { c: CaseDef; s: State; onOpen: (o: Obj) => void }) {
  return (
    <div className="scene" role="group" aria-label="Gate 13 desk. Inspect the objects.">
      {c.objects.map((o, i) => {
        const [x, y, r] = SLOTS[i] ?? SLOTS[0];
        const locked = !!o.lock && !s.unlocked[o.id];
        const seen = !!s.opened[o.id] && !locked;
        return (
          <button
            key={o.id}
            className={`tile k-${o.kind}${seen ? ' seen' : ''}${locked ? ' locked' : ''}`}
            style={{ left: x + '%', top: y + '%', transform: `rotate(${r}deg)` }}
            aria-label={o.title + (locked ? ' (locked)' : '') + (seen ? ' (inspected)' : '')}
            onClick={() => onOpen(o)}
          >
            <span className="art" aria-hidden>
              {o.kind === 'person' ? <span className="avatar">{(o.talk?.who ?? '?')[0]}</span> : null}
              {o.kind === 'terminal' ? <span className="scr">&gt; _</span> : null}
              {o.kind === 'pass' ? <span className="bars" /> : null}
              {o.kind === 'map' ? <span className="grid" /> : null}
              {o.kind === 'clock' ? <span className="face" /> : null}
            </span>
            <span className="cap">{o.title}</span>
            <span className="kind">{CAPTION[o.kind]}</span>
            {locked && <span className="chipx lock">LOCKED</span>}
            {seen && <span className="chipx ok">PINNED</span>}
          </button>
        );
      })}
    </div>
  );
}
