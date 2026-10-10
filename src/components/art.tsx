import type { ReactNode } from 'react';
import type { CaseDef, Obj, ViewId } from '../engine/types';
import type { State } from '../engine/game';

/* Everything here is drawn with plain SVG attributes so each wall renders standalone (no CSS needed). */

export interface Look {
  skin: string; hair: string; hairStyle: 'bun' | 'short' | 'grey'; cloth: string; accent: string; glasses?: boolean; mood: 'calm' | 'worried';
}
export const LOOKS: Record<string, Look> = {
  agent: { skin: '#c58c6b', hair: '#1b1210', hairStyle: 'bun', cloth: '#1c3a5e', accent: '#ffb938', mood: 'calm' },
  relative: { skin: '#b9795a', hair: '#17110e', hairStyle: 'short', cloth: '#7a3b3b', accent: '#d9c9a3', mood: 'worried' },
  ravi: { skin: '#a8704f', hair: '#c9ccd0', hairStyle: 'grey', cloth: '#4a5a3c', accent: '#e8e0d0', glasses: true, mood: 'worried' },
};
const lookFor = (o: Obj): Look => LOOKS[o.id] ?? LOOKS.relative;

export function Defs() {
  return (
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d3d5b" /><stop offset="1" stopColor="#0e2032" /></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f3144" /><stop offset="1" stopColor="#0a131d" /></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#03060c" /><stop offset=".6" stopColor="#0f2742" /><stop offset="1" stopColor="#6b4a32" /></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3a2c22" /><stop offset=".5" stopColor="#4a382b" /><stop offset="1" stopColor="#33271e" /></linearGradient>
      <linearGradient id="cork" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a47c4f" /><stop offset="1" stopColor="#85613b" /></linearGradient>
      <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff3c4" stopOpacity=".55" /><stop offset="1" stopColor="#fff3c4" stopOpacity="0" /></radialGradient>
      <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".72" /></radialGradient>
    </defs>
  );
}

function Lights({ y = 30 }: { y?: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <ellipse cx={170 + i * 252} cy={y + 150} rx="190" ry="150" fill="url(#glow)" opacity=".35" />
          <rect x={90 + i * 252} y={y} width="160" height="16" rx="4" fill="#fff7d6" />
        </g>
      ))}
    </g>
  );
}

function Floor({ y = 720 }: { y?: number }) {
  return (
    <g>
      <rect x="0" y={y} width="1600" height={900 - y} fill="url(#floor)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={i * 240 - 40} y={y + 20} width="120" height={900 - y} fill="#ffffff" opacity=".035" transform={`skewX(-18)`} />
      ))}
      <rect x="0" y={y - 6} width="1600" height="8" fill="#08111a" />
    </g>
  );
}

function Face({ cx, cy, r, look }: { cx: number; cy: number; r: number; look: Look }) {
  const w = look.mood === 'worried';
  return (
    <g transform={`translate(${cx} ${cy}) scale(${r / 40})`}>
      {look.hairStyle === 'bun' && <circle cx="0" cy="-50" r="17" fill={look.hair} />}
      <ellipse cx="-34" cy="4" rx="6" ry="10" fill={look.skin} />
      <ellipse cx="34" cy="4" rx="6" ry="10" fill={look.skin} />
      <ellipse cx="0" cy="0" rx="34" ry="40" fill={look.skin} />
      <path d="M-37 -2 C-42 -52 42 -52 37 -2 C28 -30 -28 -30 -37 -2Z" fill={look.hair} />
      <circle cx="-13" cy="0" r="3.6" fill="#17110e" />
      <circle cx="13" cy="0" r="3.6" fill="#17110e" />
      {w ? (<><path d="M-22 -8 L-7 -14" stroke="#17110e" strokeWidth="3" strokeLinecap="round" /><path d="M22 -8 L7 -14" stroke="#17110e" strokeWidth="3" strokeLinecap="round" /></>) : (<><path d="M-21 -10 L-7 -11" stroke="#17110e" strokeWidth="3" strokeLinecap="round" /><path d="M21 -10 L7 -11" stroke="#17110e" strokeWidth="3" strokeLinecap="round" /></>)}
      <path d={w ? 'M-10 22 Q0 15 10 22' : 'M-10 17 Q0 25 10 17'} stroke="#5a2a22" strokeWidth="3" fill="none" strokeLinecap="round" />
      {look.glasses && (<g stroke="#1b1b1b" strokeWidth="2.5" fill="none"><circle cx="-13" cy="0" r="11" /><circle cx="13" cy="0" r="11" /><path d="M-2 0 L2 0" /></g>)}
    </g>
  );
}

