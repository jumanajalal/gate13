import { useEffect, useState } from 'react';
import type { Obj } from '../engine/types';
import { askedFor, type Action, type State } from '../engine/game';
import { LOOKS, Portrait } from './art';

const reduced = () => typeof window.matchMedia === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useTypewriter(text: string) {
  const [n, setN] = useState(() => (reduced() ? text.length : 0));
  useEffect(() => {
    if (reduced()) return setN(text.length);
    setN(0);
    const id = window.setInterval(() => setN((x) => (x >= text.length ? x : x + 2)), 22);
    return () => window.clearInterval(id);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

/** Talk to a witness: portrait over the room, a name tab, a speech panel, and a short list of questions. */
export function Dialogue({ o, s, dispatch, onClose }: { o: Obj; s: State; dispatch: (a: Action) => void; onClose: () => void }) {
  const t = o.talk!;
  const done = askedFor(s, o.id);
  const last = done.length ? done[done.length - 1] : null;
  const line = last === null ? t.intro : t.qa[last].a;
  const { shown, done: typed, skip } = useTypewriter(line);
  const remaining = t.qa.map((q, qi) => ({ q, qi })).filter(({ qi }) => !done.includes(qi));
  return (
    <div className="dlg" role="dialog" aria-modal="true" aria-label={`Talking to ${t.who}`}>
      <button className="skipbtn" onClick={onClose}>Leave</button>
      <div className="portrait"><Portrait look={LOOKS[o.id] ?? LOOKS.relative} /></div>
      <div className="dlgpanel" onClick={skip}>
        <div className="nametab">{t.who} <span>{t.role}</span></div>
        {last !== null && <p className="you">You: {t.qa[last].q}</p>}
        <p className="said" aria-live="polite">{shown}{!typed && <span className="cursor">|</span>}</p>
        <div className="choices">
          {typed && remaining.map(({ q, qi }) => (
            <button key={qi} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'ASK', objId: o.id, qi }); }}>{q.q}</button>
          ))}
          {typed && remaining.length === 0 && <p className="mut">Nothing more to ask. Their account is pinned on the evidence board.</p>}
        </div>
      </div>
    </div>
  );
}
