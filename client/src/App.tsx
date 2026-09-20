import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import { Shield, CheckCircle, Video, Lock, ExternalLink, Activity } from 'lucide-react';

const Header: React.FC = () => (
  <header className="header">
    <div className="brand">
      <Shield color="#3b82f6" size={24} />
      <span>InterviewShield</span>
      <span className="brand-badge">MVP v1.0</span>
    </div>
    <nav style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
      <Link to="/dashboard" style={{ fontSize: '0.875rem' }}>Dashboard</Link>
      <Link to="/login" style={{ fontSize: '0.875rem' }}>Recruiter Login</Link>
      <Link
        to="/join/demo-token-123"
        className="btn btn-outline"
        style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
      >
        <ExternalLink size={14} /> Join as Candidate
      </Link>
    </nav>
  </header>
);

const LoginPage: React.FC = () => (
  <div style={{ maxWidth: '420px', margin: '40px auto' }}>
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <Shield color="#3b82f6" size={36} style={{ margin: '0 auto var(--space-sm)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Recruiter Access</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Sign in to review interview integrity sessions
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            defaultValue="recruiter@demo.interviewshield.dev"
            readOnly
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
            defaultValue="demo123"
            readOnly
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
        <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
          <Lock size={16} /> Enter Dashboard (Demo)
        </Link>
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Recruiter Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Monitored interview sessions and anomaly timeline reviews
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-primary">+ Create Interview</button>
      </div>
    </div>

    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Active & Completed Interviews</span>
        <span className="badge badge-normal">System Operational</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
            <th style={{ padding: '12px 24px' }}>CANDIDATE</th>
            <th style={{ padding: '12px 24px' }}>ROLE</th>
            <th style={{ padding: '12px 24px' }}>STATUS</th>
            <th style={{ padding: '12px 24px' }}>INTEGRITY SCORE</th>
            <th style={{ padding: '12px 24px' }}>RISK STATE</th>
            <th style={{ padding: '12px 24px' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '16px 24px', fontWeight: 500 }}>Alice Johnson</td>
            <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>Senior Full Stack Engineer</td>
            <td style={{ padding: '16px 24px' }}>
              <span className="badge badge-normal">Completed</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-normal)' }}>92 / 100</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <span className="badge badge-normal">Normal</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <Link to="/dashboard/demo-interview-1" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                View Timeline
              </Link>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '16px 24px', fontWeight: 500 }}>Bob Smith</td>
            <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>Frontend Developer</td>
            <td style={{ padding: '16px 24px' }}>
              <span className="badge badge-attention">Needs Review</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-suspicious)' }}>64 / 100</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <span className="badge badge-suspicious">Suspicious</span>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <Link to="/dashboard/demo-interview-2" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                View Timeline
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const SessionDetailPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            &larr; Back to interviews
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Session Review: {interviewId}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Candidate behavioral timeline and evidence ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-outline">Flag for Review</button>
          <button className="btn btn-primary">Pass Session</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Integrity Scorecard</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-normal)' }}>92</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>/ 100</span>
          </div>
          <span className="badge badge-normal" style={{ alignSelf: 'flex-start' }}>State: Normal</span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Deterministic score derived from client-side behavioral detectors. Cooldown periods and clean behavior recovery active.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#3b82f6" /> Event Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Screen share verified</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>00:00:15</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Candidate granted entire screen display stream.</p>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Tab Visibility Lost</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-attention)', fontFamily: 'var(--font-mono)' }}>00:14:22</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Document visibility changed to hidden for 4.2 seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateJoinPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <div style={{ maxWidth: '640px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Pre-Interview System Check</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Token: {token}</p>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
          InterviewShield uses on-device computer vision and audio analysis to verify session integrity. Your raw video and audio streams remain entirely on your device and are never transmitted to our servers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.875rem' }}>Camera Stream (Local MediaPipe)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-normal)', fontSize: '0.75rem', fontWeight: 600 }}>
              <CheckCircle size={14} /> Ready
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.875rem' }}>Microphone (Web Audio Analyser)</span>
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

        <Link to="/interview/demo-session-456" className="btn btn-primary" style={{ width: '100%' }}>
          Grant Consent & Proceed to Interview
        </Link>
      </div>
    </div>
  );
};

const CandidateInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-normal)', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Interview Session in Progress</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>Session ID: {sessionId}</span>
      </div>

      <div className="card" style={{ height: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', border: '1px solid var(--color-border)' }}>
        <Video size={48} color="#64748b" style={{ marginBottom: 'var(--space-md)' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Local Camera & Screen Share Preview</p>
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Client-side detection pipeline active @ 2 fps</span>
      </div>
    </div>
  );
};

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
