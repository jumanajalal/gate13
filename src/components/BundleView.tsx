import type { Bundle, CaseDef } from '../engine/types';
import { bundleDone, pinNode, type Action, type State } from '../engine/game';
import { MapView } from './MapView';

export function BundleView({ b, s, c, dispatch }: { b: Bundle; s: State; c: CaseDef; dispatch: (a: Action) => void }) {
  const done = bundleDone(s, c, b.id);
  const ans = s.answers[b.id];
  return (
    <div>
      {b.items.map((it) => {
        const open = s.opened[it.id];
        return (
          <div className="card" key={it.id}>
            <h3>{it.title}</h3>
            {open ? (
              <p dangerouslySetInnerHTML={{ __html: it.body }} />
            ) : (
              <button onClick={() => dispatch({ type: 'INSPECT', itemId: it.id })}>Inspect</button>
            )}
          </div>
        );
      })}
      {b.showMap && c.map && (
        <div className="card">
          <h3>Terminal map</h3>
          <MapView map={c.map} pin={pinNode(s, c)} />
        </div>
      )}
      {done && (
        <div className="card">
          <h3>{b.question.text}</h3>
          {b.question.options.map((o, i) => (
            <div key={o}>
              <button
                className={ans === i ? 'sel' : ''}
                disabled={ans !== undefined}
                onClick={() => dispatch({ type: 'ANSWER', bundleId: b.id, index: i })}
              >
                {o}
              </button>
            </div>
          ))}
          {ans !== undefined && (
            <p>{ans === b.question.answer ? 'Supported by the evidence (+10).' : 'Not supported. Reread the glossary and the records.'}</p>
          )}
        </div>
      )}
    </div>
  );
}
