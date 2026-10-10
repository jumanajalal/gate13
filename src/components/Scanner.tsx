import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/** Camera QR scanner. Needs https or localhost. Every scan has an on-screen button fallback elsewhere. */
export function Scanner({ title, onScan, onClose }: { title: string; onScan: (payload: string) => void; onClose: () => void }) {
  const [err, setErr] = useState('');
  const [flash, setFlash] = useState(false);
  const cb = useRef(onScan);
  cb.current = onScan;

  useEffect(() => {
    const h = new Html5Qrcode('qr-reader');
    let last = '';
    let lastAt = 0;
    h.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 220 },
      (text) => {
        const now = Date.now();
        if (text === last && now - lastAt < 2000) return;
        last = text;
        lastAt = now;
        setFlash(true);
        window.setTimeout(() => setFlash(false), 450);
        cb.current(text);
      },
      () => {},
    ).catch((e) => setErr(String(e)));
    return () => {
      if (h.isScanning) h.stop().then(() => h.clear()).catch(() => {});
      else {
        try {
          h.clear();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet" style={{ position: 'relative' }}>
        <h2>{title}</h2>
        <div className="scanframe">
          <div id="qr-reader" />
          <div className="scanreticle" aria-hidden>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
          </div>
          {flash && <div className="scanflash" aria-hidden />}
        </div>
        {err && (
          <div className="term scanerr" role="alert">
            <div className="tl bad">HAND SCANNER OFFLINE</div>
            <div className="tl dim">Camera unavailable: {err.slice(0, 80)}</div>
            <div className="tl dim">Use the on-screen buttons instead.</div>
            <div className="tl dim">Camera requires https or localhost and permission.</div>
          </div>
        )}
        <button onClick={onClose}>Close scanner</button>
      </div>
    </div>
  );
}
