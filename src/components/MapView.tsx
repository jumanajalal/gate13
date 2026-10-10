import type { MapDef } from '../engine/types';

export function MapView({ map, pin }: { map: MapDef; pin?: string | null }) {
  const pn = pin ? map.nodes.find((n) => n.id === pin) : undefined;
  const label = 'Terminal map showing ' + map.nodes.map((n) => n.label + (n.sub ? ' ' + n.sub : '')).join(', ');
  return (
    <svg viewBox="0 0 330 150" role="img" aria-label={label}>
      {map.edges.map((e, i) => (
        <path key={i} className="e" d={`M${e[0]} ${e[1]} L${e[2]} ${e[3]}`} />
      ))}
      {map.nodes.map((n) => (
        <g key={n.id}>
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
      ))}
      {pn && (
        <g>
          <circle className="pin" cx={pn.x + pn.w - 10} cy={pn.y + 10} r="6" />
          <text className="pinl" x={pn.x + pn.w - 10} y={pn.y - 4} textAnchor="middle">
            last lead
          </text>
        </g>
      )}
    </svg>
  );
}
