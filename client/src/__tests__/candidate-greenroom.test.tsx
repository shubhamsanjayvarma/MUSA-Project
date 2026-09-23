import { describe, it, expect, beforeEach } from 'vitest';

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.clear) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
  });
}

if (typeof globalThis.sessionStorage === 'undefined' || !globalThis.sessionStorage.clear) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
  });
}

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CandidateJoinScreen } from '../components/candidate/CandidateJoinScreen';

describe('Candidate Google Meet Greenroom Verification Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders Google Meet greenroom without any static fallback images', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join?code=A4F7-9K2L']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    // ZERO static candidate images allowed
    expect(html).not.toContain('candidate_aarav.jpg');
    expect(html).not.toContain('img src');
    expect(html).not.toContain('unsplash.com');

    // Contains direct video element
    expect(html).toContain('<video');
  });

  it('renders all 4 native Google Meet device pills (mic, speaker, camera, backgrounds & effects)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    // Exact Google Meet 4 device selector pills
    expect(html).toContain('Microphone');
    expect(html).toContain('Speakers');
    expect(html).toContain('Camera');
    expect(html).toContain('Backgrounds &amp; effects...');
  });

  it('enforces inverted affirmative consent (default: unchecked)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    // Affirmative consent checkbox must be present and not pre-checked
    expect(html).toContain('id="checkbox-affirmative-consent"');
    // In React static markup, an unchecked checkbox does not have the 'checked' attribute
    expect(html).not.toMatch(/id="checkbox-affirmative-consent"[^>]*checked/);
    expect(html).toContain('I agree to assessment integrity monitoring');
    expect(html).toContain('View proctoring parameters');
  });

  it('renders verification access code input directly above join action', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join?code=XYZ1-2345']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    expect(html).toContain('id="verification-code-input"');
    expect(html).toContain('Verification Access Code');
    expect(html).toContain('XYZ1-2345');
    expect(html).toContain('id="btn-candidate-join-now"');
    expect(html).toContain('Join now');
    expect(html).toContain('Present');
  });

  it('renders floating video controls and effects button', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    // Floating action buttons
    expect(html).toContain('title="Turn off microphone"');
    expect(html).toContain('title="Turn off camera"');
    expect(html).toContain('title="Apply visual effects"');
    expect(html).toContain('aria-label="More options"');
  });

  it('guarantees candidate UI never exposes numeric proctoring scores or deductions', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/join']}>
        <CandidateJoinScreen />
      </MemoryRouter>
    );

    expect(html).not.toContain('Score:');
    expect(html).not.toContain('Deduction');
    expect(html).not.toContain('Integrity Score');
    expect(html).not.toContain('/100');
  });
});
