import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  X,
  Eye,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { appStore } from '../../services/store.js';
import '../../styles/interview-shield.css';

export const CandidateConsentScreen: React.FC = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(true);
  const activeSession = appStore.getActiveSession();

  const handleContinue = () => {
    if (agreed) {
      navigate('/interview/candidate');
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
      {/* Top Header Bar */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--is-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} color="#2563eb" fill="#2563eb" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
            InterviewShield
          </span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="is-icon-btn"
          style={{ border: 'none', background: 'transparent' }}
          aria-label="Close consent flow"
        >
          <X size={20} />
        </button>
      </header>

      {/* Centered Main Card */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* Heading & Subtitle */}
          <div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--is-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {activeSession.title}
            </span>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--is-text-primary)',
                letterSpacing: '-0.02em',
                marginTop: '6px',
              }}
            >
              Before You Join
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--is-text-secondary)',
                marginTop: '6px',
              }}
            >
              This interview will be monitored to ensure a fair and secure process.
            </p>
          </div>

          {/* 4 Informational Clauses */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left',
            }}
          >
            {/* Clause 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--is-primary-light)',
                  color: 'var(--is-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Eye size={17} />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                Your video, audio, and screen activity may be monitored.
              </span>
            </div>

            {/* Clause 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--is-primary-light)',
                  color: 'var(--is-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={17} />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                Unusual activity may be flagged for review.
              </span>
            </div>

            {/* Clause 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--is-primary-light)',
                  color: 'var(--is-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HardDrive size={17} />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                Recordings and evidence are securely stored.
              </span>
            </div>

            {/* Clause 4 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--is-primary-light)',
                  color: 'var(--is-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={17} />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                Your privacy is respected and data is handled securely.
              </span>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#fafbfc',
              border: '1px solid var(--is-border)',
              cursor: 'pointer',
              userSelect: 'none',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: agreed ? 'none' : '1.5px solid #cbd5e1',
                backgroundColor: agreed ? 'var(--is-primary)' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {agreed && <Check size={13} strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
              I understand and agree to the monitoring process.
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContinue}
            disabled={!agreed}
            className="is-btn is-btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              opacity: agreed ? 1 : 0.6,
              cursor: agreed ? 'pointer' : 'not-allowed',
            }}
            id="btn-consent-continue"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
};
