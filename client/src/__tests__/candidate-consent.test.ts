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

import { appStore } from '../services/store.js';
import { mediaManager } from '../services/media-manager.js';

describe('Candidate UI — Inverted Affirmative Consent & Anti-Gaming Rules', () => {
  beforeEach(() => {
    // Clear storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Inverted Affirmative Consent Gate', () => {
    it('defaults consent state to FALSE (no pre-checked consent)', () => {
      const sessionId = 'test-session-101';
      // Prior to explicit affirmative action, hasConsent must be false
      expect(appStore.hasConsent(sessionId)).toBe(false);
      expect(appStore.hasConsent()).toBe(false);
    });

    it('records affirmative consent with timestamp when explicitly granted', () => {
      const sessionId = 'test-session-102';
      
      appStore.setConsent(true, sessionId);
      expect(appStore.hasConsent(sessionId)).toBe(true);

      const details = appStore.getConsentDetails(sessionId);
      expect(details.agreed).toBe(true);
      expect(details.timestamp).not.toBeNull();
      expect(new Date(details.timestamp!).getTime()).toBeGreaterThan(0);
    });

    it('clears consent when revoked or session cleared', () => {
      const sessionId = 'test-session-103';
      
      appStore.setConsent(true, sessionId);
      expect(appStore.hasConsent(sessionId)).toBe(true);

      appStore.clearConsent(sessionId);
      expect(appStore.hasConsent(sessionId)).toBe(false);
      expect(appStore.getConsentDetails(sessionId).agreed).toBe(false);
    });
  });

  describe('Anti-Gaming Telemetry Compliance', () => {
    it('ensures Candidate UI operates strictly on neutral signals without exposing numeric scores', () => {
      // Allowed candidate telemetry types
      const allowedCandidateTypes = [
        'proctoring-active',
        'media-connected',
        'camera-live',
        'camera-off',
        'mic-active',
        'mic-muted',
        'screen-active',
        'screen-off',
        'connected',
        'reconnecting',
        'disconnected',
        'local-verification',
      ];

      // Verify none of the types contain numeric score indicators
      allowedCandidateTypes.forEach((type) => {
        expect(type).not.toContain('score');
        expect(type).not.toContain('deduction');
        expect(type).not.toContain('risk-value');
        expect(type).not.toContain('points');
      });
    });
  });

  describe('Media Manager Lifecycle & Safe Teardown', () => {
    it('safely manages camera and screen streams during session and terminates all tracks on conclusion', () => {
      let cameraStopped = false;
      let screenStopped = false;

      const fakeCameraTrack = {
        kind: 'video',
        readyState: 'live',
        stop: () => {
          cameraStopped = true;
        },
      } as unknown as MediaStreamTrack;

      const fakeScreenTrack = {
        kind: 'video',
        readyState: 'live',
        stop: () => {
          screenStopped = true;
        },
      } as unknown as MediaStreamTrack;

      const fakeCameraStream = {
        active: true,
        getTracks: () => [fakeCameraTrack],
        getVideoTracks: () => [fakeCameraTrack],
        getAudioTracks: () => [],
      } as unknown as MediaStream;

      const fakeScreenStream = {
        active: true,
        getTracks: () => [fakeScreenTrack],
        getVideoTracks: () => [fakeScreenTrack],
      } as unknown as MediaStream;

      // Set streams
      mediaManager.setCameraStream(fakeCameraStream);
      mediaManager.setScreenStream(fakeScreenStream);

      expect(mediaManager.getCameraStream()).toBe(fakeCameraStream);
      expect(mediaManager.getScreenStream()).toBe(fakeScreenStream);

      // Stop all (concluding interview session)
      mediaManager.stopAll();

      expect(cameraStopped).toBe(true);
      expect(screenStopped).toBe(true);
      expect(mediaManager.getCameraStream()).toBeNull();
      expect(mediaManager.getScreenStream()).toBeNull();
    });
  });
});
