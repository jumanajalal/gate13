import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/** Camera QR scanner. Needs https or localhost. Every scan has an on-screen button fallback elsewhere. */
export function Scanner({ title, onScan, onClose }: { title: string; onScan: (payload: string) => void; onClose: () => void }) {
  const [err, setErr] = useState('');
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
      <div className="sheet">
        <h2>{title}</h2>
        <div id="qr-reader" />
        {err && (
          <p className="c-bad">
            Camera unavailable ({err.slice(0, 80)}). Use the on-screen buttons instead; the camera needs https or localhost and permission.
          </p>
        )}
        <button onClick={onClose}>Close scanner</button>
      </div>
    </div>
  );
}
