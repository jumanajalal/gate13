# Case bible (answer keys, keep private)

Time is T-minutes before scheduled departure unless a case uses clock times. All fictional.

## Case 1: The Group 3 Redirect (`nila`)

**Truth:** Nila Varghese's pass was scanned at T-27. At T-24 Group 3 was redirected to Holding Point H2. A staff note at T-20 says "Group 3 cleared" but only means the scanner registered the group; nobody saw them reach the aircraft. Nila stopped at the coffee counter in H2 with her nephew Rohan. Her bag was accepted and sorted; no load event on record.

**Lock codes:** gate terminal = seat 22C (on the boarding pass); baggage terminal = tag 482915 (on the bag tag).
**Ledger answers:** pass read at gate = Confirmed · confirmed at aircraft door = Not confirmed · bag loaded = Not confirmed.
**Radio:** Hold and verify, tap H2 on the map.
**Conflict flagged:** staff note vs relative statement (cannot both describe where Nila is).
**Hard mode:** at 100 s elapsed a staff update says she left H2 toward the main lounge, so the correct location becomes the lounge. The banner and a PA line announce it.
**Hints:** (1) separate scanned / moving / onboard. (2) match the landmark to the map.

## Case 2: The Sent-Back Group (`anjali`)

**Truth:** Anjali Menon's pass was scanned at T-30. Boarding was paused at T-22 and Group 2 sent back to the Main Lounge. The relative says she went to charge her phone. Her bag shows LOADED at T-15, which says where the bag is and nothing about where she is.

**Lock codes:** gate terminal = seat 9A; baggage terminal = tag 771204.
**Ledger answers:** pass read = Confirmed · at aircraft door = Not confirmed · bag loaded = Confirmed.
**Radio:** Hold and verify, tap the main lounge.
**Design point:** the loaded bag is the tempting distraction; the notice and her husband carry the deduction.

## Case 3: The Wrong Clock (`ravi`)

**Truth:** Departure 23:30 IST, gate closes 23:10 IST. The scan log is in SGT (UTC+8) from a Singapore server: 01:25 SGT. SGT is 2 h 30 min ahead of IST, so the scan was 22:55 IST, 15 minutes before gate close. The no-show flag and the offload request rest on a misread time.

**Lock codes:** scan log = seat 14F; baggage terminal = tag 903377. The check-in system terminal is open and shows the flag.
**Ledger answers:** pass read at (IST) = 22:55 (typing 2255 or 22.55 also works) · read before 23:10 IST = Yes · no-show flag = Not valid.
**Radio:** Correct the record (scanned on time) and keep the bag on the flight.
**Check:** 01:25 minus 2:30 = 22:55. The distractor 03:55 comes from adding instead of subtracting.

## Case 4: The Suitcase That Travelled Alone (`suitcase`)

**Truth:** Suitcase QA-883104 belongs to passenger Tariq Aziz, routing CCJ to DOH to LHR on Qatar Airways QR 517 departing from Gate 4 at 23:45. Sorter Diverter B had a smudged optical lens and misread the DOH routing barcode as DXB, dropping the bag down Chute 13. The ramp loaders on MA 613 were about to pack it into the cargo hold. The bag must be held from MA 613 and dispatched immediately to the Gate 4 transfer cart before their loader leaves.

**Lock codes:** sortation terminal = tag 883104 (or QA883104, printed on the baggage tag).
**Ledger answers:** suitcase final destination = London via Doha (DOH/LHR) · present loading status = Still on Gate 13 cart · cause of Gate 13 delivery = Optical scanner misread DOH as DXB.
**Radio:** Action = Hold bag from MA 613; Dispatch to = Dispatch to Gate 4 (QR 517).
**Conflict flagged:** ramp crew loading claim vs confirmed tag destination.

## Case 5: The Phone Left Behind (`phone`)

**Truth:** A ringing smartphone was found on seat C-4. Notifications show a calendar alert for the Gulf Medical Summit tomorrow morning in Dubai, a ride-hailing payment made with Card ****4192, and an SMS addressed to Farhan. The passenger lookup terminal matches Card 4192 to Dr. Farhan Ahmad, seated in 17A on MA 613 (boarded 23:05). Directive EX-04 authorizes immediate handoff to the lead cabin crew at the aircraft door when the passenger's seat is verified prior to door closure.

**Lock codes:** manifest lookup terminal = 4192 (card number on the lock screen ride receipt).
**Ledger answers:** phone owner = Dr. Farhan Ahmad · owner current status = Seated onboard (Seat 17A) · authorised procedure = Deliver to aircraft door under EX-04.
**Radio:** Recipient = Dr. Farhan Ahmad (Seat 17A); Delivery point = Lead Cabin Crew at aircraft door.
**Conflict flagged:** confusion over unboarded passengers Fahim Ansari and Fayis Ali vs Dr. Ahmad seated in 17A.

## Rules every case must keep

1. One decisive claim per bundle; no single clue gives away the case.
2. Define terms and zone offsets inside the case.
3. No red herrings that tempt toward an unrelated story.
4. Pair every colour with a word (CONFIRMED / UNCONFIRMED / CONFLICT).
5. A wrong answer sends players back to the evidence; it never ends the game.
6. Keep real-world claims out: "in this scenario" beats "airports always".
