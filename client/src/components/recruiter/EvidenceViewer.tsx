import React, { useState } from 'react';
import { Eye, EyeOff, X, ShieldCheck } from 'lucide-react';
import './recruiter.css';

export interface EvidenceViewerProps {
  imageUrl?: string | null;
  timestamp?: string;
  eventType?: string;
  detectorId?: string;
  metadata?: Record<string, unknown>;
  defaultBlurred?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  imageUrl,
  timestamp = new Date().toLocaleTimeString(),
  eventType = 'Anomaly Signal',
  detectorId,
  metadata,
  defaultBlurred = true,
  onClose,
  isModal = false,
  className = '',
}) => {
  const [isBlurred, setIsBlurred] = useState(defaultBlurred);
  const [isHovered, setIsHovered] = useState(false);

  // If recruiter turned on privacy blur, unblur temporarily when hovering/focusing
  const activeBlur = isBlurred && !isHovered;

  const content = (
    <div
      className={`recruiter-subpixel-card ${className}`}
      style={{
        width: isModal ? '560px' : '320px',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: isModal
          ? '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 10px 10px -5px rgba(16, 24, 40, 0.04)'
          : '0 1px 3px 0 rgba(16, 24, 40, 0.06)',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
            }}
          />
          <span
            className="recruiter-mono recruiter-text-12"
            style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #0f172a)' }}
          >
            {eventType}
          </span>
          {detectorId && (
            <span
              className="recruiter-mono recruiter-text-11"
              style={{ color: 'var(--recruiter-text-muted, #64748b)' }}
            >
              [{detectorId}]
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Privacy Blur Toggle */}
          <button
            type="button"
            onClick={() => setIsBlurred(!isBlurred)}
            title={isBlurred ? 'Disable Privacy Blur' : 'Enable Privacy Blur'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isBlurred ? '#eff6ff' : '#f8fafc',
              color: isBlurred ? '#2563eb' : '#475569',
              border: `1px solid ${isBlurred ? '#bfdbfe' : '#e2e8f0'}`,
              cursor: 'pointer',
              fontSize: '0.6875rem',
              fontWeight: 600,
            }}
          >
            {isBlurred ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{isBlurred ? 'Blur On' : 'Blur Off'}</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 4:3 Aspect Ratio Frame */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: '#050811',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`[${timestamp}] Anomaly Frame Snapshot`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: activeBlur ? 'blur(10px)' : 'none',
              transform: activeBlur ? 'scale(1.05)' : 'scale(1)',
              transition: 'filter 250ms ease, transform 250ms ease',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
            }}
          >
            <ShieldCheck size={32} />
            <span className="recruiter-text-12">Telemetry metadata only (no frame stored)</span>
          </div>
        )}

        {/* Hover Hint when blurred */}
        {activeBlur && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(9, 13, 22, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              pointerEvents: 'none',
            }}
          >
            <Eye size={20} color="#f8fafc" />
            <span
              className="recruiter-mono recruiter-text-11"
              style={{
                color: '#f8fafc',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Hover to unblur snapshot
            </span>
          </div>
        )}

        {/* Timestamp Stamp */}
        <div
          className="recruiter-mono tnum recruiter-text-11"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(9, 13, 22, 0.85)',
            color: '#f8fafc',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {timestamp}
        </div>
      </div>

      {/* Metadata Panel */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--recruiter-border-subtle, #e2e8f0)',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            className="recruiter-mono recruiter-text-11"
            style={{
              color: 'var(--recruiter-text-secondary, #475569)',
              maxHeight: '80px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(metadata, null, 2)}
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
