import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { appStore } from '../../services/store.js';
import '../../styles/interview-shield.css';

export const JoinWithCodeScreen: React.FC = () => {
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

      // Navigate to Screen 5: Candidate System Check
      navigate('/system-check');
    } catch {
      setError('Unable to load interview session. Please verify your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Bar with Back Arrow */}
      <div style={{ padding: '24px 32px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="is-btn is-btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
          aria-label="Go back to dashboard"
        >
          <ArrowLeft size={20} color="#475569" />
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
          style={{
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Shield size={28} color="#2563eb" fill="#2563eb" />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)', letterSpacing: '-0.02em' }}>
              InterviewShield
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
              Join an Interview
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', marginTop: '6px' }}>
              Enter the interview code shared by your recruiter.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: error ? '1.5px solid var(--is-danger)' : '1.5px solid var(--is-border)',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', width: '130px', textAlign: 'left' }}>
                Interview code
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="A4F7 - 9K2L"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--is-text-primary)',
                  letterSpacing: '0.05em',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}
                required
              />
            </div>

            {error && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--is-danger)', textAlign: 'left' }}>
                {error}
              </span>
            )}

            <button
              type="submit"
              disabled={loading}
              className="is-btn is-btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', fontWeight: 600 }}
              id="btn-join-submit"
            >
              {loading ? 'Joining Session...' : 'Join'}
            </button>

            <Link
              to="/help"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--is-primary)',
                textDecoration: 'none',
                marginTop: '4px',
              }}
            >
              Need help?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};
