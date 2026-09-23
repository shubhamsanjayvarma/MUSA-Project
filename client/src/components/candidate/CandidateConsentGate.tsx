import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Eye,
  Mic,
  Monitor,
  AppWindow,
  Check,
  ArrowRight,
} from 'lucide-react';
import { appStore } from '../../services/store.js';
import { CandidateHeader } from './CandidateHeader.js';
import '../../styles/candidate.css';

interface CandidateConsentGateProps {
  onConsentAccepted?: () => void;
  nextRoute?: string;
}

/**
 * CandidateConsentGate
 * Enforces Inverted Affirmative Consent:
 * - Default state is UNCHECKED (agreed = false)
 * - Media devices and detectors MUST NOT start until candidate explicitly agrees.
 * - Formatted per White Design DNA: crisp hairline borders, minimal utilitarian copy.
 */
export const CandidateConsentGate: React.FC<CandidateConsentGateProps> = ({
  onConsentAccepted,
  nextRoute = '/system-check',
}) => {
  const navigate = useNavigate();
  const activeSession = appStore.getActiveSession();

  // STRICT INVERTED AFFIRMATIVE CONSENT: Defaults to FALSE.
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) return;

    appStore.setConsent(true, activeSession.id);

    if (onConsentAccepted) {
      onConsentAccepted();
    } else {
      navigate(nextRoute);
    }
  };

  const signals = [
    {
      icon: Eye,
      title: 'Webcam Presence',
      desc: 'Landmark detection checks single candidate presence and orientation. Video is processed locally on-device.',
    },
    {
      icon: Mic,
      title: 'Audio Level',
      desc: 'Monitors acoustic energy to detect speech activity. Raw audio is not recorded or transcribed.',
    },
    {
      icon: Monitor,
      title: 'Screen Share',
      desc: 'Verifies active assessment window state during the interview.',
    },
    {
      icon: AppWindow,
      title: 'Window Focus',
      desc: 'Records tab switches and background window transitions.',
    },
  ];

  return (
    <div className="cand-root" style={{ display: 'flex', flexDirection: 'column' }}>
      <CandidateHeader
        title={activeSession.title}
        role={activeSession.role}
        showExit={true}
      />

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
          className="cand-card"
          style={{
            maxWidth: '560px',
            width: '100%',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--cand-border-subtle)',
            borderRadius: '8px',
          }}
        >
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} color="#0f172a" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-secondary)' }}>
                InterviewShield
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--cand-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Proctoring Consent
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--cand-text-secondary)',
                marginTop: '4px',
                lineHeight: 1.45,
              }}
            >
              This assessment monitors device integrity signals locally on your machine.
            </p>
          </div>

          {/* Flattened Signals List (Zero nested boxes) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid var(--cand-border-subtle)',
              borderBottom: '1px solid var(--cand-border-subtle)',
            }}
          >
            {signals.map((sig, idx) => {
              const Icon = sig.icon;
              return (
                <div
                  key={sig.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: idx < signals.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                      {sig.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      {sig.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Affirmative Opt-in Checkbox */}
          <div
            onClick={() => setAgreed(!agreed)}
            className={`cand-consent-box ${agreed ? 'checked' : ''}`}
            role="checkbox"
            aria-checked={agreed}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setAgreed(!agreed);
              }
            }}
          >
            <div className={`cand-checkbox ${agreed ? 'checked' : ''}`}>
              {agreed && <Check size={12} strokeWidth={3} />}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--cand-text-primary)', lineHeight: 1.4 }}>
              I agree to assessment integrity monitoring and understand signals are analyzed locally.
            </div>
          </div>

          {/* Continue Action */}
          <button
            onClick={handleContinue}
            disabled={!agreed}
            className="cand-btn-primary"
            style={{ width: '100%', padding: '10px' }}
            id="btn-candidate-consent-submit"
          >
            <span>Continue to System Check</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
};
