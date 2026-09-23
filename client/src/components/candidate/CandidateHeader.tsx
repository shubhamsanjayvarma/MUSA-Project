import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import '../../styles/candidate.css';

interface CandidateHeaderProps {
  title?: string;
  role?: string;
  onExit?: () => void;
  showExit?: boolean;
}

export const CandidateHeader: React.FC<CandidateHeaderProps> = ({
  title,
  role,
  onExit,
  showExit = true,
}) => {
  const navigate = useNavigate();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--cand-border-subtle)',
        boxShadow: 'var(--cand-subpixel-ring)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        backgroundColor: 'rgba(9, 13, 22, 0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={18} color="#3b82f6" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cand-text-primary)', letterSpacing: '-0.01em' }}>
              InterviewShield
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--cand-blue-fg)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontWeight: 600,
              }}
            >
              Candidate Portal
            </span>
          </div>
          {(title || role) && (
            <span style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '1px' }}>
              {title} {role ? `• ${role}` : ''}
            </span>
          )}
        </div>
      </div>

      {showExit && (
        <button
          onClick={handleExit}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cand-text-secondary)',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--cand-text-secondary)';
          }}
          aria-label="Exit interview session"
        >
          <X size={18} />
        </button>
      )}
    </header>
  );
};
