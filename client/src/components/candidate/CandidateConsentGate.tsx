import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Eye,
  Mic,
  Monitor,
  Lock,
  Check,
  ArrowRight,
  Info,
  CheckCircle2,
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
 * - Tracking, detectors, camera, mic, and screen-sharing MUST NOT start until
 *   the candidate explicitly reviews and accepts the agreement.
 */
export const CandidateConsentGate: React.FC<CandidateConsentGateProps> = ({
  onConsentAccepted,
  nextRoute = '/system-check',
}) => {
  const navigate = useNavigate();
  const activeSession = appStore.getActiveSession();

  // STRICT INVERTED AFFIRMATIVE CONSENT: Defaults to FALSE.
  // Pre-checking is strictly forbidden.
  const [agreed, setAgreed] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'privacy-notice'>('summary');

  const handleContinue = () => {
    if (!agreed) return;

    // Record verified consent with timestamp in local store
    appStore.setConsent(true, activeSession.id);

    if (onConsentAccepted) {
      onConsentAccepted();
    } else {
      navigate(nextRoute);
    }
  };

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
          padding: '40px 20px',
        }}
      >
        <div
          className="cand-card"
          style={{
            maxWidth: '640px',
            width: '100%',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header Title Section */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: 'var(--cand-blue-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Shield size={24} />
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--cand-blue-fg)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              Assessment Protocol &amp; Consent
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--cand-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              Pre-Interview Privacy &amp; Proctoring Agreement
            </h1>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cand-text-secondary)',
                marginTop: '8px',
                lineHeight: 1.5,
              }}
            >
              InterviewShield operates on <strong>affirmative inverted consent</strong>. No camera,
              microphone, screen capture, or behavioral telemetry will be initialized until you
              explicitly review and approve the proctoring parameters below.
            </p>
          </div>

          {/* Toggle between Overview and Detailed Privacy Notice */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--cand-border-subtle)',
            }}
          >
            <button
              onClick={() => setActiveTab('summary')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: '6px',
                color: activeTab === 'summary' ? '#ffffff' : 'var(--cand-text-secondary)',
                backgroundColor: activeTab === 'summary' ? 'var(--cand-card-elevated)' : 'transparent',
                border: activeTab === 'summary' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Monitored Signals
            </button>
            <button
              onClick={() => setActiveTab('privacy-notice')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: '6px',
                color: activeTab === 'privacy-notice' ? '#ffffff' : 'var(--cand-text-secondary)',
                backgroundColor: activeTab === 'privacy-notice' ? 'var(--cand-card-elevated)' : 'transparent',
                border: activeTab === 'privacy-notice' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Privacy &amp; Data Safeguards
            </button>
          </div>

          {/* Tab Content: Monitored Signals */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Signal 1: Video */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--cand-blue-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Eye size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Webcam &amp; Facial Presence
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                    Local on-device landmark detection to verify single-candidate presence and gaze orientation. Raw continuous video is <strong>never streamed or stored</strong>; only low-resolution verification snapshots (320x240) are captured if an anomaly is detected.
                  </div>
                </div>
              </div>

              {/* Signal 2: Audio */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--cand-emerald-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Mic size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Microphone &amp; Voice Telemetry
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                    Real-time audio frequency analysis to detect secondary human voices or synthetic teleprompters. Conversations are not recorded for marketing or model training.
                  </div>
                </div>
              </div>

              {/* Signal 3: Screen */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: 'var(--cand-amber-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Monitor size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Screen Presentation &amp; Tab Focus
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                    Auditing tab switches, off-screen windows, and screen sharing feeds during live coding or technical assessments.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Privacy & Data Safeguards */}
          {activeTab === 'privacy-notice' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.8125rem',
                color: 'var(--cand-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <Lock size={18} color="var(--cand-blue-fg)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--cand-text-primary)' }}>Client-Side Edge Inference:</strong> All AI face tracking runs locally in your browser sandbox via WebAssembly. Biometric templates are never exported to external servers.
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <CheckCircle2 size={18} color="var(--cand-emerald-fg)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--cand-text-primary)' }}>Recruiter Verification Only:</strong> Session logs are exclusively shared with the authorized hiring team for this job requisition. Data is automatically expunged after 30 days.
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cand-card-elevated)',
                  border: '1px solid var(--cand-border-subtle)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <Info size={18} color="var(--cand-amber-fg)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--cand-text-primary)' }}>Your Right to Revoke:</strong> You may conclude the interview at any moment using the "End Interview" dock button. Revoking immediately ceases all media transmission.
                </div>
              </div>
            </div>
          )}

          {/* Inverted Affirmative Consent Checkbox */}
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
            id="checkbox-candidate-consent"
          >
            <div className={`cand-checkbox ${agreed ? 'checked' : ''}`}>
              {agreed && <Check size={14} strokeWidth={3} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                I acknowledge and provide affirmative consent to session proctoring
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '2px' }}>
                I understand that my camera, microphone, and screen activity will be monitored for integrity verification and anomaly reporting.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleContinue}
              disabled={!agreed}
              className="cand-btn-primary"
              style={{ width: '100%', padding: '12px' }}
              id="btn-candidate-consent-proceed"
              title={agreed ? 'Proceed to Device Verification' : 'Affirmative consent required to proceed'}
            >
              <span>Accept &amp; Proceed to System Check</span>
              <ArrowRight size={16} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--cand-text-muted)' }}>
              InterviewShield Compliance Standard WCAG 2.2 Level AA • Zero-Primitive Invariant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