/** Standing (behind a counter) or seated figure inside a 150x380 box. */
function Figure({ look, pose }: { look: Look; pose: 'stand' | 'sit' }) {
    return (
    <g>
      <rect x="64" y="92" width="22" height="26" fill={look.skin} />
      {pose === 'stand' ? (
        <g>
          <path d="M8 380 L8 150 Q8 114 50 108 L100 108 Q142 114 142 150 L142 380 Z" fill={look.cloth} />
          <rect x="0" y="146" width="22" height="180" rx="11" fill={look.cloth} /><rect x="0" y="146" width="22" height="180" rx="11" fill="#000" fillOpacity=".22" />
          <rect x="128" y="146" width="22" height="180" rx="11" fill={look.cloth} /><rect x="128" y="146" width="22" height="180" rx="11" fill="#000" fillOpacity=".22" />
        </g>
      ) : (
        <g>
          <rect x="26" y="108" width="98" height="150" rx="30" fill={look.cloth} />
          <rect x="22" y="236" width="140" height="42" rx="18" fill="#243245" />
          <rect x="126" y="268" width="36" height="104" rx="14" fill="#243245" />
          <ellipse cx="148" cy="376" rx="26" ry="9" fill="#10161d" />
          <rect x="6" y="140" width="22" height="110" rx="11" fill={look.cloth} /><rect x="6" y="140" width="22" height="110" rx="11" fill="#000" fillOpacity=".22" />
          <rect x="122" y="140" width="22" height="110" rx="11" fill={look.cloth} /><rect x="122" y="140" width="22" height="110" rx="11" fill="#000" fillOpacity=".22" />
        </g>
      )}
      <path d="M52 108 L75 142 L98 108 Z" fill={look.accent} />
      <Face cx={75} cy={58} r={40} look={look} />
    </g>
  );
}

export function Portrait({ look }: { look: Look }) {
  return (
    <svg viewBox="0 -40 400 560" role="img" aria-hidden>
      <path d="M20 520 L20 400 Q20 330 110 310 L290 310 Q380 330 380 400 L380 520 Z" fill={look.cloth} />
      <rect x="168" y="260" width="64" height="70" fill={look.skin} />
      <path d="M150 312 L200 396 L250 312 Z" fill={look.accent} />
      <Face cx={200} cy={170} r={112} look={look} />
    </svg>
  );
}

/* ---------- props (local coords, top-left of the footprint) ---------- */

