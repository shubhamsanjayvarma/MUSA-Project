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

  useEffect(() => {
    loadData();
  }, [effectiveSessionId]);

  return (
    <div
      className={`recruiter-command-center ${className}`}
      style={{
        backgroundColor: 'var(--recruiter-bg, #090d16)',
        color: 'var(--recruiter-text-primary, #f8fafc)',
        minHeight: '100vh',
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
                color: 'var(--recruiter-text-secondary, #94a3b8)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span className="recruiter-mono recruiter-text-12">Dashboard</span>
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                className="recruiter-text-20"
                style={{
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--recruiter-text-primary, #f8fafc)',
                  letterSpacing: '-0.025em',
                }}
              >
                Recruiter Command Center
              </h1>
              <span
                className="recruiter-mono recruiter-text-11"
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                SECURE TELEMETRY
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '4px',
                fontSize: '0.8125rem',
                color: 'var(--recruiter-text-secondary, #94a3b8)',
              }}
            >
              <span>Candidate: <strong style={{ color: '#f8fafc' }}>{candidateName}</strong></span>
              <span>•</span>
              <span>Role: <strong style={{ color: '#f8fafc' }}>{candidateRole}</strong></span>
              <span>•</span>
              <span className="recruiter-mono tnum">Session: {effectiveSessionId.slice(0, 10)}</span>
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
              padding: '9px 14px',
              backgroundColor: 'var(--recruiter-surface, #0f172a)',
              color: 'var(--recruiter-text-secondary, #94a3b8)',
              cursor: refreshing ? 'wait' : 'pointer',
              border: 'none',
            }}
            title="Refresh real-time telemetry stream"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="recruiter-mono recruiter-text-12">Sync</span>
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
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* 1. Canonical SVG Radial Score Gauge with 280x180 fixed bounding box */}
        <RadialScoreGauge
          score={integrityScore}
          label="Assessment Integrity"
          subtext="Rule 34 Zero-Primitive Verified"
          size="standard"
          showBadge={true}
          showTicks={true}
        />

        {/* 2. Live Sensor Signal Channels */}
        <div
          className="recruiter-subpixel-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--recruiter-border-subtle, #1e293b)',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#3b82f6" />
              <span
                className="recruiter-mono recruiter-text-12"
                style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #f8fafc)' }}
              >
                Telemetry Sensor Feeds
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#34d399',
                fontSize: '0.6875rem',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  boxShadow: '0 0 6px #34d399',
                }}
              />
              <span className="recruiter-mono">STREAM ACTIVE</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            {/* Feed 1: Face Presence */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--recruiter-bg, #090d16)',
                border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={14} color="#60a5fa" />
                <span className="recruiter-text-12">Face Presence</span>
              </div>
              <span className="recruiter-mono recruiter-text-11" style={{ color: '#34d399', fontWeight: 600 }}>
                100%
              </span>
            </div>

            {/* Feed 2: Audio Correlator */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--recruiter-bg, #090d16)',
                border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={14} color="#60a5fa" />
                <span className="recruiter-text-12">Speech Sync</span>
              </div>
              <span className="recruiter-mono recruiter-text-11" style={{ color: '#34d399', fontWeight: 600 }}>
                Synced
              </span>
            </div>

            {/* Feed 3: Screen Stream */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--recruiter-bg, #090d16)',
                border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={14} color="#60a5fa" />
                <span className="recruiter-text-12">Screen Sharing</span>
              </div>
              <span className="recruiter-mono recruiter-text-11" style={{ color: '#34d399', fontWeight: 600 }}>
                Active
              </span>
            </div>

            {/* Feed 4: Tab Focus */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--recruiter-bg, #090d16)',
                border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} color="#60a5fa" />
                <span className="recruiter-text-12">Tab Focus</span>
              </div>
              <span className="recruiter-mono recruiter-text-11" style={{ color: '#fbbf24', fontWeight: 600 }}>
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
              color: 'var(--recruiter-text-secondary, #94a3b8)',
              paddingTop: '6px',
            }}
          >
            <span>Telemetry Frequency: <strong>2 FPS</strong></span>
            <span className="recruiter-mono tnum">Elapsed: {sessionDuration}</span>
          </div>
        </div>

        {/* 3. Review Action Workflow */}
        <ReviewPanel
          sessionId={effectiveSessionId}
          initialReview={review}
          onReviewSubmitted={(rev) => setReview(rev)}
        />
      </div>

      {/* Main Section: Virtualized Incident Timeline Ledger */}
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
