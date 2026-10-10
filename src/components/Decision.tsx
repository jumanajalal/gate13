import type { CaseDef } from '../engine/types';
import type { Action, State } from '../engine/game';

export function Decision({ s, c, dispatch }: { s: State; c: CaseDef; dispatch: (a: Action) => void }) {
  return (
    <section aria-label="Your call">
      <h2>Your call</h2>
      <div className="card">
        {c.decision.groups.map((g, gi) => (
          <div key={g.title}>
            <p className="lbl">{g.title}</p>
            {g.options.map((o) => (
              <button
                key={o.id}
                className={s.picks[gi] === o.id ? 'sel' : ''}
                aria-pressed={s.picks[gi] === o.id}
                onClick={() => dispatch({ type: 'PICK', group: gi as 0 | 1, value: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
        ))}
        <div>
          <button className="pri" disabled={!s.picks[0] || !s.picks[1]} onClick={() => dispatch({ type: 'SUBMIT' })}>
            Submit decision
          </button>
        </div>
      </div>
      {s.msg && <div className="msg" role="alert">{s.msg}</div>}
    </section>
  );
}
