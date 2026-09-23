/**
 * Central State & Session Store for InterviewShield
 * Provides full offline/online state synchronization across all 16 screens.
 */

export interface StoredInterview {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  role: string;
  dateTime: string;
  duration: number; // in minutes
  status: 'Upcoming' | 'Scheduled' | 'Completed';
  joinCode: string;
  avatarColor: string;
  enableMonitoring: boolean;
  integrityScore: number;
}

export interface SessionEventItem {
  id: string;
  sessionId: string;
  timestamp: string;
  time: string;
  title: string;
  detail?: string;
  severity: 'warning' | 'critical';
  type: string;
}

export interface CandidateItem {
  id: string;
  name: string;
  email: string;
  role: string;
  interviewsCount: number;
  status: 'Active' | 'Invited';
}

const DEFAULT_INTERVIEWS: StoredInterview[] = [
  {
    id: 'int-1',
    title: 'Frontend Developer Interview',
    candidateName: 'Aarav Mehta',
    candidateEmail: 'aaravi@gmail.com',
    role: 'Frontend Developer',
    dateTime: 'Today, 10:00 AM',
    duration: 60,
    status: 'Upcoming',
    joinCode: 'A4F7-9K2L',
    avatarColor: '#22c55e',
    enableMonitoring: true,
    integrityScore: 72,
  },
  {
    id: 'int-2',
    title: 'Product Manager Screening',
    candidateName: 'Priya Singh',
    candidateEmail: 'priya@gmail.com',
    role: 'Product Manager',
    dateTime: 'Today, 2:00 PM',
    duration: 45,
    status: 'Upcoming',
    joinCode: 'P2S9-4B1X',
    avatarColor: '#a855f7',
    enableMonitoring: true,
    integrityScore: 92,
  },
  {
    id: 'int-3',
    title: 'UI/UX Design Portfolio Review',
    candidateName: 'Karan Verma',
    candidateEmail: 'karan@gmail.com',
    role: 'UI/UX Designer',
    dateTime: 'Tomorrow, 11:30 AM',
    duration: 60,
    status: 'Scheduled',
    joinCode: 'K8V3-7M9Q',
    avatarColor: '#f97316',
    enableMonitoring: true,
    integrityScore: 88,
  },
];

const DEFAULT_CANDIDATES: CandidateItem[] = [
  { id: 'c1', name: 'Aarav Mehta', email: 'aarav@gmail.com', role: 'Frontend Dev', interviewsCount: 3, status: 'Active' },
  { id: 'c2', name: 'Priya Singh', email: 'priya@gmail.com', role: 'Product Manager', interviewsCount: 2, status: 'Active' },
  { id: 'c3', name: 'Karan Verma', email: 'karan@gmail.com', role: 'UI/UX Designer', interviewsCount: 1, status: 'Invited' },
  { id: 'c4', name: 'Sneha Iyer', email: 'sneha@gmail.com', role: 'Data Analyst', interviewsCount: 2, status: 'Active' },
];

