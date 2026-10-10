import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CASES } from '../engine/cases';
import type { Obj } from '../engine/types';
import { MapView } from './MapView';

function QR({ payload }: { payload: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 180 }).then(setSrc).catch(() => setSrc(''));
  }, [payload]);
  return src ? <img src={src} width={90} height={90} alt={'QR ' + payload} /> : <span className="qrph" />;
}

function Body({ o }: { o: Obj }) {
  if (o.kind === 'person') return <p>{o.talk?.who}, {o.talk?.role}. Scan to start the conversation.</p>;
  return (
    <>
      {o.heading && <p><b>{o.heading}</b></p>}
      {(o.fields ?? []).map(([k, v]) => <p key={k}>{k}: <b>{v}</b></p>)}
      {(o.lines ?? []).map((l, i) => <p key={i}>{l}</p>)}
      {o.note && <p>{o.note}</p>}
      {o.lock && <p><i>Locked terminal: the code is on another card.</i></p>}
    </>
  );
}

/** Printable evidence kit: #/props. Print (Ctrl+P), cut along the borders, one envelope per case. */
export default function Props() {
  return (
    <main className="props">
      <div className="noprint">
        <h1>Gate 13 evidence kit</h1>
        <p>Print this page and cut the cards out. Seal each case in its own envelope. The cover QR opens the case; each card QR opens that object in the game.</p>
        <button className="pri" onClick={() => window.print()}>Print kit</button> <a href="#/">Back to the game</a>
      </div>
      {CASES.map((c) => (
        <section key={c.id} className="kit">
          <h2>Envelope: {c.title} <span className="mut">({c.passenger}, {c.flight})</span></h2>
          <div className="cards">
            <div className="prop cover">
              <h3>GATE 13 INCIDENT FILE</h3>
              {c.opening.map((l, i) => <p key={i}>{l}</p>)}
              <QR payload={`g13:case:${c.id}`} />
              <p className="mut">Scan to open this case</p>
            </div>
            {c.objects.map((o) => (
              <div className="prop" key={o.id}>
                <h3>{o.title}</h3>
                {o.kind === 'map' && c.map ? <MapView map={c.map} /> : <Body o={o} />}
                <QR payload={`g13:${c.id}:${o.id}`} />
                <p className="mut">Scan to open in the game</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
