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

// Severity Indicator Dot Colors (frontend-audit clean minimal design)
export function getSeverityDotColor(severity: EventSeverity): string {
  const norm = severity === 'warning' ? 'medium' : severity;
  switch (norm) {
    case 'critical':
      return '#ef4444'; // Clean red dot
    case 'high':
      return '#f97316'; // Clean orange dot
    case 'medium':
      return '#f59e0b'; // Clean amber dot
    case 'low':
      return '#64748b'; // Clean slate dot
    case 'info':
    default:
      return '#94a3b8'; // Neutral slate dot
  }
}

// Severity Badge Configuration (Kept for backwards compatibility)
export function getSeverityStyle(severity: EventSeverity) {
  const norm = severity === 'warning' ? 'medium' : severity;
  switch (norm) {
    case 'critical':
      return {
        label: 'CRITICAL',
        color: '#b91c1c',
        bg: '#fef2f2',
        border: '#fecaca',
      };
    case 'high':
      return {
        label: 'HIGH',
        color: '#c2410c',
        bg: '#fff7ed',
        border: '#ffedd5',
      };
    case 'medium':
      return {
        label: 'MEDIUM',
        color: '#b45309',
        bg: '#fffbeb',
        border: '#fde68a',
      };
    case 'low':
      return {
        label: 'LOW',
        color: '#1d4ed8',
        bg: '#eff6ff',
        border: '#bfdbfe',
      };
    case 'info':
    default:
      return {
        label: 'INFO',
        color: '#475569',
        bg: '#f8fafc',
        border: '#e2e8f0',
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
  const ITEM_HEIGHT = 68; // 68px 2-line row height guarantees zero clipping across all viewport widths
  const OVERSCAN = 6;

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // 1. Severity filter
      if (filterSeverity !== 'all' && ev.severity !== filterSeverity) {
        return false;
      }
      // 2. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (ev.title || '').toLowerCase().includes(q);
        const matchesType = ev.eventType.toLowerCase().includes(q);
        const matchesDetector = (ev.detectorId || '').toLowerCase().includes(q);
        const matchesDetail = (ev.detail || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesType && !matchesDetector && !matchesDetail) {
          return false;
        }
      }
      return true;
    });
  }, [events, filterSeverity, searchQuery]);

  // Derived visible items
  const totalCount = filteredEvents.length;
  const totalHeight = totalCount * ITEM_HEIGHT;
  const isVirtualized = totalCount >= virtualizeThreshold;

  const startIndex = isVirtualized ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN) : 0;
  const endIndex = isVirtualized
    ? Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN)
    : totalCount;

  const visibleEvents = isVirtualized ? filteredEvents.slice(startIndex, endIndex) : filteredEvents;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight || 480);
    }
  }, [maxHeight]);

  const toggleExpand = (id: string, ev: IncidentEvent) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
    if (onSelectEvent) {
      onSelectEvent(ev);
    }
  };

  const formatTimestamp = (ev: IncidentEvent) => {
    if (ev.time) return ev.time;
    if (ev.clientTimestamp) {
      try {
        const d = new Date(ev.clientTimestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch {
        return ev.clientTimestamp;
      }
    }
    return '--:--:--';
  };

  return (
    <div
      className={`recruiter-card ${className}`}
      style={{
        padding: '0',
        overflow: 'hidden',
        border: 'none',
        borderRadius: '0',
        backgroundColor: '#ffffff',
        ...style,
      }}
    >
      {/* Top Header & Filter Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="#0f172a" />
            <span
              className="recruiter-text-13"
              style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #0f172a)' }}
            >
              Incident Timeline
            </span>
          </div>
          <span
            className="recruiter-mono tnum recruiter-text-11"
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: 'var(--recruiter-text-secondary, #475569)',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
            }}
          >
            {filteredEvents.length} events
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Input */}
          {showSearch && (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search signals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="recruiter-text-12"
                style={{
                  padding: '5px 10px 5px 30px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  color: 'var(--recruiter-text-primary, #0f172a)',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Severity Filter Dropdown - Anti-Pattern #4 Fix */}
          {showFilters && (
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="recruiter-text-11"
              aria-label="Filter severity"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: 'var(--recruiter-text-secondary, #475569)',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                height: '28px',
              }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
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
            <ShieldCheck size={40} color="#16a34a" style={{ opacity: 0.9 }} />
            <div>
              <p
                className="recruiter-text-14"
                style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #0f172a)' }}
              >
                No Anomaly Events Detected
              </p>
              <p
                className="recruiter-text-12"
                style={{ color: 'var(--recruiter-text-secondary, #64748b)', marginTop: '4px' }}
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
                    {/* Compact 2-line layout that NEVER clips in sidebars */}
                    <div
                      onClick={() => toggleExpand(ev.id, ev)}
                      className={`recruiter-timeline-row ${isSelected || isExpanded ? 'active' : ''}`}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        userSelect: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {/* Line 1: Chevron + Dot + Timestamp + Title + Score Delta */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <span style={{ color: 'var(--recruiter-text-muted, #64748b)', flexShrink: 0 }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          {/* Small clean severity dot to the side (Anti-Pattern #1 & #2 clean fix) */}
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: getSeverityDotColor(ev.severity),
                              flexShrink: 0,
                            }}
                            title={`Severity: ${ev.severity}`}
                          />
                          <span
                            className="tnum recruiter-mono recruiter-text-11"
                            style={{ color: '#64748b', fontWeight: 500, flexShrink: 0 }}
                          >
                            {formatTimestamp(ev)}
                          </span>
                          <span
                            className="recruiter-text-13"
                            style={{
                              fontWeight: 500,
                              color: 'var(--recruiter-text-primary, #0f172a)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getFriendlyEventTitle(ev.eventType, ev.title)}
                          </span>
                        </div>

                        {/* Score Delta Pill (Neutral, high-contrast, zero neon colors) */}
                        {hasDelta ? (
                          <div
                            className="tnum recruiter-mono recruiter-text-11"
                            title={`Score changed from ${ev.scoreBefore} to ${ev.scoreAfter}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              flexShrink: 0,
                              backgroundColor: '#f8fafc',
                              color: scoreDelta < 0 ? '#b91c1c' : '#15803d',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                          </div>
                        ) : null}
                      </div>

                      {/* Line 2: Details & Evidence (Clean, NO colored pastel badge pills) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          {ev.detail && (
                            <span
                              className="recruiter-text-11"
                              style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {ev.detail}
                            </span>
                          )}
                          {ev.sequenceNumber !== undefined && (
                            <span
                              className="recruiter-mono recruiter-text-11"
                              style={{ color: '#94a3b8', flexShrink: 0 }}
                            >
                              · seq #{ev.sequenceNumber}
                            </span>
                          )}
                        </div>

                        {/* Evidence button (Clean monochrome style, zero glowing blue) */}
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
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              fontWeight: 500,
                              cursor: 'pointer',
                              fontSize: '0.6875rem',
                              flexShrink: 0,
                            }}
                          >
                            <Eye size={11} /> Frame
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Drawer Row */}
                    {isExpanded && (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          borderTop: '1px solid #e2e8f0',
                          borderBottom: '1px solid #e2e8f0',
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
                                color: 'var(--recruiter-text-secondary, #475569)',
                                fontWeight: 600,
                              }}
                            >
                              Structured Telemetry Payload
                            </span>
                            {ev.detectorId && (
                              <span
                                className="recruiter-mono recruiter-text-11"
                                style={{ color: '#2563eb', fontWeight: 600 }}
                              >
                                Detector: {ev.detectorId}
                              </span>
                            )}
                          </div>

                          <pre
                            className="recruiter-mono tnum recruiter-text-11"
                            style={{
                              backgroundColor: '#ffffff',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              color: '#0f172a',
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
