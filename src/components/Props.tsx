import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CASES } from '../engine/cases';
import { MapView } from './MapView';

function QR({ payload }: { payload: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 180 }).then(setSrc).catch(() => setSrc(''));
  }, [payload]);
  return src ? <img src={src} width={90} height={90} alt={'QR ' + payload} /> : <span className="qrph" />;
}

/** Printable evidence kit: #/props. Print (Ctrl+P), cut along the borders, one envelope per case. */
export default function Props() {
  return (
    <main className="props">
      <div className="noprint">
        <h1>Gate 13 evidence kit</h1>
        <p>Print this page, cut the cards out, and seal each case in its own envelope. Scanning a card in the game adds it to the timeline. The case cover QR starts the case.</p>
        <button className="pri" onClick={() => window.print()}>Print kit</button> <a href="#/">Back to the game</a>
      </div>
      {CASES.map((c) => (
        <section key={c.id} className="kit">
          <h2>
            Envelope: {c.title} <span className="mut">({c.passenger}, {c.flight})</span>
          </h2>
          <div className="cards">
            <div className="prop cover">
              <h3>GATE 13 INCIDENT FILE</h3>
              <p>{c.intro}</p>
              <QR payload={`g13:case:${c.id}`} />
              <p className="mut">Scan to open this case</p>
            </div>
            {c.bundles.flatMap((b) =>
              b.items.map((it) => (
                <div className="prop" key={it.id}>
                  <h3>
                    {b.title}: {it.title}
                  </h3>
                  <p dangerouslySetInnerHTML={{ __html: it.body }} />
                  <QR payload={`g13:${c.id}:${it.id}`} />
                  <p className="mut">Scan to add to the timeline</p>
                </div>
              )),
            )}
            {c.map && (
              <div className="prop">
                <h3>Terminal map</h3>
                <MapView map={c.map} />
              </div>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
