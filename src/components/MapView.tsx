import type { MapDef } from '../engine/types';

interface Props {
  map: MapDef;
  /** Hard mode: where a staff update last reported the passenger. */
  pin?: string | null;
  /** Node ids the player may tap (radio map). */
  pickable?: string[];
  picked?: string | null;
  onPick?: (id: string) => void;
}

export function MapView({ map, pin, pickable = [], picked, onPick }: Props) {
  const pn = pin ? map.nodes.find((n) => n.id === pin) : undefined;
  const label = 'Terminal map showing ' + map.nodes.map((n) => n.label + (n.sub ? ' ' + n.sub : '')).join(', ');
  return (
    <svg viewBox="0 0 330 150" role={pickable.length ? 'group' : 'img'} aria-label={label}>
      {map.edges.map((e, i) => (
        <path key={i} className="e" d={`M${e[0]} ${e[1]} L${e[2]} ${e[3]}`} />
      ))}
      {map.nodes.map((n) => {
        const can = pickable.includes(n.id);
        const props = can
          ? {
              role: 'button' as const,
              tabIndex: 0,
              'aria-label': `${n.label}${n.sub ? ' ' + n.sub : ''}`,
              'aria-pressed': picked === n.id,
              onClick: () => onPick?.(n.id),
              onKeyDown: (ev: React.KeyboardEvent) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onPick?.(n.id);
                }
              },
            }
          : {};
        return (
          <g key={n.id} className={(can ? 'pickable ' : '') + (picked === n.id ? 'picked' : '')} {...props}>
            <rect className="n" x={n.x} y={n.y} width={n.w} height={n.h} rx="5" />
            <text x={n.x + 7} y={n.y + (n.sub ? 15 : 19)}>
              {n.label}
            </text>
            {n.sub && (
              <text className="sub" x={n.x + 7} y={n.y + 29}>
                {n.sub}
              </text>
            )}
          </g>
        );
      })}
      {pn && (
        <g>
          <circle className="pin" cx={pn.x + pn.w - 10} cy={pn.y + 10} r="6" />
          <text className="pinl" x={pn.x + pn.w - 10} y={pn.y - 4} textAnchor="middle">
            last report
          </text>
        </g>
      )}
    </svg>
  );
}
