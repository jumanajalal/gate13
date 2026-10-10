import { useEffect, useRef, useState } from 'react';
import type { CaseDef, Obj } from '../engine/types';
import { askedFor, type Action, type State } from '../engine/game';
import { MapView } from './MapView';
import { Typed } from './Typed';

function Artifact({ o, c }: { o: Obj; c: CaseDef }) {
  switch (o.kind) {
    case 'pass':
      return (
        <div className="pass">
          <div className="pass-top"><b>MALABAR AIR</b><span>BOARDING PASS</span></div>
          <dl>{(o.fields ?? []).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <div className="barcode" aria-hidden />
        </div>
      );
    case 'terminal':
      return <div className="term"><Typed lines={o.lines ?? []} /></div>;
    case 'paper':
    case 'clock':
      return (
        <div className={o.kind === 'clock' ? 'paper clockcard' : 'paper'}>
          <h3>{o.heading}</h3>
          {(o.lines ?? []).map((l, i) => <p key={i}>{l}</p>)}
        </div>
      );
    case 'receipt':
      return (
        <div className="receipt">
          <h3>{o.heading}</h3>
          {(o.lines ?? []).map((l, i) => <p key={i}>{l}</p>)}
          {o.note && <p className="rnote">{o.note}</p>}
        </div>
      );
    case 'tag':
      return (
        <div className="bagtag">
          <div className="hole" aria-hidden />
          <h3>{o.heading}</h3>
          <dl>{(o.fields ?? []).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      );
    case 'map':
      return (
        <div className="paper blueprint">
          {c.map && <MapView map={c.map} />}
          {o.note && <p>{o.note}</p>}
        </div>
      );
    default:
      return null;
  }
}

function LockPanel({ o, s, dispatch }: { o: Obj; s: State; dispatch: (a: Action) => void }) {
  const [code, setCode] = useState('');
  const fails = s.lockFails[o.id] ?? 0;
  const submit = () => code.trim() && dispatch({ type: 'UNLOCK', objId: o.id, code });
  return (
    <div className="term lockp">
      <div className="tl">{o.lock!.prompt}</div>
      <input
        key={fails}
        className={fails ? 'shake' : ''}
        aria-label="Code"
        placeholder={o.lock!.placeholder}
        value={code}
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button className="pri" onClick={submit}>Unlock</button>
      {fails > 0 && <div className="tl bad">ACCESS DENIED. {o.lock!.hint}</div>}
      {fails === 0 && <div className="tl dim">{o.lock!.hint}</div>}
    </div>
  );
}

function Dialogue({ o, s, dispatch }: { o: Obj; s: State; dispatch: (a: Action) => void }) {
  const t = o.talk!;
  const done = askedFor(s, o.id);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView?.({ block: 'nearest' }), [done.length]);
  return (
    <div className="talk">
      <div className="who">
        <span className="avatar big">{t.who[0]}</span>
        <div><b>{t.who}</b><div className="mut">{t.role}</div></div>
      </div>
      <div className="bubble them">{t.intro}</div>
      {done.map((qi) => (
        <div key={qi}>
          <div className="bubble me">{t.qa[qi].q}</div>
          <div className="bubble them">{t.qa[qi].a}</div>
        </div>
      ))}
      <div ref={end} />
      <div className="asks">
        {t.qa.map((q, qi) => !done.includes(qi) && (
          <button key={qi} onClick={() => dispatch({ type: 'ASK', objId: o.id, qi })}>{q.q}</button>
        ))}
        {done.length === t.qa.length && <p className="mut">Nothing more to ask. Their account is pinned on the wall.</p>}
      </div>
    </div>
  );
}

export function Inspect({ o, c, s, dispatch, onClose }: { o: Obj; c: CaseDef; s: State; dispatch: (a: Action) => void; onClose: () => void }) {
  const locked = !!o.lock && !s.unlocked[o.id];
  const pins = locked ? 0 : (o.events?.length ?? 0);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={o.title} onClick={onClose}>
      <div className="sheet zoom" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>{o.title}</h2>
          <button onClick={onClose}>Close</button>
        </div>
        {o.kind === 'person' ? <Dialogue o={o} s={s} dispatch={dispatch} /> : locked ? <LockPanel o={o} s={s} dispatch={dispatch} /> : <Artifact o={o} c={c} />}
        {pins > 0 && <p className="pinned">{pins === 1 ? '1 fact' : pins + ' facts'} pinned to the evidence wall.</p>}
      </div>
    </div>
  );
}
