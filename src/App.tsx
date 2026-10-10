import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CASES, caseById } from './engine/cases';
import { initial, liveScore, reducer, LIMIT } from './engine/game';
import { addEntry, loadBoard, loadSettings, saveSettings, type Settings } from './engine/store';
import { announce, silence, unlock, type Line } from './engine/pa';
import { Board } from './components/Board';
import { BundleView } from './components/BundleView';
import { Timeline } from './components/Timeline';
import { Decision } from './components/Decision';
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
  const [tab, setTab] = useState<'A' | 'B' | 'C'>('A');
  const [scan, setScan] = useState<null | 'envelope' | 'evidence'>(null);
  const [toast, setToast] = useState('');
  const [caption, setCaption] = useState<Line | null>(null);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [, force] = useState(0);
  const lastCase = useRef('');
  const c = caseById(s.caseId);

  const say = useCallback(
    (line: Line, key?: string) => {
      setCaption(line);
      void announce(line, settings.sound, key);
      window.setTimeout(() => setCaption((cur) => (cur === line ? null : cur)), 12000);
    },
    [settings.sound],
  );

  // 1 second clock
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
      say(s.result.win ? c.winPa : c.losePa, `${c.id}-${s.result.win ? 'win' : 'lose'}`);
      setSaved(false);
      setName(`Team ${loadBoard().length + 1}`);
    }
    if (s.phase === 'home') {
      silence();
      setCaption(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase]);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2500);
  };

  const start = (caseId: string) => {
    unlock();
    lastCase.current = caseId;
    setTab('A');
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

  const onScan = (payload: string) => {
    const parts = payload.split(':');
    if (parts[0] !== 'g13') return flash('Not a Gate 13 code.');
    if (scan === 'envelope' && parts[1] === 'case') {
      if (CASES.some((x) => x.id === parts[2])) start(parts[2]);
      else flash('Unknown case.');
      return;
    }
    if (scan === 'evidence' && parts[1] === c.id) {
      const b = c.bundles.find((x) => x.items.some((i) => i.id === parts[2]));
      const it = b?.items.find((i) => i.id === parts[2]);
      if (b && it) {
        dispatch({ type: 'INSPECT', itemId: it.id });
        setTab(b.id);
        flash(`Added: ${it.title}`);
        setScan(null);
        return;
      }
    }
    flash('That card belongs to a different case.');
  };

  const status = s.phase === 'result' ? (s.result?.win ? c.boardWin : c.boardLose) : s.phase === 'play' ? c.boardHold : 'AWAITING INCIDENT FILE';

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
            <p>
              Travel records say one thing. People say another. You have {LIMIT / 60} minutes to work out what the records really prove, then tell operations what to do. Everything here is fictional.
            </p>
            <button className="pri big" onClick={draw}>Draw an envelope</button>
            <button onClick={() => setScan('envelope')}>Scan an envelope QR</button>
            <div className="card opts">
              <label>
                <input type="checkbox" checked={settings.sound} onChange={() => toggle('sound')} /> Sound and announcements
              </label>
              <label>
                <input type="checkbox" checked={settings.hard} onChange={() => toggle('hard')} /> Hard mode: the passenger can move (+10 points)
              </label>
            </div>
            <details>
              <summary>Facilitator: pick a case, print props</summary>
              <div className="card">
                {CASES.map((x) => (
                  <div key={x.id}>
                    <button onClick={() => start(x.id)}>{x.title}</button> <span className="mut">{x.tagline}</span>
                  </div>
                ))}
                <p>
                  <a href="#/props">Open the printable evidence kit</a>
                </p>
              </div>
            </details>
            <Leaderboard onChange={() => force((n) => n + 1)} />
          </>
        )}

        {s.phase === 'play' && (
          <>
            <p className="intro">{c.intro}</p>
            <div className="row">
              <button onClick={() => setScan('evidence')}>Scan evidence card</button>
              <span className="score">Score {liveScore(s)}</span>
            </div>
            {s.banner && <div className="msg warn" role="status">{s.banner}</div>}
            <div className="tabs" role="tablist">
              {c.bundles.map((b) => (
                <button key={b.id} role="tab" aria-selected={tab === b.id} className={tab === b.id ? 'sel' : ''} onClick={() => setTab(b.id)}>
                  {b.title}
                  {s.answers[b.id] !== undefined ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <BundleView b={c.bundles.find((b) => b.id === tab)!} s={s} c={c} dispatch={dispatch} />
            <Timeline s={s} c={c} />
            <Decision s={s} c={c} dispatch={dispatch} />
            <div className="row">
              <button disabled={s.hints >= 2} onClick={() => dispatch({ type: 'HINT' })}>
                Hint (-3)
              </button>
            </div>
            {[...Array(s.hints)].map((_, i) => (
              <div className="msg" key={i}>{c.hints[i]}</div>
            ))}
          </>
        )}

        {s.phase === 'result' && s.result && (
          <>
            <h1>{s.result.win ? 'Good call.' : 'Time ran out.'}</h1>
            <div className="card">
              <p>{s.result.win ? c.winText : c.loseText}</p>
            </div>
            <div className="card">
              <h3>Score: {s.result.total}</h3>
              <table>
                <tbody>
                  <tr><td>Evidence</td><td className="num">+{s.result.evidence}</td></tr>
                  <tr><td>Decision</td><td className="num">+{s.result.decision}</td></tr>
                  <tr><td>Speed</td><td className="num">+{s.result.speed}</td></tr>
                  {s.hard && <tr><td>Hard mode</td><td className="num">+{s.result.hardBonus}</td></tr>}
                  <tr><td>Hints</td><td className="num">-{s.result.hints}</td></tr>
                  <tr><td>Wrong checks</td><td className="num">-{s.result.wrong}</td></tr>
                </tbody>
              </table>
              {!saved ? (
                <>
                  <p className="lbl">Team name</p>
                  <input value={name} maxLength={20} onChange={(e) => setName(e.target.value.replace(/[<>&]/g, ''))} aria-label="Team name" />
                  <button
                    className="pri"
                    onClick={() => {
                      addEntry({ name: name.trim() || 'Team', points: s.result!.total, caseId: s.caseId, hard: s.hard, at: Date.now() });
                      setSaved(true);
                    }}
                  >
                    Save to leaderboard
                  </button>
                </>
              ) : (
                <p>Saved.</p>
              )}
            </div>
            <button onClick={() => dispatch({ type: 'HOME' })}>Back to start</button>
          </>
        )}
      </main>

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
