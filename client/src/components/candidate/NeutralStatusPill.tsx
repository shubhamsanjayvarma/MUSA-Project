import React from 'react';
import {
  ShieldCheck,
  Camera,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Wifi,
  WifiOff,
  Cpu,
  Loader2,
} from 'lucide-react';
import '../../styles/candidate.css';

export type NeutralStatusType =
  | 'proctoring-active'
  | 'media-connected'
  | 'camera-live'
  | 'camera-off'
  | 'mic-active'
  | 'mic-muted'
  | 'screen-active'
  | 'screen-off'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'local-verification';

export interface NeutralStatusPillProps {
  type: NeutralStatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * NeutralStatusPill
 * Strict Compliance: NEVER displays numerical integrity score (0-100) or deduction points.
 * Provides objective, calm telemetry indicators to prevent adversarial gaming.
 */
export const NeutralStatusPill: React.FC<NeutralStatusPillProps> = ({
  type,
  label,
  size = 'md',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 12 : 14;

  const renderContent = () => {
    switch (type) {
      case 'proctoring-active':
        return (
          <span className="cand-pill cand-pill-active" title="Proctoring active with local device telemetry">
            <span className="cand-pulse-dot" aria-hidden="true" />
            <ShieldCheck size={iconSize} />
            <span>{label || 'Proctoring Active'}</span>
          </span>
        );

      case 'media-connected':
        return (
          <span className="cand-pill cand-pill-neutral">
            <ShieldCheck size={iconSize} color="var(--cand-emerald-fg)" />
            <span>{label || 'Camera & Microphone Connected'}</span>
          </span>
        );

      case 'camera-live':
        return (
          <span className="cand-pill cand-pill-neutral">
            <Camera size={iconSize} color="var(--cand-emerald-fg)" />
            <span>{label || 'Camera Live'}</span>
          </span>
        );

      case 'camera-off':
        return (
          <span className="cand-pill cand-pill-warning">
            <VideoOff size={iconSize} />
            <span>{label || 'Camera Off'}</span>
          </span>
        );

      case 'mic-active':
        return (
          <span className="cand-pill cand-pill-neutral">
            <Mic size={iconSize} color="var(--cand-emerald-fg)" />
            <span>{label || 'Mic Active'}</span>
          </span>
        );

      case 'mic-muted':
        return (
          <span className="cand-pill cand-pill-warning">
            <MicOff size={iconSize} />
            <span>{label || 'Mic Muted'}</span>
          </span>
        );

      case 'screen-active':
        return (
          <span className="cand-pill cand-pill-info">
            <Monitor size={iconSize} />
            <span>{label || 'Screen Share Active'}</span>
          </span>
        );

      case 'screen-off':
        return (
          <span className="cand-pill cand-pill-neutral">
            <Monitor size={iconSize} color="var(--cand-text-muted)" />
            <span>{label || 'Screen Share Ready'}</span>
          </span>
        );

      case 'connected':
        return (
          <span className="cand-pill cand-pill-active">
            <Wifi size={iconSize} />
            <span>{label || 'Connected'}</span>
          </span>
        );

      case 'reconnecting':
        return (
          <span className="cand-pill cand-pill-warning">
            <Loader2 size={iconSize} className="animate-spin" />
            <span>{label || 'Reconnecting...'}</span>
          </span>
        );

      case 'disconnected':
        return (
          <span className="cand-pill cand-pill-neutral" style={{ color: 'var(--cand-rose-fg)' }}>
            <WifiOff size={iconSize} />
            <span>{label || 'Disconnected'}</span>
          </span>
        );

      case 'local-verification':
        return (
          <span className="cand-pill cand-pill-neutral" style={{ fontSize: '0.6875rem' }}>
            <Cpu size={iconSize} color="var(--cand-text-secondary)" />
            <span>{label || 'On-Device Verification'}</span>
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderContent()}
    </div>
  );
};