export function PropArt({ o }: { o: Obj }) {
  switch (o.kind) {
    case 'pass':
      return (
        <g transform="rotate(-4 75 35)">
          <rect x="0" y="0" width="150" height="70" rx="5" fill="#f4f6f8" stroke="#9fb0c2" />
          <rect x="0" y="0" width="14" height="70" rx="5" fill="#ffb938" />
          <text x="24" y="20" fontSize="11" fontFamily="monospace" fontWeight="700" fill="#14202e">BOARDING PASS</text>
          <rect x="24" y="30" width="70" height="4" fill="#9aa9b8" /><rect x="24" y="40" width="50" height="4" fill="#9aa9b8" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={104 + i * 5} y="14" width={i % 3 === 0 ? 3 : 2} height="42" fill="#14202e" />)}
        </g>
      );
    case 'paper':
      return (
        <g transform="rotate(2 55 70)">
          <rect x="4" y="6" width="102" height="130" fill="#f1f4f7" stroke="#aab6c3" />
          <rect x="16" y="20" width="78" height="10" fill="#14202e" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="16" y={44 + i * 16} width={i === 4 ? 40 : 78} height="5" fill="#9aa9b8" />)}
          <rect x="-4" y="0" width="34" height="14" fill="#f0e2a3" opacity=".8" transform="rotate(-18 10 7)" />
          <rect x="84" y="0" width="34" height="14" fill="#f0e2a3" opacity=".8" transform="rotate(18 100 7)" />
        </g>
      );
    case 'terminal':
      return (
        <g>
          <rect x="30" y="118" width="140" height="14" rx="3" fill="#10161d" /><rect x="84" y="100" width="32" height="22" fill="#18212b" />
          <rect x="0" y="0" width="200" height="106" rx="10" fill="#0c141d" stroke="#2b4157" strokeWidth="3" />
          <rect x="12" y="12" width="176" height="82" rx="4" fill="#04130c" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="22" y={24 + i * 16} width={[110, 140, 90, 60][i]} height="5" fill="#7dffb3" opacity={0.85 - i * 0.12} />)}
          <rect x="22" y="80" width="10" height="8" fill="#7dffb3" />
        </g>
      );
    case 'receipt':
      return (
        <g transform="rotate(6 25 55)">
          <path d="M0 0 H50 V104 L42 110 L34 104 L26 110 L18 104 L10 110 L0 104 Z" fill="#fff" stroke="#c9d2db" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="8" y={12 + i * 14} width={i % 2 ? 24 : 34} height="4" fill="#9aa9b8" />)}
        </g>
      );
    case 'tag':
      return (
        <g>
          <path d="M40 0 L40 66" stroke="#caa86a" strokeWidth="3" />
          <path d="M8 76 Q8 66 18 66 L62 66 Q72 66 72 76 L72 156 Q72 168 62 168 L18 168 Q8 168 8 156 Z" fill="#f1d9a8" stroke="#b8975a" strokeWidth="2" />
          <circle cx="40" cy="84" r="7" fill="#0e2032" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="20" y={104 + i * 14} width={i % 2 ? 26 : 40} height="5" fill="#8a6a35" />)}
        </g>
      );
    case 'map':
      return (
        <g>
          <rect x="0" y="0" width="230" height="160" rx="6" fill="#5a4332" /><rect x="10" y="10" width="210" height="140" fill="#0f3b63" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={10 + i * 35} y="10" width="1" height="140" fill="#9fd0ff" opacity=".25" />)}
          {[0, 1, 2, 3].map((i) => <rect key={i} x="10" y={10 + i * 35} width="210" height="1" fill="#9fd0ff" opacity=".25" />)}
          <rect x="24" y="84" width="40" height="22" fill="none" stroke="#d6ecff" strokeWidth="2" /><rect x="86" y="96" width="56" height="30" fill="none" stroke="#d6ecff" strokeWidth="2" />
          <rect x="164" y="26" width="44" height="22" fill="none" stroke="#d6ecff" strokeWidth="2" /><rect x="160" y="100" width="48" height="26" fill="none" stroke="#d6ecff" strokeWidth="2" />
          <path d="M64 92 L86 108 M142 100 L170 48 M142 112 L160 112" stroke="#d6ecff" strokeWidth="2" strokeDasharray="5 4" fill="none" />
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle cx="55" cy="55" r="52" fill="#e9eef3" stroke="#14202e" strokeWidth="5" />
          {[...Array(12)].map((_, i) => <rect key={i} x="53" y="9" width="4" height={i % 3 === 0 ? 12 : 7} fill="#14202e" transform={`rotate(${i * 30} 55 55)`} />)}
          <path d="M55 55 L55 24 M55 55 L78 66" stroke="#14202e" strokeWidth="4" strokeLinecap="round" />
          <circle cx="55" cy="55" r="5" fill="#c9302f" />
        </g>
      );
    default:
      return null;
  }
}

export function PersonArt({ o, pose }: { o: Obj; pose: 'stand' | 'sit' }) {
  return <Figure look={lookFor(o)} pose={pose} />;
}

/* ---------- walls ---------- */

export interface SceneBits {
  back: ReactNode;
  /** Drawn after seated/standing people, before ordinary props (e.g. the counter that hides the agent's legs). */
  mid: ReactNode;
  personPose: 'stand' | 'sit';
}

const mono = { fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } as const;

