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
        height: '56px',
        borderBottom: '1px solid var(--cand-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
          }}
        >
          <Shield size={18} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--cand-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            InterviewShield
          </span>
          {(title || role) && (
            <>
              <span style={{ color: 'var(--cand-border-strong)', fontSize: '0.875rem' }}>/</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--cand-text-secondary)' }}>
                {title} {role ? `(${role})` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {showExit && (
        <button
          onClick={handleExit}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cand-text-secondary)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--cand-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = 'var(--cand-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = 'var(--cand-text-secondary)';
          }}
          aria-label="Exit interview session"
        >
          <X size={15} />
        </button>
      )}
    </header>
  );
};
