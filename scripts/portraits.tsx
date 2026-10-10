import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { LOOKS, Portrait } from '../src/components/art';

const parts = Object.keys(LOOKS).map((k, i) => `<g transform="translate(${i * 400} 0)">${renderToStaticMarkup(<Portrait look={LOOKS[k]} />).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`);
writeFileSync('/tmp/walls/portraits.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520"><rect width="1200" height="520" fill="#2a3a4a"/>${parts.join('')}</svg>`);