function GateWall({ c }: { c: CaseDef }): SceneBits {
  return {
    personPose: 'stand',
    back: (
      <g>
        <rect width="1600" height="720" fill="url(#wall)" /><Lights />
        <rect x="400" y="130" width="800" height="220" rx="10" fill="#04090f" stroke="#2b4157" strokeWidth="6" />
        {[['FLIGHT', 430], ['TO', 610], ['GATE', 850], ['STATUS', 980]].map(([h, x]) => <text key={h as string} x={x as number} y="172" fontSize="22" fill="#6f8ba6" {...mono}>{h}</text>)}
        {[[c.flight, 'DUBAI', '13', 'ON HOLD', '#ffb938', 222], ['MA 421', 'CHENNAI', '09', 'DELAYED', '#6f8ba6', 266], ['MA 288', 'MUMBAI', '11', 'BOARDING', '#6f8ba6', 310]].map((r) => (
          <g key={r[1] as string}>{[430, 610, 850, 980].map((x, i) => <text key={x} x={x} y={r[5] as number} fontSize="30" fill={r[4] as string} fontWeight={r[5] === 222 ? 700 : 400} {...mono}>{r[i] as string}</text>)}</g>
        ))}
        <rect x="90" y="200" width="190" height="450" rx="6" fill="#0a1520" stroke="#2b4157" strokeWidth="5" />
        <rect x="118" y="232" width="134" height="40" rx="4" fill="#7a1f1f" /><text x="130" y="259" fontSize="20" fill="#fff" fontWeight="700" {...mono}>STAFF ONLY</text>
        <circle cx="250" cy="430" r="9" fill="#9fb0c2" />
        <Floor />
      </g>
    ),
    mid: (
      <g>
        <rect x="250" y="540" width="1100" height="28" rx="4" fill="#6e8ba3" />
        <rect x="262" y="568" width="1076" height="160" fill="#1d3447" /><rect x="262" y="568" width="1076" height="160" fill="#000" opacity=".12" />
        <rect x="660" y="606" width="280" height="64" rx="6" fill="#0c1a28" stroke="#ffb938" strokeWidth="3" />
        <text x="690" y="647" fontSize="28" fill="#ffb938" fontWeight="700" {...mono}>MALABAR AIR</text>
      </g>
    ),
  };
}

