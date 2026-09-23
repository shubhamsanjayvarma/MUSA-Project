import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Activity,
} from 'lucide-react';
import { EvidenceViewer } from './EvidenceViewer.js';
import './recruiter.css';

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical' | 'warning';

export interface IncidentEvent {
  id: string;
  sequenceNumber?: number;
  eventType: string;
  detectorId?: string;
  clientTimestamp?: string;
  serverTimestamp?: string;
  time?: string;
  title?: string;
  detail?: string;
  severity: EventSeverity;
  confidence?: number;
  payload?: Record<string, unknown>;
  scoreBefore?: number | null;
  scoreAfter?: number | null;
  hasEvidence?: boolean;
  evidenceUrl?: string;
}

export interface IncidentTimelineProps {
  events: IncidentEvent[];
  onSelectEvent?: (event: IncidentEvent) => void;
  selectedEventId?: string | null;
  maxHeight?: number | string;
  virtualizeThreshold?: number; // default: 50
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Canonical Event Labels
export function getFriendlyEventTitle(eventType: string, title?: string): string {
  if (title) return title;
  switch (eventType) {
    case 'tab_hidden':
      return 'Tab Switch Away (Blur)';
    case 'tab_visible':
      return 'Tab Refocused';
    case 'multiple_faces':
      return 'Multiple Faces in Frame';
    case 'face_absent':
      return 'Candidate Face Absent';
    case 'face_returned':
      return 'Candidate Face Returned';
    case 'face_orientation_off':
      return 'Gaze / Face Turned Away';
    case 'screen_share_stopped':
      return 'Screen Sharing Terminated';
    case 'screen_share_started':
      return 'Screen Sharing Active';
    case 'av_mismatch':
      return 'Audio-Visual Motion Mismatch';
    case 'audio_silence_extended':
      return 'Extended Microphone Silence';
    case 'audio_activity_detected':
      return 'Secondary Audio Detected';
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// Severity Badge Configuration
export function getSeverityStyle(severity: EventSeverity) {
  const norm = severity === 'warning' ? 'medium' : severity;
  switch (norm) {
    case 'critical':
      return {
        label: 'CRITICAL',
        color: 'var(--risk-high-risk-fg, #fb7185)',
        bg: 'var(--risk-high-risk-bg, rgba(244, 63, 94, 0.12))',
        border: 'var(--risk-high-risk-border, rgba(244, 63, 94, 0.3))',
      };
    case 'high':
      return {
        label: 'HIGH',
        color: 'var(--risk-suspicious-fg, #fb923c)',
        bg: 'var(--risk-suspicious-bg, rgba(249, 115, 22, 0.12))',
        border: 'var(--risk-suspicious-border, rgba(249, 115, 22, 0.3))',
      };
    case 'medium':
      return {
        label: 'MEDIUM',
        color: 'var(--risk-attention-fg, #fbbf24)',
        bg: 'var(--risk-attention-bg, rgba(245, 158, 11, 0.12))',
        border: 'var(--risk-attention-border, rgba(245, 158, 11, 0.3))',
      };
    case 'low':
      return {
        label: 'LOW',
        color: '#60a5fa',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    case 'info':
    default:
      return {
        label: 'INFO',
        color: 'var(--recruiter-text-secondary, #94a3b8)',
        bg: 'rgba(148, 163, 184, 0.1)',
        border: 'rgba(148, 163, 184, 0.25)',
      };
  }
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
  maxHeight = '480px',
  virtualizeThreshold = 50,
  showFilters = true,
  showSearch = true,
  className = '',
  style,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeModalEvidence, setActiveModalEvidence] = useState<{
    imageUrl: string;
    timestamp: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  } | null>(null);

  // Virtualization state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);
  const ITEM_HEIGHT = 56; // 56px fixed row height per specification
  const OVERSCAN = 6;

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const normSev = ev.severity === 'warning' ? 'medium' : ev.severity;
      if (filterSeverity !== 'all' && normSev !== filterSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = getFriendlyEventTitle(ev.eventType, ev.title).toLowerCase();
        const detector = (ev.detectorId || '').toLowerCase();
        const payloadStr = JSON.stringify(ev.payload || {}).toLowerCase();
        return title.includes(q) || detector.includes(q) || payloadStr.includes(q);
      }
      return true;
    });
  }, [events, filterSeverity, searchQuery]);

  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight || 480);
    }
  }, []);

  const isVirtualized = filteredEvents.length > virtualizeThreshold;

  const totalHeight = filteredEvents.length * ITEM_HEIGHT;
  const startIndex = isVirtualized
    ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
    : 0;
  const endIndex = isVirtualized
    ? Math.min(filteredEvents.length - 1, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN)
    : filteredEvents.length - 1;

  const visibleEvents = isVirtualized
    ? filteredEvents.slice(startIndex, endIndex + 1)
    : filteredEvents;

  const toggleExpand = (id: string, evObj: IncidentEvent) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
    if (onSelectEvent) onSelectEvent(evObj);
  };

  const formatTimestamp = (ev: IncidentEvent) => {
    if (ev.time) return ev.time;
    if (ev.serverTimestamp) {
      const d = new Date(ev.serverTimestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return '--:--:--';
  };

  return (
    <div
      className={`recruiter-subpixel-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--recruiter-surface, #0f172a)',
        ...style,
      }}
      role="region"
      aria-label="Detection Incident Timeline"
    >
      {/* Top Header & Filter Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--recruiter-border-subtle, #1e293b)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--color-primary, #3b82f6)" />
          <span
            className="recruiter-mono recruiter-text-13"
            style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #f8fafc)' }}
          >
            Incident Telemetry Timeline
          </span>
          <span
            className="recruiter-mono tnum recruiter-text-11"
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--recruiter-text-secondary, #94a3b8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {filteredEvents.length} events
          </span>
          {isVirtualized && (
            <span
              className="recruiter-mono recruiter-text-11"
              style={{ color: '#38bdf8', opacity: 0.8 }}
              title="Virtualized for smooth 60fps rendering"
            >
              [Virtualized]
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          {showSearch && (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={14}
                color="var(--recruiter-text-muted, #64748b)"
                style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search signals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="recruiter-text-12"
                style={{
                  padding: '6px 12px 6px 30px',
                  backgroundColor: 'var(--recruiter-bg, #090d16)',
                  border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                  borderRadius: '6px',
                  color: 'var(--recruiter-text-primary, #f8fafc)',
                  width: '160px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Severity Filter Pills */}
          {showFilters && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
                const isActive = filterSeverity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFilterSeverity(sev)}
                    className="recruiter-mono recruiter-text-11"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: `1px solid ${isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: isActive ? '#60a5fa' : 'var(--recruiter-text-secondary, #94a3b8)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <ShieldCheck size={40} color="var(--risk-normal-fg, #34d399)" style={{ opacity: 0.8 }} />
            <div>
              <p
                className="recruiter-text-14"
                style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #f8fafc)' }}
              >
                No Anomaly Events Detected
              </p>
              <p
                className="recruiter-text-12"
                style={{ color: 'var(--recruiter-text-secondary, #94a3b8)', marginTop: '4px' }}
              >
                {events.length === 0
                  ? 'Candidate behavior is completely clean and aligned with policy.'
                  : 'No events match the current severity or query filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: isVirtualized ? `${totalHeight}px` : 'auto',
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                transform: isVirtualized ? `translateY(${startIndex * ITEM_HEIGHT}px)` : 'none',
                width: '100%',
              }}
            >
              {visibleEvents.map((ev, relIdx) => {
                const globalIndex = startIndex + relIdx;
                const isExpanded = expandedEventId === ev.id;
                const isSelected = selectedEventId === ev.id;
                const sevStyle = getSeverityStyle(ev.severity);

                // Delta calculation
                const scoreDelta =
                  ev.scoreBefore !== null &&
                  ev.scoreBefore !== undefined &&
                  ev.scoreAfter !== null &&
                  ev.scoreAfter !== undefined
                    ? ev.scoreAfter - ev.scoreBefore
                    : null;

                const hasDelta = scoreDelta !== null;

                return (
                  <div key={ev.id || globalIndex} style={{ width: '100%' }}>
                    {/* Row item matching DESIGN.md: 2-column grid layout */}
                    <div
                      onClick={() => toggleExpand(ev.id, ev)}
                      className={`recruiter-timeline-row ${isSelected || isExpanded ? 'active' : ''}`}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 18px',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        userSelect: 'none',
                      }}
                    >
                      {/* Left Column: Fixed 130px monospace timestamp & sequence */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '140px',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ color: 'var(--recruiter-text-muted, #64748b)' }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            className="tnum recruiter-mono recruiter-text-12"
                            style={{ color: 'var(--recruiter-text-secondary, #94a3b8)', fontWeight: 500 }}
                          >
                            {formatTimestamp(ev)}
                          </span>
                          {ev.sequenceNumber !== undefined && (
                            <span
                              className="recruiter-mono recruiter-text-11"
                              style={{ color: 'var(--recruiter-text-muted, #64748b)' }}
                            >
                              seq #{ev.sequenceNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Center Column: Signal Title & Detector ID */}
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          overflow: 'hidden',
                          padding: '0 12px',
                        }}
                      >
                        {/* Severity Badge */}
                        <span
                          className="recruiter-mono recruiter-text-11"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: sevStyle.bg,
                            color: sevStyle.color,
                            border: `1px solid ${sevStyle.border}`,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                          }}
                        >
                          {sevStyle.label}
                        </span>

                        {/* Title */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            className="recruiter-text-13"
                            style={{
                              fontWeight: 600,
                              color: 'var(--recruiter-text-primary, #f8fafc)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {getFriendlyEventTitle(ev.eventType, ev.title)}
                          </span>
                          {ev.detail && (
                            <span
                              className="recruiter-text-11"
                              style={{ color: 'var(--recruiter-text-secondary, #94a3b8)' }}
                            >
                              {ev.detail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Score Delta Pill & Evidence button */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexShrink: 0,
                        }}
                      >
                        {/* Score Delta Pill */}
                        {hasDelta ? (
                          <div
                            className="tnum recruiter-mono recruiter-text-11"
                            title={`Score changed from ${ev.scoreBefore} to ${ev.scoreAfter}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              backgroundColor:
                                scoreDelta < 0
                                  ? 'var(--risk-high-risk-bg, rgba(244, 63, 94, 0.12))'
                                  : scoreDelta > 0
                                  ? 'var(--risk-normal-bg, rgba(16, 185, 129, 0.12))'
                                  : 'rgba(255, 255, 255, 0.06)',
                              color:
                                scoreDelta < 0
                                  ? 'var(--risk-high-risk-fg, #fb7185)'
                                  : scoreDelta > 0
                                  ? 'var(--risk-normal-fg, #34d399)'
                                  : 'var(--recruiter-text-secondary, #94a3b8)',
                              border: `1px solid ${
                                scoreDelta < 0
                                  ? 'var(--risk-high-risk-border, rgba(244, 63, 94, 0.3))'
                                  : scoreDelta > 0
                                  ? 'var(--risk-normal-border, rgba(16, 185, 129, 0.3))'
                                  : 'rgba(255, 255, 255, 0.1)'
                              }`,
                            }}
                          >
                            {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                          </div>
                        ) : null}

                        {/* Confidence Indicator */}
                        {ev.confidence !== undefined && (
                          <span
                            className="tnum recruiter-mono recruiter-text-11"
                            style={{ color: 'var(--recruiter-text-muted, #64748b)' }}
                          >
                            {(ev.confidence * 100).toFixed(0)}%
                          </span>
                        )}

                        {/* Evidence Snapshot indicator */}
                        {(ev.hasEvidence || ev.evidenceUrl) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalEvidence({
                                imageUrl: ev.evidenceUrl || '/candidate_aarav.jpg',
                                timestamp: formatTimestamp(ev),
                                eventType: getFriendlyEventTitle(ev.eventType, ev.title),
                                metadata: ev.payload,
                              });
                            }}
                            className="recruiter-mono recruiter-text-11"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} /> Frame
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Drawer Row */}
                    {isExpanded && (
                      <div
                        style={{
                          backgroundColor: 'var(--recruiter-surface-elevated, #141e33)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '16px 20px',
                          display: 'grid',
                          gridTemplateColumns: ev.evidenceUrl || ev.hasEvidence ? '1fr 320px' : '1fr',
                          gap: '20px',
                        }}
                      >
                        {/* JSON Payload & Telemetry Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              className="recruiter-mono recruiter-text-11"
                              style={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--recruiter-text-secondary, #94a3b8)',
                                fontWeight: 600,
                              }}
                            >
                              Structured Telemetry Payload
                            </span>
                            {ev.detectorId && (
                              <span
                                className="recruiter-mono recruiter-text-11"
                                style={{ color: '#38bdf8' }}
                              >
                                Detector: {ev.detectorId}
                              </span>
                            )}
                          </div>

                          <pre
                            className="recruiter-mono tnum recruiter-text-11"
                            style={{
                              backgroundColor: '#050811',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '1px solid var(--recruiter-border-subtle, #1e293b)',
                              color: '#e2e8f0',
                              maxHeight: '160px',
                              overflowY: 'auto',
                              margin: 0,
                            }}
                          >
                            {JSON.stringify(
                              {
                                eventId: ev.id,
                                eventType: ev.eventType,
                                detectorId: ev.detectorId,
                                sequenceNumber: ev.sequenceNumber,
                                clientTimestamp: ev.clientTimestamp,
                                serverTimestamp: ev.serverTimestamp,
                                scoreBefore: ev.scoreBefore,
                                scoreAfter: ev.scoreAfter,
                                confidence: ev.confidence,
                                payload: ev.payload || {},
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>

                        {/* Evidence Viewer if linked */}
                        {(ev.evidenceUrl || ev.hasEvidence) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span
                              className="recruiter-mono recruiter-text-11"
                              style={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--recruiter-text-secondary, #94a3b8)',
                                fontWeight: 600,
                              }}
                            >
                              Verification Frame Snapshot
                            </span>
                            <EvidenceViewer
                              imageUrl={ev.evidenceUrl || '/candidate_aarav.jpg'}
                              timestamp={formatTimestamp(ev)}
                              eventType={getFriendlyEventTitle(ev.eventType, ev.title)}
                              detectorId={ev.detectorId}
                              defaultBlurred={true}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Evidence Lightbox */}
      {activeModalEvidence && (
        <EvidenceViewer
          imageUrl={activeModalEvidence.imageUrl}
          timestamp={activeModalEvidence.timestamp}
          eventType={activeModalEvidence.eventType}
          metadata={activeModalEvidence.metadata}
          isModal={true}
          onClose={() => setActiveModalEvidence(null)}
        />
      )}
    </div>
  );
};
