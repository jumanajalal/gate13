import type { CaseDef, Decision, MapDef, PaLine } from './types';

/** All names, airlines, flights and records are fictional. */
const TERMINAL_MAP: MapDef = {
  nodes: [
    { id: 'gate', label: 'Gate 13', x: 8, y: 62, w: 64, h: 30 },
    { id: 'H2', label: 'H2 holding point', sub: '(coffee counter)', x: 110, y: 96, w: 108, h: 38 },
    { id: 'door', label: 'Aircraft door', x: 238, y: 14, w: 84, h: 30 },
    { id: 'lounge', label: 'Main lounge', sub: '(charging points)', x: 236, y: 96, w: 90, h: 38 },
  ],
  edges: [
    [72, 66, 238, 32],
    [72, 78, 110, 108],
    [190, 96, 256, 44],
    [218, 115, 236, 115],
  ],
};

const MAP_DECISION = (loc: string): Decision => ({
  groups: [
    { title: 'Action', options: [{ id: 'hold', label: 'Hold and verify' }, { id: 'clear', label: 'Clear the flight' }] },
    {
      title: 'Send staff to check (tap the map)',
      options: [
        { id: 'door', label: 'Aircraft door' },
        { id: 'H2', label: 'Holding Point H2' },
        { id: 'lounge', label: 'Main lounge' },
      ],
    },
  ],
  correct: ['hold', loc],
  messages: {
    first: { clear: 'Flight released: passenger status unresolved. Recheck the wall and decide again.' },
    fallback: 'No confirmation at that location. Recheck the route evidence.',
  },
});

const HOLD_PA: PaLine = {
  atLeft: 45,
  en: 'This flight is on hold. Operations are reconciling passenger records.',
  ml: 'ഈ വിമാനം തൽക്കാലം നിർത്തിവച്ചിരിക്കുന്നു. യാത്രക്കാരുടെ രേഖകൾ പരിശോധിക്കുകയാണ്.',
  ar: 'هذه الرحلة متوقفة مؤقتاً. تقوم العمليات بمطابقة سجلات الركاب.',
};

const SCAN_GLOSSARY = ['---', 'SCAN = pass read at the gate', 'ONBOARD = passenger confirmed at the aircraft door'];
const BAG_GLOSSARY = ['---', 'LOADED = bag confirmed on the aircraft'];
const MAP_NOTE = 'Holding points and the main lounge are marked. Read the labels.';

