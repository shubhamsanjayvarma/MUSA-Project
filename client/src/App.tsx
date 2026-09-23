import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  CheckCircle2,
  Lock,
  Activity,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  LogOut,
  Calendar,
  Loader2,
  Camera,
  Mic,
  MicOff,
  Monitor,
  Clock,
  Power,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import {
  authApi,
  interviewApi,
  sessionApi,
  Interview,
  SessionDetails,
  SessionEvent,
  RiskSnapshotItem,
  EvidenceItemData,
  RecruiterReviewData,
} from './services/api.js';
import { SystemCheck, SystemCheckResult } from './components/SystemCheck.js';
import { HomePage } from './components/HomePage.js';
import { mediaManager } from './services/media-manager.js';
import { WSClient, ConnectionState } from './services/ws-client.js';
import { EventBuffer } from './services/event-buffer.js';
import {
  DetectorOrchestrator,
  TabDetector,
  FaceDetector,
  ScreenShareDetector,
  AudioDetector,
  AVCorrelator,
} from './detectors/index.js';
import {
  RecruiterCommandCenter,
  RadialScoreGauge,
  ReviewPanel,
  DownloadReportButton,
} from './components/recruiter/index.js';
import AuthSwitch from './components/ui/auth-switch';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from './services/firebase.js';

// Header Component
const Header: React.FC = () => {
  const navigate = useNavigate();
  const token = authApi.getToken();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut errors
    }
    await authApi.logout();
    localStorage.removeItem('interviewshield_user');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="brand">
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'inherit' }}>
          <Shield color="#3b82f6" size={24} />
          <span>InterviewShield</span>
          <span className="brand-badge">MVP v1.0</span>
        </Link>
      </div>
      <nav style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
        {token ? (
          <>
            <Link to="/dashboard" style={{ fontSize: '0.875rem' }}>Dashboard</Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            <Lock size={14} /> Recruiter Login
          </Link>
        )}
      </nav>
    </header>
  );
};

// Login Page
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('recruiter@demo.interviewshield.dev');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <Shield color="#3b82f6" size={36} style={{ margin: '0 auto var(--space-sm)' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Recruiter Access</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Sign in to manage and review interview integrity sessions
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-high-risk)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: 'var(--space-md)',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: 'var(--space-md)', textAlign: 'center' }}>
          Default demo credentials pre-filled for evaluation.
        </p>
      </div>
    </div>
  );
};

