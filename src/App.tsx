import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CASES, caseById } from './engine/cases';
import { initial, liveScore, reducer, LIMIT } from './engine/game';
import { loadBoard, loadSettings, saveSettings, type Settings } from './engine/store';
import { announce, silence, unlock, type Line } from './engine/pa';
import { setSfx, sfx } from './engine/sfx';
import type { Obj } from './engine/types';
import { Board } from './components/Board';
import { Desk } from './components/Desk';
import { Inspect } from './components/Inspect';
import { Wall } from './components/Wall';
import { Intro } from './components/Intro';
import { Report } from './components/Report';
import { Leaderboard } from './components/Leaderboard';
import { Scanner } from './components/Scanner';
import Props from './components/Props';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const f = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route.startsWith('#/props') ? <Props /> : <Game />;
}

function Game() {
  const [s, dispatch] = useReducer(reducer, initial);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [room, setRoom] = useState<'desk' | 'wall'>('desk');
  const [openId, setOpenId] = useState<string | null>(null);
  const [scan, setScan] = useState<null | 'envelope' | 'evidence'>(null);
  const [toast, setToast] = useState('');
  const [caption, setCaption] = useState<Line | null>(null);
  const [, force] = useState(0);
  const lastCase = useRef('');
  const c = caseById(s.caseId);
  setSfx(settings.sound);

  const say = useCallback(
    (line: Line, key?: string) => {
      setCaption(line);
      void announce(line, settings.sound, key);
      window.setTimeout(() => setCaption((cur) => (cur === line ? null : cur)), 12000);
    },
    [settings.sound],
  );

  // 1 second clock (only while playing; the cold open is untimed)
  useEffect(() => {
    if (s.phase !== 'play') return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(id);
  }, [s.phase]);

  // scheduled PA announcements
  useEffect(() => {
    if (s.phase !== 'play') return;
    const line = c.pa.find((p) => p.atLeft === s.left);
    if (line) say(line, `${c.id}-${line.atLeft}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.left, s.phase]);

  // the passenger moved (hard mode)
  useEffect(() => {
    if (s.phase === 'play' && s.banner) say({ en: s.banner });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.banner]);

  // outcome announcement
  useEffect(() => {
    if (s.phase === 'result' && s.result) {
      setOpenId(null);
      say(s.result.win ? c.winPa : c.losePa, `${c.id}-${s.result.win ? 'win' : 'lose'}`);
    }
    if (s.phase === 'home') {
      silence();
      setCaption(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase]);

  // room sound effects
  const prev = useRef({ fails: 0, unlocked: 0, rows: 0, wrong: 0, events: 0, conflicts: 0 });
  useEffect(() => {
    const p = prev.current;
    const fails = Object.values(s.lockFails).reduce((a, b) => a + b, 0);
    const unlocked = Object.keys(s.unlocked).length;
    const rows = Object.keys(s.ledgerOk).length;
    const events = Object.keys(s.events).length;
    if (fails > p.fails) sfx.denied();
    else if (unlocked > p.unlocked) sfx.granted();
    else if (rows > p.rows) sfx.stamp();
    else if (s.wrong > p.wrong) sfx.denied();
    else if (events > p.events) sfx.open();
    prev.current = { fails, unlocked, rows, wrong: s.wrong, events, conflicts: 0 };
  }, [s.lockFails, s.unlocked, s.ledgerOk, s.wrong, s.events]);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2500);
  };

  const start = (caseId: string) => {
    unlock();
    lastCase.current = caseId;
    setRoom('desk');
    setOpenId(null);
    setScan(null);
    dispatch({ type: 'START', caseId, hard: settings.hard });
  };

  const draw = () => {
    const pool = CASES.filter((x) => x.id !== lastCase.current);
    start(pool[Math.floor(Math.random() * pool.length)].id);
  };

  const toggle = (k: keyof Settings) => {
    const n = { ...settings, [k]: !settings[k] };
    setSettings(n);
    saveSettings(n);
  };

  const openObj = (o: Obj) => {
    dispatch({ type: 'OPEN', objId: o.id });
    setOpenId(o.id);
  };

  const onScan = (payload: string) => {
    const parts = payload.split(':');
    if (parts[0] !== 'g13') return flash('Not a Gate 13 code.');
    if (scan === 'envelope' && parts[1] === 'case') {
      if (CASES.some((x) => x.id === parts[2])) start(parts[2]);
      else flash('Unknown case.');
      return;
    }
    if (scan === 'evidence' && parts[1] === c.id) {
      const o = c.objects.find((x) => x.id === parts[2]);
      if (o) {
        setRoom('desk');
        openObj(o);
        setScan(null);
        return;
      }
    }
    flash('That card belongs to a different case.');
  };

  const status = s.phase === 'result' ? (s.result?.win ? c.boardWin : c.boardLose) : s.phase === 'home' ? 'AWAITING INCIDENT FILE' : c.boardHold;
  const openObjDef = c.objects.find((o) => o.id === openId) ?? null;
  const pinned = Object.keys(s.events).length;

  return (
    <>
      <Board
        flight={s.phase === 'home' ? 'GATE 13' : c.flight + ' · KOZHIKODE to DUBAI'}
        status={status}
        left={s.phase === 'home' ? null : s.left}
        hold={s.phase !== 'result'}
      />
      <main>
        {s.phase === 'home' && (
          <>
            <h1>Last call at Gate 13</h1>
            <p className="lede">
              The system says one thing. The people say another. You have {LIMIT / 60} minutes to search the gate, pin the facts on the wall, work out what the records really prove, and radio operations. Everything here is fictional.
            </p>
            <ol className="how">
              <li><b>Search the desk.</b> Open props, crack locked terminals, question witnesses.</li>
              <li><b>Read the wall.</b> Facts pin themselves. Contradictions get a red string.</li>
              <li><b>File the ledger, then radio.</b> The radio only unlocks when your ledger is right.</li>
            </ol>
            <button className="pri big" onClick={draw}>Draw an envelope</button>
            <button onClick={() => setScan('envelope')}>Scan an envelope QR</button>
            <div className="card opts">
              <label><input type="checkbox" checked={settings.sound} onChange={() => toggle('sound')} /> Sound and announcements</label>
              <label><input type="checkbox" checked={settings.hard} onChange={() => toggle('hard')} /> Hard mode: the passenger can move (+10 points)</label>
            </div>
            <details>
              <summary>Facilitator: pick a case, print props</summary>
              <div className="card">
                {CASES.map((x) => (
                  <div key={x.id}><button onClick={() => start(x.id)}>{x.title}</button> <span className="mut">{x.tagline}</span></div>
                ))}
                <p><a href="#/props">Open the printable evidence kit</a></p>
              </div>
            </details>
            <Leaderboard onChange={() => force((n) => n + 1)} />
          </>
        )}

        {s.phase === 'intro' && <Intro c={c} onBegin={() => dispatch({ type: 'BEGIN' })} />}

        {s.phase === 'play' && (
          <>
            <div className="rooms" role="tablist" aria-label="Rooms">
              <button role="tab" aria-selected={room === 'desk'} className={room === 'desk' ? 'sel' : ''} onClick={() => setRoom('desk')}>Gate desk</button>
              <button role="tab" aria-selected={room === 'wall'} className={room === 'wall' ? 'sel' : ''} onClick={() => setRoom('wall')}>Evidence wall ({pinned})</button>
            </div>
            <div className="row">
              <button onClick={() => setScan('evidence')}>Scan a card</button>
              <span className="score">Score {liveScore(s)}</span>
              <button disabled={s.hints >= 2} onClick={() => dispatch({ type: 'HINT' })}>Hint (-3)</button>
            </div>
            {s.banner && <div className="msg warn" role="status">{s.banner}</div>}
            {[...Array(s.hints)].map((_, i) => <div className="msg" key={i}>Supervisor: {c.hints[i]}</div>)}
            {room === 'desk' ? <Desk c={c} s={s} onOpen={openObj} /> : <Wall s={s} c={c} dispatch={dispatch} />}
            {room === 'desk' && <p className="mut center">Tip: facts you find are pinned on the evidence wall automatically.</p>}
          </>
        )}

        {s.phase === 'result' && s.result && <Report s={s} c={c} dispatch={dispatch} />}
      </main>

      {openObjDef && s.phase === 'play' && <Inspect o={openObjDef} c={c} s={s} dispatch={dispatch} onClose={() => setOpenId(null)} />}
      {caption && (
        <div className="captions" aria-live="polite">
          {caption.en && <div>{caption.en}</div>}
          {caption.ml && <div lang="ml">{caption.ml}</div>}
          {caption.ar && <div lang="ar" dir="rtl">{caption.ar}</div>}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
      {scan && <Scanner title={scan === 'envelope' ? 'Scan the envelope QR' : 'Scan an evidence card'} onScan={onScan} onClose={() => setScan(null)} />}
    </>
  );
}
