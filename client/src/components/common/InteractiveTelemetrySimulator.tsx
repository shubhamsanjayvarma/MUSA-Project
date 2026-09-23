import React, { useState } from 'react';
import {
  Activity,
  Users,
  UserX,
  Eye,
  AppWindow,
  MonitorOff,
  MicOff,
  VolumeX,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import '../recruiter/recruiter.css';

export interface SimulatedSignalEvent {
  eventType: string;
  detectorId: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  deduction: number;
  hasEvidence?: boolean;
  evidenceUrl?: string;
  payload: Record<string, unknown>;
}

export interface InteractiveTelemetrySimulatorProps {
  currentScore?: number;
  onSignalTriggered?: (event: SimulatedSignalEvent, newScore: number) => void;
  onResetScore?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const InteractiveTelemetrySimulator: React.FC<InteractiveTelemetrySimulatorProps> = ({
  currentScore = 85,
  onSignalTriggered,
  onResetScore,
  className = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const signals: Array<{
    id: string;
    label: string;
    description: string;
    impact: string;
    icon: LucideIcon;
    buildEvent: () => SimulatedSignalEvent;
  }> = [
    {
      id: 'tab_hidden',
      label: 'Tab Switch',
      description: 'Candidate moved focus away from interview window',
      impact: '-10 pts (High)',
      icon: AppWindow,
      buildEvent: () => ({
        eventType: 'tab_hidden',
        detectorId: 'tab-blur-detector',
        title: 'Tab switch away',
        severity: 'high',
        confidence: 0.99,
        deduction: 10,
        payload: {
          action: 'blur',
          durationMs: 4200,
          targetWindow: 'browser-secondary',
        },
      }),
    },
    {
      id: 'multiple_faces',
      label: 'Multiple Faces',
      description: 'Secondary person detected inside camera viewport',
      impact: '-15 pts (High)',
      icon: Users,
      buildEvent: () => ({
        eventType: 'multiple_faces',
        detectorId: 'vision-face-detector',
        title: 'Multiple faces in frame',
        severity: 'high',
        confidence: 0.96,
        deduction: 15,
        hasEvidence: true,
        evidenceUrl: '/candidate_aarav.jpg',
        payload: {
          faceCount: 2,
          primaryConfidence: 0.96,
          secondaryConfidence: 0.91,
          boundingBoxes: [
            { originX: 140, originY: 90, width: 220, height: 260 },
            { originX: 420, originY: 130, width: 170, height: 190 },
          ],
        },
      }),
    },
    {
      id: 'face_absent',
      label: 'Face Absent',
      description: 'Candidate left camera viewport for ≥3 seconds',
      impact: '-5 pts (Medium)',
      icon: UserX,
      buildEvent: () => ({
        eventType: 'face_absent',
        detectorId: 'vision-face-detector',
        title: 'Face disappeared from view',
        severity: 'medium',
        confidence: 0.94,
        deduction: 5,
        hasEvidence: true,
        evidenceUrl: '/candidate_aarav.jpg',
        payload: {
          faceCount: 0,
          absenceDurationMs: 3800,
        },
      }),
    },
    {
      id: 'gaze_deviation',
      label: 'Gaze Deviation',
      description: 'Off-screen gaze / deviation sustained for ≥5s',
      impact: '-3 pts (Low)',
      icon: Eye,
      buildEvent: () => ({
        eventType: 'unusual_gaze_direction',
        detectorId: 'gaze-head-pose',
        title: 'Sustained off-screen gaze',
        severity: 'low',
        confidence: 0.89,
        deduction: 3,
        hasEvidence: true,
        evidenceUrl: '/candidate_aarav.jpg',
        payload: {
          yawDegrees: 34.2,
          pitchDegrees: -12.4,
          sustainedDurationMs: 5200,
          likelyTeleprompter: true,
        },
      }),
    },
    {
      id: 'screen_stopped',
      label: 'Screen Stop',
      description: 'Screen sharing revoked during live assessment',
      impact: '-20 pts (Critical)',
      icon: MonitorOff,
      buildEvent: () => ({
        eventType: 'screen_share_stopped',
        detectorId: 'screen-detector',
        title: 'Screen sharing stream ended',
        severity: 'critical',
        confidence: 1.0,
        deduction: 20,
        payload: {
          streamId: 'screen-display-01',
          stopReason: 'track_ended_by_user',
        },
      }),
    },
    {
      id: 'audio_silence',
      label: 'Extended Silence',
      description: 'No speech energy detected for ≥30 seconds',
      impact: '-2 pts (Low)',
      icon: VolumeX,
      buildEvent: () => ({
        eventType: 'audio_silence_extended',
        detectorId: 'audio-energy-detector',
        title: 'Acoustic silence duration reached',
        severity: 'low',
        confidence: 0.92,
        deduction: 2,
        payload: {
          silenceDurationMs: 32000,
          backgroundNoiseRms: 0.002,
        },
      }),
    },
    {
      id: 'av_mismatch',
      label: 'AV Speech Mismatch',
      description: 'Speech audio detected while mouth movement is stationary',
      impact: '-8 pts (Medium)',
      icon: MicOff,
      buildEvent: () => ({
        eventType: 'av_mismatch',
        detectorId: 'av-correlator',
        title: 'Speech detected without lip motion',
        severity: 'medium',
        confidence: 0.88,
        deduction: 8,
        payload: {
          audioEnergyRms: 0.082,
          mouthAspectRatio: 0.04,
          inconsistencyType: 'audio_without_mouth',
          correlationWindowMs: 5000,
        },
      }),
    },
  ];

  const handleTrigger = (signalDef: (typeof signals)[0]) => {
    const event = signalDef.buildEvent();
    const nextScore = Math.max(0, currentScore - event.deduction);

    // Broadcast on custom window event for decoupled listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('interviewshield:telemetry_event', {
          detail: { event, nextScore },
        })
      );
    }

    if (onSignalTriggered) {
      onSignalTriggered(event, nextScore);
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('interviewshield:telemetry_reset', {
          detail: { score: 100 },
        })
      );
    }

    if (onResetScore) {
      onResetScore();
    }
  };

  return (
    <div
      className={`recruiter-subpixel-card ${className}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} color="#0f172a" />
          <span
            style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a' }}
          >
            Telemetry Signal Simulator
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Signal Trigger Grid */}
      {isExpanded && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {signals.map((sig) => {
              const Icon = sig.icon;
              return (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => handleTrigger(sig)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#0f172a',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <Icon size={13} color="#475569" />
                  <span>{sig.label}</span>
                  <span className="tnum" style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.6875rem' }}>
                    {sig.impact.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '8px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Simulated Score: <strong className="tnum" style={{ color: '#0f172a' }}>{currentScore} / 100</strong>
            </span>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} color="#475569" />
              <span>Reset Score</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
