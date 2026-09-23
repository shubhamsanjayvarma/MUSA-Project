import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { appStore, StoredInterview } from '../../services/store.js';
import {
  RadialScoreGauge,
  IncidentTimeline,
  ReviewPanel,
  DownloadReportButton,
  EvidenceViewer,
  IncidentEvent,
} from '../recruiter/index.js';
import '../../styles/interview-shield.css';
import '../recruiter/recruiter.css';

export const InterviewReportScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramCode = searchParams.get('code') || '';

  const activeSession: StoredInterview = paramCode
    ? appStore.findInterviewByCode(paramCode)
    : appStore.getActiveSession();

  const [activeTab, setActiveTab] = useState<'timeline' | 'review' | 'evidence' | 'ai'>('timeline');
  const [events] = useState<IncidentEvent[]>([
    {
      id: 'e1',
      sequenceNumber: 1,
      eventType: 'tab_hidden',
      detectorId: 'tab-blur-detector',
      time: '10:05 AM',
      title: 'Tab switched away',
      detail: 'Duration: 1 min 12 sec',
      severity: 'medium',
      confidence: 0.98,
      scoreBefore: 100,
      scoreAfter: 95,
      hasEvidence: true,
      evidenceUrl: '/candidate_aarav.jpg',
      payload: { durationMs: 72000, targetWindow: 'external_browser' },
    },
    {
      id: 'e2',
      sequenceNumber: 2,
      eventType: 'multiple_faces',
      detectorId: 'vision-face-detector',
      time: '10:08 AM',
      title: 'Multiple faces detected',
      detail: '2 people identified in viewport',
      severity: 'critical',
      confidence: 0.94,
      scoreBefore: 95,
      scoreAfter: 78,
      hasEvidence: true,
      evidenceUrl: '/candidate_aarav.jpg',
      payload: { facesDetected: 2, primaryConfidence: 0.98, secondaryConfidence: 0.92 },
    },
    {
      id: 'e3',
      sequenceNumber: 3,
      eventType: 'screen_share_stopped',
      detectorId: 'screen-detector',
      time: '10:12 AM',
      title: 'Screen sharing revoked',
      detail: 'Screen stream paused',
      severity: 'critical',
      confidence: 0.99,
      scoreBefore: 78,
      scoreAfter: 72,
      payload: { reason: 'user_ended_track' },
    },
    {
      id: 'e4',
      sequenceNumber: 4,
      eventType: 'face_absent',
      detectorId: 'vision-face-detector',
      time: '10:15 AM',
      title: 'Face not detected',
      detail: 'Candidate absent for 8 sec',
      severity: 'medium',
      confidence: 0.89,
      scoreBefore: 72,
      scoreAfter: 72,
      payload: { absentDurationSec: 8 },
    },
  ]);

  const score = activeSession.integrityScore || 72;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation & Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--is-text-secondary)',
              fontSize: '0.8125rem',
              marginBottom: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--is-text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Interview Audit Report
            </h1>
            <span className="is-pill is-pill-upcoming" style={{ fontSize: '0.75rem' }}>
              Session Verified
            </span>
          </div>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--is-text-secondary)',
              marginTop: '4px',
              marginBottom: '2px',
            }}
          >
            {activeSession.role} — {activeSession.candidateName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8125rem', color: 'var(--is-text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {activeSession.dateTime || 'Today, 10:00 AM'}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> {activeSession.duration || 60} minutes
            </span>
            <span>•</span>
            <span className="recruiter-mono">Code: {activeSession.joinCode}</span>
          </div>
        </div>

        {/* Actionable Download Audit Report (PDF) Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DownloadReportButton
            sessionId={activeSession.joinCode || activeSession.id}
            candidateName={activeSession.candidateName}
            interviewTitle={activeSession.role}
            integrityScore={score}
            variant="primary"
            buttonText="Download Audit Report (PDF)"
          />
        </div>
      </div>

      {/* Top 2 Cards: SVG Radial Score Gauge (Left) & Incident Summary Metrics (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Left: SVG Radial Score Gauge with animated arc, color coding thresholds & tabular numbers */}
        <RadialScoreGauge
          score={score}
          label="Assessment Integrity"
          subtext="Rule 34 Multi-Signal Evaluated"
          size="standard"
          showBadge={true}
          showTicks={true}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Right Card: Summary Metrics & Risk Classification */}
        <div className="is-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--is-text-primary)',
                  margin: 0,
                }}
              >
                Telemetry Telemetric Ledger
              </h2>
              <span className="recruiter-mono recruiter-text-11" style={{ color: 'var(--is-text-secondary)' }}>
                4 Recorded Anomalies
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--is-border-subtle)', backgroundColor: 'var(--is-surface-muted)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--is-text-secondary)' }}>Total Signals</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--is-text-primary)', marginTop: '4px' }}>
                  {events.length}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--is-warning-border)', backgroundColor: 'var(--is-warning-bg)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--is-warning-text)' }}>Warnings</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--is-warning-text)', marginTop: '4px' }}>
                  {events.filter((e) => e.severity === 'medium' || e.severity === 'warning').length}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--is-danger-border)', backgroundColor: 'var(--is-danger-bg)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--is-danger-text)' }}>Critical</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--is-danger-text)', marginTop: '4px' }}>
                  {events.filter((e) => e.severity === 'critical' || e.severity === 'high').length}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Integrity score computed using localized offline edge signals. Baseline penalty deduction triggered primarily by secondary face presence and tab defocus at 10:08 AM.
            </p>
          </div>

          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--is-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)' }}>
              Proctoring standard: Client WebGL + WebAudio Real-time (2 FPS)
            </span>
            <button
              onClick={() => setActiveTab('review')}
              className="is-btn is-btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Go to Review &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Proctor Review Workflow Card */}
      <ReviewPanel
        sessionId={activeSession.joinCode || activeSession.id}
      />

      {/* Bottom Section: Tabs (Timeline | Evidence | AI Insights) */}
      <div className="is-card" style={{ overflow: 'hidden' }}>
        {/* Tab Headers */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--is-border)',
            backgroundColor: '#ffffff',
            padding: '0 16px',
          }}
        >
          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '14px 20px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'timeline' ? 600 : 500,
              color: activeTab === 'timeline' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'timeline' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
            id="tab-report-timeline"
          >
            Incident Timeline ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            style={{
              padding: '14px 20px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'evidence' ? 600 : 500,
              color: activeTab === 'evidence' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'evidence' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
            id="tab-report-evidence"
          >
            Evidence Snapshots (2)
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            style={{
              padding: '14px 20px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'ai' ? 600 : 500,
              color: activeTab === 'ai' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'ai' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
            id="tab-report-ai"
          >
            AI Assessment Insights
          </button>
        </div>

        {/* Tab 1: Virtualized Incident Timeline */}
        {activeTab === 'timeline' && (
          <div style={{ padding: '16px' }}>
            <IncidentTimeline
              events={events}
              maxHeight="420px"
              virtualizeThreshold={50}
              showFilters={true}
              showSearch={true}
            />
          </div>
        )}

        {/* Tab 2: Evidence Frames with 4:3 Aspect Ratio & Privacy Blur Toggle */}
        {activeTab === 'evidence' && (
          <div
            style={{
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            <EvidenceViewer
              imageUrl="/candidate_aarav.jpg"
              timestamp="10:05 AM"
              eventType="Tab Switch Away"
              detectorId="tab-blur-detector"
              metadata={{
                blurDurationSec: 72,
                windowFocusState: 'inactive',
                eventSequence: 1,
              }}
              defaultBlurred={true}
            />

            <EvidenceViewer
              imageUrl="/candidate_aarav.jpg"
              timestamp="10:08 AM"
              eventType="Multiple Faces in Frame"
              detectorId="vision-face-detector"
              metadata={{
                primaryConfidence: 0.98,
                secondaryConfidence: 0.92,
                boundingBoxesCount: 2,
                eventSequence: 2,
              }}
              defaultBlurred={true}
            />
          </div>
        )}

        {/* Tab 3: AI Insights */}
        {activeTab === 'ai' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                padding: '18px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--is-primary-light)',
                border: '1px solid var(--is-primary-border)',
              }}
            >
              <ShieldCheck size={22} color="var(--is-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--is-primary)', fontSize: '1rem' }}>
                  Multi-Signal Telemetry Analysis
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
                  The candidate maintained consistent camera presence for 92% of the assessment window. A temporary browser defocus (1m 12s) and an off-camera secondary person at 10:08 AM reduced the baseline integrity score from 95 to 72. Human review of the evidence snapshot at 10:08 AM confirmed an incidental co-worker pass-through.
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <span className="is-pill is-pill-upcoming" style={{ fontSize: '0.75rem' }}>
                    Zero Deepfake Indicators
                  </span>
                  <span className="is-pill is-pill-active" style={{ fontSize: '0.75rem' }}>
                    Lip Sync Audio Correlated
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
