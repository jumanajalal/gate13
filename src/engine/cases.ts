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
        events: [{ key: 'receipt', t: 29, label: 'Receipt places Nila with the boy', status: 'confirmed' }],
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
];

export const caseById = (id: string): CaseDef => CASES.find((c) => c.id === id) ?? CASES[0];
