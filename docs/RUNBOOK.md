# Booth runbook

## Before judging
- [ ] `npm run build && npm run preview` running on the booth laptop; page open at http://localhost:4173
- [ ] A second browser tab or phone on the same Wi-Fi as a backup (`npm run preview` prints the LAN URL)
- [ ] Sound on, volume tested, captions visible
- [ ] Camera permission granted; open `/#/props` print test
- [ ] 3 envelopes sealed (one per case), spare prints in a folder
- [ ] Leaderboard cleared (Reset board) and one dummy score removed

## Between players (reset checklist)
1. Back to start screen (or let the result screen time out).
2. Put cards back in the envelope in order: cover, then bundles A, B, C.
3. Draw a different envelope (the app avoids repeating the last case).

## If something breaks
| Problem | Fallback |
|---|---|
| Camera will not scan | Use the on-screen Inspect buttons; everything still works |
| No sound / voices missing | Captions show every line; or use recorded clips in `public/audio` |
| Laptop dies | Phone on the LAN URL; or the printed paper packet works with no screen |
| Judge stuck for 60 s | Offer the hint button (-3), or hand them a card |

## Build order if time is short (cut from the bottom)
1. Case 1 playable end to end offline (this is the demo).
2. Props printed and one stranger playtest.
3. PA + captions + countdown.
4. Cases 2 and 3.
5. Hard mode and the leaderboard polish.
6. Recorded voice clips.
