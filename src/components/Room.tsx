import type { KeyboardEvent, ReactNode } from 'react';
import type { CaseDef, Obj, ViewId } from '../engine/types';
import { CARRYABLE, KIND_SIZE, VIEWS } from '../engine/layout';
import { radioUnlocked, type State } from '../engine/game';
import { Defs, OpsWall, PersonArt, PropArt, WALLS, opsMid } from './art';

export type Special = 'board' | 'ledger' | 'radio' | { flash: string };

interface HotProps {
  x: number; y: number; w: number; h: number; label: string; onClick: () => void; children?: ReactNode;
  hint?: boolean; locked?: boolean; strong?: boolean;
}

function Hot({ x, y, w, h, label, onClick, children, hint, locked, strong }: HotProps) {
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <g className={'hot' + (strong ? ' strong' : '')} role="button" tabIndex={0} aria-label={label} onClick={onClick} onKeyDown={key}>
      <rect className="hit" x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill="#000" opacity="0.001" />
      {children}
      <rect className="hl" x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx="12" fill="none" stroke="#ffb938" strokeWidth="5" opacity="0" />
      {hint && <circle className="dot" cx={x + w} cy={y} r="11" fill="#ffb938" stroke="#14202e" strokeWidth="3" />}
      {locked && (
        <g transform={`translate(${x + w - 36} ${y - 34})`}>
          <rect x="0" y="14" width="30" height="24" rx="4" fill="#ffb938" stroke="#14202e" strokeWidth="2" />
          <path d="M6 14 V8 a9 9 0 0 1 18 0 V14" fill="none" stroke="#ffb938" strokeWidth="4" />
        </g>
      )}
      <title>{label}</title>
    </g>
  );
}

interface RoomProps {
  view: ViewId;
  c: CaseDef;
  s: State;
  /** show pulsing hint dots on things not yet inspected */
  hints: boolean;
  strong: boolean;
  onObj: (o: Obj) => void;
  onSpecial: (sp: Special) => void;
}

/** One wall of the room. Pure SVG so it can also be rendered offline for checking. */
export function RoomSvg({ view, c, s, hints, strong, onObj, onSpecial }: RoomProps) {
  const here = c.objects.filter((o) => o.at.v === view);
  // carried items leave the room and live in the inventory bar
  const visible = here.filter((o) => !(CARRYABLE.includes(o.kind) && s.opened[o.id]));
  const bits = view === 'ops' ? null : WALLS[view]({ c, s });
  const people = visible.filter((o) => o.kind === 'person');
  const things = visible.filter((o) => o.kind !== 'person');

  const objHot = (o: Obj) => {
    const [w, h] = KIND_SIZE[o.kind];
    const locked = !!o.lock && !s.unlocked[o.id];
    const seen = !!s.opened[o.id] && !locked;
    const label = o.title + (locked ? ' (locked)' : '');
    return (
      <Hot key={o.id} x={o.at.x} y={o.at.y} w={w} h={h} label={label} locked={locked} hint={hints && !seen} strong={strong} onClick={() => onObj(o)}>
        <g transform={`translate(${o.at.x} ${o.at.y})`}>{o.kind === 'person' ? <PersonArt o={o} pose={bits?.personPose ?? 'sit'} /> : <PropArt o={o} />}</g>
      </Hot>
    );
  };

  const decor = (x: number, y: number, w: number, h: number, label: string, flash: string) => (
    <Hot key={label} x={x} y={y} w={w} h={h} label={label} onClick={() => onSpecial({ flash })} />
  );

  return (
    <svg className="roomsvg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="group" aria-label={VIEWS.find((v) => v.id === view)?.label}>
      <Defs />
      {view === 'ops' ? <OpsWall c={c} s={s} /> : bits!.back}
      {people.map(objHot)}
      {view === 'ops' ? opsMid(radioUnlocked(s, c)) : bits!.mid}
      {things.map(objHot)}

      {view === 'gate' && decor(400, 130, 800, 220, 'Departure board', `${c.flight} to Dubai: ${c.boardHold}.`)}
      {view === 'gate' && decor(90, 200, 190, 450, 'Staff door', 'Staff only. The door is locked.')}
      {view === 'win' && decor(1230, 180, 230, 450, 'Aircraft door', 'The aircraft door is closed until operations clears the flight.')}
      {view === 'win' && decor(150, 140, 1020, 440, 'Window', 'The aircraft is parked at the stand with its doors closed.')}
      {view === 'seat' && decor(1020, 120, 460, 190, c.map ? 'Holding point sign' : 'Coffee bar sign', c.map ? 'HOLDING POINT H2. Please wait here until your group is called.' : 'Coffee bar. Closed for the night.')}
      {view === 'bag' && decor(600, 130, 440, 430, 'Baggage service hatch', 'Baggage service. Closed to passengers.')}

      {view === 'ops' && (
        <>
          <Hot x={110} y={120} w={880} h={540} label="Evidence board" onClick={() => onSpecial('board')} hint={hints && Object.keys(s.events).length === 0 ? false : false} strong={strong} />
          <Hot x={960} y={600} w={170} h={220} label="Ledger clipboard" onClick={() => onSpecial('ledger')} hint={hints && !radioUnlocked(s, c)} strong={strong}>
            <g transform="translate(960 600) rotate(-4 85 110)">
              <rect x="0" y="0" width="170" height="220" rx="10" fill="#6b4a2e" stroke="#3a2818" strokeWidth="4" />
              <rect x="14" y="26" width="142" height="180" fill="#f1f4f7" /><rect x="52" y="8" width="66" height="26" rx="6" fill="#9aa4ad" />
              {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="26" y={52 + i * 24} width={i % 2 ? 90 : 110} height="6" fill="#9aa9b8" />)}
              <rect x="26" y="190" width="60" height="8" fill="#41c98a" opacity={Object.keys(s.ledgerOk).length ? 1 : 0} />
            </g>
          </Hot>
          <Hot x={1250} y={560} w={230} h={290} label="Radio" onClick={() => onSpecial('radio')} hint={hints && radioUnlocked(s, c)} strong={strong}>
            <g>
              <rect x="1300" y="560" width="14" height="150" rx="6" fill="#10161d" />
              <rect x="1340" y="600" width="90" height="190" rx="20" fill="#1c2635" stroke="#3a4c63" strokeWidth="4" />
              <rect x="1356" y="620" width="58" height="30" rx="4" fill="#04130c" /><rect x="1362" y="630" width="36" height="5" fill="#7dffb3" />
              {[0, 1, 2].map((i) => <rect key={i} x="1360" y={668 + i * 14} width="50" height="6" rx="3" fill="#0c141d" />)}
            </g>
          </Hot>
        </>
      )}
      <rect width="1600" height="900" fill="url(#vig)" pointerEvents="none" />
    </svg>
  );
}
