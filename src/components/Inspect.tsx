import { useState } from 'react';
import type { CaseDef, Obj } from '../engine/types';
import { CARRYABLE } from '../engine/layout';
import type { Action, State } from '../engine/game';
import { MapView } from './MapView';
import { Typed } from './Typed';

function ManualScanField({ o, dispatch }: { o: Obj; dispatch: (a: Action) => void }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const alias = o.manualAlias!;

  const tryMatch = () => {
    if (val.trim().toUpperCase() === alias.toUpperCase()) {
      setConfirmed(true);
      dispatch({ type: 'OPEN', objId: o.id });
      setErr(false);
    } else {
      setErr(true);
    }
  };

  if (confirmed) {
    return (
      <div className="term manualfield">
        <div className="tl ok">&gt; ARTIFACT REGISTERED — {alias}</div>
        <div className="tl dim">&gt; Facts pinned to evidence board.</div>
      </div>
    );
  }

  return (
    <div className="term manualfield">
      <div className="tl dim">&gt; Enter reference code to register this artifact</div>
      <div className="tl dim">Expected format: {alias}</div>
      <input
        className={err ? 'shake' : ''}
        key={err ? 'err' : 'ok'}
        aria-label="Reference code"
        placeholder={alias}
        value={val}
        autoComplete="off"
        autoCapitalize="characters"
        onChange={(e) => { setVal(e.target.value); setErr(false); }}
        onKeyDown={(e) => e.key === 'Enter' && tryMatch()}
      />
      <button className="pri" onClick={tryMatch}>&gt; REGISTER</button>
      {err && <div className="tl bad">&gt; REFERENCE MISMATCH. Check the printed artifact.</div>}
    </div>
  );
}

function Artifact({ o, c, s }: { o: Obj; c: CaseDef; s: State }) {
  switch (o.kind) {
    case 'pass':
      return (
        <div className="pass" style={{ position: 'relative' }}>
          <div className="pass-watermark" aria-hidden>MALABAR AIR</div>
          <div className="pass-top"><b>MALABAR AIR</b><span>BOARDING PASS</span></div>
          <dl>{(o.fields ?? []).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <div className="barcode" aria-hidden />
        </div>
      );
    case 'terminal':
      return (
        <div className="term" style={{ position: 'relative' }}>
          <div className="scanlines" aria-hidden />
          <Typed lines={o.lines ?? []} />
        </div>
      );
    case 'paper':
      return (
        <div className="paper" style={{ position: 'relative' }}>
          <div className="op-stamp" aria-hidden>OPERATIONAL UPDATE</div>
          <h3>{o.heading}</h3>
          {(o.lines ?? []).map((l, i) => <p key={i}>{l}</p>)}
        </div>
      );
    case 'clock':
      return (
        <div className="paper clockcard">
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
          {c.map && <MapView map={c.map} overlay={s.mapOverlay} />}
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

export function Inspect({ o, c, s, dispatch, onClose }: { o: Obj; c: CaseDef; s: State; dispatch: (a: Action) => void; onClose: () => void }) {
  const locked = !!o.lock && !s.unlocked[o.id];
  const pins = locked ? 0 : (o.events?.length ?? 0);
  // Show the manual fallback when the object has a manualAlias, is not locked, and has
  // not yet been opened. We do NOT gate on s.opened here to preserve the ManualScanField's
  // local "confirmed" display state — it handles its own post-dispatch visibility.
  // openObj in App.tsx defers the OPEN dispatch for manualAlias objects so s.opened[o.id]
  // remains false when this component first renders from a room click.
  const showManual = !!(o.manualAlias && !s.opened[o.id] && !locked);
  return (
    <div className="layer" role="dialog" aria-modal="true" aria-label={o.title} onClick={onClose}>
      <div className="sheet zoom" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>{o.title}</h2>
          <button onClick={onClose}>Close</button>
        </div>
        {locked ? <LockPanel o={o} s={s} dispatch={dispatch} /> : <Artifact o={o} c={c} s={s} />}
        {CARRYABLE.includes(o.kind) && <p className="pinned">Added to your inventory.</p>}
        {pins > 0 && <p className="pinned">{pins === 1 ? '1 fact' : pins + ' facts'} pinned to the evidence board.</p>}
        {showManual && (
          <details className="manualentry">
            <summary>Enter reference code manually</summary>
            <ManualScanField o={o} dispatch={dispatch} />
          </details>
        )}
      </div>
    </div>
  );
}