function WindowWall({ c }: { c: CaseDef }): SceneBits {
  void c;
  return {
    personPose: 'stand',
    back: (
      <g>
        <rect width="1600" height="720" fill="url(#wall)" /><Lights />
        <rect x="150" y="140" width="1020" height="440" fill="url(#sky)" />
        {[[210, 190], [330, 230], [520, 170], [760, 210], [980, 180], [1100, 240]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#fff" opacity=".8" />)}
        <rect x="150" y="470" width="1020" height="110" fill="#1a2430" />
        <ellipse cx="640" cy="420" rx="320" ry="46" fill="#dfe7ee" />
        <path d="M900 410 L1010 300 L1050 300 L990 420 Z" fill="#c9d3dc" /><path d="M520 440 L420 500 L560 500 L640 450 Z" fill="#b6c2cd" />
        <path d="M360 400 Q330 420 360 440 L470 440 L470 400 Z" fill="#c9d3dc" />
        {[...Array(18)].map((_, i) => <circle key={i} cx={420 + i * 22} cy="410" r="5" fill="#1f3f5d" />)}
        <circle cx="560" cy="500" r="4" fill="#ff4d4d" /><circle cx="740" cy="500" r="4" fill="#41c98a" />
        {[...Array(14)].map((_, i) => <circle key={i} cx={190 + i * 70} cy={545 + (i % 2) * 10} r="4" fill="#4aa8ff" />)}
        <rect x="400" y="140" width="16" height="440" fill="#0b1520" /><rect x="660" y="140" width="16" height="440" fill="#0b1520" /><rect x="920" y="140" width="16" height="440" fill="#0b1520" />
        <rect x="150" y="140" width="1020" height="440" fill="none" stroke="#0b1520" strokeWidth="14" />
        <rect x="140" y="580" width="1040" height="18" fill="#2b4157" /><rect x="150" y="598" width="1020" height="122" fill="#12283b" />
        <rect x="1230" y="180" width="230" height="450" fill="#5d6f7d" stroke="#2b4157" strokeWidth="6" />
        <rect x="1262" y="224" width="166" height="200" fill="#0b1822" /><rect x="1250" y="130" width="190" height="40" rx="4" fill="#0b1520" />
        <text x="1276" y="159" fontSize="26" fill="#ffb938" fontWeight="700" {...mono}>GATE 13</text>
        <circle cx="1345" cy="480" r="16" fill="#ff3b3b" /><circle cx="1345" cy="480" r="34" fill="#ff3b3b" opacity=".25" />
        <text x="1292" y="540" fontSize="22" fill="#ff8a8a" fontWeight="700" {...mono}>CLOSED</text>
        <rect x="1420" y="400" width="14" height="60" rx="5" fill="#c9d3dc" />
        <Floor />
      </g>
    ),
    mid: null,
  };
}

function SeatWall({ c }: { c: CaseDef }): SceneBits {
  const sign = c.map ? 'HOLDING POINT H2' : 'COFFEE BAR';
  return {
    personPose: 'sit',
    back: (
      <g>
        <rect width="1600" height="720" fill="url(#wall)" /><Lights />
        <rect x="1020" y="130" width="450" height="96" rx="16" fill="none" stroke="#ff9a3c" strokeWidth="7" />
        <text x="1080" y="200" fontSize="64" fill="#ffb25c" fontWeight="800" {...mono}>COFFEE</text>
        <rect x="1100" y="246" width="290" height="48" rx="6" fill="#0b1520" stroke="#ffb938" strokeWidth="2" />
        <text x="1114" y="278" fontSize="22" fill="#ffb938" fontWeight="700" {...mono}>{sign}</text>
        <rect x="1100" y="320" width="170" height="86" rx="8" fill="#3b3f46" /><rect x="1120" y="340" width="40" height="30" fill="#9aa4ad" />
        <rect x="940" y="408" width="590" height="26" rx="4" fill="#8a6a4a" /><rect x="950" y="434" width="570" height="290" fill="url(#wood)" />
        {[...Array(12)].map((_, i) => <rect key={i} x={970 + i * 46} y="440" width="3" height="280" fill="#000" opacity=".18" />)}
        {[1000, 1090, 1180].map((x) => <g key={x}><rect x={x} y="378" width="34" height="30" rx="4" fill="#f4f6f8" /><rect x={x} y="386" width="34" height="8" fill="#7a3b3b" /></g>)}
        {[100, 280, 460, 640].map((x) => (
          <g key={x}>
            <rect x={x} y="420" width="150" height="160" rx="14" fill="#2f5575" />
            <rect x={x - 6} y="556" width="162" height="48" rx="10" fill="#274a66" />
            <rect x={x + 20} y="604" width="12" height="116" fill="#10161d" /><rect x={x + 118} y="604" width="12" height="116" fill="#10161d" />
          </g>
        ))}
        <Floor />
        <rect x="720" y="706" width="270" height="22" rx="4" fill="#6a7f93" /><rect x="740" y="728" width="14" height="120" fill="#10161d" /><rect x="956" y="728" width="14" height="120" fill="#10161d" />
      </g>
    ),
    mid: null,
  };
}

function BagWall({ c }: { c: CaseDef }): SceneBits {
  void c;
  return {
    personPose: 'stand',
    back: (
      <g>
        <rect width="1600" height="720" fill="url(#wall)" /><Lights />
        <rect x="600" y="210" width="440" height="340" rx="6" fill="#050a10" stroke="#2b4157" strokeWidth="6" />
        <rect x="604" y="214" width="432" height="130" fill="#51606d" />
        {[...Array(8)].map((_, i) => <rect key={i} x="604" y={218 + i * 16} width="432" height="3" fill="#2f3b46" />)}
        <rect x="604" y="494" width="432" height="52" fill="#1a1f26" />
        {[...Array(10)].map((_, i) => <rect key={i} x={612 + i * 43} y="500" width="6" height="40" fill="#2e3641" />)}
        <rect x="640" y="140" width="360" height="52" rx="6" fill="#0b1520" stroke="#ffb938" strokeWidth="2" />
        <text x="668" y="176" fontSize="26" fill="#ffb938" fontWeight="700" {...mono}>BAGGAGE SERVICE</text>
        <rect x="1100" y="520" width="280" height="18" fill="#6e8ba3" />
        <Floor />
        <rect x="0" y="720" width="1600" height="70" fill="#242d37" />
        {[...Array(32)].map((_, i) => <rect key={i} x={i * 52} y="724" width="8" height="62" fill="#37424e" />)}
        <rect x="200" y="660" width="120" height="70" rx="10" fill="#8a2b2b" /><rect x="360" y="640" width="150" height="90" rx="10" fill="#274a66" /><rect x="1180" y="672" width="110" height="58" rx="10" fill="#3d6b4f" />
        <rect x="1330" y="650" width="120" height="80" rx="10" fill="#6b5a2b" />
      </g>
    ),
    mid: null,
  };
}

export function OpsWall({ c, s }: { c: CaseDef; s: State }) {
  const events = Object.values(s.events).sort((a, b) => (b.t ?? 0) - (a.t ?? 0)).slice(0, 12);
  const pos = (i: number) => ({ x: 170 + (i % 4) * 200, y: 170 + Math.floor(i / 4) * 150 });
  const idx = (k: string) => events.findIndex((e) => e.key === k);
  const left = Math.max(0, s.left);
  const clock = `${Math.floor(left / 60)}:${('0' + (left % 60)).slice(-2)}`;
  return (
    <g>
      <rect width="1600" height="720" fill="url(#wall)" /><Lights />
      <rect x="110" y="120" width="880" height="540" rx="6" fill="url(#cork)" stroke="#4a3523" strokeWidth="16" />
      {events.map((e, i) => {
        const p = pos(i);
        return (
          <g key={e.key} transform={`rotate(${((i * 37) % 7) - 3} ${p.x + 70} ${p.y + 50})`}>
            <rect x={p.x} y={p.y} width="150" height="104" fill="#f1f4f7" stroke="#b6c2cd" />
            <rect x={p.x + 12} y={p.y + 22} width="100" height="6" fill="#14202e" /><rect x={p.x + 12} y={p.y + 42} width="124" height="5" fill="#9aa9b8" /><rect x={p.x + 12} y={p.y + 58} width="90" height="5" fill="#9aa9b8" />
            <rect x={p.x + 12} y={p.y + 78} width="60" height="10" fill={e.status === 'confirmed' ? '#41c98a' : '#e7b04e'} />
            <circle cx={p.x + 75} cy={p.y + 6} r="8" fill="#c9302f" />
          </g>
        );
      })}
      {c.conflicts.map((x) => {
        const a = idx(x.a), b = idx(x.b);
        if (a < 0 || b < 0) return null;
        const pa = pos(a), pb = pos(b);
        return <line key={x.a + x.b} x1={pa.x + 75} y1={pa.y + 6} x2={pb.x + 75} y2={pb.y + 6} stroke="#ff4d4d" strokeWidth="5" />;
      })}
      {events.length === 0 && <text x="550" y="400" fontSize="30" fill="#4a3523" textAnchor="middle" {...mono}>Nothing pinned yet</text>}
      <rect x="1060" y="130" width="420" height="130" rx="10" fill="#04090f" stroke="#2b4157" strokeWidth="6" />
      <text x="1270" y="168" fontSize="22" fill="#6f8ba6" textAnchor="middle" {...mono}>AIRCRAFT CLEARED IN</text>
      <text x="1270" y="238" fontSize="64" fill={left <= 30 ? '#ff6b68' : '#ffb938'} fontWeight="800" textAnchor="middle" {...mono}>{clock}</text>
      <Floor y={700} />
    </g>
  );
}

export function opsMid(open: boolean) {
  return (
    <g>
      <rect x="0" y="690" width="1600" height="210" fill="#3b4a58" /><rect x="0" y="686" width="1600" height="12" fill="#5d7284" />
      <rect x="1250" y="770" width="230" height="70" rx="8" fill="#1a2433" stroke="#3a4c63" strokeWidth="3" />
      <circle cx="1440" cy="792" r="9" fill={open ? '#41c98a' : '#ff4d4d'} />
      <text x="1275" y="800" fontSize="20" fill="#9db0c3" {...mono}>OPS RADIO</text>
    </g>
  );
}

export const WALLS: Record<Exclude<ViewId, 'ops'>, (a: { c: CaseDef }) => SceneBits> = {
  gate: GateWall,
  win: WindowWall,
  seat: SeatWall,
  bag: BagWall,
};
