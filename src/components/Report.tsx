import { useState } from 'react';
import type { CaseDef } from '../engine/types';
import type { Action, State } from '../engine/game';
import { addEntry, loadBoard } from '../engine/store';

/** Debrief as a stamped incident report: what the records proved, row by row. */
export function Report({ s, c, dispatch }: { s: State; c: CaseDef; dispatch: (a: Action) => void }) {
  const r = s.result!;
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(() => `Team ${loadBoard().length + 1}`);
  return (
    <section className="report" aria-label="Incident report">
      <div className={'bigstamp ' + (r.win ? 'win' : 'lose')}>{r.win ? 'RESOLVED' : 'UNRESOLVED'}</div>
      <h1>Incident report: {c.title}</h1>
      <p>{r.win ? c.winText : c.loseText}</p>
      <h2>What the records proved</h2>
      <table>
        <tbody>
          {c.ledger.map((row) => (
            <tr key={row.id}>
              <td><b>{row.label}</b><br /><span className="mut">{row.why}</span></td>
              <td className="num"><b>{row.answer}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Score: {r.total}</h2>
      <table>
        <tbody>
          <tr><td>Ledger</td><td className="num">+{r.evidence}</td></tr>
          <tr><td>Radio call</td><td className="num">+{r.decision}</td></tr>
          <tr><td>Speed</td><td className="num">+{r.speed}</td></tr>
          {s.hard && <tr><td>Hard mode</td><td className="num">+{r.hardBonus}</td></tr>}
          <tr><td>Hints</td><td className="num">-{r.hints}</td></tr>
          <tr><td>Wrong radio calls</td><td className="num">-{r.wrong}</td></tr>
        </tbody>
      </table>
      {!saved ? (
        <div className="savebox">
          <p className="lbl">Team name</p>
          <input value={name} maxLength={20} aria-label="Team name" onChange={(e) => setName(e.target.value.replace(/[<>&]/g, ''))} />
          <button className="pri" onClick={() => { addEntry({ name: name.trim() || 'Team', points: r.total, caseId: s.caseId, hard: s.hard, at: Date.now() }); setSaved(true); }}>Save to leaderboard</button>
        </div>
      ) : <p>Saved to the leaderboard.</p>}
      <button onClick={() => dispatch({ type: 'HOME' })}>Back to start</button>
    </section>
  );
}