export const appStore = {
  // Interviews
  getInterviews(): StoredInterview[] {
    const raw = localStorage.getItem('is_interviews');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return DEFAULT_INTERVIEWS;
  },

  createInterview(data: {
    title: string;
    role: string;
    date: string;
    time: string;
    duration: string;
    enableMonitoring: boolean;
    candidateName?: string;
    candidateEmail?: string;
  }): StoredInterview {
    const list = this.getInterviews();
    const codePart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codePart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const joinCode = `${codePart1}-${codePart2}`;

    const newInterview: StoredInterview = {
      id: `int-${Date.now()}`,
      title: data.title || `${data.role} Interview`,
      candidateName: data.candidateName || 'New Candidate',
      candidateEmail: data.candidateEmail || 'candidate@example.com',
      role: data.role,
      dateTime: `${data.date}, ${data.time}`,
      duration: parseInt(data.duration, 10) || 60,
      status: 'Upcoming',
      joinCode,
      avatarColor: '#3b82f6',
      enableMonitoring: data.enableMonitoring,
      integrityScore: 100,
    };

    const updated = [newInterview, ...list];
    localStorage.setItem('is_interviews', JSON.stringify(updated));
    return newInterview;
  },

  findInterviewByCode(code: string): StoredInterview {
    const cleanInput = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const list = this.getInterviews();
    const found = list.find(
      (item) => item.joinCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanInput
    );
    if (found) return found;

    // Dynamic generation if unknown code, guaranteeing zero dead ends
    return {
      id: `int-${cleanInput}`,
      title: 'Technical Screening Interview',
      candidateName: 'Candidate',
      candidateEmail: 'candidate@interviewshield.dev',
      role: 'Frontend Developer',
      dateTime: 'Today, Live',
      duration: 60,
      status: 'Upcoming',
      joinCode: code,
      avatarColor: '#22c55e',
      enableMonitoring: true,
      integrityScore: 92,
    };
  },

  // Active Candidate Session
  setActiveSession(interview: StoredInterview) {
    sessionStorage.setItem('is_active_session', JSON.stringify(interview));
  },

  getActiveSession(): StoredInterview {
    const raw = sessionStorage.getItem('is_active_session');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return DEFAULT_INTERVIEWS[0];
  },

  // Inverted Affirmative Consent State Management
  // Default is strictly FALSE: tracking/devices cannot run until explicit acceptance
  hasConsent(sessionId?: string): boolean {
    const key = sessionId ? `is_consent_${sessionId}` : 'is_consent_active';
    return sessionStorage.getItem(key) === 'true';
  },

  setConsent(agreed: boolean, sessionId?: string): void {
    const key = sessionId ? `is_consent_${sessionId}` : 'is_consent_active';
    const tsKey = sessionId ? `is_consent_ts_${sessionId}` : 'is_consent_ts_active';
    if (agreed) {
      sessionStorage.setItem(key, 'true');
      sessionStorage.setItem(tsKey, new Date().toISOString());
    } else {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(tsKey);
    }
  },

  clearConsent(sessionId?: string): void {
    const key = sessionId ? `is_consent_${sessionId}` : 'is_consent_active';
    const tsKey = sessionId ? `is_consent_ts_${sessionId}` : 'is_consent_ts_active';
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(tsKey);
  },

  getConsentDetails(sessionId?: string): { agreed: boolean; timestamp: string | null } {
    const key = sessionId ? `is_consent_${sessionId}` : 'is_consent_active';
    const tsKey = sessionId ? `is_consent_ts_${sessionId}` : 'is_consent_ts_active';
    const agreed = sessionStorage.getItem(key) === 'true';
    const timestamp = sessionStorage.getItem(tsKey);
    return { agreed, timestamp };
  },

  // Candidates
  getCandidates(): CandidateItem[] {
    const raw = localStorage.getItem('is_candidates');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return DEFAULT_CANDIDATES;
  },

  addCandidate(candidate: { name: string; email: string; role: string }): CandidateItem {
    const list = this.getCandidates();
    const newCand: CandidateItem = {
      id: `c-${Date.now()}`,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      interviewsCount: 0,
      status: 'Invited',
    };
    const updated = [newCand, ...list];
    localStorage.setItem('is_candidates', JSON.stringify(updated));
    return newCand;
  },

  // Recruiter Profile
  getProfile(): { name: string; email: string; role: string } {
    const raw = localStorage.getItem('is_profile');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      role: 'Recruiter',
    };
  },

  saveProfile(profile: { name: string; email: string; role: string }) {
    localStorage.setItem('is_profile', JSON.stringify(profile));
  },

  // Settings
  getSettings() {
    const raw = localStorage.getItem('is_settings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      orgName: 'InterviewShield',
      timezone: '(GMT+05:30) Mumbai, India',
      defaultDuration: '60 minutes',
      enableMonitoring: true,
      sendEmails: true,
    };
  },

  saveSettings(settings: {
    orgName: string;
    timezone: string;
    defaultDuration: string;
    enableMonitoring: boolean;
    sendEmails: boolean;
  }) {
    localStorage.setItem('is_settings', JSON.stringify(settings));
  },
};
