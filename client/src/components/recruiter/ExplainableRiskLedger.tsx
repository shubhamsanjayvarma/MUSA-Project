import React from 'react';
import {
  ShieldAlert,
  Clock,
  UserCheck,
  Users,
  Eye,
  AppWindow,
  Monitor,
  Mic,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import './recruiter.css';

export interface SignalContribution {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  status: 'normal' | 'active_deduction' | 'recovered';
  deduction: number;
  count: number;
  lastTriggered?: string;
  explanation: string;
  isObservation: boolean;
}

export interface ExplainableRiskLedgerProps {
  currentScore: number;
  peakScore?: number;
  recoveryApplied?: number;
  cleanMinutes?: number;
  events?: Array<{
    eventType: string;
    severity?: string;
    serverTimestamp?: string;
    scoreBefore?: number | null;
    scoreAfter?: number | null;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

export const ExplainableRiskLedger: React.FC<ExplainableRiskLedgerProps> = ({
  currentScore,
  peakScore = 100,
  recoveryApplied = 0,
  cleanMinutes = 0,
  events = [],
  className = '',
  style,
}) => {
  // Aggregate deduction events by the 7 canonical signal categories from pending_task.md
  const tabEvents = events.filter((e) => e.eventType === 'tab_hidden');
  const multiFaceEvents = events.filter((e) => e.eventType === 'multiple_faces');
  const faceAbsentEvents = events.filter((e) => e.eventType === 'face_absent');
  const gazeEvents = events.filter(
    (e) => e.eventType === 'face_orientation_off' || e.eventType === 'unusual_gaze_direction'
  );
  const screenStopEvents = events.filter((e) => e.eventType === 'screen_share_stopped');
  const silenceEvents = events.filter((e) => e.eventType === 'audio_silence_extended');
  const avMismatchEvents = events.filter((e) => e.eventType === 'av_mismatch');

  const signals: SignalContribution[] = [
    {
      id: 'tab_activity',
      name: 'Browser Tab Activity',
      category: 'Focus Observation',
      icon: AppWindow,
      status: tabEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: tabEvents.length > 0 ? 10 : 0,
      count: tabEvents.length,
      explanation:
        tabEvents.length > 0
          ? `${tabEvents.length} tab switch away recorded (observation, not cheating verdict)`
          : 'Active on interview tab continuously',
      isObservation: true,
    },
    {
      id: 'multiple_faces',
      name: 'Multi-Face Presence',
      category: 'Visual Security',
      icon: Users,
      status: multiFaceEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: multiFaceEvents.length > 0 ? 15 : 0,
      count: multiFaceEvents.length,
      explanation:
        multiFaceEvents.length > 0
          ? `${multiFaceEvents.length} secondary face detected in camera viewport with frame snapshot`
          : 'Sole verified candidate in viewport',
      isObservation: true,
    },
    {
      id: 'face_presence',
      name: 'Face Presence Continuity',
      category: 'Visual Continuity',
      icon: UserCheck,
      status: faceAbsentEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: faceAbsentEvents.length > 0 ? 5 : 0,
      count: faceAbsentEvents.length,
      explanation:
        faceAbsentEvents.length > 0
          ? 'Candidate face temporarily disappeared for ≥3 seconds'
          : 'Candidate consistently visible in camera',
      isObservation: true,
    },
    {
      id: 'face_orientation',
      name: 'Orientation & Gaze Vector',
      category: 'Behavioral Pattern',
      icon: Eye,
      status: gazeEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: gazeEvents.length > 0 ? 3 : 0,
      count: gazeEvents.length,
      explanation:
        gazeEvents.length > 0
          ? 'Off-screen gaze / deviation sustained for ≥5s'
          : 'Natural forward-facing attention maintained',
      isObservation: true,
    },
    {
      id: 'screen_sharing',
      name: 'Screen Share Monitoring',
      category: 'Display Telemetry',
      icon: Monitor,
      status: screenStopEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: screenStopEvents.length > 0 ? 20 : 0,
      count: screenStopEvents.length,
      explanation:
        screenStopEvents.length > 0
          ? 'Screen sharing stream was revoked during assessment'
          : 'Active desktop screen share stream confirmed',
      isObservation: true,
    },
    {
      id: 'audio_activity',
      name: 'Audio Layer Continuity',
      category: 'Acoustic Monitoring',
      icon: Mic,
      status: silenceEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: silenceEvents.length > 0 ? 2 : 0,
      count: silenceEvents.length,
      explanation:
        silenceEvents.length > 0
          ? 'Extended acoustic silence detected (≥30 seconds)'
          : 'Normal conversational speech acoustics',
      isObservation: true,
    },
    {
      id: 'av_correlation',
      name: 'Audio-Visual Speech Sync',
      category: 'Multimodal Correlation',
      icon: Volume2,
      status: avMismatchEvents.length > 0 ? 'active_deduction' : 'normal',
      deduction: avMismatchEvents.length > 0 ? 8 : 0,
      count: avMismatchEvents.length,
      explanation:
        avMismatchEvents.length > 0
          ? 'Audio speech energy detected while mouth movement was absent'
          : 'Acoustic energy correlates with facial lip motion',
      isObservation: true,
    },
  ];

  const totalDeductions = signals.reduce((sum, s) => sum + s.deduction, 0);

  return (
    <div
      className={`recruiter-subpixel-card ${className}`}
      style={{
        padding: '20px 22px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} color="#0f172a" />
          <h3
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#0f172a',
              margin: 0,
            }}
          >
            Risk Deductions & Observations
          </h3>
        </div>
      </div>

      {/* Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
            Baseline
          </span>
          <span className="tnum" style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
            {peakScore} pts
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
            Active Deductions
          </span>
          <span
            className="tnum"
            style={{ fontWeight: 600, fontSize: '0.875rem', color: totalDeductions > 0 ? '#b91c1c' : '#0f172a' }}
          >
            {totalDeductions > 0 ? `-${totalDeductions} pts` : '0 pts'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
            Clean Recovery
          </span>
          <span
            className="tnum"
            style={{ fontWeight: 600, fontSize: '0.875rem', color: recoveryApplied > 0 ? '#15803d' : '#0f172a' }}
          >
            +{recoveryApplied} pts ({cleanMinutes}m)
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#475569', display: 'block' }}>
            Current Net Score
          </span>
          <span className="tnum" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
            {currentScore} / 100
          </span>
        </div>
      </div>

      {/* Monitored Signals Clean List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {signals.map((signal, idx) => {
          const Icon = signal.icon;
          const isDeducted = signal.status === 'active_deduction';

          return (
            <div
              key={signal.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: idx < signals.length - 1 ? '1px solid #f1f5f9' : 'none',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                <Icon size={14} color={isDeducted ? '#c2410c' : '#64748b'} />
                <div>
                  <span
                    style={{ fontWeight: 600, fontSize: '0.75rem', color: '#0f172a', display: 'block' }}
                  >
                    {signal.name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    {signal.category}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: isDeducted ? '#9a3412' : '#64748b',
                  }}
                >
                  {signal.explanation}
                </span>
              </div>

              <div style={{ minWidth: '80px', textAlign: 'right' }}>
                {isDeducted ? (
                  <span
                    className="tnum"
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '0.6875rem',
                    }}
                  >
                    -{signal.deduction} pts
                  </span>
                ) : (
                  <span
                    style={{
                      color: '#15803d',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                    }}
                  >
                    Clean
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '8px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} />
          Telemetry sampling: 500ms cycle budget
        </span>
        <span style={{ color: '#64748b' }}>
          Recovery rate: +2 pts / 60s clean interval
        </span>
      </div>
    </div>
  );
};
