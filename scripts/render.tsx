import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { CASES } from '../src/engine/cases';
import { initial, type State } from '../src/engine/game';
import { RoomSvg } from '../src/components/Room';
import { VIEWS } from '../src/engine/layout';

const noop = () => {};
for (const c of CASES.slice(0, 3)) {
  for (const v of VIEWS) {
    const s: State = { ...initial, phase: 'play', caseId: c.id, left: 135,
      events: v.id === 'ops' ? { a: { key: 'a', t: 27, label: 'x', status: 'confirmed' }, note: { key: 'note', t: 20, label: 'x', status: 'unconfirmed' }, b: { key: 'b', t: 24, label: 'y', status: 'confirmed' }, stmt: { key: 'stmt', t: 17, label: 'z', status: 'unconfirmed' } } : {} };
    const svg = renderToStaticMarkup(<RoomSvg view={v.id} c={c} s={s} hints={true} strong={false} onObj={noop} onSpecial={noop} />)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" ');
    writeFileSync(`/tmp/walls/${c.id}-${v.id}.svg`, svg);
  }
}
console.log('rendered');
