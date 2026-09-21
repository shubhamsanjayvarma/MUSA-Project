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

// Polyfill browser storage for Node.js environment
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

import { authApi, sessionApi } from '../services/api.js';

describe('Client API Services', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should manage auth token correctly in localStorage', () => {
    expect(authApi.getToken()).toBeNull();
    localStorage.setItem('interviewshield_token', 'test-token-xyz');
    expect(authApi.getToken()).toBe('test-token-xyz');
    authApi.clearToken();
    expect(authApi.getToken()).toBeNull();
  });

  it('should manage candidate session token correctly in sessionStorage', () => {
    expect(sessionApi.getCandidateToken()).toBeNull();
    sessionStorage.setItem('interviewshield_session_token', 'session-token-abc');
    expect(sessionApi.getCandidateToken()).toBe('session-token-abc');
  });
});
