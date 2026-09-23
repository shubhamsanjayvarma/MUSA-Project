import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { appStore } from '../../services/store.js';
import '../../styles/candidate.css';

interface CandidateJoinScreenProps {
  onJoinSuccess?: () => void;
}

/**
 * CandidateJoinScreen
 * Candidate entrance page to enter join code.
 * Routes directly to the Inverted Affirmative Consent gate (/consent).
 */
export const CandidateJoinScreen: React.FC<CandidateJoinScreenProps> = ({
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCode = searchParams.get('code') || '';

  const [code, setCode] = useState(paramCode || 'A4F7 - 9K2L');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramCode) {
      setCode(paramCode);
    }
  }, [paramCode]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) {
      setError('Please enter a valid interview code');
      return;
    }

    setLoading(true);
    try {
      // Find or initialize interview session
      const interview = appStore.findInterviewByCode(clean);
      appStore.setActiveSession(interview);

      // CRITICAL: Clear any stale consent for a new code join
      // to strictly enforce affirmative opt-in
      appStore.clearConsent(interview.id);

      if (onJoinSuccess) {
        onJoinSuccess();
      } else {
        // STRICT ENFORCEMENT: Route to Consent Gate FIRST, never to devices!
        navigate('/consent');
      }
    } catch {
      setError('Unable to load interview session. Please verify your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cand-root" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar with Back Arrow */}
      <div style={{ padding: '24px 32px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="cand-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
          aria-label="Go back to dashboard"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Centered Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          className="cand-card"
          style={{
            width: '100%',
            maxWidth: '460px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '36px 32px',
          }}
        >
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={22} color="#3b82f6" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cand-text-primary)', letterSpacing: '-0.02em' }}>
              InterviewShield
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--cand-text-primary)', letterSpacing: '-0.02em' }}>
              Candidate Verification
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--cand-text-secondary)', marginTop: '6px' }}>
              Enter your secure candidate access code to review proctoring parameters and begin.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: error ? '1.5px solid var(--cand-rose-fg)' : '1px solid var(--cand-border-strong)',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: 'var(--cand-card-elevated)',
                boxShadow: 'var(--cand-subpixel-ring)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cand-text-secondary)', width: '130px', textAlign: 'left', fontSize: '0.8125rem' }}>
                <KeyRound size={15} />
                <span>Access Code</span>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="A4F7 - 9K2L"
                className="cand-tabular"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--cand-text-primary)',
                  letterSpacing: '0.06em',
                  textAlign: 'right',
                  backgroundColor: 'transparent',
                }}
                required
              />
            </div>

            {error && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--cand-rose-fg)', textAlign: 'left' }}>
                {error}
              </span>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cand-btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9375rem' }}
              id="btn-candidate-join-submit"
            >
              <span>{loading ? 'Validating Session...' : 'Review Proctoring Terms'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-muted)', lineHeight: 1.5, marginTop: '4px' }}>
              By continuing, you will review the monitored data signals before any camera or audio device is accessed.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
