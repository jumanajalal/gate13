// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const go = (wall: string) => click(`Go to ${wall}`);

function startCase(title: string) {
  render(<App />);
  click(title); // facilitator list lives inside <details>, still in the DOM
  fireEvent.click(screen.getByLabelText('Incident briefing')); // tap to skip the typed cold open
  click(/Enter Gate 13/);
}

describe('Gate 13 room: play whole cases by clicking inside the room', () => {
  it('opens on the start screen and runs the cold open before the clock starts', () => {
    render(<App />);
    // Home screen shows the unique LAST CALL · INCIDENT INVESTIGATION subtitle
    expect(screen.getByText('LAST CALL · INCIDENT INVESTIGATION')).toBeTruthy();
    click('The Group 3 Redirect');
    expect(screen.getByLabelText('Incident briefing')).toBeTruthy();
    expect(screen.queryByLabelText('Gate counter')).toBeNull(); // not in the room yet
  });

  it('Nila: pick things up, crack the lock, talk, read the board, file the ledger, radio, win', () => {
    startCase('The Group 3 Redirect');

    // you start at the gate counter: the pass, a locked terminal and the gate agent
    expect(screen.getByLabelText('Gate counter')).toBeTruthy();
    click('Boarding pass');
    expect(screen.getByText('NILA VARGHESE')).toBeTruthy();
    expect(screen.getByText('Added to your inventory.')).toBeTruthy();
    click('Close');
    // the pass left the counter and is in the inventory
    expect(screen.queryByRole('button', { name: 'Boarding pass' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Inventory: Boarding pass' })).toBeTruthy();

    // locked terminal: wrong code is denied; open the pass from the inventory to read the seat; then unlock
    click('Gate terminal (locked)');
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '99Z' } });
    click('Unlock');
    expect(screen.getByText(/ACCESS DENIED/)).toBeTruthy();
    click('Inventory: Boarding pass'); // stacked on top of the terminal
    expect(screen.getByText('22C')).toBeTruthy();
    click('Close'); // back to the terminal
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '22c' } });
    click('Unlock');
    expect(screen.getByText(/READ OK/)).toBeTruthy();
    click('Close');

    // talk to the gate agent in a dialogue panel
    click('Gate agent');
    expect(screen.getByRole('dialog', { name: 'Talking to Sana' })).toBeTruthy();
    click('What does "Group 3 cleared" mean?');
    expect(screen.getByText(/did not walk them to the aircraft/)).toBeTruthy();
    click('Leave ✕');

    // turn through the room to the seating area and talk to her brother
    go('Seating area');
    click('Her brother');
    click('When did you last see Nila?');
    click('Leave ✕');

    // the operations wall: the evidence board shows a contradiction and the radio is locked
    go('Operations wall');
    click('Evidence board');
    expect(screen.getByText('These two accounts cannot both describe where Nila is.')).toBeTruthy();
    click('Close');
    click('Radio');
    expect(screen.getByText(/RADIO LOCKED/)).toBeTruthy();
    click('Close');

    // a wrong ledger is rejected
    click('Ledger clipboard');
    const ledger = within(screen.getByLabelText('Operations ledger'));
    fireEvent.click(ledger.getAllByRole('button', { name: 'Confirmed' })[0]);
    fireEvent.click(ledger.getAllByRole('button', { name: 'Confirmed' })[1]); // wrong
    fireEvent.click(ledger.getAllByRole('button', { name: 'Not confirmed' })[2]);
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Operations rejected/)).toBeTruthy();
    // fix it
    fireEvent.click(ledger.getAllByRole('button', { name: 'Not confirmed' })[1]);
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Ledger accepted/)).toBeTruthy();
    click('Close');

    // the radio is now unlocked: hold, tap H2 on the map, transmit
    click('Radio');
    click('Hold and verify');
    fireEvent.click(screen.getByRole('button', { name: /H2 holding point/ }));
    click('Transmit');

    expect(screen.getByLabelText('Incident report')).toBeTruthy();
    expect(screen.getByText('RESOLVED')).toBeTruthy();
  });

  it('fixtures stay in the room when inspected; carried items leave it', () => {
    startCase('The Group 3 Redirect');
    go('Baggage wall');
    click('Terminal map');
    click('Close');
    expect(screen.getByRole('button', { name: 'Terminal map' })).toBeTruthy(); // a wall fixture stays
    click('Bag tag');
    click('Close');
    expect(screen.queryByRole('button', { name: 'Bag tag' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Baggage terminal (locked)' })).toBeTruthy();
  });

  it('Ravi: the time-zone ledger accepts a forgiving time and the radio is a two-step call', () => {
    startCase('The Wrong Clock');
    go('Operations wall');
    click('Ledger clipboard');
    const ledger = within(screen.getByLabelText('Operations ledger'));
    fireEvent.change(ledger.getByLabelText('Pass read at (IST, 24h)'), { target: { value: '2255' } });
    fireEvent.click(ledger.getByRole('button', { name: 'Yes' }));
    fireEvent.click(ledger.getByRole('button', { name: 'Not valid' }));
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Ledger accepted/)).toBeTruthy();
    click('Close');
    click('Radio');
    click('Correct it: scanned on time');
    click('Keep the bag on the flight');
    click('Transmit');
    expect(screen.getByText('RESOLVED')).toBeTruthy();
  });

  it('turning with the arrow buttons cycles through all five walls', () => {
    startCase('The Group 3 Redirect');
    const names = ['Window and jet bridge', 'Seating area', 'Baggage wall', 'Operations wall', 'Gate counter'];
    for (const n of names) {
      click('Turn right');
      expect(screen.getByLabelText(n)).toBeTruthy();
    }
  });

  it('the printable kit page renders every case with scan codes', () => {
    window.location.hash = '#/props';
    render(<App />);
    expect(screen.getByText('Gate 13 evidence kit')).toBeTruthy();
    expect(screen.getAllByText(/Envelope:/).length).toBe(3);
    window.location.hash = '';
  });
});
