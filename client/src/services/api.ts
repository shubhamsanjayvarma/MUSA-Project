/**
 * InterviewShield Frontend API Client
 * Source of truth: docs/API_CONTRACT.md
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  } | null;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Recruiter {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  recruiter: Recruiter;
}

export interface Interview {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  joinToken: string;
  joinUrl: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  scheduledAt: string | null;
  createdAt: string;
  latestSession?: {
    id: string;
    integrityScore: number;
    riskState: string;
    startedAt: string;
    endedAt: string | null;
    reviewDecision: string | null;
  } | null;
  sessions?: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    integrityScore: number;
    riskState: string;
    eventCount: number;
  }>;
}

export interface JoinResponse {
  sessionId: string;
  interviewId: string;
  interviewTitle: string;
  wsUrl: string;
  sessionToken: string;
}

export interface SessionDetails {
  id: string;
  interviewId: string;
  interviewTitle: string;
  candidateName: string;
  candidateEmail: string;
  startedAt: string;
  endedAt: string | null;
  consentGiven: boolean;
  consentGivenAt: string | null;
  systemCheckPassed: boolean;
  currentIntegrityScore: number;
  currentRiskState: string;
  eventCount: number;
  duration: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('interviewshield_token');
};

const setAuthToken = (token: string): void => {
  localStorage.setItem('interviewshield_token', token);
};

const clearAuthToken = (): void => {
  localStorage.removeItem('interviewshield_token');
};

const getCandidateToken = (): string | null => {
  return sessionStorage.getItem('interviewshield_session_token');
};

const setCandidateToken = (token: string): void => {
  sessionStorage.setItem('interviewshield_session_token', token);
};

async function request<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const authToken = token !== undefined ? token : getAuthToken();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    data: null,
    error: {
      code: 'NETWORK_ERROR',
      message: 'Server returned an invalid response or is unavailable',
    },
  }));

  if (!res.ok || !body.success) {
    const errorMsg = body.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg) as Error & { code?: string; status?: number };
    err.code = body.error?.code || 'ERROR';
    err.status = res.status;
    throw err;
  }

  return body.data as T;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data;
  },
  logout: async (): Promise<void> => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },
  getToken: getAuthToken,
  clearToken: clearAuthToken,
};

export const interviewApi = {
  list: async (): Promise<Interview[]> => {
    const res = await request<Interview[]>('/api/interviews');
    return res;
  },
  get: async (id: string): Promise<Interview> => {
    return request<Interview>(`/api/interviews/${id}`);
  },
  create: async (data: {
    title: string;
    candidateName: string;
    candidateEmail: string;
    scheduledAt?: string;
  }): Promise<Interview> => {
    return request<Interview>('/api/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  join: async (joinToken: string): Promise<JoinResponse> => {
    const data = await request<JoinResponse>(
      '/api/interviews/join',
      {
        method: 'POST',
        body: JSON.stringify({ joinToken }),
      },
      null // No recruiter auth header
    );
    setCandidateToken(data.sessionToken);
    return data;
  },
};

export const sessionApi = {
  get: async (sessionId: string): Promise<SessionDetails> => {
    // Check candidate token first, otherwise fallback to recruiter token
    const candidateToken = getCandidateToken();
    return request<SessionDetails>(
      `/api/sessions/${sessionId}`,
      {},
      candidateToken || undefined
    );
  },
  getCandidateToken,
};
