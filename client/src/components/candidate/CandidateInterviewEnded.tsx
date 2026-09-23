import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import { appStore } from '../../services/store.js';
import { CandidateHeader } from './CandidateHeader.js';
import { NeutralStatusPill } from './NeutralStatusPill.js';
import '../../styles/candidate.css';

interface CandidateInterviewEndedProps {
  onReturnHome?: () => void;
}

/**
 * CandidateInterviewEnded
 * Post-session completion view.
 * Confirms telemetry transmission and device teardown.
 */
export const CandidateInterviewEnded: React.FC<CandidateInterviewEndedProps> = ({
  onReturnHome,
}) => {
  const navigate = useNavigate();
  const activeSession = appStore.getActiveSession();

  const handleReturn = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="cand-root" style={{ display: 'flex', flexDirection: 'column' }}>
      <CandidateHeader
        title={activeSession.title}
        role={activeSession.role}
        showExit={false}
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
            maxWidth: '520px',
            width: '100%',
            padding: '36px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Emerald Checkmark Circle Graphic */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--cand-emerald-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <NeutralStatusPill type="media-connected" label="Media Streams Terminated" />
            </div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--cand-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Interview Concluded
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cand-text-secondary)',
                marginTop: '8px',
                lineHeight: 1.5,
              }}
            >
              Thank you for completing your technical assessment for{' '}
              <strong style={{ color: 'var(--cand-text-primary)' }}>{activeSession.title}</strong>.
            </p>
          </div>

          {/* Verification Audit Summary Card */}
          <div
            className="cand-card-elevated"
            style={{
              width: '100%',
              padding: '16px 20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--cand-text-secondary)' }}>Candidate Name:</span>
              <span style={{ fontWeight: 600, color: 'var(--cand-text-primary)' }}>{activeSession.candidateName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--cand-text-secondary)' }}>Job Requisition:</span>
              <span style={{ fontWeight: 500, color: 'var(--cand-text-primary)' }}>{activeSession.role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--cand-text-secondary)' }}>Verification Telemetry:</span>
              <span style={{ color: 'var(--cand-emerald-fg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Finalized &amp; Delivered
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--cand-text-secondary)' }}>Data Retention Policy:</span>
              <span style={{ color: 'var(--cand-text-muted)', fontSize: '0.75rem' }}>Automated 30-Day Expiry</span>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--cand-text-muted)', lineHeight: 1.5 }}>
            All camera, microphone, and screen-sharing tracks have been completely stopped and disconnected from your device. You may safely close this browser window.
          </p>

          {/* Action Button */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button
              onClick={handleReturn}
              className="cand-btn-primary"
              style={{ flex: 1, padding: '12px' }}
              id="btn-candidate-ended-home"
            >
              <Home size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
