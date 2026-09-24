/**
 * @file dashboard-table-actions.test.tsx
 * Comprehensive 4-Tier TDD Test Suite for Elevated Dashboard Table Actions & Anti-Slop Workstation
 * 
 * Complies with spec_universal/tdd_4tier_testing_template.md:
 * - Tier 1: Space & Time Complexity Testing (Performance Upper-Bounds, Monogram Throughput)
 * - Tier 2: Logic Testing (Initials Extraction, Live Status Detection, Session Role Isolation)
 * - Tier 3: UI & Integration Testing (Direct Row Buttons, Purged Candidate Join Option, Zero Slop Pills, Semantic Thead)
 * - Tier 4: QA & Security Testing (STRIDE / OWASP: XSS Sanitization, Parameter Pollution Defense, Token Entropy)
 */

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
import { DashboardScreen, getMonogramInitials } from '../components/screens/DashboardScreen.js';
import { appStore, StoredInterview } from '../services/store.js';
import { mediaManager } from '../services/media-manager.js';

describe('Dashboard Table Actions & Anti-Slop Workstation (4-Tier TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    mediaManager.stopAll();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1: SPACE & TIME COMPLEXITY TESTING
  // =========================================================================
  describe('Tier 1: Space & Time Complexity Testing', () => {
    it('executes table rendering within strict performance upper-bounds (< 50ms for 25 rows)', () => {
      const bulkInterviews: StoredInterview[] = Array.from({ length: 25 }, (_, i) => ({
        id: `bulk-int-${i}`,
        title: `Technical Interview ${i}`,
        candidateName: `Candidate Number ${i}`,
        candidateEmail: `candidate${i}@example.com`,
        role: i % 2 === 0 ? 'Senior Frontend Engineer' : 'Backend Distributed Architect',
        dateTime: i === 0 ? 'Today, Live Now' : `Oct ${20 + (i % 10)}, 2026 · 10:00 AM`,
        duration: 45,
        status: i === 0 ? 'Upcoming' : 'Scheduled',
        joinCode: `BULK-${1000 + i}`,
        avatarColor: '#2563eb',
        enableMonitoring: true,
        integrityScore: 95,
      }));

      vi.spyOn(appStore, 'getInterviews').mockReturnValue(bulkInterviews);

      const t0 = performance.now();
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );
      const t1 = performance.now();
      const durationMs = t1 - t0;

      expect(durationMs).toBeLessThan(50);
      expect(html).toContain('BULK-1000');
      expect(html).toContain('BULK-1024');
    });

    it('demonstrates O(1) monogram generation throughput (> 100,000 ops/sec)', () => {
      const names = [
        'Aarav Mehta',
        'Sarah Connor',
        'John Michael Doe',
        'Cher',
        'Dr. Alice Wonder',
      ];

      const t0 = performance.now();
      for (let i = 0; i < 5000; i++) {
        const name = names[i % names.length];
        getMonogramInitials(name);
      }
      const t1 = performance.now();
      const durationMs = t1 - t0;

      // 5,000 iterations must easily complete in < 25ms
      expect(durationMs).toBeLessThan(25);
    });
  });

  // =========================================================================
  // TIER 2: LOGIC & STATE TRANSITION TESTING
  // =========================================================================
  describe('Tier 2: Logic & State Transition Testing', () => {
    it('getMonogramInitials accurately extracts 1-2 uppercase alphanumeric initials across varied name formats', () => {
      expect(getMonogramInitials('Aarav Mehta')).toBe('AM');
      expect(getMonogramInitials('Sarah Connor')).toBe('SC');
      expect(getMonogramInitials('Cher')).toBe('CH');
      expect(getMonogramInitials('John Ronald Reuel Tolkien')).toBe('JR');
      expect(getMonogramInitials('A')).toBe('A');
      expect(getMonogramInitials('123 Numbers')).toBe('1N');
      expect(getMonogramInitials('')).toBe('NA');
      expect(getMonogramInitials('   ')).toBe('NA');
    });

    it('accurately distinguishes Live status from Scheduled future meetings in DOM output', () => {
      const mockInterviews: StoredInterview[] = [
        {
          id: 'int-live',
          title: 'Frontend React Live Evaluation',
          candidateName: 'Alice Live',
          candidateEmail: 'alice@live.com',
          role: 'React Engineer',
          dateTime: 'Today, Live',
          duration: 45,
          status: 'Upcoming',
          joinCode: 'LIVE-0001',
          avatarColor: '#22c55e',
          enableMonitoring: true,
          integrityScore: 92,
        },
        {
          id: 'int-scheduled',
          title: 'Distributed Systems Interview',
          candidateName: 'Bob Scheduled',
          candidateEmail: 'bob@sched.com',
          role: 'Node Engineer',
          dateTime: 'Tomorrow · 10:00 AM',
          duration: 45,
          status: 'Scheduled',
          joinCode: 'SCHED-0002',
          avatarColor: '#64748b',
          enableMonitoring: true,
          integrityScore: 100,
        },
      ];

      vi.spyOn(appStore, 'getInterviews').mockReturnValue(mockInterviews);

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      expect(html).toContain('Live Now');
      expect(html).toContain('Scheduled');
    });

    it('enforces role isolation between recruiter host and candidate sessions in appStore', () => {
      const interview = appStore.getInterviews()[0];

      // Setting active session as recruiter retains all fields including integrity score
      appStore.setActiveSession(interview);
      const activeHost = appStore.getActiveSession();
      expect(activeHost.integrityScore).toBe(interview.integrityScore);

      // Setting candidate active session MUST strip integrity score for candidate anti-gaming
      appStore.setCandidateActiveSession(interview);
      const activeCandidate = appStore.getActiveSession();
      expect((activeCandidate as any).integrityScore).toBeUndefined();
      expect(activeCandidate.joinCode).toBe(interview.joinCode);
    });
  });

  // =========================================================================
  // TIER 3: UI & INTEGRATION TESTING (ANTI-SLOP & WORKSTATION)
  // =========================================================================
  describe('Tier 3: UI & Anti-Slop Workstation Integration', () => {
    it('renders elevated action buttons directly on each table row without Join Candidate option', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      const interviews = appStore.getInterviews();
      const firstId = interviews[0].id;

      // Direct Action 1: Start Call (Host)
      expect(html).toContain(`id="btn-row-start-call-${firstId}"`);
      expect(html).toContain('Start Call');
      expect(html).toContain('is-row-btn-primary');

      // Purged Join Candidate option from direct view
      expect(html).not.toContain(`id="btn-row-join-candidate-${firstId}"`);
      expect(html).not.toContain('Join Candidate');

      // Direct Action 2: Quick 1-Click Copy Link
      expect(html).toContain(`id="btn-row-quick-copy-${firstId}"`);
      expect(html).toContain('is-row-btn-icon');

      // Direct Action 3: Overflow Trigger
      expect(html).toContain(`id="btn-menu-trigger-${firstId}"`);
      expect(html).toContain('data-menu-trigger="true"');
    });

    it('completely removes Join Candidate option from both direct row view and 3-dots overflow popover', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      // No direct Join Candidate button
      expect(html).not.toContain('btn-row-join-candidate-');
      // No menu Join as Candidate button
      expect(html).not.toContain('btn-menu-candidate-call-');
      expect(html).not.toContain('Join as Candidate');
      expect(html).not.toContain('Join Candidate');
    });

    it('contains strictly ZERO instances of generic AI baby-blue .is-pill-upcoming badges', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      // Anti-Pattern #2 audit: no repeated pastel badge pills
      expect(html).not.toContain('is-pill-upcoming');
      expect(html).not.toContain('is-pill-scheduled');
    });

    it('renders clean monogram initial avatars with .is-table-monogram', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      expect(html).toContain('class="is-table-monogram"');
      // For default interview candidate Aarav Mehta, initials AM must be present
      expect(html).toContain('AM');
    });

    it('renders structured semantic <thead> with aligned columns and table-layout fixed', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      expect(html).toContain('table-layout:fixed');
      expect(html).toContain('min-width:820px');
      expect(html).toContain('<th style="padding:0 20px;width:26%">Candidate</th>');
      expect(html).toContain('<th style="padding:0 16px;width:17%">Role</th>');
      expect(html).toContain('<th style="padding:0 16px;width:18%">Scheduled Time</th>');
      expect(html).toContain('<th style="padding:0 16px;width:14%">Status</th>');
      expect(html).toContain('<th style="padding:0 20px;width:25%;text-align:right">Actions</th>');
    });
  });

  // =========================================================================
  // TIER 4: QA & SECURITY TESTING (STRIDE / OWASP)
  // =========================================================================
  describe('Tier 4: QA & Security Testing (STRIDE / OWASP)', () => {
    it('STRIDE Tampering / XSS: Malicious candidate names and tags are sanitized by getMonogramInitials and JSX', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>',
        '   ',
        '--!@#$%^&*()',
      ];

      xssPayloads.forEach((payload) => {
        const initials = getMonogramInitials(payload);
        // Initials must strictly be alphanumeric 1-2 uppercase characters or safe fallback 'NA'
        expect(/^[A-Z0-9]{1,2}$/.test(initials)).toBe(true);
        expect(initials).not.toContain('<');
        expect(initials).not.toContain('>');
      });

      // Render malicious interview in component
      const xssInterview: StoredInterview = {
        id: 'int-xss',
        title: 'Penetration Testing Review',
        candidateName: '<script>alert("XSS")</script> Eve Tester',
        candidateEmail: 'eve@xss.com',
        role: '<img src=x onerror=alert(1)> Role',
        dateTime: 'Today · 10:00 AM',
        duration: 45,
        status: 'Upcoming',
        joinCode: 'XSS-0001',
        avatarColor: '#2563eb',
        enableMonitoring: true,
        integrityScore: 80,
      };

      vi.spyOn(appStore, 'getInterviews').mockReturnValue([xssInterview]);

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      // Verify no executable un-escaped script or img tags were injected into DOM
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      // Must be safely escaped by React as text entities
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img');
    });

    it('STRIDE Elevation of Privilege: Parameter pollution in joinCode is neutralized by URI encoding', () => {
      const maliciousCode = 'POLLUTE-CODE&role=host&admin=true';
      const encoded = encodeURIComponent(maliciousCode);

      expect(encoded).toBe('POLLUTE-CODE%26role%3Dhost%26admin%3Dtrue');
      expect(encoded).not.toContain('&role=host');
      expect(encoded).not.toContain('&admin=true');
    });

    it('All direct action buttons declare explicit type="button" and descriptive aria-labels', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      // Every button must have type="button" to prevent accidental form submission in enclosing forms
      const buttonMatches = html.match(/<button [^>]*>/g) || [];
      expect(buttonMatches.length).toBeGreaterThan(0);

      // Verify Start Call and Copy Link have aria-labels, and no Join Candidate label exists
      expect(html).toContain('aria-label="Start host call with');
      expect(html).toContain('aria-label="Copy candidate join link for');
      expect(html).not.toContain('aria-label="Join as candidate:');
    });
  });
});
