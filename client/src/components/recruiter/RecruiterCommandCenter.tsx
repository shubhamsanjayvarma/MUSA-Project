import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Video,
  Mic,
  Monitor,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  sessionApi,
  SessionDetails,
  RiskSnapshotItem,
  EvidenceItemData,
  RecruiterReviewData,
} from '../../services/api.js';
import { appStore } from '../../services/store.js';
import { RadialScoreGauge } from './RadialScoreGauge.js';
import { IncidentTimeline, IncidentEvent } from './IncidentTimeline.js';
import { ReviewPanel } from './ReviewPanel.js';
import { DownloadReportButton } from './DownloadReportButton.js';
import { ExplainableRiskLedger } from './ExplainableRiskLedger.js';
import {
  InteractiveTelemetrySimulator,
  SimulatedSignalEvent,
} from '../common/InteractiveTelemetrySimulator.js';
import './recruiter.css';

export interface RecruiterCommandCenterProps {
  sessionId?: string;
  interviewId?: string;
  joinCode?: string;
  onBackToDashboard?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const RecruiterCommandCenter: React.FC<RecruiterCommandCenterProps> = ({
  sessionId: propSessionId,
  interviewId: _propInterviewId,
  joinCode: _propJoinCode,
  onBackToDashboard,
  className = '',
  style,
}) => {
  // Session resolution
  const activeSessionStored = appStore.getActiveSession();
  const effectiveSessionId =
    propSessionId ||
    activeSessionStored?.id ||
    'sess-live-01';

  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [_sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [_snapshots, setSnapshots] = useState<RiskSnapshotItem[]>([]);
  const [_evidenceList, setEvidenceList] = useState<EvidenceItemData[]>([]);
  const [review, setReview] = useState<RecruiterReviewData | null>(null);

  // Active candidate and interview metadata
  const [candidateName, setCandidateName] = useState(activeSessionStored?.candidateName || 'Aarav Mehta');
  const [candidateRole] = useState(activeSessionStored?.role || 'Frontend Developer');
  const [integrityScore, setIntegrityScore] = useState(activeSessionStored?.integrityScore || 85);
  const [sessionDuration, setSessionDuration] = useState('00:42:15');

  // Load telemetry & review data
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      if (effectiveSessionId && !effectiveSessionId.startsWith('int-') && !effectiveSessionId.startsWith('sess-local')) {
        const [details, evts, snaps, evd, rev] = await Promise.allSettled([
          sessionApi.get(effectiveSessionId),
          sessionApi.getEvents(effectiveSessionId, 1, 100),
          sessionApi.getRiskHistory(effectiveSessionId),
          sessionApi.getEvidence(effectiveSessionId),
          sessionApi.getReview(effectiveSessionId),
        ]);

        if (details.status === 'fulfilled' && details.value) {
          setSessionData(details.value);
          setCandidateName(details.value.candidateName);
          setIntegrityScore(details.value.currentIntegrityScore);
          setSessionDuration(details.value.duration || '00:45:00');
        }

        if (evts.status === 'fulfilled' && evts.value) {
          const mapped: IncidentEvent[] = evts.value.map((e) => ({
            id: e.id,
            sequenceNumber: e.sequenceNumber,
            eventType: e.eventType,
            detectorId: e.detectorId,
            clientTimestamp: e.clientTimestamp,
            serverTimestamp: e.serverTimestamp,
            severity: e.severity as any,
            confidence: e.confidence,
            payload: e.payload,
            scoreBefore: e.scoreBefore,
            scoreAfter: e.scoreAfter,
            hasEvidence: e.hasEvidence,
          }));
          setEvents(mapped);
        }

        if (snaps.status === 'fulfilled' && snaps.value) {
          setSnapshots(snaps.value);
        }

        if (evd.status === 'fulfilled' && evd.value) {
          setEvidenceList(evd.value);
        }

        if (rev.status === 'fulfilled' && rev.value) {
          setReview(rev.value);
        }
      } else {
        // Fallback default sample data for robust mock demonstration
        loadSampleData();
      }
    } catch (err) {
      console.warn('Command center data fetch fallback:', err);
      loadSampleData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSampleData = () => {
    setIntegrityScore(activeSessionStored?.integrityScore || 82);
    setEvents([
      {
        id: 'evt-1',
        sequenceNumber: 1,
        eventType: 'tab_hidden',
        detectorId: 'tab-blur-detector',
        serverTimestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        severity: 'low',
        confidence: 0.98,
        scoreBefore: 100,
        scoreAfter: 100,
        payload: { durationMs: 1420, targetWindow: 'browser-secondary' },
      },
      {
        id: 'evt-2',
        sequenceNumber: 2,
        eventType: 'multiple_faces',
        detectorId: 'vision-face-detector',
        serverTimestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        severity: 'critical',
        confidence: 0.94,
        scoreBefore: 100,
        scoreAfter: 85,
        hasEvidence: true,
        evidenceUrl: '/candidate_aarav.jpg',
        payload: { facesDetected: 2, primaryBoundingBox: [120, 80, 240, 280], secondaryConfidence: 0.89 },
      },
      {
        id: 'evt-3',
        sequenceNumber: 3,
        eventType: 'face_orientation_off',
        detectorId: 'gaze-head-pose',
        serverTimestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
        severity: 'medium',
        confidence: 0.88,
        scoreBefore: 85,
        scoreAfter: 82,
        payload: { yawDegrees: 34.2, pitchDegrees: -12.1, continuousDurationMs: 4200 },
      },
      {
        id: 'evt-4',
        sequenceNumber: 4,
        eventType: 'av_mismatch',
        detectorId: 'av-sync-correlator',
        serverTimestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        severity: 'medium',
        confidence: 0.81,
        scoreBefore: 82,
        scoreAfter: 82,
        payload: { speechEnergyRms: 0.42, mouthApertureDelta: 0.03, correlationFactor: 0.12 },
      },
    ]);
  };

  const handleSignalSimulated = (simEvent: SimulatedSignalEvent, nextScore: number) => {
    const newSeq = events.length > 0 ? Math.max(...events.map((e) => e.sequenceNumber || 0)) + 1 : 1;
    const newEvt: IncidentEvent = {
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sequenceNumber: newSeq,
      eventType: simEvent.eventType,
      detectorId: simEvent.detectorId,
      title: simEvent.title,
      serverTimestamp: new Date().toISOString(),
      clientTimestamp: new Date().toISOString(),
      severity: simEvent.severity,
      confidence: simEvent.confidence,
      scoreBefore: integrityScore,
      scoreAfter: nextScore,
      hasEvidence: simEvent.hasEvidence,
      evidenceUrl: simEvent.evidenceUrl,
      payload: { ...simEvent.payload, isSimulated: true },
    };

    setEvents((prev) => [newEvt, ...prev]);
    setIntegrityScore(nextScore);
  };

  const handleResetScore = () => {
    setIntegrityScore(100);
    const newSeq = events.length > 0 ? Math.max(...events.map((e) => e.sequenceNumber || 0)) + 1 : 1;
    const resetEvt: IncidentEvent = {
      id: `sim-reset-${Date.now()}`,
      sequenceNumber: newSeq,
      eventType: 'clean_baseline_restored',
      detectorId: 'risk-recovery-engine',
      title: 'Clean observation recovery (baseline restored)',
      serverTimestamp: new Date().toISOString(),
      clientTimestamp: new Date().toISOString(),
      severity: 'low',
      confidence: 1.0,
      scoreBefore: integrityScore,
      scoreAfter: 100,
      payload: { reason: 'manual_demonstration_reset', isSimulated: true },
    };
    setEvents((prev) => [resetEvt, ...prev]);
  };

  useEffect(() => {
    loadData();
  }, [effectiveSessionId]);

  return (
    <div
      className={`recruiter-command-center ${className}`}
      style={{
        backgroundColor: 'var(--recruiter-bg, #f8fafc)',
        color: 'var(--recruiter-text-primary, #0f172a)',
        minHeight: '100%',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Top Navigation & Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="recruiter-subpixel-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                color: 'var(--recruiter-text-secondary, #475569)',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span className="recruiter-text-12" style={{ fontWeight: 500 }}>Dashboard</span>
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                className="recruiter-text-20"
                style={{
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--recruiter-text-primary, #0f172a)',
                  letterSpacing: '-0.025em',
                }}
              >
                Recruiter Command Center
              </h1>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '4px',
                fontSize: '0.8125rem',
                color: 'var(--recruiter-text-secondary, #475569)',
              }}
            >
              <span>Candidate: <strong style={{ color: '#0f172a' }}>{candidateName}</strong></span>
              <span>•</span>
              <span>Role: <strong style={{ color: '#0f172a' }}>{candidateRole}</strong></span>
              <span>•</span>
              <span className="tnum">Session: {effectiveSessionId.slice(0, 10)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => loadData(true)}
            className="recruiter-subpixel-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: 'var(--recruiter-text-secondary, #475569)',
              cursor: refreshing ? 'wait' : 'pointer',
              boxShadow: 'none',
            }}
            title="Refresh real-time telemetry stream"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="recruiter-text-12" style={{ fontWeight: 500 }}>Sync</span>
          </button>

          {/* Actionable Download Audit Report Button */}
          <DownloadReportButton
            sessionId={effectiveSessionId}
            candidateName={candidateName}
            interviewTitle={candidateRole}
            integrityScore={integrityScore}
            buttonText="Download Audit Report (PDF)"
            variant="primary"
          />
        </div>
      </div>

      {/* Top Row: Radial Gauge (280x180), Sensor Telemetry Status, Proctor Review Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 1.2fr',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* 1. Canonical SVG Radial Score Gauge with 280x180 fixed bounding box */}
        <RadialScoreGauge
          score={integrityScore}
          label="Assessment Integrity"
          size="standard"
          showBadge={true}
          showTicks={true}
        />

        {/* 2. Live Sensor Signal Channels */}
        <div
          className="recruiter-subpixel-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#ffffff',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#0f172a" />
              <span
                style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a' }}
              >
                Telemetry Sensor Feeds
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 24px',
              padding: '6px 0',
            }}
          >
            {/* Feed 1: Face Presence */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={14} color="#64748b" />
                <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>Face Presence</span>
              </div>
              <span className="tnum" style={{ color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>
                100%
              </span>
            </div>

            {/* Feed 2: Speech Sync */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={14} color="#64748b" />
                <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>Speech Sync</span>
              </div>
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>
                Synced
              </span>
            </div>

            {/* Feed 3: Screen Stream */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={14} color="#64748b" />
                <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>Screen Sharing</span>
              </div>
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>
                Active
              </span>
            </div>

            {/* Feed 4: Tab Focus */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} color="#64748b" />
                <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>Tab Focus</span>
              </div>
              <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.75rem' }}>
                1 Switch
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--recruiter-text-secondary, #64748b)',
              paddingTop: '6px',
            }}
          >
            <span>Telemetry Frequency: <strong style={{ color: '#0f172a' }}>2 FPS</strong></span>
            <span className="tnum">Elapsed: {sessionDuration}</span>
          </div>
        </div>

        {/* 3. Review Action Workflow */}
        <ReviewPanel
          sessionId={effectiveSessionId}
          initialReview={review}
          onReviewSubmitted={(rev) => setReview(rev)}
        />
      </div>

      {/* Interactive Telemetry Signal Simulator (tactile trigger for the 7 canonical signals) */}
      <InteractiveTelemetrySimulator
        currentScore={integrityScore}
        onSignalTriggered={handleSignalSimulated}
        onResetScore={handleResetScore}
        defaultExpanded={false}
      />

      {/* Level 2 Progressive Disclosure: Explainable Risk Matrix */}
      <ExplainableRiskLedger
        currentScore={integrityScore}
        peakScore={100}
        recoveryApplied={2}
        cleanMinutes={4}
        events={events}
      />

      {/* Level 3 Progressive Disclosure: Virtualized Incident Timeline Ledger */}
      <div>
        <IncidentTimeline
          events={events}
          maxHeight="520px"
          virtualizeThreshold={50}
          showFilters={true}
          showSearch={true}
        />
      </div>
    </div>
  );
};
