import type { CaseDef, MapDef } from './types';

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

const GLOSSARY_PASS =
  'Glossary: SCAN = pass read at the gate. ONBOARD = passenger confirmed at the aircraft door.';

export const CASES: CaseDef[] = [
  {
    id: 'nila',
    title: 'The Group 3 Redirect',
    tagline: 'A scan is not the same as being onboard.',
    flight: 'MA 613',
    passenger: 'Nila Varghese',
    intro:
      "Nila Varghese's pass was scanned at Gate 13, but her relative says she never reached the aircraft. Departure is on hold. Work out what the records actually prove, then tell operations what to do.",
    boardHold: 'DEPARTURE HOLD: PASSENGER STATUS UNCONFIRMED',
    boardWin: 'PASSENGER LOCATED: WELFARE CHECK IN PROGRESS',
    boardLose: 'FLIGHT DEPARTED: PASSENGER STATUS UNCONFIRMED',
    winText:
      "Nila's pass was scanned, but nothing confirmed she reached the aircraft: the staff note only says the scanner registered the group. The notice, the map and the relative's statement point to where she actually stopped, with her nephew. Her bag was accepted and sorted, and its loading is still unconfirmed.",
    loseText:
      'The records never confirmed Nila on board. The best next step was to hold the flight and check where the route evidence pointed, while keeping the bag marked unconfirmed.',
    bundles: [
      {
        id: 'A',
        title: 'Boarding',
        items: [
          { id: 'pass', title: 'Boarding pass stub', body: 'MA 613 · NILA VARGHESE · Group 3 · Seat 22C · Gate 13' },
          {
            id: 'scan',
            title: 'Gate scan log',
            body: `T-27: pass 22C read OK. No other entries for this pass.<br>${GLOSSARY_PASS}`,
            events: [
              { key: 'scan', t: 27, label: 'Pass scanned at Gate 13', status: 'confirmed' },
              { key: 'onb', t: 0, label: 'Onboard confirmation: none on record', status: 'unconfirmed' },
            ],
          },
        ],
        question: {
          text: 'What does this record establish?',
          options: [
            'Nila boarded the aircraft',
            'Her pass was read at the gate; reaching the aircraft is not recorded',
            'Nila never reached the gate',
          ],
          answer: 1,
        },
      },
      {
        id: 'B',
        title: 'Movement',
        showMap: true,
        items: [
          {
            id: 'notice',
            title: 'Gate change notice',
            body: 'T-24: Group 3 to wait at Holding Point H2 until called again.',
            events: [{ key: 'notice', t: 24, label: 'Group 3 redirected to Holding Point H2', status: 'confirmed' }],
          },
          {
            id: 'note',
            title: 'Staff note',
            body: 'T-20: "Group 3 cleared." The scanner registered the group. Staff did not see the group reach the aircraft.',
            events: [
              { key: 'note', t: 20, label: '"Group 3 cleared" (scanner only; nobody saw them reach the aircraft)', status: 'unconfirmed' },
            ],
          },
          {
            id: 'stmt',
            title: 'Relative statement',
            body: '"When they redirected Group 3, Nila stopped with the boy by the coffee counter. I went toward the gate because an agent said the group would be called again."',
            events: [{ key: 'stmt', t: 17, label: 'Relative: Nila last seen at the coffee counter (see map)', status: 'unconfirmed' }],
          },
          {
            id: 'receipt',
            title: 'Duty-free receipt',
            body: 'T-29: one sweets purchase. On the back, a child\'s drawing of a plane, signed "Rohan".',
            events: [{ key: 'receipt', t: 29, label: 'Receipt places Nila with the boy', status: 'confirmed' }],
          },
        ],
        question: {
          text: 'Where do the notice, the map and the statement point?',
          options: ['The aircraft door', 'Holding Point H2', 'The main lounge'],
          answer: 1,
        },
      },
      {
        id: 'C',
        title: 'Baggage',
        items: [
          { id: 'tag', title: 'Bag tag', body: 'MA 613 · VARGHESE/NILA · 1 checked bag' },
          {
            id: 'strip',
            title: 'Bag event strip (fictional extract)',
            body: 'ACCEPTED T-60 · SORTED T-48 · LOADED: not confirmed.<br>Glossary: LOADED = bag confirmed on the aircraft.',
            events: [
              { key: 'bag', t: 48, label: 'Bag accepted and sorted', status: 'confirmed' },
              { key: 'load', t: 0, label: 'Bag loaded: no record', status: 'unconfirmed' },
            ],
          },
        ],
        question: {
          text: 'What does the bag record establish?',
          options: ['The bag was loaded', 'Accepted and sorted; loading is unconfirmed', 'The bag is lost'],
          answer: 1,
        },
      },
    ],
    map: TERMINAL_MAP,
    decision: {
      groups: [
        { title: 'Action', options: [{ id: 'hold', label: 'Hold and verify' }, { id: 'clear', label: 'Clear the flight' }] },
        {
          title: 'Send staff to check',
          options: [
            { id: 'door', label: 'Aircraft door' },
            { id: 'H2', label: 'Holding Point H2' },
            { id: 'lounge', label: 'Main lounge' },
          ],
        },
      ],
      correct: ['hold', 'H2'],
      messages: {
        first: { clear: 'Flight released: passenger status unresolved. Recheck the evidence and decide again.' },
        fallback: 'No confirmation at that location. Recheck the route evidence.',
      },
    },
    hints: [
      'Separate three things: scanned, moving, onboard. Which of them does each record actually prove?',
      "Match the relative's landmark to a labeled place on the map.",
    ],
    conflicts: [{ a: 'note', b: 'stmt', note: 'These two records cannot both describe where Nila is.' }],
    moves: [
      { atElapsed: 100, loc: 'lounge', text: 'Staff update: a woman with a child was seen leaving H2 toward the main lounge.' },
    ],
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
      {
        atLeft: 45,
        en: 'This flight is on hold. Operations are reconciling passenger records.',
        ml: 'ഈ വിമാനം തൽക്കാലം നിർത്തിവച്ചിരിക്കുന്നു. യാത്രക്കാരുടെ രേഖകൾ പരിശോധിക്കുകയാണ്.',
        ar: 'هذه الرحلة متوقفة مؤقتاً. تقوم العمليات بمطابقة سجلات الركاب.',
      },
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
  {
    id: 'anjali',
    title: 'The Sent-Back Group',
    tagline: 'A loaded bag still is not a passenger.',
    flight: 'MA 613',
    passenger: 'Anjali Menon',
    intro:
      "Anjali Menon's pass was scanned and her bag is on the aircraft, but she is not in her seat and her relative cannot reach her. Departure is on hold. Decide what the records prove and where staff should look.",
    boardHold: 'DEPARTURE HOLD: PASSENGER NOT IN SEAT, BAG LOADED',
    boardWin: 'PASSENGER LOCATED: ESCORTED TO GATE',
    boardLose: 'FLIGHT DEPARTED: PASSENGER STATUS UNCONFIRMED',
    winText:
      "Anjali's pass was scanned, but nothing confirmed she reached the aircraft. Boarding was paused and Group 2 was sent back to the lounge; her relative says she went to charge her phone. Her bag was confirmed loaded, which says where the bag is and nothing about where she is.",
    loseText:
      'The bag record was a distraction: a loaded bag does not locate its owner. The notice and the statement both pointed to the lounge, so that was where staff needed to check.',
    bundles: [
      {
        id: 'A',
        title: 'Boarding',
        items: [
          { id: 'pass', title: 'Boarding pass stub', body: 'MA 613 · ANJALI MENON · Group 2 · Seat 9A · Gate 13' },
          {
            id: 'scan',
            title: 'Gate scan log',
            body: `T-30: pass 9A read OK. No other entries for this pass.<br>${GLOSSARY_PASS}`,
            events: [
              { key: 'scan', t: 30, label: 'Pass scanned at Gate 13', status: 'confirmed' },
              { key: 'onb', t: 0, label: 'Onboard confirmation: none on record', status: 'unconfirmed' },
            ],
          },
        ],
        question: {
          text: 'What does this record establish?',
          options: [
            'Anjali is in her seat',
            'Her pass was read at the gate; reaching the aircraft is not recorded',
            'Anjali was never at the airport',
          ],
          answer: 1,
        },
      },
      {
        id: 'B',
        title: 'Movement',
        showMap: true,
        items: [
          {
            id: 'notice',
            title: 'Gate change notice',
            body: 'T-22: Boarding paused. Group 2 to return to the Main Lounge until the aircraft is ready.',
            events: [{ key: 'notice', t: 22, label: 'Group 2 sent back to the Main Lounge', status: 'confirmed' }],
          },
          {
            id: 'note',
            title: 'Staff note',
            body: 'T-19: "Group 2 cleared." The scanner registered the group. Staff did not see the group reach the aircraft.',
            events: [
              { key: 'note', t: 19, label: '"Group 2 cleared" (scanner only; nobody saw them reach the aircraft)', status: 'unconfirmed' },
            ],
          },
          {
            id: 'stmt',
            title: 'Relative statement',
            body: '"Anjali went back to the lounge with the others to charge her phone. I stayed at the gate because they said ten minutes. Now boarding has resumed and I can\'t reach her."',
            events: [{ key: 'stmt', t: 12, label: 'Relative: Anjali went to charge her phone in the lounge', status: 'unconfirmed' }],
          },
        ],
        question: {
          text: 'Where do the notice, the map and the statement point?',
          options: ['The aircraft door', 'Holding Point H2', 'The main lounge'],
          answer: 2,
        },
      },
      {
        id: 'C',
        title: 'Baggage',
        items: [
          { id: 'tag', title: 'Bag tag', body: 'MA 613 · MENON/ANJALI · 1 checked bag' },
          {
            id: 'strip',
            title: 'Bag event strip (fictional extract)',
            body: 'ACCEPTED T-58 · SORTED T-46 · LOADED T-15 (confirmed).<br>Glossary: LOADED = bag confirmed on the aircraft.',
            events: [
              { key: 'bag', t: 46, label: 'Bag accepted and sorted', status: 'confirmed' },
              { key: 'load', t: 15, label: 'Bag loaded onto the aircraft', status: 'confirmed' },
            ],
          },
        ],
        question: {
          text: 'What does the bag record establish?',
          options: [
            'Anjali is on the aircraft',
            'The bag is on the aircraft; it says nothing about where Anjali is',
            'The bag must be removed',
          ],
          answer: 1,
        },
      },
    ],
    map: TERMINAL_MAP,
    decision: {
      groups: [
        { title: 'Action', options: [{ id: 'hold', label: 'Hold and verify' }, { id: 'clear', label: 'Clear the flight' }] },
        {
          title: 'Send staff to check',
          options: [
            { id: 'door', label: 'Aircraft door' },
            { id: 'H2', label: 'Holding Point H2' },
            { id: 'lounge', label: 'Main lounge' },
          ],
        },
      ],
      correct: ['hold', 'lounge'],
      messages: {
        first: { clear: 'Flight released: passenger status unresolved. Recheck the evidence and decide again.' },
        fallback: 'No confirmation at that location. Recheck the route evidence.',
      },
    },
    hints: [
      'The bag being loaded tells you where the bag is. What does it say about Anjali?',
      "Match the relative's statement to a labeled place on the map.",
    ],
    conflicts: [{ a: 'note', b: 'stmt', note: 'These two records cannot both describe where Anjali is.' }],
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
      {
        atLeft: 45,
        en: 'This flight is on hold. Operations are reconciling passenger records.',
        ml: 'ഈ വിമാനം തൽക്കാലം നിർത്തിവച്ചിരിക്കുന്നു. യാത്രക്കാരുടെ രേഖകൾ പരിശോധിക്കുകയാണ്.',
        ar: 'هذه الرحلة متوقفة مؤقتاً. تقوم العمليات بمطابقة سجلات الركاب.',
      },
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
  {
    id: 'ravi',
    title: 'The Wrong Clock',
    tagline: 'Same moment, different clocks.',
    flight: 'MA 615',
    passenger: 'Ravi Menon',
    intro:
      'The system flagged Ravi Menon as a late no-show and queued his checked bag for offloading. Ravi insists he scanned in with time to spare. Read the clocks, then fix the record.',
    boardHold: 'NO-SHOW FLAG RAISED: BAG OFFLOAD PENDING',
    boardWin: 'RECORD CORRECTED: PASSENGER SCANNED ON TIME',
    boardLose: 'FLIGHT DEPARTED: RECORD LEFT UNRESOLVED',
    winText:
      "The scan log used Singapore time (SGT, UTC+8) while the gate closes on India time (IST). Converted, Ravi's pass was read at 22:55 IST, fifteen minutes before the gate closed. The flag and the offload request both rested on a misread clock.",
    loseText:
      "The scan log was in SGT, which is 2 h 30 min ahead of IST. Converted, 01:25 SGT is 22:55 IST: fifteen minutes before the gate closed. The no-show flag and the offload request were a time-zone misread.",
    bundles: [
      {
        id: 'A',
        title: 'Boarding',
        items: [
          {
            id: 'pass',
            title: 'Boarding pass stub',
            body: 'MA 615 · RAVI MENON · Seat 14F · Departs 23:30 IST · Gate closes 23:10 IST',
          },
          {
            id: 'flag',
            title: 'System flag',
            body: 'NO-SHOW FLAG: pass read after gate closed (scan 01:25). Pending: offload checked bag.',
            events: [{ key: 'flag', t: null, when: 'flag', label: 'System flag: scanned after the gate closed', status: 'unconfirmed' }],
          },
          {
            id: 'scan',
            title: 'Gate scan log',
            body: "Pass 14F read OK at 01:25 SGT (UTC+8). Logged by the airline's Singapore server.",
            events: [{ key: 'scan', t: null, when: '01:25 SGT', label: 'Pass read at the gate', status: 'confirmed' }],
          },
        ],
        question: {
          text: 'What does the flag rest on?',
          options: [
            'A scan time read as if it were local time',
            'Ravi arriving after the gate closed',
            'A broken scanner',
          ],
          answer: 0,
        },
      },
      {
        id: 'B',
        title: 'Clocks',
        items: [
          {
            id: 'close',
            title: 'Gate close notice',
            body: 'Gate 13 closes at 23:10 IST (India Standard Time).',
            events: [{ key: 'close', t: null, when: '23:10 IST', label: 'Gate closes', status: 'confirmed' }],
          },
          {
            id: 'zones',
            title: 'Time zone card',
            body: 'IST = UTC+5:30 · SGT = UTC+8 · GST (Dubai) = UTC+4.<br>SGT is 2 h 30 min ahead of IST. To get IST, subtract 2 h 30 min from SGT.',
          },
        ],
        question: {
          text: 'When was the pass read, in IST?',
          options: ['01:25 IST, after the gate closed', '22:55 IST, 15 minutes before it closed', '03:55 IST'],
          answer: 1,
        },
        onCorrect: [
          { key: 'conv', t: null, when: '22:55 IST', label: 'Scan converted: 15 minutes before gate close', status: 'confirmed' },
        ],
      },
      {
        id: 'C',
        title: 'Baggage',
        items: [
          { id: 'tag', title: 'Bag tag', body: 'MA 615 · MENON/RAVI · 1 checked bag' },
          {
            id: 'strip',
            title: 'Bag event strip (fictional extract)',
            body: 'ACCEPTED 22:10 IST · SORTED 22:31 IST · OFFLOAD REQUEST: pending (raised from the no-show flag).',
            events: [
              { key: 'bag', t: null, when: '22:31 IST', label: 'Bag accepted and sorted', status: 'confirmed' },
              { key: 'off', t: null, when: 'pending', label: 'Offload request raised from the no-show flag', status: 'unconfirmed' },
            ],
          },
        ],
        question: {
          text: 'What should happen to the offload request?',
          options: ['Proceed: he missed the gate', 'Cancel it: it rests on a misread time', 'Wait until Ravi explains'],
          answer: 1,
        },
      },
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
      {
        atLeft: 45,
        en: 'This flight is on hold. Operations are reviewing a passenger record.',
        ml: 'ഈ വിമാനം തൽക്കാലം നിർത്തിവച്ചിരിക്കുന്നു. ഒരു യാത്രക്കാരന്റെ രേഖ പരിശോധിക്കുകയാണ്.',
        ar: 'هذه الرحلة متوقفة مؤقتاً. تراجع العمليات سجل أحد الركاب.',
      },
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
