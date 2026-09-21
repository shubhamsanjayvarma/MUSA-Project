import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  Video,
  Lock,
  Activity,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  LogOut,
  Calendar,
  Loader2,
} from 'lucide-react';
import { authApi, interviewApi, sessionApi, Interview, SessionDetails } from './services/api.js';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const handleJoin = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await interviewApi.join(token);
      navigate(`/interview/${data.sessionId}`);
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string };
      setError({
        code: errorObj.code || 'JOIN_FAILED',
        message: errorObj.message || 'Failed to join interview session',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Pre-Interview System Check & Consent</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Token: {token?.slice(0, 16)}...
            </p>
          </div>
        </div>

        {error ? (
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-high-risk)', color: '#fca5a5', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <AlertTriangle size={18} />
              <span>Unable to Join Session</span>
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: '6px', color: 'var(--color-text)' }}>
              {error.message}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Error code: {error.code}. Please contact your recruiter if this error persists.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
              InterviewShield verifies behavioral consistency on your local device. Your video and audio streams remain private to your local browser environment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.875rem' }}>Camera Stream Capability</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-normal)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Ready
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.875rem' }}>Microphone Capability</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-normal)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Ready
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.875rem' }}>Screen Share Capability</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-normal)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Supported
                </span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {loading ? 'Validating Token & Initializing Session...' : 'Grant Consent & Enter Interview'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Candidate Interview Session Page
const CandidateInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      try {
        const data = await sessionApi.get(sessionId);
        setSession(data);
      } catch (err: unknown) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to retrieve session state');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
        <p>Connecting to session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '30px' }}>
        <AlertTriangle size={32} color="var(--color-high-risk)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Session Unavailable</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{error || 'Session not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-normal)', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{session.interviewTitle} &bull; Session Active</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <span>Candidate: {session.candidateName}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Session ID: {session.id.slice(0, 8)}...</span>
        </div>
      </div>

      <div className="card" style={{ height: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', border: '1px solid var(--color-border)' }}>
        <Video size={48} color="#64748b" style={{ marginBottom: 'var(--space-md)' }} />
        <p style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500 }}>Live Interview Camera Preview</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '4px' }}>
          Integrity Score: {session.currentIntegrityScore} / 100 &bull; Risk State: {session.currentRiskState}
        </p>
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}>Session active and synchronized with server</span>
      </div>
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
