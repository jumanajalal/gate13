import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CASES, caseById } from './engine/cases';
import { initial, liveScore, reducer, LIMIT } from './engine/game';
import { loadSettings, saveSettings, type Settings } from './engine/store';
import { announce, silence, unlock, type Line } from './engine/pa';
import { setSfx, sfx } from './engine/sfx';
import { VIEWS } from './engine/layout';
import type { Obj, ViewId } from './engine/types';
import { Board } from './components/Board';
import { RoomSvg, type Special } from './components/Room';
import { Inspect } from './components/Inspect';
import { Dialogue } from './components/Dialogue';
import { Inventory } from './components/Inventory';
import { Ledger, Pinboard, Radio } from './components/Wall';
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

type Layer = { type: 'obj' | 'talk'; id: string } | { type: 'board' | 'ledger' | 'radio' };

function Game() {
  const [s, dispatch] = useReducer(reducer, initial);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [view, setView] = useState<ViewId>('gate');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [scan, setScan] = useState<null | 'envelope' | 'evidence'>(null);
  const [toast, setToast] = useState('');
  const [caption, setCaption] = useState<Line | null>(null);
  const [pulse, setPulse] = useState(false);
  const [, force] = useState(0);
  const lastCase = useRef('');
  const gameRef = useRef<HTMLDivElement>(null);
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

  const flash = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

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
      setLayers([]);
      say(s.result.win ? c.winPa : c.losePa, `${c.id}-${s.result.win ? 'win' : 'lose'}`);
    }
    if (s.phase === 'home') {
      silence();
      setCaption(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase]);

  // room sound effects
  const prev = useRef({ fails: 0, unlocked: 0, rows: 0, wrong: 0, events: 0 });
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
    prev.current = { fails, unlocked, rows, wrong: s.wrong, events };
  }, [s.lockFails, s.unlocked, s.ledgerOk, s.wrong, s.events]);

  const turn = useCallback((d: 1 | -1) => {
    setView((v) => {
      const i = VIEWS.findIndex((x) => x.id === v);
      return VIEWS[(i + d + VIEWS.length) % VIEWS.length].id;
    });
  }, []);

  // arrow keys turn the room when nothing is open
  useEffect(() => {
    if (s.phase !== 'play' || layers.length || scan) return;
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') turn(-1);
      if (e.key === 'ArrowRight') turn(1);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [s.phase, layers.length, scan, turn]);

  // keyboard shortcuts: Escape, I, M
  useEffect(() => {
    if (s.phase !== 'play') return;
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        if (layers.length) pop();
      } else if (e.key === 'i' || e.key === 'I') {
        if (!layers.length) {
          const btn = document.querySelector<HTMLButtonElement>('.inv button');
          if (btn) btn.focus();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!layers.length) push({ type: 'board' });
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [s.phase, layers.length]);

  const start = (caseId: string) => {
    unlock();
    lastCase.current = caseId;
    setView('gate');
    setLayers([]);
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

  const push = (l: Layer) => setLayers((ls) => [...ls, l]);
  const pop = () => setLayers((ls) => ls.slice(0, -1));

  const openObj = (o: Obj) => {
    dispatch({ type: 'OPEN', objId: o.id });
    push({ type: o.kind === 'person' ? 'talk' : 'obj', id: o.id });
  };

  const special = (sp: Special) => {
    if (typeof sp === 'object') return flash(sp.flash);
    push({ type: sp });
  };

  const hintNow = () => {
    dispatch({ type: 'HINT' });
    setPulse(true);
    window.setTimeout(() => setPulse(false), 5000);
  };

  const fullscreen = () => {
    const el = gameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
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
        setScan(null);
        openObj(o);
        return;
      }
    }
    flash('That card belongs to a different case.');
  };

  const status = s.phase === 'result'
    ? (s.outcome === 'cleared' ? c.boardLose : s.result?.win ? c.boardWin : c.boardLose)
    : s.phase === 'home' ? 'AWAITING INCIDENT FILE' : c.boardHold;
  const top = layers[layers.length - 1];
  const topObj = top && 'id' in top ? c.objects.find((o) => o.id === top.id) : undefined;
  const label = VIEWS.find((v) => v.id === view)!.label;

  return (
    <div className="game" ref={gameRef}>
      <Board
        flight={s.phase === 'home' ? 'GATE 13' : c.flight + ' · KOZHIKODE to DUBAI'}
        status={status}
        left={s.phase === 'home' || s.phase === 'intro' ? null : s.left}
        hold={s.phase !== 'result'}
        outcome={s.outcome}
      />

      {s.phase === 'play' && (
        <>
          <div className="stage">
            <div key={view} className="wallfade">
              <RoomSvg view={view} c={c} s={s} hints={settings.hotspots} strong={pulse} onObj={openObj} onSpecial={special} />
            </div>
            <button className="arrow left" aria-label="Turn left" onClick={() => turn(-1)}>‹</button>
            <button className="arrow right" aria-label="Turn right" onClick={() => turn(1)}>›</button>
            <div className="stagetop">
              <span className="score">Score {liveScore(s)}</span>
              <span className="tools">
                <button onClick={() => setScan('evidence')} aria-label="Scan a card">Scan</button>
                <button disabled={s.hints >= 2} onClick={hintNow}>Hint (-3)</button>
                <button onClick={fullscreen}>Fullscreen</button>
              </span>
            </div>
            <div className="viewbar">
              <span className="viewname">{label}</span>
              <span className="dots">
                {VIEWS.map((v) => (
                  <button key={v.id} className={'dotb' + (v.id === view ? ' on' : '')} aria-label={`Go to ${v.label}`} aria-current={v.id === view} onClick={() => setView(v.id)} />
                ))}
              </span>
            </div>
            {(s.banner || s.hints > 0) && (
              <div className="stagemsgs">
                {s.banner && <div className="msg warn" role="status">{s.banner}</div>}
                {[...Array(s.hints)].map((_, i) => <div className="msg" key={i}>Supervisor: {c.hints[i]}</div>)}
              </div>
            )}
            {/* Dialogue lives INSIDE .stage so it's contained within the room area */}
            {top?.type === 'talk' && topObj && (
              <Dialogue o={topObj} s={s} dispatch={dispatch} onClose={pop} />
            )}
          </div>
          <Inventory c={c} s={s} onOpen={openObj} />
        </>
      )}

      <main>
        {s.phase === 'home' && (
          <>
            <div className="home-screen">
              <div className="home-terminal">
                <div className="home-logo">
                  <span className="home-logo-mark">G13</span>
                  <div className="home-logo-text">
                    <span className="home-title">GATE 13</span>
                    <span className="home-sub">LAST CALL · INCIDENT INVESTIGATION</span>
                  </div>
                </div>
                <p className="home-brief">
                  The system says the passenger boarded. Her brother says she never reached the plane.
                  You have <strong>3 minutes</strong> before the aircraft is cleared. Everything here is fictional.
                </p>
                <div className="home-actions">
                  <button className="pri big home-start" onClick={draw}>▶ Begin Investigation</button>
                  <button className="home-scan" onClick={() => setScan('envelope')}>⬡ Scan Envelope QR</button>
                </div>
                <div className="home-howto">
                  <div className="home-howto-item"><span className="home-key">←→</span> Pan through Gate 13</div>
                  <div className="home-howto-item"><span className="home-key">Click</span> Inspect objects &amp; talk to witnesses</div>
                  <div className="home-howto-item"><span className="home-key">M</span> Open evidence board</div>
                  <div className="home-howto-item"><span className="home-key">Esc</span> Close any panel</div>
                </div>
                <div className="home-opts">
                  <label><input type="checkbox" checked={settings.sound} onChange={() => toggle('sound')} /> Sound</label>
                  <label><input type="checkbox" checked={settings.hotspots} onChange={() => toggle('hotspots')} /> Show hotspot hints</label>
                  <label><input type="checkbox" checked={settings.hard} onChange={() => toggle('hard')} /> Hard mode (+10 pts)</label>
                </div>
                <details className="home-facilitator">
                  <summary>Facilitator controls</summary>
                  <div className="home-facilitator-body">
                    {CASES.map((x) => (
                      <div key={x.id}><button onClick={() => start(x.id)}>{x.title}</button> <span className="mut">{x.tagline}</span></div>
                    ))}
                    <p><a href="#/props">Print evidence kit →</a></p>
                  </div>
                </details>
              </div>
            </div>
            <Leaderboard onChange={() => force((n) => n + 1)} />
          </>
        )}
        {s.phase === 'intro' && <Intro c={c} onBegin={() => dispatch({ type: 'BEGIN' })} />}
        {s.phase === 'result' && (s.result || s.outcome === 'cleared') && <Report s={s} c={c} dispatch={dispatch} />}
      </main>

      {s.phase === 'play' && top?.type === 'obj' && topObj && <Inspect o={topObj} c={c} s={s} dispatch={dispatch} onClose={pop} />}
      {s.phase === 'play' && top && (top.type === 'board' || top.type === 'ledger' || top.type === 'radio') && (
        <div className="layer" role="dialog" aria-modal="true" aria-label={top.type === 'board' ? 'Evidence board close-up' : top.type === 'ledger' ? 'Ledger close-up' : 'Radio close-up'} onClick={pop}>
          <div className="sheet wide zoom" onClick={(e) => e.stopPropagation()}>
            <div className="sheethead"><span /><button onClick={pop}>Close</button></div>
            {top.type === 'board' && <Pinboard s={s} c={c} />}
            {top.type === 'ledger' && <Ledger s={s} c={c} dispatch={dispatch} />}
            {top.type === 'radio' && <Radio s={s} c={c} dispatch={dispatch} />}
          </div>
        </div>
      )}

      {caption && (
        <div className="captions" aria-live="polite">
          {caption.en && <div>{caption.en}</div>}
          {caption.ml && <div lang="ml">{caption.ml}</div>}
          {caption.ar && <div lang="ar" dir="rtl">{caption.ar}</div>}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
      {scan && <Scanner title={scan === 'envelope' ? 'Scan the envelope QR' : 'Scan an evidence card'} onScan={onScan} onClose={() => setScan(null)} />}
    </div>
  );
}
