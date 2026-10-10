import { useLayoutEffect, useRef, useState } from 'react';
import type { CaseDef } from '../engine/types';
import { detectConflicts, radioUnlocked, type Action, type State } from '../engine/game';
import { MapView } from './MapView';

interface Line { k: string; x1: number; y1: number; x2: number; y2: number }

export function Pinboard({ s, c }: { s: State; c: CaseDef }) {
  const events = Object.values(s.events).sort((a, b) => (b.t ?? 0) - (a.t ?? 0));
  const board = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const conflicted = new Set(c.conflicts.filter((x) => s.events[x.a] && s.events[x.b]).flatMap((x) => [x.a, x.b]));

  useLayoutEffect(() => {
    const calc = () => {
      const b = board.current;
      if (!b) return;
      const br = b.getBoundingClientRect();
      const out: Line[] = [];
      for (const x of c.conflicts) {
        const a = refs.current[x.a];
        const z = refs.current[x.b];
        if (a && z && s.events[x.a] && s.events[x.b]) {
          const ar = a.getBoundingClientRect();
          const zr = z.getBoundingClientRect();
          out.push({ k: x.a + x.b, x1: ar.left - br.left + ar.width / 2, y1: ar.top - br.top + 10, x2: zr.left - br.left + zr.width / 2, y2: zr.top - br.top + 10 });
        }
      }
      setLines(out);
      setDim({ w: br.width, h: br.height });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [s.events, c]);

  const notes = detectConflicts(s.events, c);
  return (
    <section aria-label="Evidence wall">
      <div className="pinboard" ref={board}>
        {events.length === 0 && <p className="mut emptywall">Nothing pinned yet. Inspect objects on the desk and talk to the witnesses.</p>}
        {events.map((e, i) => {
          const bad = conflicted.has(e.key);
          const cls = bad ? 'c-bad' : e.status === 'confirmed' ? 'c-ok' : 'c-un';
          const word = bad ? 'CONFLICT' : e.status === 'confirmed' ? 'CONFIRMED' : 'UNCONFIRMED';
          const when = e.when ?? (e.t === null ? '' : `T-${e.t}`);
          return (
            <div key={e.key} className={'card pin' + (bad ? ' bad' : '')} ref={(el) => { refs.current[e.key] = el; }} style={{ transform: `rotate(${((i * 37) % 5) - 2}deg)` }}>
              <span className="tack" aria-hidden />
              <b>{when}</b>
              <p>{e.label}</p>
              <span className={'chip ' + cls}>{word}</span>
            </div>
          );
        })}
        {dim.w > 0 && (
          <svg className="strings" width={dim.w} height={dim.h} viewBox={`0 0 ${dim.w} ${dim.h}`} aria-hidden>
            {lines.map((l) => <line key={l.k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
          </svg>
        )}
      </div>
      {notes.map((n) => <p key={n} className="c-bad strong" role="status">{n}</p>)}
    </section>
  );
}

export function Ledger({ s, c, dispatch }: { s: State; c: CaseDef; dispatch: (a: Action) => void }) {
  return (
    <section aria-label="Operations ledger">
      <h2>Operations ledger</h2>
      <div className="form">
        <p className="mut">Record only what the evidence confirms. Operations checks every row.</p>
        {c.ledger.map((r) => {
          const ok = !!s.ledgerOk[r.id];
          const val = s.ledger[r.id] ?? '';
          return (
            <div className={'lrow' + (ok ? ' ok' : '')} key={r.id}>
              <div className="llabel">{r.label}</div>
              {r.kind === 'choice' ? (
                <div className="seg">
                  {r.options.map((o) => (
                    <button key={o} disabled={ok} aria-pressed={val === o} className={val === o ? 'sel' : ''} onClick={() => dispatch({ type: 'SET_ROW', rowId: r.id, value: o })}>{o}</button>
                  ))}
                </div>
              ) : (
                <input aria-label={r.label} inputMode="numeric" placeholder="HH:MM" value={val} disabled={ok} onChange={(e) => dispatch({ type: 'SET_ROW', rowId: r.id, value: e.target.value })} />
              )}
              {ok && <span className="stamp">VERIFIED</span>}
            </div>
          );
        })}
        <button className="pri" onClick={() => dispatch({ type: 'FILE_LEDGER' })} disabled={radioUnlocked(s, c)}>
          File ledger
        </button>
        {s.ledgerMsg && <div className={'msg' + (radioUnlocked(s, c) ? ' good' : '')} role="status">{s.ledgerMsg}</div>}
      </div>
    </section>
  );
}

export function Radio({ s, c, dispatch }: { s: State; c: CaseDef; dispatch: (a: Action) => void }) {
  const open = radioUnlocked(s, c);
  const [g0, g1] = c.decision.groups;
  return (
    <section aria-label="Radio to operations">
      <h2>Radio to operations</h2>
      <div className={'radio' + (open ? '' : ' off')}>
        {!open ? (
          <p>RADIO LOCKED. File a correct ledger first.</p>
        ) : (
          <>
            <p className="lbl">{g0.title}</p>
            <div className="seg">
              {g0.options.map((o) => (
                <button key={o.id} aria-pressed={s.picks[0] === o.id} className={s.picks[0] === o.id ? 'sel' : ''} onClick={() => dispatch({ type: 'PICK', group: 0, value: o.id })}>{o.label}</button>
              ))}
            </div>
            <p className="lbl">{g1.title}</p>
            {c.map ? (
              <div className="radiomap">
                <MapView map={c.map} pin={s.hard && s.movesApplied ? (c.moves ?? [])[s.movesApplied - 1]?.loc : null} pickable={g1.options.map((o) => o.id)} picked={s.picks[1]} onPick={(id) => dispatch({ type: 'PICK', group: 1, value: id })} />
              </div>
            ) : (
              <div className="seg">
                {g1.options.map((o) => (
                  <button key={o.id} aria-pressed={s.picks[1] === o.id} className={s.picks[1] === o.id ? 'sel' : ''} onClick={() => dispatch({ type: 'PICK', group: 1, value: o.id })}>{o.label}</button>
                ))}
              </div>
            )}
            <button className="pri big" disabled={!s.picks[0] || !s.picks[1]} onClick={() => dispatch({ type: 'SUBMIT' })}>Transmit</button>
          </>
        )}
        {s.msg && <div className="msg" role="alert">{s.msg}</div>}
      </div>
    </section>
  );
}
