import type { CaseDef, Obj } from '../engine/types';
import { CARRYABLE, KIND_SIZE } from '../engine/layout';
import type { State } from '../engine/game';
import { PropArt } from './art';

export const carried = (c: CaseDef, s: State) => c.objects.filter((o) => CARRYABLE.includes(o.kind) && s.opened[o.id]);

/** Items you have picked up. Tap one to look at it again, for example while you are at a locked terminal. */
export function Inventory({ c, s, onOpen }: { c: CaseDef; s: State; onOpen: (o: Obj) => void }) {
  const items = carried(c, s);
  return (
    <div className="inv" aria-label="Inventory">
      <span className="invlabel">Inventory</span>
      {items.length === 0 && <span className="mut">Empty. Things you pick up appear here.</span>}
      {items.map((o) => {
        const [w, h] = KIND_SIZE[o.kind];
        return (
          <button key={o.id} className="slot" aria-label={`Inventory: ${o.title}`} onClick={() => onOpen(o)}>
            <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} aria-hidden><PropArt o={o} /></svg>
            <span>{o.title}</span>
          </button>
        );
      })}
    </div>
  );
}