// Modern Interactive Auth Page (Firebase Sign In & Sign Up)
const AuthPage: React.FC<{ initialSignUp?: boolean }> = ({ initialSignUp = false }) => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const form = e.currentTarget;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      authApi.setToken(idToken);
      localStorage.setItem(
        'interviewshield_user',
        JSON.stringify({
          name: userCredential.user.displayName || email.split('@')[0],
          email: userCredential.user.email,
        })
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      let message = 'Failed to sign in. Please verify your credentials.';
      if (
        errorObj.code === 'auth/invalid-credential' ||
        errorObj.code === 'auth/wrong-password' ||
        errorObj.code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password.';
      } else if (errorObj.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (errorObj.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
      } else if (errorObj.message) {
        message = errorObj.message;
      }
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const form = e.currentTarget;
    const usernameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
    const allEmailInputs = form.querySelectorAll('input[type="email"]');
    const allPasswordInputs = form.querySelectorAll('input[type="password"]');
    const emailInput = (allEmailInputs[1] || allEmailInputs[0]) as HTMLInputElement;
    const passwordInput = (allPasswordInputs[1] || allPasswordInputs[0]) as HTMLInputElement;

    const username = usernameInput?.value?.trim() || 'Recruiter';
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (username) {
        await updateProfile(userCredential.user, { displayName: username });
      }
      const idToken = await userCredential.user.getIdToken();
      authApi.setToken(idToken);
      localStorage.setItem(
        'interviewshield_user',
        JSON.stringify({
          name: username || email.split('@')[0],
          email: userCredential.user.email,
        })
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      let message = 'Failed to create account.';
      if (errorObj.code === 'auth/email-already-in-use') {
        message = 'This email is already in use. Please sign in instead.';
      } else if (errorObj.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (errorObj.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (errorObj.message) {
        message = errorObj.message;
      }
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      authApi.setToken(idToken);
      localStorage.setItem(
        'interviewshield_user',
        JSON.stringify({
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Recruiter',
          email: result.user.email,
        })
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code !== 'auth/popup-closed-by-user') {
        setAuthError(errorObj.message || 'Google sign in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {authError && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {authError}
        </div>
      )}
      <AuthSwitch
        initialSignUp={initialSignUp}
        onSignInSubmit={handleSignIn}
        onSignUpSubmit={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isLoading}
      />
    </div>
  );
};

// Legacy Create Interview Modal
const LegacyCreateInterviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (interview: Interview) => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInterview, setCreatedInterview] = useState<Interview | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const interview = await interviewApi.create({
        title,
        candidateName,
        candidateEmail,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      setCreatedInterview(interview);
      onCreated(interview);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdInterview) {
      navigator.clipboard.writeText(createdInterview.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-md)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New Interview</h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {createdInterview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-normal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-normal)', fontWeight: 600 }}>
                <CheckCircle size={18} />
                <span>Interview Scheduled Successfully!</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', marginTop: '6px' }}>
                Share the unique candidate link below to allow joining.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                CANDIDATE JOIN LINK
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={createdInterview.joinUrl}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <button onClick={handleCopyLink} className="btn btn-primary" style={{ padding: '8px 14px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
              <button onClick={onClose} className="btn btn-outline">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {error && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-high-risk)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                INTERVIEW TITLE / ROLE
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Full Stack Engineer Screening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  CANDIDATE NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Smith"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  CANDIDATE EMAIL
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                SCHEDULED TIME (OPTIONAL)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Creating...' : 'Generate Join Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.list();
      setInterviews(data);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-normal">Active</span>;
      case 'completed':
        return <span className="badge badge-normal">Completed</span>;
      case 'pending':
        return <span className="badge badge-attention">Pending</span>;
      default:
        return <span className="badge" style={{ backgroundColor: '#334155', color: '#94a3b8' }}>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Recruiter Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Monitored interview sessions and anomaly timeline reviews
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Create Interview
        </button>
      </div>

      <LegacyCreateInterviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(newInv) => {
          setInterviews((prev) => [newInv, ...prev]);
        }}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Active & Completed Interviews</span>
          <span className="badge badge-normal">System Operational</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading real interview sessions from database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-high-risk)', marginBottom: '12px' }}>{error}</p>
            <button onClick={fetchInterviews} className="btn btn-outline" style={{ margin: '0 auto' }}>
              Retry
            </button>
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>No interviews found</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Create an interview above to generate a candidate join link.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 24px' }}>CANDIDATE</th>
                <th style={{ padding: '12px 24px' }}>TITLE / ROLE</th>
                <th style={{ padding: '12px 24px' }}>STATUS</th>
                <th style={{ padding: '12px 24px' }}>INTEGRITY SCORE</th>
                <th style={{ padding: '12px 24px' }}>JOIN LINK</th>
                <th style={{ padding: '12px 24px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                    <div>{interview.candidateName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>{interview.candidateEmail}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text)' }}>
                    {interview.title}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {getStatusBadge(interview.status)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {interview.latestSession ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-normal)' }}>
                        {interview.latestSession.integrityScore} / 100
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Awaiting candidate</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button
                      onClick={() => handleCopy(interview.id, interview.joinUrl)}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      {copiedId === interview.id ? <Check size={12} color="var(--color-normal)" /> : <Copy size={12} />}
                      {copiedId === interview.id ? 'Copied' : 'Copy Link'}
                    </button>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <Link
                      to={`/dashboard/${interview.id}`}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Session Detail Page
const SessionDetailPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recruiter Session Data
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [snapshots, setSnapshots] = useState<RiskSnapshotItem[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItemData[]>([]);
  const [review, setReview] = useState<RecruiterReviewData | null>(null);

  // Filtering & Evidence Modal
  const [severityFilter, setSeverityFilter] = useState<'all' | 'medium' | 'high' | 'critical'>('all');
  const [activeEvidenceUrl, setActiveEvidenceUrl] = useState<string | null>(null);
  const [activeEvidenceMeta, setActiveEvidenceMeta] = useState<any>(null);

  const fetchSessionData = async (sessId: string) => {
    try {
      const [sess, evts, snaps, evd, rev] = await Promise.all([
        sessionApi.get(sessId),
        sessionApi.getEvents(sessId, 1, 100),
        sessionApi.getRiskHistory(sessId),
        sessionApi.getEvidence(sessId),
        sessionApi.getReview(sessId),
      ]);
      setSessionDetails(sess);
      setEvents(evts);
      setSnapshots(snaps);
      setEvidenceItems(evd);
      if (rev) {
        setReview(rev);
      }
    } catch (err) {
      console.error('Error fetching session sub-resources:', err);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!interviewId) return;
      try {
        const data = await interviewApi.get(interviewId);
        setInterview(data);

        if (data.sessions && data.sessions.length > 0) {
          const sid = data.sessions[0].id;
          setActiveSessionId(sid);
          await fetchSessionData(sid);
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [interviewId]);

  const formatEventType = (type: string) => {
    switch (type) {
      case 'tab_hidden': return 'Tab switch away';
      case 'tab_visible': return 'Tab returned';
      case 'face_absent': return 'Candidate face absent';
      case 'face_returned': return 'Candidate face returned';
      case 'multiple_faces': return 'Multiple faces detected';
      case 'face_orientation_off': return 'Face turned away';
      case 'screen_share_stopped': return 'Screen sharing revoked';
      case 'screen_share_started': return 'Screen sharing started';
      case 'av_mismatch': return 'Speech without mouth motion';
      case 'audio_silence_extended': return 'Extended audio silence';
      case 'audio_activity_detected': return 'Speech activity detected';
      default: return type.replace(/_/g, ' ');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-high-risk" style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}>Critical</span>;
      case 'high':
        return <span className="badge badge-suspicious" style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}>High</span>;
      case 'medium':
        return <span className="badge badge-attention" style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}>Medium</span>;
      case 'low':
        return <span className="badge" style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', textTransform: 'uppercase', fontSize: '0.6875rem' }}>Low</span>;
      default:
        return <span className="badge" style={{ backgroundColor: '#0f172a', color: '#64748b', fontSize: '0.6875rem' }}>Info</span>;
    }
  };

  const formatScoreDiff = (before: number | null, after: number | null) => {
    if (before === null || after === null) return '-';
    const diff = after - before;
    if (diff === 0) return <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>0</span>;
    return (
      <span style={{ color: diff < 0 ? 'var(--color-high-risk)' : 'var(--color-normal)', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        {before} &rarr; {after} ({diff > 0 ? `+${diff}` : diff})
      </span>
    );
  };

  const filteredEvents = events.filter((ev) => {
    if (severityFilter === 'all') return true;
    if (severityFilter === 'critical') return ev.severity === 'critical';
    if (severityFilter === 'high') return ev.severity === 'high' || ev.severity === 'critical';
    if (severityFilter === 'medium') return ev.severity === 'medium' || ev.severity === 'high' || ev.severity === 'critical';
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
        <p>Loading session information &amp; timeline...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-high-risk)', marginBottom: '14px' }}>{error || 'Interview not found'}</p>
        <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>
    );
  }

  const latestSession = sessionDetails || (interview.sessions && interview.sessions.length > 0 ? interview.sessions[0] : null);
  const score = sessionDetails
    ? sessionDetails.currentIntegrityScore
    : (interview.sessions && interview.sessions.length > 0 ? interview.sessions[0].integrityScore : 100);
  const riskState = sessionDetails
    ? sessionDetails.currentRiskState
    : (interview.sessions && interview.sessions.length > 0 ? interview.sessions[0].riskState : 'normal');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Breadcrumb & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            &larr; Back to interviews
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{interview.title}</h1>
            <span className={`badge badge-${interview.status === 'completed' ? 'normal' : interview.status === 'active' ? 'attention' : 'normal'}`}>
              {interview.status.toUpperCase()}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Candidate: <strong style={{ color: 'var(--color-text)' }}>{interview.candidateName}</strong> ({interview.candidateEmail})
          </p>
        </div>

        {activeSessionId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to={`/command-center?code=${interview.joinToken || activeSessionId}`}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            >
              <Activity size={14} color="#3b82f6" />
              <span>Command Center</span>
            </Link>
            <DownloadReportButton
              sessionId={activeSessionId}
              candidateName={interview.candidateName}
              interviewTitle={interview.title}
              integrityScore={score}
              riskState={riskState}
              variant="primary"
            />
          </div>
        )}
      </div>

      {/* Main Grid: Left side metrics & human review, Right side timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
        {/* LEFT COLUMN: Scorecard, Review Form & Risk History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Integrity Scorecard */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Integrity Scorecard
            </h3>
            {latestSession ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                  <RadialScoreGauge
                    score={score}
                    size="compact"
                    showBadge={true}
                    showTicks={false}
                  />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  {snapshots.length > 0 ? snapshots[snapshots.length - 1].explanation : 'Session initialized with baseline integrity score.'}
                </p>
              </>
            ) : (
              <div style={{ padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Candidate has not joined this interview session yet.
              </div>
            )}
          </div>

          {/* HUMAN RECRUITER REVIEW PANEL */}
          <ReviewPanel
            sessionId={activeSessionId || interview.id}
            initialReview={review}
            onReviewSubmitted={(r) => setReview(r)}
          />

          {/* Risk Progression Ledger */}
          {snapshots.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Risk Transitions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {snapshots.map((snap) => (
                  <div key={snap.id} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: snap.integrityScore >= 80 ? 'var(--color-normal)' : 'var(--color-attention)' }}>
                        Score: {snap.integrityScore} ({snap.riskState})
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {new Date(snap.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{snap.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Event Timeline Table with Evidence inspection */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header & Filter Controls */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Event Timeline &amp; Evidence Ledger</h3>
              <span className="badge" style={{ backgroundColor: '#334155', color: '#94a3b8', fontSize: '0.6875rem' }}>
                {events.length} recorded
              </span>
            </div>

            {/* Severity Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'medium', 'high', 'critical'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSeverityFilter(filter)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    border: `1px solid ${severityFilter === filter ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: severityFilter === filter ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: severityFilter === filter ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Events Table */}
          {filteredEvents.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <ShieldCheck size={36} color="var(--color-normal)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
              <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>No detection events match this criteria</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                {events.length === 0 ? 'Candidate behavior clean with no detected anomalies.' : 'Change the severity filter above to view all events.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>
                    <th style={{ padding: '10px 16px' }}>SEQ</th>
                    <th style={{ padding: '10px 16px' }}>TIME</th>
                    <th style={{ padding: '10px 16px' }}>EVENT SIGNAL</th>
                    <th style={{ padding: '10px 16px' }}>SEVERITY</th>
                    <th style={{ padding: '10px 16px' }}>CONFIDENCE</th>
                    <th style={{ padding: '10px 16px' }}>SCORE IMPACT</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>EVIDENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => {
                    const linkedEvidence = evidenceItems.find(
                      (item) => item.eventId === ev.id || (item.metadata as any)?.eventSequenceNumber === ev.sequenceNumber
                    );

                    return (
                      <tr key={ev.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                          #{ev.sequenceNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {new Date(ev.serverTimestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                          <div>{formatEventType(ev.eventType)}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{ev.detectorId}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {getSeverityBadge(ev.severity)}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                          {(ev.confidence * 100).toFixed(0)}%
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {formatScoreDiff(ev.scoreBefore, ev.scoreAfter)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {linkedEvidence ? (
                            <button
                              onClick={() => {
                                setActiveEvidenceUrl(linkedEvidence.downloadUrl);
                                setActiveEvidenceMeta({
                                  ...linkedEvidence.metadata,
                                  timestamp: linkedEvidence.timestamp,
                                  eventType: ev.eventType,
                                });
                              }}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem', gap: '4px' }}
                            >
                              <Eye size={12} color="var(--color-primary)" /> View Snapshot
                            </button>
                          ) : (
                            <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EVIDENCE SNAPSHOT MODAL */}
      {activeEvidenceUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-md)',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Verification Snapshot</h3>
              </div>
              <button onClick={() => setActiveEvidenceUrl(null)} style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} aria-label="Close evidence">
                <X size={18} />
              </button>
            </div>

            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#000', display: 'flex', justifyContent: 'center' }}>
              <img
                src={activeEvidenceUrl}
                alt="Verification Evidence Snapshot"
                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>

            {activeEvidenceMeta && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-text-secondary)' }}>
                <div>Signal: <strong style={{ color: 'var(--color-text)' }}>{formatEventType(activeEvidenceMeta.eventType || '')}</strong></div>
                <div>Captured: <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(activeEvidenceMeta.timestamp).toLocaleString()}</span></div>
                <div>Format: {activeEvidenceMeta.resolution || '320x240'} JPEG (low-resolution privacy compliant)</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setActiveEvidenceUrl(null)} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Candidate Join Page
const CandidateJoinPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const handleSystemCheckComplete = async (result: SystemCheckResult) => {
    if (!token) return;
    setError(null);

    try {
      // 1. Hand off verified streams
      mediaManager.setCameraStream(result.cameraStream);
      mediaManager.setScreenStream(result.screenStream);

      // 2. Join session via token
      const joinData = await interviewApi.join(token);

      // 3. Mark consent and system check status in database
      await sessionApi.update(joinData.sessionId, {
        consentGiven: true,
        systemCheckPassed:
          (result.camera === 'PASSED' || result.camera === 'SKIPPED') &&
          (result.mic === 'PASSED' || result.mic === 'SKIPPED'),
        systemCheckDetails: {
          camera: result.camera,
          mic: result.mic,
          screen: result.screen,
          browser: result.browser,
        },
      });

      // 4. Navigate to live interview session room
      navigate(`/interview/${joinData.sessionId}`);
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string };
      setError({
        code: errorObj.code || 'JOIN_FAILED',
        message: errorObj.message || 'Failed to initialize candidate interview session.',
      });
    }
  };

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', padding: '32px' }}>
        <AlertTriangle size={36} color="var(--color-high-risk)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Invalid Join Link</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
          No interview token provided in URL. Please check your interview invitation email.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '540px', margin: '40px auto', textAlign: 'center', padding: '32px' }}>
        <AlertTriangle size={36} color="var(--color-high-risk)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Unable to Join Session</h3>
        <p style={{ color: 'var(--color-text)', marginTop: '8px', fontSize: '0.875rem' }}>
          {error.message}
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '6px' }}>
          Code: {error.code}
        </p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => setError(null)} className="btn btn-outline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <SystemCheck onComplete={handleSystemCheckComplete} />
    </div>
  );
};

// Candidate Interview Session Page
const CandidateInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const wsClientRef = useRef<WSClient | null>(null);
  const orchestratorRef = useRef<DetectorOrchestrator | null>(null);

  // 1. Fetch session details & check token
  useEffect(() => {
    let timerId: any = null;

    const init = async () => {
      if (!sessionId) return;
      try {
        const data = await sessionApi.get(sessionId);
        setSession(data);

        if (data.endedAt) {
          setIsCompleted(true);
          setLoading(false);
          return;
        }

        // Calculate initial elapsed time
        const start = new Date(data.startedAt).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));

        timerId = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: unknown) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to retrieve session state');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [sessionId]);

  // 2. Setup Media Stream, Detectors & WebSocket
  useEffect(() => {
    if (!sessionId || loading || isCompleted || error) return;

    let isDisposed = false;
    let localStream: MediaStream | null = null;

    const setupSession = async () => {
      // A. Video stream attach
      localStream = mediaManager.getCameraStream();

      if (!localStream && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          mediaManager.setCameraStream(localStream);
        } catch (err) {
          console.warn('[Session] Unable to acquire local camera stream:', err);
        }
      }

      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
        setCameraActive(localStream.getVideoTracks().some((t) => t.readyState === 'live'));
        setMicActive(localStream.getAudioTracks().some((t) => t.readyState === 'live'));
      }

      const screenStream = mediaManager.getScreenStream();
      if (screenStream && screenStream.active) {
        setScreenActive(true);
      }

      if (isDisposed) return;

      // B. WebSocket & Event Buffer
      const token = sessionApi.getCandidateToken() || '';
      const envWs = import.meta.env?.VITE_WS_URL as string;
      const wsUrl = envWs
        ? `${envWs}/ws/session/${sessionId}`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/session/${sessionId}`;

      const wsClient = new WSClient({
        wsUrl,
        sessionId,
        token,
        onStateChange: (state) => setConnectionState(state),
        onAck: (seq) => eventBuffer.acknowledge(seq),
        onConnect: () => eventBuffer.replayUnacknowledged(),
      });

      const eventBuffer = new EventBuffer(wsClient);
      wsClientRef.current = wsClient;

      // C. Detection Orchestrator & Detectors
      let evidenceSeq = 50000;
      const orchestrator = new DetectorOrchestrator({
        intervalMs: 500, // 2 fps
        videoElement: videoRef.current,
        onEvents: (events) => {
          eventBuffer.enqueue(events);
        },
        onEvidence: (_ev, snapshotDataUrl) => {
          if (wsClientRef.current && wsClientRef.current.isConnected) {
            wsClientRef.current.send({
              type: 'evidence:snapshot',
              sequenceNumber: evidenceSeq++,
              payload: {
                imageDataUrl: snapshotDataUrl,
                capturedAt: Date.now(),
              },
            } as any);
          }
        },
      });

      const tabDetector = new TabDetector();
      const faceDetector = new FaceDetector();
      const screenDetector = new ScreenShareDetector();
      const audioDetector = new AudioDetector();
      const avCorrelator = new AVCorrelator(faceDetector, audioDetector);

      orchestrator.registerDetector(tabDetector);
      orchestrator.registerDetector(faceDetector);
      orchestrator.registerDetector(screenDetector);
      orchestrator.registerDetector(audioDetector);
      orchestrator.registerDetector(avCorrelator);

      orchestratorRef.current = orchestrator;

      await orchestrator.initializeAll();

      if (!isDisposed) {
        orchestrator.start();
        wsClient.connect();
      }
    };

    setupSession();

    return () => {
      isDisposed = true;
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
        orchestratorRef.current.dispose();
        orchestratorRef.current = null;
      }
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [sessionId, loading, isCompleted, error]);

  // Format timer HH:MM:SS
  const formatTimer = (seconds: number) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // 3. End session action
  const handleEndSession = async () => {
    if (!sessionId || isEnding) return;
    setIsEnding(true);

    try {
      // 1. Notify server of completion
      await sessionApi.update(sessionId, {
        ended: true,
        endReason: 'completed_by_candidate',
      });

      // 2. Stop detectors & media
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
        orchestratorRef.current.dispose();
        orchestratorRef.current = null;
      }

      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }

      mediaManager.stopAll();
      setCameraActive(false);
      setMicActive(false);
      setScreenActive(false);

      setShowEndModal(false);
      setIsCompleted(true);
    } catch (err) {
      console.error('[Session] Error concluding interview:', err);
      // Even if network fails, ensure local media is stopped
      mediaManager.stopAll();
      setIsCompleted(true);
      setShowEndModal(false);
    } finally {
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 14px', color: 'var(--color-primary)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Connecting to secure interview room...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '36px' }}>
        <AlertTriangle size={36} color="var(--color-high-risk)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Session Unavailable</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
          {error || 'The requested interview session does not exist or has expired.'}
        </p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/login')} className="btn btn-outline">
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  // Interview Completed Summary View
  if (isCompleted) {
    return (
      <div className="card" style={{ maxWidth: '580px', margin: '50px auto', textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-normal)', margin: '0 auto 16px' }}>
          <CheckCircle2 size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>Interview Completed</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '8px', lineHeight: 1.6 }}>
          Thank you for completing your interview session for <strong style={{ color: 'var(--color-text)' }}>{session.interviewTitle}</strong>.
        </p>

        <div style={{ margin: '24px 0', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', textAlign: 'left', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Candidate:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{session.candidateName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Total Duration:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{formatTimer(elapsedSeconds)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Session Verification:</span>
            <span style={{ color: 'var(--color-normal)', fontWeight: 600 }}>Finalized &amp; Submitted</span>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          All recorded telemetry has been submitted for review. You may safely close this browser window.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '16px auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Session Top Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
            {session.interviewTitle}
          </span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Candidate: <strong style={{ color: 'var(--color-text)' }}>{session.candidateName}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Connection badge */}
          {connectionState === 'CONNECTED' && (
            <span className="indicator-pill success">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
              Connected
            </span>
          )}
          {connectionState === 'RECONNECTING' && (
            <span className="indicator-pill warning">
              <Loader2 size={12} className="animate-spin" /> Reconnecting
            </span>
          )}
          {connectionState === 'DISCONNECTED' && (
            <span className="indicator-pill danger">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f87171' }}></span>
              Disconnected
            </span>
          )}

          {/* End Interview button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.8125rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            <Power size={14} /> End Interview
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-element"
        />

        {/* Video Overlay Header */}
        <div className="video-overlay-header">
          <div className="interactive-pill timer-pill">
            <Clock size={14} color="#94a3b8" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="interactive-pill">
            <ShieldCheck size={14} color="#4ade80" />
            <span>Integrity Shield Active</span>
          </div>
        </div>

        {/* Video Overlay Footer */}
        <div className="video-overlay-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="interactive-pill" style={{ padding: '6px 12px' }}>
              <Camera size={14} color={cameraActive ? '#4ade80' : '#f87171'} />
              <span>{cameraActive ? 'Camera Live' : 'Camera Off'}</span>
            </div>
            <div className="interactive-pill" style={{ padding: '6px 12px' }}>
              {micActive ? <Mic size={14} color="#4ade80" /> : <MicOff size={14} color="#f87171" />}
              <span>{micActive ? 'Mic Active' : 'Mic Muted'}</span>
            </div>
            {screenActive && (
              <div className="interactive-pill" style={{ padding: '6px 12px' }}>
                <Monitor size={14} color="#38bdf8" />
                <span>Screen Shared</span>
              </div>
            )}
          </div>

          <div className="interactive-pill" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Local Verification 2 FPS
          </div>
        </div>
      </div>

      {/* Candidate Notice */}
      <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
          <Shield size={16} color="var(--color-primary)" />
          <span>Local session monitoring active. Tab switches and face presence are automatically audited locally.</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          Session: {session.id.slice(0, 8)}
        </span>
      </div>

      {/* Confirmation Modal for Ending Interview */}
      {showEndModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AlertTriangle size={24} color="var(--color-suspicious)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Conclude Interview?
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you wish to end this interview session? This will finalize your telemetry record and submit all verification data to the hiring team. Your camera and microphone streams will be immediately stopped.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                disabled={isEnding}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-high-risk)' }}
              >
                {isEnding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Concluding...
                  </>
                ) : (
                  <>
                    <Power size={14} /> Yes, End Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { RecruiterLayout } from './components/layout/RecruiterLayout.js';
import { DashboardScreen } from './components/screens/DashboardScreen.js';
import { CreateInterviewModal } from './components/screens/CreateInterviewModal.js';
import { JoinWithCodeScreen } from './components/screens/JoinWithCodeScreen.js';

// App Layout for Legacy/Candidate Pages
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

import { CandidateSystemCheckScreen } from './components/screens/CandidateSystemCheckScreen.js';
import { CandidateConsentScreen } from './components/screens/CandidateConsentScreen.js';
import { InInterviewCandidateScreen } from './components/screens/InInterviewCandidateScreen.js';
import { InInterviewRecruiterScreen } from './components/screens/InInterviewRecruiterScreen.js';
import { InterviewEndedScreen } from './components/screens/InterviewEndedScreen.js';
import { InterviewReportScreen } from './components/screens/InterviewReportScreen.js';
import { CandidatesScreen } from './components/screens/CandidatesScreen.js';
import { ReportsAnalyticsScreen } from './components/screens/ReportsAnalyticsScreen.js';
import { SettingsScreen } from './components/screens/SettingsScreen.js';
import { ProfileScreen } from './components/screens/ProfileScreen.js';
import { PricingScreen } from './components/screens/PricingScreen.js';

// Enhanced Recruiter Dashboard Container
const ModernDashboardPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <RecruiterLayout
      onNewInterviewClick={() => setIsCreateModalOpen(true)}
      onJoinCodeClick={() => navigate('/join')}
    >
      <DashboardScreen
        onNewInterviewClick={() => setIsCreateModalOpen(true)}
        onJoinCodeClick={() => navigate('/join')}
      />

      <CreateInterviewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccessNavigate={(url: string) => navigate(url)}
      />
    </RecruiterLayout>
  );
};

// Main App Router
export const App: React.FC = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          authApi.setToken(idToken);
          localStorage.setItem(
            'interviewshield_user',
            JSON.stringify({
              name: user.displayName || user.email?.split('@')[0] || 'Recruiter',
              email: user.email,
            })
          );
        } catch {
          // Token refresh / storage fallback
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Recruiter Screens */}
        <Route path="/" element={<ModernDashboardPage />} />
        <Route path="/dashboard" element={<ModernDashboardPage />} />
        <Route path="/interviews" element={<ModernDashboardPage />} />
        <Route path="/candidates" element={<RecruiterLayout><CandidatesScreen /></RecruiterLayout>} />
        <Route path="/reports" element={<RecruiterLayout><ReportsAnalyticsScreen /></RecruiterLayout>} />
        <Route path="/analytics" element={<RecruiterLayout><ReportsAnalyticsScreen /></RecruiterLayout>} />
        <Route path="/report" element={<RecruiterLayout><InterviewReportScreen /></RecruiterLayout>} />
        <Route path="/command-center" element={<RecruiterLayout><RecruiterCommandCenter /></RecruiterLayout>} />
        <Route path="/recruiter/command-center" element={<RecruiterLayout><RecruiterCommandCenter /></RecruiterLayout>} />
        <Route path="/session/:sessionId/command-center" element={<RecruiterLayout><RecruiterCommandCenter /></RecruiterLayout>} />
        <Route path="/settings" element={<RecruiterLayout><SettingsScreen /></RecruiterLayout>} />
        <Route path="/profile" element={<RecruiterLayout><ProfileScreen /></RecruiterLayout>} />
        <Route path="/pricing" element={<PricingScreen />} />
        <Route path="/upgrade" element={<PricingScreen />} />

        {/* Candidate Flow Screens */}
        <Route path="/join" element={<JoinWithCodeScreen />} />
        <Route path="/join-code" element={<JoinWithCodeScreen />} />
        <Route path="/system-check" element={<CandidateSystemCheckScreen />} />
        <Route path="/consent" element={<CandidateConsentScreen />} />
        <Route path="/interview/candidate" element={<InInterviewCandidateScreen />} />
        <Route path="/interview/recruiter" element={<InInterviewRecruiterScreen />} />
        <Route path="/interview-ended" element={<InterviewEndedScreen />} />

        {/* Legacy & Fallback Routes */}
        <Route path="/landing" element={<HomePage />} />
        <Route path="/legacy-dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/join/:token" element={<MainLayout><CandidateJoinPage /></MainLayout>} />
        {/* Authentication Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage initialSignUp={true} />} />
        <Route path="/legacy-login" element={<MainLayout><LoginPage /></MainLayout>} />
        <Route path="/dashboard/:interviewId" element={<MainLayout><SessionDetailPage /></MainLayout>} />
        <Route path="/interview/:sessionId" element={<MainLayout><CandidateInterviewPage /></MainLayout>} />
        <Route path="*" element={<MainLayout><div className="card"><h3>404: Page Not Found</h3></div></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
