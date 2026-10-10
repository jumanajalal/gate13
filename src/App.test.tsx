// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

function startCase(title: string) {
  render(<App />);
  click(title); // facilitator list lives inside <details>, still in the DOM
  fireEvent.click(screen.getByLabelText('Incident briefing')); // tap to skip the typed cold open
  click(/Enter Gate 13/);
}

describe('Gate 13 UI smoke test: play a whole case by clicking', () => {
  it('opens on the start screen and runs the cold open before the clock starts', () => {
    render(<App />);
    expect(screen.getByText('Last call at Gate 13')).toBeTruthy();
    click('The Group 3 Redirect');
    expect(screen.getByLabelText('Incident briefing')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Incident briefing')); // tap to skip typing
    expect(screen.getByRole('button', { name: /Enter Gate 13/ })).toBeTruthy();
  });

  it('Nila: crack the lock, question a witness, file the ledger, radio operations, win', () => {
    startCase('The Group 3 Redirect');

    // the desk shows all nine objects; terminals start locked
    expect(screen.getByRole('button', { name: 'Gate terminal (locked)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Baggage terminal (locked)' })).toBeTruthy();

    // a wrong code is denied, the right one (found on the boarding pass) opens it
    click('Gate terminal (locked)');
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '99Z' } });
    click('Unlock');
    expect(screen.getByText(/ACCESS DENIED/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '22c' } });
    click('Unlock');
    expect(screen.getByText(/READ OK/)).toBeTruthy();
    expect(screen.getByText(/1 fact|2 facts/)).toBeTruthy();
    click('Close');

    // interrogate both witnesses
    click('Gate agent');
    click('What does "Group 3 cleared" mean?');
    click('Close');
    click('Her brother');
    click('When did you last see Nila?');
    click('Close');

    // the wall shows the contradiction
    fireEvent.click(screen.getByRole('tab', { name: /Evidence wall/ }));
    expect(screen.getByText('These two accounts cannot both describe where Nila is.')).toBeTruthy();
    expect(screen.getByText(/RADIO LOCKED/)).toBeTruthy();

    // a wrong ledger is rejected and the radio stays locked
    const ledger = within(screen.getByLabelText('Operations ledger'));
    const confirmed = ledger.getAllByRole('button', { name: 'Confirmed' });
    const notConfirmed = ledger.getAllByRole('button', { name: 'Not confirmed' });
    fireEvent.click(confirmed[0]);
    fireEvent.click(confirmed[1]); // wrong: nobody confirmed her at the aircraft door
    fireEvent.click(notConfirmed[2]);
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Operations rejected/)).toBeTruthy();
    expect(screen.getByText(/RADIO LOCKED/)).toBeTruthy();

    // fix it, the radio unlocks
    fireEvent.click(ledger.getAllByRole('button', { name: 'Not confirmed' })[1]);
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Ledger accepted/)).toBeTruthy();
    expect(screen.queryByText(/RADIO LOCKED/)).toBeNull();

    // transmit: hold, and tap H2 on the map
    click('Hold and verify');
    fireEvent.click(screen.getByRole('button', { name: /H2 holding point/ }));
    click('Transmit');

    // debrief
    expect(screen.getByLabelText('Incident report')).toBeTruthy();
    expect(screen.getByText('RESOLVED')).toBeTruthy();
    expect(screen.getByText(/Score: /)).toBeTruthy();
  });

  it('Ravi: the time-zone ledger accepts a forgiving time format and the radio is a two-step call', () => {
    startCase('The Wrong Clock');
    fireEvent.click(screen.getByRole('tab', { name: /Evidence wall/ }));
    const ledger = within(screen.getByLabelText('Operations ledger'));
    fireEvent.change(ledger.getByLabelText('Pass read at (IST, 24h)'), { target: { value: '2255' } });
    fireEvent.click(ledger.getByRole('button', { name: 'Yes' }));
    fireEvent.click(ledger.getByRole('button', { name: 'Not valid' }));
    fireEvent.click(ledger.getByRole('button', { name: 'File ledger' }));
    expect(screen.getByText(/Ledger accepted/)).toBeTruthy();
    click('Correct it: scanned on time');
    click('Keep the bag on the flight');
    click('Transmit');
    expect(screen.getByText('RESOLVED')).toBeTruthy();
  });

  it('the printable kit page renders every case with scan codes', () => {
    window.location.hash = '#/props';
    render(<App />);
    expect(screen.getByText('Gate 13 evidence kit')).toBeTruthy();
    expect(screen.getAllByText(/Envelope:/).length).toBe(3);
    window.location.hash = '';
  });
});
