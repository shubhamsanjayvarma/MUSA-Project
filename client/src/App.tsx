import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { authApi, interviewApi, sessionApi, Interview, SessionDetails } from './services/api.js';
import { SystemCheck, SystemCheckResult } from './components/SystemCheck.js';
import { mediaManager } from './services/media-manager.js';
import { WSClient, ConnectionState } from './services/ws-client.js';
import { EventBuffer } from './services/event-buffer.js';
import { DetectorOrchestrator, TabDetector, FaceDetector } from './detectors/index.js';

// Header Component
const Header: React.FC = () => {
  const navigate = useNavigate();
  const token = authApi.getToken();

  const handleLogout = async () => {
    await authApi.logout();
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

// Create Interview Modal
const CreateInterviewModal: React.FC<{
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
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)', fontSize: '1.25rem' }}>✕</button>
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

      <CreateInterviewModal
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

  useEffect(() => {
    const fetchDetail = async () => {
      if (!interviewId) return;
      try {
        const data = await interviewApi.get(interviewId);
        setInterview(data);
      } catch (err: unknown) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [interviewId]);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
        <p>Loading session information...</p>
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

  const latestSession = interview.sessions && interview.sessions.length > 0 ? interview.sessions[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            &larr; Back to interviews
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{interview.title}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Candidate: {interview.candidateName} ({interview.candidateEmail}) &bull; Status: {interview.status}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Integrity Scorecard</h3>
          {latestSession ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-normal)' }}>
                  {latestSession.integrityScore}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>/ 100</span>
              </div>
              <span className="badge badge-normal" style={{ alignSelf: 'flex-start' }}>State: {latestSession.riskState}</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Session started at {new Date(latestSession.startedAt).toLocaleTimeString()}. All behavioral event counts currently recorded: {latestSession.eventCount}.
              </p>
            </>
          ) : (
            <div style={{ padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Candidate has not connected to this interview yet.
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#3b82f6" /> Session Activity Ledger
          </h3>
          {interview.sessions && interview.sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {interview.sessions.map((s) => (
                <div key={s.id} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Session: {s.id}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Started: {new Date(s.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Score: {s.integrityScore}/100 &bull; Risk State: {s.riskState} &bull; Events: {s.eventCount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              No recorded sessions yet. Candidate join link is active.
            </div>
          )}
        </div>
      </div>
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
      const orchestrator = new DetectorOrchestrator({
        intervalMs: 500, // 2 fps
        videoElement: videoRef.current,
        onEvents: (events) => {
          eventBuffer.enqueue(events);
        },
      });

      const tabDetector = new TabDetector();
      const faceDetector = new FaceDetector();

      orchestrator.registerDetector(tabDetector);
      orchestrator.registerDetector(faceDetector);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot"></div>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
              {session.interviewTitle}
            </span>
          </div>
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

// Main App Router
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:interviewId" element={<SessionDetailPage />} />
            <Route path="/join/:token" element={<CandidateJoinPage />} />
            <Route path="/interview/:sessionId" element={<CandidateInterviewPage />} />
            <Route path="*" element={<div className="card"><h3>404: Page Not Found</h3></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
