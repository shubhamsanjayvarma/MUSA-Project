import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X, CheckCircle2, Home, FileText } from 'lucide-react';
import '../../styles/interview-shield.css';

export const InterviewEndedScreen: React.FC = () => {
  const navigate = useNavigate();

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
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Centered Content */}
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
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Green Checkmark Circle Graphic */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={38} strokeWidth={2.5} />
          </div>

          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--is-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Interview Ended
            </h1>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--is-text-secondary)',
                marginTop: '6px',
                lineHeight: 1.5,
              }}
            >
              Thank you for your time!<br />
              The interview has been completed.
            </p>
          </div>

          {/* Action Buttons: Back to Home & View Details */}
          <div style={{ display: 'flex', gap: '14px', width: '100%', marginTop: '8px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="is-btn is-btn-primary"
              style={{ flex: 1, padding: '12px' }}
              id="btn-ended-home"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </button>

            <button
              onClick={() => navigate('/report')}
              className="is-btn is-btn-outline"
              style={{ flex: 1, padding: '12px' }}
              id="btn-ended-details"
            >
              <FileText size={16} color="var(--is-text-secondary)" />
              <span>View Details</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
