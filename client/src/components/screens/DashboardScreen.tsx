import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  KeyRound,
  MoreVertical,
  Video,
  FileText,
  Copy,
  Check,
  Activity,
  Link2,
  Calendar,
} from 'lucide-react';
import { appStore, StoredInterview } from '../../services/store.js';
import { mediaManager } from '../../services/media-manager.js';
import '../../styles/interview-shield.css';

export type CreationMode = 'schedule' | 'instant' | 'google-calendar';

/**
 * Sanitizes candidate name and extracts 1-2 uppercase alphanumeric initials.
 * Defends against XSS injection, SVG tag breakout, and non-alphanumeric chars.
 */
export function getMonogramInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'NA';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (!clean) return 'NA';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return /^[A-Z0-9]{1,2}$/.test(initials) ? initials : 'NA';
  }
  const initials = clean.slice(0, 2).toUpperCase();
  return /^[A-Z0-9]{1,2}$/.test(initials) ? initials : 'NA';
}

interface DashboardScreenProps {
  onNewInterviewClick: (mode?: CreationMode) => void;
  onJoinCodeClick: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNewInterviewClick,
  onJoinCodeClick,
}) => {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isNewInterviewMenuOpen, setIsNewInterviewMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const newInterviewMenuRef = useRef<HTMLDivElement | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [interviews, setInterviews] = useState<StoredInterview[]>(() => appStore.getInterviews());
  const [profile, setProfile] = useState(() => appStore.getProfile());

  useEffect(() => {
    setInterviews(appStore.getInterviews());
    setProfile(appStore.getProfile());
  }, []);

  // Cleanup pending async timers on unmount to prevent React memory leaks
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Close active 3-dots popover & new interview dropdown on click outside or Escape key with collision defense
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!menuContainerRef.current?.contains(target) && !target.closest('[data-menu-trigger="true"]')) {
        setActiveMenuId(null);
      }
      if (!newInterviewMenuRef.current?.contains(target) && !target.closest('#btn-new-interview')) {
        setIsNewInterviewMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setIsNewInterviewMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = async (interview: StoredInterview) => {
    setActiveMenuId(null);
    const origin = window.location.origin;
    const safeOrigin = origin.startsWith('http://') || origin.startsWith('https://') ? origin : '';
    const encodedCode = encodeURIComponent(interview.joinCode);
    const link = `${safeOrigin || ''}/join?code=${encodedCode}`;

    let copiedSuccessfully = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(link);
        copiedSuccessfully = true;
      } catch {
        copiedSuccessfully = false;
      }
    }

    if (!copiedSuccessfully) {
      const el = document.createElement('textarea');
      el.value = link;
      el.setAttribute('readonly', 'true');
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.width = '1px';
      el.style.height = '1px';
      document.body.appendChild(el);
      try {
        el.select();
        document.execCommand('copy');
      } finally {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    }

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopiedId(interview.id);
    showToast(`Join link copied for ${interview.candidateName}`);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleStartRecruiterCall = (interview: StoredInterview) => {
    mediaManager.stopAll();
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/interview/recruiter?code=${encodeURIComponent(interview.joinCode)}&role=host`);
  };

  const handleViewReport = (interview: StoredInterview) => {
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/report?code=${encodeURIComponent(interview.joinCode)}`);
  };

  const handleOpenCommandCenter = (interview: StoredInterview) => {
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/command-center?code=${encodeURIComponent(interview.joinCode)}`);
  };


  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
      {/* Floating Action Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={15} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome Banner Header */}
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
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--is-text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
            }}
          >
            Good morning, {profile.name.split(' ')[0]}
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--is-text-secondary)',
              marginTop: '6px',
            }}
          >
            Conduct fairer interviews with confidence.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/command-center')}
            className="is-btn is-btn-outline"
            id="btn-command-center"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Activity size={16} color="#3b82f6" />
            <span>Command Center</span>
          </button>

          {/* New Interview Trigger & Google Meet 3-Option Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNewInterviewMenuOpen((prev) => !prev)}
              className="is-btn is-btn-primary"
              id="btn-new-interview"
              aria-haspopup="true"
              aria-expanded={isNewInterviewMenuOpen}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Interview</span>
            </button>

            <div
              ref={newInterviewMenuRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '260px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--is-border)',
                padding: '6px 0',
                zIndex: 100,
                display: isNewInterviewMenuOpen ? 'flex' : 'none',
                flexDirection: 'column',
              }}
              role="menu"
              id="menu-new-interview-options"
              aria-hidden={!isNewInterviewMenuOpen}
            >
              {/* Option 1: Create a meeting for later */}
              <button
                type="button"
                onClick={() => {
                  setIsNewInterviewMenuOpen(false);
                  onNewInterviewClick('schedule');
                }}
                className="is-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--is-text-primary)',
                  fontFamily: "'Inter', sans-serif",
                }}
                role="menuitem"
                id="opt-schedule-meeting"
              >
                <Link2 size={18} color="#475569" />
                <span>Create a meeting for later</span>
              </button>

              {/* Option 2: Start an instant meeting */}
              <button
                type="button"
                onClick={() => {
                  setIsNewInterviewMenuOpen(false);
                  onNewInterviewClick('instant');
                }}
                className="is-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--is-text-primary)',
                  fontFamily: "'Inter', sans-serif",
                }}
                role="menuitem"
                id="opt-instant-meeting"
              >
                <Plus size={18} color="#475569" strokeWidth={2.5} />
                <span>Start an instant meeting</span>
              </button>

              {/* Option 3: Schedule in Google Calendar */}
              <button
                type="button"
                onClick={() => {
                  setIsNewInterviewMenuOpen(false);
                  onNewInterviewClick('google-calendar');
                }}
                className="is-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--is-text-primary)',
                  fontFamily: "'Inter', sans-serif",
                }}
                role="menuitem"
                id="opt-google-calendar"
              >
                <Calendar size={18} color="#475569" />
                <span>Schedule in Google Calendar</span>
              </button>
            </div>
          </div>

          <button
            onClick={onJoinCodeClick}
            className="is-btn is-btn-outline"
            id="btn-join-code"
          >
            <KeyRound size={16} color="var(--is-primary)" />
            <span>Join with code</span>
          </button>
        </div>
      </div>

      {/* Upcoming Interviews Card */}
      <div className="is-card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--is-text-primary)',
            }}
          >
            Upcoming Interviews
          </h2>
          <Link
            to="/candidates"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--is-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View all
          </Link>
        </div>

        {/* Interviews List Table */}
        <div
          className="is-table-container"
          style={{
            overflowX: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--is-border)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <table className="is-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--is-border)',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  height: '42px',
                }}
              >
                <th style={{ padding: '0 20px', width: '32%' }}>Candidate</th>
                <th style={{ padding: '0 16px', width: '20%' }}>Role</th>
                <th style={{ padding: '0 16px', width: '20%' }}>Scheduled Time</th>
                <th style={{ padding: '0 16px', width: '12%' }}>Status</th>
                <th style={{ padding: '0 20px', width: '16%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((item) => {
                const isLive = item.dateTime.includes('Live');
                const initials = getMonogramInitials(item.candidateName);
                return (
                  <tr
                    key={item.id}
                    style={{
                      height: '70px',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Candidate Name & Monogram Avatar */}
                    <td style={{ padding: '0 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="is-table-monogram" aria-hidden="true">
                          <span>{initials}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--is-text-primary)',
                              fontSize: '0.9375rem',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {item.candidateName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                            Code: {item.joinCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '0 16px', color: 'var(--is-text-secondary)', fontSize: '0.875rem' }}>
                      {item.role}
                    </td>

                    {/* Date & Time */}
                    <td style={{ padding: '0 16px', color: 'var(--is-text-secondary)', fontSize: '0.875rem' }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.dateTime}</span>
                    </td>

                    {/* Status: Clean semantic indicator (frontend-audit anti-slop compliant) */}
                    <td style={{ padding: '0 16px' }}>
                      {isLive ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: '#22c55e',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: 600, color: '#15803d', fontSize: '0.8125rem' }}>Live Now</span>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#94a3b8',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 500 }}>Scheduled</span>
                        </div>
                      )}
                    </td>

                    {/* Direct Actions & Overflow Menu */}
                    <td style={{ padding: '0 20px', textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {/* Direct Action 1: Start Recruiter Call (Host) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRecruiterCall(item);
                          }}
                          id={`btn-row-start-call-${item.id}`}
                          className="is-row-btn-primary"
                          title={`Start host call with ${item.candidateName}`}
                          aria-label={`Start host call with ${item.candidateName}`}
                        >
                          <Video size={13} />
                          <span>Start Call</span>
                        </button>

                        {/* Direct Action 2: Quick 1-Click Copy Link */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(item);
                          }}
                          id={`btn-row-quick-copy-${item.id}`}
                          className={`is-row-btn-icon ${copiedId === item.id ? 'copied' : ''}`}
                          title={copiedId === item.id ? 'Copied link!' : `Copy candidate join link for ${item.candidateName}`}
                          aria-label={`Copy candidate join link for ${item.candidateName}`}
                        >
                          {copiedId === item.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                        </button>

                        {/* Direct Action 3: Overflow Action Menu (...) */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="is-icon-btn is-row-btn-icon"
                            data-menu-trigger="true"
                            id={`btn-menu-trigger-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === item.id ? null : item.id));
                            }}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Popover Action Menu */}
                          {activeMenuId === item.id && (
                            <div
                              ref={menuContainerRef}
                              data-menu-popover="true"
                              className="is-menu-popover"
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '36px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--is-border)',
                                borderRadius: '8px',
                                boxShadow: 'var(--is-shadow-lg)',
                                padding: '6px',
                                width: '190px',
                                zIndex: 50,
                                textAlign: 'left',
                              }}
                            >
                              <button
                                type="button"
                                id={`btn-menu-recruiter-call-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRecruiterCall(item);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  color: 'var(--is-text-primary)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Video size={14} color="var(--is-primary)" />
                                <span>Start Recruiter Call</span>
                              </button>


                              <button
                                type="button"
                                id={`btn-menu-view-report-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewReport(item);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  color: 'var(--is-text-primary)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <FileText size={14} color="#64748b" />
                                <span>View Report</span>
                              </button>

                              <button
                                type="button"
                                id={`btn-menu-command-center-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCommandCenter(item);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  color: 'var(--is-text-primary)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Activity size={14} color="#3b82f6" />
                                <span>Command Center</span>
                              </button>

                              <button
                                type="button"
                                id={`btn-menu-copy-link-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(item);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  color: 'var(--is-text-primary)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                {copiedId === item.id ? (
                                  <Check size={14} color="#16a34a" />
                                ) : (
                                  <Copy size={14} color="#64748b" />
                                )}
                                <span>{copiedId === item.id ? 'Copied Link' : 'Copy Join Link'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