export const CASES: CaseDef[] = [
  /* ------------------------------------------------------------------ */
  {
    id: 'nila',
    title: 'The Group 3 Redirect',
    tagline: 'A scan is not the same as being onboard.',
    flight: 'MA 613',
    passenger: 'Nila Varghese',
    opening: [
      '23:12 · Gate 13',
      'Malabar Air MA 613 to Dubai is on hold.',
      'The system says passenger Nila Varghese boarded. Her brother says she never reached the plane.',
      'You are the response team. You have three minutes before the aircraft is cleared.',
    ],
    boardHold: 'DEPARTURE HOLD: PASSENGER STATUS UNCONFIRMED',
    boardWin: 'PASSENGER LOCATED: WELFARE CHECK IN PROGRESS',
    boardLose: 'FLIGHT DEPARTED: PASSENGER STATUS UNCONFIRMED',
    winText:
      "Nila's pass was scanned, but nothing confirmed she reached the aircraft. 'Group 3 cleared' only meant the scanner registered the group. The notice, the map and her brother's account pointed to where she stopped with her nephew. Her bag was accepted and sorted, and its loading is still unconfirmed.",
    loseText:
      'The records never confirmed Nila on board. The best next step was to hold the flight and check where the route evidence pointed, while keeping the bag marked unconfirmed.',
    objects: [
      {
        id: 'pass',
        kind: 'pass',
        at: { v: 'gate', x: 840, y: 470 },
        title: 'Boarding pass',
        manualAlias: 'PASS-22C',
        fields: [
          ['Passenger', 'NILA VARGHESE'],
          ['Flight', 'MA 613'],
          ['Route', 'CCJ to DXB'],
          ['Group', '3'],
          ['Seat', '22C'],
          ['Gate', '13'],
        ],
      },
      {
        id: 'receipt',
        kind: 'receipt',
        at: { v: 'seat', x: 800, y: 592 },
        title: 'Duty-free receipt',
        heading: 'DUTY FREE · KOZHIKODE',
        lines: ['T-29', '1 x sweets', 'Thank you'],
        note: 'On the back, in crayon: a plane and two stick figures. Signed "Rohan".',
        manualAlias: 'REC-H2',
        events: [{ key: 'receipt', t: 29, label: 'Receipt places Nila with the boy at H2 counter', status: 'confirmed' }],
      },
      {
        id: 'scanlog',
        kind: 'terminal',
        at: { v: 'gate', x: 520, y: 390 },
        title: 'Gate terminal',
        lock: { prompt: 'ENTER SEAT NUMBER TO OPEN THIS PASS RECORD', placeholder: 'e.g. 12A', answers: ['22C'], hint: 'The seat is printed on the boarding pass.' },
        lines: ['GATE 13 · SCAN LOG', 'T-27  PASS 22C  READ OK', 'AIRCRAFT-DOOR CONFIRMATION: no entry for pass 22C', ...SCAN_GLOSSARY],
        events: [
          { key: 'scan', t: 27, label: 'Pass scanned at Gate 13', status: 'confirmed' },
          { key: 'onb', t: 0, label: 'Aircraft-door confirmation: none on record', status: 'unconfirmed' },
        ],
      },
      {
        id: 'notice',
        kind: 'paper',
        at: { v: 'win', x: 280, y: 220 },
        title: 'Gate notice',
        heading: 'GATE CHANGE NOTICE',
        lines: ['T-24', 'Boarding is moving.', 'Group 3: please wait at Holding Point H2 until called again.'],
        manualAlias: 'NOTICE-G3',
        events: [{ key: 'notice', t: 24, label: 'Group 3 redirected to Holding Point H2', status: 'confirmed' }],
      },
      {
        id: 'agent',
        kind: 'person',
        at: { v: 'gate', x: 1000, y: 300 },
        title: 'Gate agent',
        talk: {
          who: 'Sana',
          role: 'Gate agent',
          intro: 'I wrote "Group 3 cleared" in the log. Ask me what I meant.',
          qa: [
            {
              q: 'What does "Group 3 cleared" mean?',
              a: 'My scanner registered the group, so I wrote cleared. I did not walk them to the aircraft myself.',
              events: [{ key: 'note', t: 20, label: '"Group 3 cleared" (scanner only; nobody saw them reach the aircraft)', status: 'unconfirmed' }],
            },
            { q: 'Did you see Nila reach the plane?', a: 'No. After the redirect I lost sight of the group.' },
            { q: 'Where was Group 3 sent?', a: 'Gate change. They were told to wait at Holding Point H2 until called again.' },
          ],
        },
      },
      {
        id: 'relative',
        kind: 'person',
        at: { v: 'seat', x: 280, y: 315 },
        title: 'Her brother',
        talk: {
          who: 'Thomas',
          role: "Nila's brother",
          intro: 'Please. My sister and my nephew are somewhere in this airport.',
          qa: [
            {
              q: 'When did you last see Nila?',
              a: 'When they redirected Group 3. She stopped with the boy by the coffee counter. I went toward the gate because an agent said the group would be called again.',
              events: [{ key: 'stmt', t: 17, label: 'Brother: Nila last seen at the coffee counter (see map)', status: 'unconfirmed' }],
            },
            { q: 'Who is the boy?', a: 'Rohan, her nephew. He is six and he stops walking when he is tired. She would never rush him.' },
            { q: 'Can you call her?', a: 'It goes straight to voicemail. Her phone was nearly dead.' },
          ],
        },
      },
      { id: 'map', kind: 'map', at: { v: 'bag', x: 150, y: 170 }, title: 'Terminal map', note: MAP_NOTE },
      {
        id: 'tag',
        kind: 'tag',
        at: { v: 'bag', x: 520, y: 290 },
        title: 'Bag tag',
        heading: 'BAG TAG',
        manualAlias: 'TAG-482915',
        fields: [
          ['Passenger', 'VARGHESE/NILA'],
          ['Flight', 'MA 613'],
          ['Tag no.', 'MA613-482915'],
          ['Pieces', '1 of 1'],
        ],
      },
      {
        id: 'bagterm',
        kind: 'terminal',
        at: { v: 'bag', x: 1150, y: 370 },
        title: 'Baggage terminal',
        lock: { prompt: 'ENTER BAG TAG NUMBER', placeholder: '6 digits', answers: ['482915', 'MA613482915'], hint: 'The tag number is printed on the bag tag.' },
        lines: ['BAG EVENTS · 482915', 'ACCEPTED  T-60', 'SORTED    T-48', 'LOADED    no record', ...BAG_GLOSSARY],
        events: [
          { key: 'bag', t: 48, label: 'Bag accepted and sorted', status: 'confirmed' },
          { key: 'load', t: 0, label: 'Bag loaded: no record', status: 'unconfirmed' },
        ],
      },
    ],
    ledger: [
      { id: 'scan', label: 'Pass read at the gate', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Confirmed', why: 'The gate scan log shows the pass was read at T-27.' },
      { id: 'onboard', label: 'Passenger confirmed at the aircraft door', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Not confirmed', why: '"Group 3 cleared" only means the scanner registered the group. Nobody saw Nila reach the aircraft.' },
      { id: 'bag', label: 'Bag confirmed loaded on the aircraft', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Not confirmed', why: 'The bag was accepted and sorted. No load event is on record.' },
    ],
    map: TERMINAL_MAP,
    decision: MAP_DECISION('H2'),
    hints: [
      'Separate three things: scanned, moving, onboard. Which of them does each record actually prove?',
      "Match her brother's landmark to a labeled place on the map.",
      'Nila stopped with Rohan at the coffee counter at Holding Point H2. Her bag was never loaded. Hold the flight and check H2.',
    ],
    conflicts: [{ a: 'note', b: 'stmt', note: 'These two accounts cannot both describe where Nila is.' }],
    moves: [{ atElapsed: 100, loc: 'lounge', text: 'Staff update: a woman with a child was seen leaving H2 toward the main lounge.' }],
    pa: [
      {
        atLeft: 177,
        en: 'Malabar Air flight M A six one three to Dubai is now boarding at gate thirteen.',
        ml: 'മലബാർ എയർ വിമാനം എം എ 613, ദുബായിലേക്കുള്ള ബോർഡിംഗ് ഗേറ്റ് 13-ൽ ആരംഭിച്ചിരിക്കുന്നു.',
        ar: 'رحلة الخطوط الجوية ملبار رقم إم إيه ٦١٣ المتجهة إلى دبي، الصعود إلى الطائرة الآن عند البوابة ١٣.',
      },
      {
        atLeft: 120,
        en: 'Final call for Malabar Air M A six one three to Dubai. Passenger Nila Varghese, please proceed to gate thirteen immediately.',
        ml: 'മലബാർ എയർ എം എ 613, ദുബായ് വിമാനത്തിന്റെ അവസാന അറിയിപ്പ്. യാത്രക്കാരി നില വർഗീസ്, ദയവായി ഉടൻ ഗേറ്റ് 13-ലേക്ക് വരിക.',
        ar: 'النداء الأخير لرحلة ملبار إم إيه ٦١٣ إلى دبي. على الراكبة نيلا فارغيز التوجه فوراً إلى البوابة ١٣.',
      },
      HOLD_PA,
    ],
    winPa: {
      en: 'Passenger located. Welfare check in progress.',
      ml: 'യാത്രക്കാരിയെ കണ്ടെത്തി. ക്ഷേമ പരിശോധന നടക്കുന്നു.',
      ar: 'تم العثور على الراكبة. الفحص الصحي جارٍ.',
    },
    losePa: {
      en: 'Flight M A six one three has departed. One passenger status remains unconfirmed.',
      ml: 'എം എ 613 വിമാനം പുറപ്പെട്ടു. ഒരു യാത്രക്കാരിയുടെ നില സ്ഥിരീകരിച്ചിട്ടില്ല.',
      ar: 'غادرت الرحلة إم إيه ٦١٣. لا تزال حالة إحدى الراكبات غير مؤكدة.',
    },
  },
  /* ------------------------------------------------------------------ */
  {
    id: 'anjali',
    title: 'The Sent-Back Group',
    tagline: 'A loaded bag still is not a passenger.',
    flight: 'MA 613',
    passenger: 'Anjali Menon',
    opening: [
      '23:08 · Gate 13',
      'Malabar Air MA 613 to Dubai is on hold.',
      "Passenger Anjali Menon's bag is on the aircraft. She is not in her seat, and her husband cannot reach her.",
      'You have three minutes before the aircraft is cleared.',
    ],
    boardHold: 'DEPARTURE HOLD: PASSENGER NOT IN SEAT, BAG LOADED',
    boardWin: 'PASSENGER LOCATED: ESCORTED TO GATE',
    boardLose: 'FLIGHT DEPARTED: PASSENGER STATUS UNCONFIRMED',
    winText:
      "Anjali's pass was scanned, but nothing confirmed she reached the aircraft. Boarding was paused and Group 2 was sent back to the lounge, where her husband said she went to charge her phone. Her bag was confirmed loaded, which says where the bag is and nothing about where she is.",
    loseText:
      'The loaded bag was the distraction: it does not locate its owner. The notice and her husband both pointed to the lounge, so that was where staff needed to check.',
    objects: [
      {
        id: 'pass',
        kind: 'pass',
        at: { v: 'gate', x: 840, y: 470 },
        title: 'Boarding pass',
        fields: [
          ['Passenger', 'ANJALI MENON'],
          ['Flight', 'MA 613'],
          ['Route', 'CCJ to DXB'],
          ['Group', '2'],
          ['Seat', '9A'],
          ['Gate', '13'],
        ],
      },
      {
        id: 'scanlog',
        kind: 'terminal',
        at: { v: 'gate', x: 520, y: 390 },
        title: 'Gate terminal',
        lock: { prompt: 'ENTER SEAT NUMBER TO OPEN THIS PASS RECORD', placeholder: 'e.g. 12A', answers: ['9A'], hint: 'The seat is printed on the boarding pass.' },
        lines: ['GATE 13 · SCAN LOG', 'T-30  PASS 9A  READ OK', 'AIRCRAFT-DOOR CONFIRMATION: no entry for pass 9A', ...SCAN_GLOSSARY],
        events: [
          { key: 'scan', t: 30, label: 'Pass scanned at Gate 13', status: 'confirmed' },
          { key: 'onb', t: 0, label: 'Aircraft-door confirmation: none on record', status: 'unconfirmed' },
        ],
      },
      {
        id: 'notice',
        kind: 'paper',
        at: { v: 'win', x: 280, y: 220 },
        title: 'Gate notice',
        heading: 'BOARDING PAUSED',
        lines: ['T-22', 'Group 2: please return to the Main Lounge until the aircraft is ready.'],
        events: [{ key: 'notice', t: 22, label: 'Group 2 sent back to the Main Lounge', status: 'confirmed' }],
      },
      {
        id: 'agent',
        kind: 'person',
        at: { v: 'gate', x: 1000, y: 300 },
        title: 'Gate agent',
        talk: {
          who: 'Sana',
          role: 'Gate agent',
          intro: 'I wrote "Group 2 cleared" in the log. Ask me what I meant.',
          qa: [
            {
              q: 'What does "Group 2 cleared" mean?',
              a: 'My scanner registered the group, so I wrote cleared. I did not see them reach the aircraft.',
              events: [{ key: 'note', t: 19, label: '"Group 2 cleared" (scanner only; nobody saw them reach the aircraft)', status: 'unconfirmed' }],
            },
            { q: 'Where was Group 2 sent?', a: 'Boarding paused. I told them to wait in the Main Lounge until the aircraft was ready.' },
          ],
        },
      },
      {
        id: 'relative',
        kind: 'person',
        at: { v: 'seat', x: 280, y: 315 },
        title: 'Her husband',
        talk: {
          who: 'Dev',
          role: "Anjali's husband",
          intro: 'Boarding has restarted and I cannot find my wife.',
          qa: [
            {
              q: 'When did you last see Anjali?',
              a: 'At the gate, when they sent the group to the lounge. She said she would charge her phone and come straight back. I stayed because they said ten minutes.',
              events: [{ key: 'stmt', t: 12, label: 'Husband: Anjali went to charge her phone in the lounge', status: 'unconfirmed' }],
            },
            { q: 'Is her bag on the plane?', a: 'Yes, we checked it in together.' },
            { q: 'Have you tried calling?', a: 'No answer. She said her battery was low.' },
          ],
        },
      },
      { id: 'map', kind: 'map', at: { v: 'bag', x: 150, y: 170 }, title: 'Terminal map', note: MAP_NOTE },
      {
        id: 'tag',
        kind: 'tag',
        at: { v: 'bag', x: 520, y: 290 },
        title: 'Bag tag',
        heading: 'BAG TAG',
        fields: [
          ['Passenger', 'MENON/ANJALI'],
          ['Flight', 'MA 613'],
          ['Tag no.', 'MA613-771204'],
          ['Pieces', '1 of 1'],
        ],
      },
      {
        id: 'bagterm',
        kind: 'terminal',
        at: { v: 'bag', x: 1150, y: 370 },
        title: 'Baggage terminal',
        lock: { prompt: 'ENTER BAG TAG NUMBER', placeholder: '6 digits', answers: ['771204', 'MA613771204'], hint: 'The tag number is printed on the bag tag.' },
        lines: ['BAG EVENTS · 771204', 'ACCEPTED  T-58', 'SORTED    T-46', 'LOADED    T-15  CONFIRMED', ...BAG_GLOSSARY],
        events: [
          { key: 'bag', t: 46, label: 'Bag accepted and sorted', status: 'confirmed' },
          { key: 'load', t: 15, label: 'Bag loaded onto the aircraft', status: 'confirmed' },
        ],
      },
    ],
    ledger: [
      { id: 'scan', label: 'Pass read at the gate', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Confirmed', why: 'The gate scan log shows the pass was read at T-30.' },
      { id: 'onboard', label: 'Passenger confirmed at the aircraft door', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Not confirmed', why: '"Group 2 cleared" only means the scanner registered the group. Nobody saw Anjali reach the aircraft.' },
      { id: 'bag', label: 'Bag confirmed loaded on the aircraft', kind: 'choice', options: ['Confirmed', 'Not confirmed'], answer: 'Confirmed', why: 'The bag is on the aircraft, which says nothing about where Anjali is.' },
    ],
    map: TERMINAL_MAP,
    decision: MAP_DECISION('lounge'),
    hints: [
      'The bag being loaded tells you where the bag is. What does it say about Anjali?',
      "Match her husband's account to a labeled place on the map.",
      'Group 2 was sent back when boarding paused; Anjali is charging her phone in the main lounge. Hold the flight and check the lounge.',
    ],
    conflicts: [{ a: 'note', b: 'stmt', note: 'These two accounts cannot both describe where Anjali is.' }],
    pa: [
      {
        atLeft: 177,
        en: 'Malabar Air flight M A six one three to Dubai: boarding is paused. Group two, please wait in the main lounge.',
        ml: 'മലബാർ എയർ എം എ 613 ദുബായ് വിമാനത്തിന്റെ ബോർഡിംഗ് താൽക്കാലികമായി നിർത്തി. ഗ്രൂപ്പ് രണ്ട് യാത്രക്കാർ പ്രധാന ലോഞ്ചിൽ കാത്തിരിക്കുക.',
        ar: 'رحلة ملبار إم إيه ٦١٣ إلى دبي: تم إيقاف الصعود مؤقتاً. على ركاب المجموعة الثانية الانتظار في الصالة الرئيسية.',
      },
      {
        atLeft: 110,
        en: 'Boarding has resumed. Passenger Anjali Menon, please proceed to gate thirteen.',
        ml: 'ബോർഡിംഗ് പുനരാരംഭിച്ചു. യാത്രക്കാരി അഞ്ജലി മേനോൻ, ദയവായി ഗേറ്റ് 13-ലേക്ക് വരിക.',
        ar: 'استؤنف الصعود إلى الطائرة. على الراكبة أنجلي مينون التوجه إلى البوابة ١٣.',
      },
      HOLD_PA,
    ],
    winPa: {
      en: 'Passenger located and escorted to the gate.',
      ml: 'യാത്രക്കാരിയെ കണ്ടെത്തി ഗേറ്റിലേക്ക് എത്തിച്ചു.',
      ar: 'تم العثور على الراكبة ومرافقتها إلى البوابة.',
    },
    losePa: {
      en: 'Flight M A six one three has departed. One passenger status remains unconfirmed.',
      ml: 'എം എ 613 വിമാനം പുറപ്പെട്ടു. ഒരു യാത്രക്കാരിയുടെ നില സ്ഥിരീകരിച്ചിട്ടില്ല.',
      ar: 'غادرت الرحلة إم إيه ٦١٣. لا تزال حالة إحدى الراكبات غير مؤكدة.',
    },
  },
  /* ------------------------------------------------------------------ */
  {
    id: 'ravi',
    title: 'The Wrong Clock',
    tagline: 'Same moment, different clocks.',
    flight: 'MA 615',
    passenger: 'Ravi Menon',
    opening: [
      '23:19 · Gate 13',
      'Malabar Air MA 615 to Dubai.',
      'The system has flagged passenger Ravi Menon as a late no-show and queued his bag for offloading.',
      'He says he was early. Read the clocks before anyone touches that bag.',
    ],
    boardHold: 'NO-SHOW FLAG RAISED: BAG OFFLOAD PENDING',
    boardWin: 'RECORD CORRECTED: PASSENGER SCANNED ON TIME',
    boardLose: 'FLIGHT DEPARTED: RECORD LEFT UNRESOLVED',
    winText:
      "The scan log used Singapore time (SGT, UTC+8) while the gate closes on India time (IST). Converted, Ravi's pass was read at 22:55 IST, fifteen minutes before the gate closed. The flag and the offload request both rested on a misread clock.",
    loseText:
      'The scan log was in SGT, which is 2 h 30 min ahead of IST. Converted, 01:25 SGT is 22:55 IST: fifteen minutes before the gate closed. The no-show flag and the offload request were a time-zone misread.',
    objects: [
      {
        id: 'pass',
        kind: 'pass',
        at: { v: 'gate', x: 900, y: 470 },
        title: 'Boarding pass',
        fields: [
          ['Passenger', 'RAVI MENON'],
          ['Flight', 'MA 615'],
          ['Route', 'CCJ to DXB'],
          ['Seat', '14F'],
          ['Departs', '23:30 IST'],
        ],
      },
      {
        id: 'flagterm',
        kind: 'terminal',
        at: { v: 'gate', x: 330, y: 390 },
        title: 'Check-in system',
        lines: ['CHECK-IN SYSTEM · MA 615', 'PASSENGER: MENON/RAVI', 'STATUS: NO-SHOW FLAG', 'REASON: pass read after gate closed (scan 01:25)', 'PENDING: offload checked bag'],
        events: [{ key: 'flag', t: null, when: 'FLAG', label: 'System flag: scanned after the gate closed', status: 'unconfirmed' }],
      },
      {
        id: 'scanlog',
        kind: 'terminal',
        at: { v: 'gate', x: 580, y: 390 },
        title: 'Scan log',
        lock: { prompt: 'ENTER SEAT NUMBER TO OPEN THIS PASS RECORD', placeholder: 'e.g. 12A', answers: ['14F'], hint: 'The seat is printed on the boarding pass.' },
        lines: ['AIRLINE SCAN LOG · SINGAPORE SERVER', 'PASS 14F  READ OK  01:25 SGT (UTC+8)', 'Times on this server are in SGT.'],
        events: [{ key: 'scan', t: null, when: '01:25 SGT', label: 'Pass read at the gate', status: 'confirmed' }],
      },
      {
        id: 'notice',
        kind: 'paper',
        at: { v: 'win', x: 280, y: 220 },
        title: 'Gate notice',
        heading: 'GATE CLOSE NOTICE',
        lines: ['Flight MA 615 departs 23:30 IST.', 'Gate 13 closes at 23:10 IST (India Standard Time).'],
        events: [{ key: 'close', t: null, when: '23:10 IST', label: 'Gate closes', status: 'confirmed' }],
      },
      {
        id: 'zones',
        kind: 'clock',
        at: { v: 'win', x: 480, y: 230 },
        title: 'World clock card',
        heading: 'WORLD CLOCK CARD',
        lines: ['IST (India) = UTC+5:30', 'SGT (Singapore) = UTC+8', 'GST (Dubai) = UTC+4', 'SGT is 2 h 30 min ahead of IST.', 'To get IST from SGT, subtract 2 h 30 min.'],
      },
      {
        id: 'ravi',
        kind: 'person',
        at: { v: 'seat', x: 280, y: 315 },
        title: 'The passenger',
        talk: {
          who: 'Ravi',
          role: 'Passenger',
          intro: 'I was early. I do not understand why my bag is being pulled.',
          qa: [
            {
              q: 'When did you reach the gate?',
              a: 'A little before eleven at night. I was not watching the clock, but I was not late.',
              events: [{ key: 'ravi', t: null, when: '~23:00', label: 'Ravi: arrived a little before 23:00', status: 'unconfirmed' }],
            },
            { q: 'What happened at the scanner?', a: 'It beeped green. The agent nodded and I went to find a seat.' },
            { q: 'Why are you flying to Dubai?', a: 'My daughter lives there. This is my first visit.' },
          ],
        },
      },
      {
        id: 'tag',
        kind: 'tag',
        at: { v: 'bag', x: 520, y: 290 },
        title: 'Bag tag',
        heading: 'BAG TAG',
        fields: [
          ['Passenger', 'MENON/RAVI'],
          ['Flight', 'MA 615'],
          ['Tag no.', 'MA615-903377'],
          ['Pieces', '1 of 1'],
        ],
      },
      {
        id: 'bagterm',
        kind: 'terminal',
        at: { v: 'bag', x: 1150, y: 370 },
        title: 'Baggage terminal',
        lock: { prompt: 'ENTER BAG TAG NUMBER', placeholder: '6 digits', answers: ['903377', 'MA615903377'], hint: 'The tag number is printed on the bag tag.' },
        lines: ['BAG EVENTS · 903377', 'ACCEPTED  22:10 IST', 'SORTED    22:31 IST', 'OFFLOAD REQUEST: pending (raised from the no-show flag)'],
        events: [
          { key: 'bag', t: null, when: '22:31 IST', label: 'Bag accepted and sorted', status: 'confirmed' },
          { key: 'off', t: null, when: 'PENDING', label: 'Offload request raised from the no-show flag', status: 'unconfirmed' },
        ],
      },
    ],
    ledger: [
      {
        id: 'ist',
        label: 'Pass read at (IST, 24h)',
        kind: 'time',
        answer: '22:55',
        why: '01:25 SGT minus 2 h 30 min = 22:55 IST.',
        onOk: [{ key: 'conv', t: null, when: '22:55 IST', label: 'Scan converted: 15 minutes before gate close', status: 'confirmed' }],
      },
      { id: 'before', label: 'Read before the gate closed (23:10 IST)?', kind: 'choice', options: ['Yes', 'No'], answer: 'Yes', why: '22:55 is 15 minutes before 23:10.' },
      { id: 'flag', label: 'The no-show flag is', kind: 'choice', options: ['Valid', 'Not valid'], answer: 'Not valid', why: 'The flag compared an SGT clock time with an IST gate time.' },
    ],
    decision: {
      groups: [
        {
          title: 'The record',
          options: [
            { id: 'noshow', label: 'Keep the no-show flag' },
            { id: 'correct', label: 'Correct it: scanned on time' },
          ],
        },
        {
          title: 'His bag',
          options: [
            { id: 'offload', label: 'Offload the bag' },
            { id: 'keep', label: 'Keep the bag on the flight' },
          ],
        },
      ],
      correct: ['correct', 'keep'],
      messages: {
        first: { noshow: 'The flag still rests on a misread time. Convert the scan to IST and decide again.' },
        fallback: 'Check the bag decision against the corrected scan time.',
      },
    },
    hints: [
      'Compare the time zone in the scan log with the time zone on the gate notice.',
      'Convert before you compare: SGT is 2 h 30 min ahead of IST.',
      '01:25 SGT minus 2:30 equals 22:55 IST, which is 15 minutes before gate closure at 23:10. Correct the record and keep his bag on the flight.',
    ],
    conflicts: [{ a: 'flag', b: 'conv', note: 'The flag and the converted scan time cannot both be right.' }],
    pa: [
      {
        atLeft: 177,
        en: 'Malabar Air flight M A six one five to Dubai is now boarding at gate thirteen.',
        ml: 'മലബാർ എയർ വിമാനം എം എ 615, ദുബായിലേക്കുള്ള ബോർഡിംഗ് ഗേറ്റ് 13-ൽ ആരംഭിച്ചിരിക്കുന്നു.',
        ar: 'رحلة الخطوط الجوية ملبار رقم إم إيه ٦١٥ المتجهة إلى دبي، الصعود إلى الطائرة الآن عند البوابة ١٣.',
      },
      {
        atLeft: 100,
        en: 'Passengers are reminded that gate thirteen closes at eleven ten, India time.',
        ml: 'ഗേറ്റ് 13 ഇന്ത്യൻ സമയം രാത്രി 11.10-ന് അടയ്ക്കുമെന്ന് യാത്രക്കാരെ ഓർമ്മിപ്പിക്കുന്നു.',
        ar: 'نذكّر الركاب بأن البوابة ١٣ ستُغلق عند الحادية عشرة وعشر دقائق بتوقيت الهند.',
      },
      { ...HOLD_PA, en: 'This flight is on hold. Operations are reviewing a passenger record.' },
    ],
    winPa: {
      en: 'Record corrected. Passenger scanned on time.',
      ml: 'രേഖ തിരുത്തി. യാത്രക്കാരൻ കൃത്യസമയത്ത് സ്കാൻ ചെയ്തു.',
      ar: 'تم تصحيح السجل. قام الراكب بالمسح في الوقت المحدد.',
    },
    losePa: {
      en: 'Flight M A six one five has departed. One passenger record remains unresolved.',
      ml: 'എം എ 615 വിമാനം പുറപ്പെട്ടു. ഒരു യാത്രക്കാരന്റെ രേഖ പരിഹരിക്കപ്പെട്ടിട്ടില്ല.',
      ar: 'غادرت الرحلة إم إيه ٦١٥. لا يزال سجل أحد الركاب دون حل.',
    },
  },
  /* ------------------------------------------------------------------ */
  {
    id: 'suitcase',
    title: 'The Suitcase That Travelled Alone',
    tagline: 'A bag at the gate does not mean it belongs to this flight.',
    flight: 'MA 613',
    passenger: 'Tariq Aziz',
    opening: [
      '23:14 · Gate 13',
      'Malabar Air MA 613 to Dubai is preparing for departure.',
      'A silver transfer suitcase sits on the Gate 13 loading chute. Ramp crew is about to load it into the hold.',
      'Ramp supervisor reports a routing tag mismatch. Determine where this suitcase belongs before it flies to the wrong country.',
    ],
    boardHold: 'TRANSFER MISMATCH: SUSPECT SUITCASE AT CHUTE 13',
    boardWin: 'SUITCASE REROUTED: DISPATCHED TO GATE 4 FOR QR 517',
    boardLose: 'FLIGHT DEPARTED: SUITCASE LOADED ONTO WRONG FLIGHT',
    winText:
      "Suitcase QA-883104 belongs to passenger Tariq Aziz, flying to London via Doha on Qatar Airways QR 517 from Gate 4. Diverter B's optical scanner smudged DOH as DXB, dumping it down Chute 13. Operations held the bag from MA 613 and rushed it to Gate 4 before their cart departed.",
    loseText:
      "The suitcase was destined for London via Doha on QR 517, but was misdirected to Chute 13 by an optical scanner fault. It should have been held from MA 613 and transferred to Gate 4.",
    objects: [
      {
        id: 'tag',
        kind: 'tag',
        at: { v: 'bag', x: 520, y: 290 },
        title: 'Baggage routing tag',
        heading: 'INTERLINE BAGGAGE TAG',
        manualAlias: 'TAG-883104',
        fields: [
          ['Passenger', 'AZIZ/TARIQ'],
          ['Tag No.', 'QA-883104'],
          ['Flight 1', 'QR 517 (CCJ to DOH)'],
          ['Connecting', 'QR 003 (DOH to LHR)'],
          ['Final Dest', 'LHR (London Heathrow)'],
        ],
        events: [
          { key: 'tag_dest', t: null, when: 'QR 517', label: 'Tag QA-883104 destination is London via Doha on QR 517', status: 'confirmed' },
        ],
      },
      {
        id: 'chuteterm',
        kind: 'terminal',
        at: { v: 'bag', x: 1150, y: 370 },
        title: 'Sortation terminal',
        lock: {
          prompt: 'ENTER 6-DIGIT BAG TAG NUMBER',
          placeholder: '6 digits',
          answers: ['883104', 'QA883104'],
          hint: 'The tag number is printed on the suitcase bag tag.',
        },
        lines: [
          'AUTOMATED SORTATION LOG · BAGGAGE SYSTEM',
          'BAG QA-883104 READ AT MAIN DIVERTER B',
          'ROUTED TO: CHUTE 13 (GATE 13 · MA 613 TO DUBAI)',
          'SYSTEM ALERT: OPTICAL DIVERTER MISREAD DETECTED',
          'DOH TAG READ AS DXB DUE TO BARCODE SCUFF',
          'HOLD STATUS: Bag on ramp cart; NOT in MA 613 hold',
        ],
        events: [
          { key: 'chute_misread', t: null, when: 'DIVERTER B', label: 'Diverter B optical scanner misread DOH as DXB', status: 'confirmed' },
          { key: 'hold_not_loaded', t: null, when: 'RAMP CART', label: 'Bag on Gate 13 cart; not loaded into MA 613 hold', status: 'confirmed' },
        ],
      },
      {
        id: 'handler',
        kind: 'person',
        at: { v: 'gate', x: 1000, y: 300 },
        title: 'Ramp agent',
        talk: {
          who: 'Hamza',
          role: 'Ramp Agent',
          intro: 'We have a stray silver case on the Chute 13 cart. If it is on my cart, my loaders are about to pack it into MA 613.',
          qa: [
            {
              q: 'Why was this suitcase sent to Gate 13?',
              a: 'The automated chute dropped it down here two minutes ago. Standard procedure is to load everything on Chute 13 unless you tell me otherwise.',
              events: [
                { key: 'crew_claim', t: null, when: 'RAMP', label: 'Ramp crew preparing to load suitcase into MA 613 forward hold', status: 'unconfirmed' },
              ],
            },
            {
              q: 'Where is flight QR 517 departing from?',
              a: 'Gate 4 on the North Concourse! Their loader cart leaves the apron in ten minutes.',
              events: [
                { key: 'gate4_cart', t: null, when: 'GATE 4', label: 'QR 517 loading at Gate 4; transfer cart departs in 10 minutes', status: 'confirmed' },
              ],
            },
            {
              q: 'Is passenger Tariq Aziz on MA 613?',
              a: 'No, Tariq Aziz is not on our passenger manifest. He checked in at Counter 4 with Qatar Airways.',
            },
          ],
        },
      },
      {
        id: 'schedule',
        kind: 'paper',
        at: { v: 'win', x: 280, y: 220 },
        title: 'Flight gate schedule',
        heading: 'OUTBOUND DEPARTURES & GATES',
        lines: [
          'MA 613 · DXB (Dubai) · Gate 13 · Departs 23:30',
          'QR 517 · DOH (Doha) · Gate 04 · Departs 23:45',
          'Baggage transfers for Doha/London must be routed via Gate 4 Transfer Cart.',
        ],
        events: [
          { key: 'sched_gate4', t: null, when: '23:45', label: 'Schedule confirms QR 517 departs Gate 4 at 23:45', status: 'confirmed' },
        ],
      },
      {
        id: 'maint',
        kind: 'receipt',
        at: { v: 'seat', x: 800, y: 592 },
        title: 'Sorter maintenance notice',
        heading: 'SORTER MAINTENANCE LOG',
        lines: [
          'T-40 · Diverter B lens smudged',
          'DOH barcode tags intermittently misread as DXB',
          'Chute 13 receives DXB spillover',
        ],
        note: 'Handwritten: "Check all London transfers on belt 2!"',
        events: [
          { key: 'maint_log', t: null, when: 'T-40', label: 'Maintenance log: Diverter B lens smudged, routing DOH to Chute 13', status: 'confirmed' },
        ],
        optional: true,
      },
      {
        id: 'pass',
        kind: 'pass',
        at: { v: 'gate', x: 840, y: 470 },
        title: 'Baggage transfer slip',
        fields: [
          ['Passenger', 'TARIQ AZIZ'],
          ['Route', 'CCJ to DOH to LHR'],
          ['Connecting Carrier', 'QATAR AIRWAYS QR 517'],
          ['Assigned Departure Gate', 'GATE 4'],
          ['Tag Reference', 'QA-883104'],
        ],
        events: [
          { key: 'transfer_manifest', t: null, when: 'GATE 4', label: 'Transfer slip confirms passenger on QR 517 at Gate 4', status: 'confirmed' },
        ],
      },
    ],
    ledger: [
      {
        id: 'dest',
        label: 'Suitcase final destination',
        kind: 'choice',
        options: ['Dubai (DXB)', 'London via Doha (DOH/LHR)'],
        answer: 'London via Doha (DOH/LHR)',
        why: 'Tag QA-883104 and the transfer slip confirm routing CCJ-DOH-LHR on Qatar Airways QR 517.',
      },
      {
        id: 'hold',
        label: 'Present loading status',
        kind: 'choice',
        options: ['Loaded in MA 613 hold', 'Still on Gate 13 cart'],
        answer: 'Still on Gate 13 cart',
        why: 'The sortation terminal and ramp agent confirm the bag is on the ramp cart and has not entered the cargo hold.',
      },
      {
        id: 'cause',
        label: 'Cause of Gate 13 delivery',
        kind: 'choice',
        options: ['Optical scanner misread DOH as DXB', 'Passenger changed flight'],
        answer: 'Optical scanner misread DOH as DXB',
        why: 'Maintenance log and sortation terminal confirm Diverter B scanner smudged DOH tags as DXB.',
      },
    ],
    decision: {
      groups: [
        {
          title: 'Suitcase action',
          options: [
            { id: 'hold_bag', label: 'Hold bag from MA 613' },
            { id: 'load_bag', label: 'Load onto MA 613' },
          ],
        },
        {
          title: 'Dispatch to',
          options: [
            { id: 'gate4', label: 'Dispatch to Gate 4 (QR 517)' },
            { id: 'unclaimed', label: 'Send to Unclaimed Luggage' },
          ],
        },
      ],
      correct: ['hold_bag', 'gate4'],
      messages: {
        first: { load_bag: 'Bag loaded onto MA 613! It will fly to Dubai while the passenger flies to London.' },
        fallback: 'Incorrect bag disposition. Recheck the routing slip and gate schedule.',
      },
    },
    hints: [
      'Inspect the destination codes on the bag tag and the sortation terminal log.',
      'Diverter B optical scanner misread DOH (Doha) as DXB (Dubai). Compare the bag tag with the flight schedule.',
      'The suitcase belongs to Tariq Aziz traveling on QR 517 at Gate 4. Do not load it onto MA 613; dispatch it to Gate 4 immediately.',
    ],
    conflicts: [
      { a: 'crew_claim', b: 'tag_dest', note: 'The ramp crew intent to load onto MA 613 contradicts the confirmed destination tag.' },
    ],
    pa: [
      {
        atLeft: 177,
        en: 'Malabar Air flight M A six one three to Dubai: baggage reconciliation is in progress at gate thirteen.',
        ml: 'മലബാർ എയർ വിമാനം എം എ 613, ദുബായിലേക്ക്: ലഗേജ് പരിശോധന ഗേറ്റ് 13-ൽ നടക്കുന്നു.',
        ar: 'رحلة ملبار إم إيه ٦١٣ إلى دبي: تجري مطابقة الأمتعة عند البوابة ١٣.',
      },
      {
        atLeft: 100,
        en: 'Ramp transfer cart for flight Q R five one seven departing gate four in ten minutes.',
        ml: 'വിമാനം ക്യു ആർ 517-നുള്ള റാംപ് ട്രാൻസ്ഫർ വണ്ടി പത്ത് മിനിറ്റിനുള്ളിൽ ഗേറ്റ് 4-ൽ നിന്ന് തിരിക്കും.',
        ar: 'عربة النقل للرحلة كيو آر ٥١٧ تغادر البوابة ٤ بعد عشر دقائق.',
      },
      HOLD_PA,
    ],
    winPa: {
      en: 'Suitcase rerouted to Gate 4. Loading onto flight Q R five one seven confirmed.',
      ml: 'സ്യൂട്ട്കേസ് ഗേറ്റ് 4-ലേക്ക് തിരിച്ചുവിട്ടു. ക്യു ആർ 517-ൽ കയറ്റിയത് സ്ഥിരീകരിച്ചു.',
      ar: 'تمت إعادة توجيه الحقيبة إلى البوابة ٤ وتأكيد تحميلها على الرحلة كيو آر ٥١٧.',
    },
    losePa: {
      en: 'Flight M A six one three has departed. Misrouted baggage status unresolved.',
      ml: 'എം എ 613 വിമാനം പുറപ്പെട്ടു. തെറ്റായ ലഗേജിന്റെ കാര്യം പരിഹരിക്കപ്പെട്ടിട്ടില്ല.',
      ar: 'غادرت الرحلة إم إيه ٦١٣. لا تزال حالة الأمتعة الخاطئة غير محلولة.',
    },
  },
  /* ------------------------------------------------------------------ */
  {
    id: 'phone',
    title: 'The Phone Left Behind',
    tagline: 'A ringing screen, three names, and two minutes before departure.',
    flight: 'MA 613',
    passenger: 'Dr. Farhan Ahmad',
    opening: [
      '23:18 · Gate 13',
      'Malabar Air MA 613 to Dubai.',
      'A ringing smartphone was found on a waiting area seat. Boarding is almost complete.',
      'Identify the owner and deliver the phone before the aircraft door closes. Three passengers share similar initials.',
    ],
    boardHold: 'UNATTENDED PROPERTY: SMARTPHONE RECOVERED AT SEATING ROW C',
    boardWin: 'DELIVERY COMPLETED: PHONE HANDED TO DR. AHMAD ONBOARD',
    boardLose: 'FLIGHT DEPARTED: PASSENGER STRANDED WITHOUT ESSENTIAL DEVICE',
    winText:
      "Calendar alerts, cab payment details, and pharmacy records identified Dr. Farhan Ahmad in Seat 17A as the owner of the smartphone. Terminal Directive EX-04 permits handoff directly to the lead cabin crew at the aircraft door when the seat is verified. Dr. Ahmad received his phone just before the door closed.",
    loseText:
      "The phone belonged to Dr. Farhan Ahmad, who was already seated in 17A. Sending it to Lost & Found or misidentifying the owner left him flying to Dubai without his conference materials.",
    objects: [
      {
        id: 'phone',
        kind: 'phone',
        at: { v: 'seat', x: 800, y: 592 },
        title: 'Lost smartphone',
        heading: 'LOST SMARTPHONE · LOCK SCREEN',
        manualAlias: 'PHONE-4192',
        lines: [
          '23:15 · Battery 14%',
          'CALENDAR: Gulf Medical Summit opening session tomorrow 09:00 Dubai',
          'CAB RECEIPT: CCJ Airport drop-off · Paid ₹840 by Visa ****4192',
          'SMS from Dr. Kabeer: Boarding now Farhan? Safe travels!',
        ],
        events: [
          { key: 'phone_screen', t: null, when: '23:15', label: 'Phone screen indicates passenger Farhan attending Gulf Medical Summit', status: 'confirmed' },
          { key: 'card_last4', t: null, when: 'VISA 4192', label: 'Recent cab receipt paid by card ending 4192', status: 'confirmed' },
        ],
      },
      {
        id: 'manifestterm',
        kind: 'terminal',
        at: { v: 'gate', x: 520, y: 390 },
        title: 'Manifest lookup terminal',
        lock: {
          prompt: 'ENTER 4-DIGIT CARD NUMBER FROM RECENT RECEIPT',
          placeholder: '4 digits',
          answers: ['4192'],
          hint: 'The 4-digit card number is visible on the phone lock screen ride receipt.',
        },
        lines: [
          'GATE 13 · PASSENGER LOOKUP SYSTEM',
          'CARD ****4192 MATCH: DR. FARHAN AHMAD',
          'SEAT: 17A · STATUS: BOARDED AT 23:05 · SEATED ONBOARD',
          'OTHER PARTIAL INITIAL MATCHES:',
          'FAHIM ANSARI (SEAT 24D) · STATUS: NO-SHOW AT CHECK-IN',
          'FAYIS ALI (SEAT 05C) · STATUS: BOOKING CANCELLED',
        ],
        events: [
          { key: 'farhan_seated', t: null, when: 'SEAT 17A', label: 'Dr. Farhan Ahmad in Seat 17A is confirmed boarded and seated', status: 'confirmed' },
          { key: 'pax_unboarded', t: null, when: 'NOT BOARDED', label: 'Fahim Ansari and Fayis Ali are not onboard MA 613', status: 'unconfirmed' },
        ],
      },
      {
        id: 'attendant',
        kind: 'person',
        at: { v: 'win', x: 280, y: 220 },
        title: 'Lead cabin crew',
        talk: {
          who: 'Leila',
          role: 'Lead Cabin Crew',
          intro: 'The jet bridge door is still open for another minute. Can I help with something urgent?',
          qa: [
            {
              q: 'Can we still deliver an item to a seated passenger?',
              a: 'Yes! If you can confirm the seat number with operations, I will take it to them right now before we close the door.',
              events: [
                { key: 'door_open', t: null, when: 'AIRCRAFT DOOR', label: 'Cabin crew available to deliver item to verified seat before door closure', status: 'confirmed' },
              ],
            },
            {
              q: 'Has anyone in row 17 reported a missing device?',
              a: 'The passenger in 17A was anxiously checking his jacket pockets just as I walked out.',
              events: [
                { key: 'crew_distress', t: null, when: 'ROW 17', label: 'Passenger in 17A observed searching for missing phone', status: 'confirmed' },
              ],
            },
            {
              q: 'Should this go to Terminal Lost & Found?',
              a: 'Directive EX-04 says if we have the seat number for a departing flight, deliver it to the door. Lost & Found means he flies without his phone.',
            },
          ],
        },
      },
      {
        id: 'pass',
        kind: 'pass',
        at: { v: 'seat', x: 280, y: 315 },
        title: 'Boarding pass stub',
        fields: [
          ['Passenger', 'AHMAD/FARHAN DR'],
          ['Flight', 'MA 613'],
          ['Seat', '17A'],
          ['Gate', '13'],
        ],
        events: [
          { key: 'pass_stub', t: null, when: 'SEAT 17A', label: 'Boarding pass stub confirms Dr. Farhan Ahmad in Seat 17A', status: 'confirmed' },
        ],
      },
      {
        id: 'lostnotice',
        kind: 'paper',
        at: { v: 'bag', x: 150, y: 170 },
        title: 'Terminal directive EX-04',
        heading: 'DISPATCH DIRECTIVE EX-04',
        lines: [
          'STANDARD RULE: Unidentified lost property goes to Main Concourse Lost & Found.',
          'EXCEPTION EX-04: When verified passenger identity and onboard seat number are established prior to door closure, dispatch directly to Lead Cabin Crew at aircraft door.',
        ],
        events: [
          { key: 'rule_ex04', t: null, when: 'EX-04', label: 'Directive EX-04 permits direct handoff to cabin crew if seat verified', status: 'confirmed' },
        ],
      },
      {
        id: 'pharmreceipt',
        kind: 'receipt',
        at: { v: 'gate', x: 840, y: 470 },
        title: 'Pharmacy receipt',
        heading: 'AIRPORT PHARMACY · GATE 13',
        lines: [
          'Time: 22:45',
          '1 x Travel Lozenges',
          'Paid: Visa ****4192',
          'Customer: Dr. F. Ahmad',
        ],
        note: 'Badge attached: "Gulf Medical Summit 2026 Delegate".',
        events: [
          { key: 'pharm_card', t: null, when: '22:45', label: 'Pharmacy receipt links Card 4192 to Dr. F. Ahmad (Gulf Medical Summit)', status: 'confirmed' },
        ],
        optional: true,
      },
    ],
    ledger: [
      {
        id: 'owner',
        label: 'Phone owner',
        kind: 'choice',
        options: ['Dr. Farhan Ahmad', 'Fahim Ansari', 'Fayis Ali'],
        answer: 'Dr. Farhan Ahmad',
        why: 'Calendar, SMS, cab receipt, and pharmacy receipt match Card 4192 to Dr. Farhan Ahmad.',
      },
      {
        id: 'location',
        label: 'Owner current status',
        kind: 'choice',
        options: ['Seated onboard (Seat 17A)', 'Still in terminal'],
        answer: 'Seated onboard (Seat 17A)',
        why: 'Manifest terminal and cabin crew confirm Dr. Farhan Ahmad is seated in 17A.',
      },
      {
        id: 'directive',
        label: 'Authorised procedure',
        kind: 'choice',
        options: ['Deliver to aircraft door under EX-04', 'Deposit at Lost & Found'],
        answer: 'Deliver to aircraft door under EX-04',
        why: 'Directive EX-04 permits direct delivery to cabin crew at aircraft door when seat assignment is verified.',
      },
    ],
    decision: {
      groups: [
        {
          title: 'Recipient',
          options: [
            { id: 'farhan', label: 'Dr. Farhan Ahmad (Seat 17A)' },
            { id: 'lostfound', label: 'Terminal Lost & Found' },
          ],
        },
        {
          title: 'Delivery point',
          options: [
            { id: 'cabindoor', label: 'Lead Cabin Crew at aircraft door' },
            { id: 'bagcounter', label: 'Ground Baggage counter' },
          ],
        },
      ],
      correct: ['farhan', 'cabindoor'],
      messages: {
        first: { lostfound: 'Phone sent to Lost & Found while Dr. Ahmad flew to Dubai without his device. Recheck procedure EX-04.' },
        fallback: 'Incorrect delivery procedure. Recheck the passenger lookup and directive EX-04.',
      },
    },
    hints: [
      'Inspect the notifications on the phone and check the payment card digits.',
      'Use the 4-digit card number from the ride receipt to unlock the passenger lookup terminal, then compare names.',
      'The phone belongs to Dr. Farhan Ahmad in Seat 17A. Under directive EX-04, deliver it to the lead cabin crew at the aircraft door.',
    ],
    conflicts: [
      { a: 'pax_unboarded', b: 'farhan_seated', note: 'Initial confusion over unboarded passengers Fahim Ansari and Fayis Ali contradicts Dr. Ahmad confirmed in Seat 17A.' },
    ],
    pa: [
      {
        atLeft: 177,
        en: 'Malabar Air flight M A six one three to Dubai is in final boarding. Gate thirteen doors closing soon.',
        ml: 'മലബാർ എയർ വിമാനം എം എ 613, ദുബായ് ബോർഡിംഗ് അവസാനഘട്ടത്തിലാണ്. ഗേറ്റ് 13 ഉടൻ അടയ്ക്കും.',
        ar: 'رحلة ملبار إم إيه ٦١٣ إلى دبي في مراحل الصعود الأخيرة. تغلق أبواب البوابة ١٣ قريباً.',
      },
      {
        atLeft: 95,
        en: 'Cabin crew, prepare for door closure on flight M A six one three.',
        ml: 'ക്യാബിൻ ക്രൂ, എം എ 613 വിമാനത്തിന്റെ വാതിലുകൾ അടയ്ക്കാൻ തയ്യാറാകുക.',
        ar: 'طاقم الطائرة، يرجى الاستعداد لإغلاق الأبواب للرحلة إم إيه ٦١٣.',
      },
      HOLD_PA,
    ],
    winPa: {
      en: 'Phone delivered to passenger in seat seventeen A. Departure cleared.',
      ml: 'സീറ്റ് പതിനേഴ് എ-യിലെ യാത്രക്കാരന് ഫോൺ എത്തിച്ചുനൽകി. വിമാനം പുറപ്പെടാൻ അനുമതി.',
      ar: 'تم تسليم الهاتف للراكب في المقعد ١٧ أ. تمت الموافقة على المغادرة.',
    },
    losePa: {
      en: 'Flight M A six one three has departed. Unclaimed property remained unreturned.',
      ml: 'എം എ 613 വിമാനം പുറപ്പെട്ടു. അവകാശപ്പെടാത്ത ഉപകരണം തിരികെ നൽകാനായില്ല.',
      ar: 'غادرت الرحلة إم إيه ٦١٣. بقيت الممتلكات المفقودة دون إعادة.',
    },
  },
];

export const caseById = (id: string): CaseDef => CASES.find((c) => c.id === id) ?? CASES[0];
