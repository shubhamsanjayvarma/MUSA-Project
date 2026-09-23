import React, { useState } from 'react';
import {
  Download,
  Sparkles,
} from 'lucide-react';
import '../../styles/interview-shield.css';

export const InterviewReportScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'ai'>('timeline');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 500);
  };

  const timelineEvents = [
    {
      time: '10:05 AM',
      title: 'Tab switched',
      detail: '1 min 12 sec',
      severity: 'warning' as const,
    },
    {
      time: '10:08 AM',
      title: 'Multiple faces detected',
      detail: '2 people seen',
      severity: 'critical' as const,
    },
    {
      time: '10:12 AM',
      title: 'Screen sharing stopped',
      severity: 'critical' as const,
    },
    {
      time: '10:15 AM',
      title: 'Face not detected',
      detail: '8 sec',
      severity: 'warning' as const,
    },
  ];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header with Title, Candidate Name, and Download PDF CTA */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--is-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Interview Report
            </h1>
          </div>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--is-text-secondary)',
              marginTop: '4px',
            }}
          >
            Frontend Developer — Aarav Mehta
          </p>
          <span style={{ fontSize: '0.8125rem', color: 'var(--is-text-muted)' }}>
            Oct 25, 2024, 10:00 AM — 60 minutes
          </span>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="is-btn is-btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          id="btn-download-pdf"
        >
          <Download size={16} />
          <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* Top 2 Cards: Integrity Score (Left) & Summary (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left Card: Integrity Score Gauge */}
        <div className="is-card" style={{ padding: '24px' }}>
          <h2
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--is-text-primary)',
              marginBottom: '20px',
            }}
          >
            Integrity Score
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Circular Gauge Graphic (72/100) */}
            <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
              <svg width="96" height="96" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#16a34a"
                  strokeWidth="9"
                  strokeDasharray="264"
                  strokeDashoffset="74" /* 72% fill */
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                  72
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--is-text-muted)', marginTop: '-2px' }}>
                  /100
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-success-text)' }}>
                Good
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', marginTop: '2px' }}>
                No critical issues
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Summary Metrics */}
        <div className="is-card" style={{ padding: '24px' }}>
          <h2
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--is-text-primary)',
              marginBottom: '16px',
            }}
          >
            Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--is-border-subtle)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--is-text-secondary)' }}>Total Events</span>
              <span style={{ fontWeight: 700, color: 'var(--is-text-primary)' }}>5</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--is-border-subtle)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--is-text-secondary)' }}>Warnings</span>
              <span style={{ fontWeight: 700, color: 'var(--is-warning-text)' }}>3</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--is-text-secondary)' }}>Critical</span>
              <span style={{ fontWeight: 700, color: 'var(--is-danger-text)' }}>2</span>
            </div>
          </div>
        </div>
      </div>

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
            Timeline
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
            Evidence
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
            AI Insights
          </button>
        </div>

        {/* Tab 1: Timeline Content */}
        {activeTab === 'timeline' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {timelineEvents.map((ev, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--is-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--is-text-muted)', width: '70px', fontWeight: 500 }}>
                    {ev.time}
                  </span>

                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: ev.severity === 'critical' ? 'var(--is-danger)' : 'var(--is-warning)',
                    }}
                  />

                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    {ev.title}
                  </span>
                </div>

                {ev.detail && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)' }}>
                    {ev.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Evidence Frames */}
        {activeTab === 'evidence' && (
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--is-border)' }}>
              <div style={{ position: 'relative', height: '140px', backgroundColor: '#0f172a' }}>
                <img src="/candidate_aarav.jpg" alt="Snapshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span className="is-pill is-pill-warning" style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  Tab switched
                </span>
              </div>
              <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--is-text-secondary)' }}>
                10:05 AM — Captured on tab blur
              </div>
            </div>

            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--is-border)' }}>
              <div style={{ position: 'relative', height: '140px', backgroundColor: '#0f172a' }}>
                <img src="/candidate_aarav.jpg" alt="Snapshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span className="is-pill is-pill-critical" style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  Multiple faces
                </span>
              </div>
              <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--is-text-secondary)' }}>
                10:08 AM — Second face detected
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Insights */}
        {activeTab === 'ai' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', borderRadius: '10px', backgroundColor: 'var(--is-primary-light)', border: '1px solid var(--is-primary-border)' }}>
              <Sparkles size={20} color="var(--is-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--is-primary)', fontSize: '0.9375rem' }}>
                  Session Analysis Summary
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  The candidate maintained consistent camera presence for 92% of the session. A temporary tab blur (1m 12s) and an off-camera secondary person at 10:08 AM reduced the baseline integrity from 95 to 72. Human review of evidence item at 10:08 AM is advised.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
