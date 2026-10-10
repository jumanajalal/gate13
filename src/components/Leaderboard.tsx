import { caseById } from '../engine/cases';
import { clearBoard, loadBoard } from '../engine/store';

export function Leaderboard({ onChange }: { onChange: () => void }) {
  const rows = loadBoard().slice(0, 10);
  return (
    <section aria-label="Leaderboard">
      <h2>Leaderboard</h2>
      <div className="card">
        {rows.length === 0 ? (
          <p>No scores yet. Be the first.</p>
        ) : (
          <table>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.at + r.name}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{caseById(r.caseId).title}{r.hard ? ' (hard)' : ''}</td>
                  <td className="num">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear the whole leaderboard?')) {
                clearBoard();
                onChange();
              }
            }}
          >
            Reset board
          </button>
        )}
      </div>
    </section>
  );
}
