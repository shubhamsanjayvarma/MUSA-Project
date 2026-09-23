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
import { InInterviewRecruiterScreen } from '../components/screens/InInterviewRecruiterScreen.js';
import { CandidateInterviewRoom } from '../components/candidate/CandidateInterviewRoom.js';
import {
  SyntheticMediaStream,
  createSyntheticCandidateStream,
  createSyntheticInterviewerStream,
} from '../services/synthetic-media.js';
import { appStore } from '../services/store.js';
import { mediaManager } from '../services/media-manager.js';

describe('Meeting Media Pipeline & Dashboard Actions Test Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    mediaManager.stopAll();
  });

  describe('Tier 1: SyntheticMediaStream Lifecycle & Space/Time Efficiency', () => {
    it('creates candidate synthetic stream with high-resolution 1280x720 dimensions and 24 FPS cap', () => {
      const synth = createSyntheticCandidateStream('Aarav Mehta', 'Frontend Engineer');
      expect(synth.width).toBe(1280);
      expect(synth.height).toBe(720);
      expect(synth.fps).toBe(24);
      expect(synth.type).toBe('candidate');

      const stream = synth.getStream();
      expect(stream).toBeDefined();

      synth.dispose();
    });

    it('creates interviewer synthetic stream with 640x360 resolution and 20 FPS', () => {
      const synth = createSyntheticInterviewerStream('Rahul Sharma', 'Lead Recruiter');
      expect(synth.width).toBe(640);
      expect(synth.height).toBe(360);
      expect(synth.fps).toBe(20);
      expect(synth.type).toBe('interviewer');

      const stream = synth.getStream();
      expect(stream).toBeDefined();

      synth.dispose();
    });

    it('terminates all media tracks and resets buffers on dispose', () => {
      const synth = new SyntheticMediaStream({ width: 320, height: 180, fps: 20 });
      const stream = synth.getStream();
      const track = stream.getVideoTracks()[0];
      const stopSpy = vi.fn();
      if (track) {
        track.stop = stopSpy;
      }

      synth.dispose();
      if (track) {
        expect(stopSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Tier 2: Dashboard 3-Dots Action Menu Full Functionality', () => {
    it('renders 3-dots action trigger buttons with data-menu-trigger attributes', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <DashboardScreen onNewInterviewClick={() => {}} onJoinCodeClick={() => {}} />
        </MemoryRouter>
      );

      expect(html).toContain('data-menu-trigger="true"');
      expect(html).toContain('btn-menu-trigger-');
      expect(html).toContain('More actions');
    });

    it('sanitizes candidate session storage for anti-gaming (no numeric score)', () => {
      const interview = appStore.getInterviews()[0];
      expect(interview.integrityScore).toBeDefined();

      appStore.setCandidateActiveSession(interview);
      const activeCandidate = appStore.getActiveSession();

      // Integrity score must be stripped from candidate session memory
      expect((activeCandidate as any).integrityScore).toBeUndefined();
      expect(activeCandidate.candidateName).toBe(interview.candidateName);
      expect(activeCandidate.joinCode).toBe(interview.joinCode);
    });

    it('findInterviewByCode reliably looks up interview by joinCode', () => {
      const interviews = appStore.getInterviews();
      const first = interviews[0];

      const found = appStore.findInterviewByCode(first.joinCode);
      expect(found.id).toBe(first.id);
      expect(found.candidateName).toBe(first.candidateName);
    });
  });

  describe('Tier 3: Meeting Rooms Real Media Pipeline (Zero Static Mock Images)', () => {
    it('InInterviewRecruiterScreen renders live video elements and ZERO static image mockups', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/interview/recruiter?code=INT-101&role=host']}>
          <InInterviewRecruiterScreen />
        </MemoryRouter>
      );

      // Verify ZERO static mock images in recruiter meeting room
      expect(html).not.toContain('/candidate_aarav.jpg');
      expect(html).not.toContain('/recruiter.jpg');
      expect(html).not.toContain('Candidate Stream');

      // Verify real video elements are rendered
      expect(html).toContain('<video');

      // Verify dock controls exist and are wired
      expect(html).toContain('id="btn-recruiter-mic"');
      expect(html).toContain('id="btn-recruiter-video"');
      expect(html).toContain('id="btn-recruiter-screenshare"');
      expect(html).toContain('id="btn-recruiter-end-call"');
      expect(html).toContain('End Interview &amp; View Report');
    });

    it('CandidateInterviewRoom renders live video elements and ZERO static image mockups', () => {
      // Affirm consent in store so room initializes
      appStore.setConsent(true, 'int-1');

      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/interview/candidate?code=G6Y3-R4T2']}>
          <CandidateInterviewRoom />
        </MemoryRouter>
      );

      // Verify ZERO mock image elements
      expect(html).not.toContain('/candidate_aarav.jpg');
      expect(html).not.toContain('/recruiter.jpg');
      expect(html).not.toContain('<img');

      // Verify live video elements exist for candidate and interviewer PiP
      expect(html).toContain('<video');
      expect(html).toContain('Rahul Sharma (Interviewer)');

      // ANTI-GAMING GUARANTEE: Never exposes numeric integrity scores (e.g. 0-100) or deduction amounts
      expect(html).not.toMatch(/Integrity Score:\s*\d+/i);
      expect(html).not.toMatch(/pts deduction/i);
    });
  });
});
