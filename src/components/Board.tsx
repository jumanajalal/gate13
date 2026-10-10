export function Flap({ text }: { text: string }) {
  return (
    <span className="flap" aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={text + i} className="ch" aria-hidden style={{ animationDelay: `${Math.min(i * 16, 640)}ms` }}>
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  );
}

export function Board({ flight, status, left, hold }: { flight: string; status: string; left: number | null; hold: boolean }) {
  const l = Math.max(0, left ?? 0);
  const clock = left === null ? '' : `${Math.floor(l / 60)}:${('0' + (l % 60)).slice(-2)}`;
  return (
    <header className={'board' + (hold ? ' hold' : '')}>
      <div className="row">
        <span>{flight}</span>
        <span className={'clock' + (left !== null && l <= 30 ? ' low' : '')} aria-live="off">
          {clock}
        </span>
      </div>
      <small>Malabar Air (fictional) · Gate 13</small>
      <div className="st" role="status">
        <Flap text={status} />
      </div>
    </header>
  );
}
