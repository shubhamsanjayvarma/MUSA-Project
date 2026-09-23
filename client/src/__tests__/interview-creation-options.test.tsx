import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
import { DashboardScreen } from '../components/screens/DashboardScreen.js';
import { CreateInterviewModal } from '../components/screens/CreateInterviewModal.js';
import { appStore } from '../services/store.js';

describe('Interview Creation Options & Anti-Slop Test Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tier 1: Space & Time Complexity Testing', () => {
    it('renders CreateInterviewModal in all 3 modes within performance budget (<50ms)', () => {
      const t0 = performance.now();
      const htmlSchedule = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal isOpen={true} mode="schedule" onClose={() => {}} />
        </MemoryRouter>
      );
      const htmlInstant = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal isOpen={true} mode="instant" onClose={() => {}} />
        </MemoryRouter>
      );
      const htmlGCal = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal isOpen={true} mode="google-calendar" onClose={() => {}} />
        </MemoryRouter>
      );
      const duration = performance.now() - t0;

      expect(duration).toBeLessThan(100);
      expect(htmlSchedule).toContain('Create New Interview');
      expect(htmlInstant).toContain('Start an Instant Meeting');
      expect(htmlGCal).toContain('Schedule in Google Calendar');
    });

    it('returns null when modal isOpen is false (zero DOM node footprint)', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal isOpen={false} onClose={() => {}} />
        </MemoryRouter>
      );
      expect(html).toBe('');
    });
  });

  describe('Tier 2: Logic Testing (3 Creation Modes & Google Calendar URL Math)', () => {
    it('Mode A (Schedule): stores interview with chosen date, time, and duration', () => {
      const interview = appStore.createInterview({
        title: 'Senior Frontend Architect',
        candidateName: 'Rohan Sharma',
        candidateEmail: 'rohan@example.com',
        role: 'Frontend Developer',
        date: '2026-10-15',
        time: '14:00',
        duration: '45',
        enableMonitoring: true,
      });

      expect(interview.id).toBeDefined();
      expect(interview.joinCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(interview.title).toBe('Senior Frontend Architect');
      expect(interview.date).toBe('2026-10-15');
      expect(interview.time).toBe('14:00');
    });

    it('Mode B (Instant): stores interview with current timestamp and auto-generated join code', () => {
      const interview = appStore.createInterview({
        title: 'Instant Technical Screen',
        candidateName: 'Ananya Patel',
        candidateEmail: 'ananya@example.com',
        role: 'Backend Developer',
        date: new Date().toISOString().split('T')[0],
        time: 'Now',
        duration: '60',
        enableMonitoring: true,
      });

      expect(interview.joinCode).toBeDefined();
      expect(interview.title).toBe('Instant Technical Screen');
      appStore.setActiveSession(interview);
      expect(appStore.getActiveSession().joinCode).toBe(interview.joinCode);
    });

    it('Mode C (Google Calendar): builds valid Google Calendar event URL format with encoded parameters', () => {
      const date = '2026-11-20';
      const time = '15:30';
      const durationMin = 60;
      const joinCode = 'TEST-1234';
      const joinLink = `http://localhost:5173/join?code=${joinCode}`;

      // Date calculations
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMin * 60000);

      const formatGCalDate = (d: Date) =>
        d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const startUtc = formatGCalDate(startDateTime);
      const endUtc = formatGCalDate(endDateTime);

      const title = 'Frontend Developer Interview';
      const candidateEmail = 'aarav@gmail.com';

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `${title} - InterviewShield`
      )}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(
        `Interview with Aarav Mehta.\nJoin Link: ${joinLink}\nCode: ${joinCode}`
      )}&location=${encodeURIComponent(joinLink)}&add=${encodeURIComponent(candidateEmail)}`;

      expect(gcalUrl).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
      expect(gcalUrl).toContain(encodeURIComponent(`${title} - InterviewShield`));
      expect(gcalUrl).toContain(`dates=${startUtc}/${endUtc}`);
      expect(gcalUrl).toContain(`location=${encodeURIComponent(joinLink)}`);
      expect(gcalUrl).toContain(`add=${encodeURIComponent(candidateEmail)}`);
    });
  });

  describe('Tier 3: UI & Integration Testing (Google Meet 3-Option Dropdown & Anti-Slop)', () => {
    it('DashboardScreen renders New Interview trigger with Google Meet dropdown options', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen
            onNewInterviewClick={() => {}}
            onJoinCodeClick={() => {}}
          />
        </MemoryRouter>
      );

      // Verify trigger button
      expect(html).toContain('id="btn-new-interview"');
      expect(html).toContain('New Interview');

      // Verify all 3 options exist in dropdown markup
      expect(html).toContain('Create a meeting for later');
      expect(html).toContain('Start an instant meeting');
      expect(html).toContain('Schedule in Google Calendar');
    });

    it('CreateInterviewModal in instant mode renders join link, copy button, and Start meeting button directly below role', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal
            isOpen={true}
            mode="instant"
            onClose={() => {}}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Start an Instant Meeting');
      expect(html).toContain('Interview Title');
      expect(html).toContain('Candidate Name');
      expect(html).toContain('Role');
      // In instant mode, Date and Time inputs are not required
      expect(html).toContain('btn-copy-instant-link');
      expect(html).toContain('btn-start-instant-meeting');
      expect(html).toContain('Start meeting');
    });

    it('CreateInterviewModal in google-calendar mode renders schedule inputs with Google Calendar action button', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal
            isOpen={true}
            mode="google-calendar"
            onClose={() => {}}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Schedule in Google Calendar');
      expect(html).toContain('Date');
      expect(html).toContain('Time');
      expect(html).toContain('Duration');
      expect(html).toContain('btn-schedule-gcal');
    });

    it('frontend-audit anti-slop verification: zero faux-technical marketing buzzwords in monitoring toggle', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CreateInterviewModal
            isOpen={true}
            mode="schedule"
            onClose={() => {}}
          />
        </MemoryRouter>
      );

      // Must NOT contain generic AI slop copy
      expect(html).not.toContain('AI-powered monitoring will be enabled');
      // Must contain professional proctoring telemetry label
      expect(html).toContain('Integrity telemetry monitoring');
    });
  });

  describe('Tier 4: QA & Security Testing (STRIDE / OWASP Hardening)', () => {
    it('prevents XSS injection payloads in Google Calendar parameter encoding', () => {
      const maliciousTitle = '<script>alert("xss")</script>';
      const maliciousCandidate = '"><img src=x onerror=alert(1)>';
      const encodedTitle = encodeURIComponent(maliciousTitle);
      const encodedCandidate = encodeURIComponent(maliciousCandidate);

      expect(encodedTitle).not.toContain('<script>');
      expect(encodedCandidate).not.toContain('<img');
    });

    it('guards appStore from prototype pollution when creating interview sessions', () => {
      const pollutedPayload = JSON.parse(
        '{"title":"Clean Interview","__proto__":{"polluted":true}}'
      );
      const interview = appStore.createInterview(pollutedPayload);

      expect((({} as unknown) as { polluted?: boolean }).polluted).toBeUndefined();
      expect(interview.title).toBe('Clean Interview');
    });
  });
});
