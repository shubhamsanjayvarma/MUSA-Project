import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Briefcase,
  ExternalLink,
  Video,
} from 'lucide-react';
import { appStore, StoredInterview } from '../../services/store.js';
import { mediaManager } from '../../services/media-manager.js';
import '../../styles/interview-shield.css';

export type CreationMode = 'schedule' | 'instant' | 'google-calendar';

export interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: CreationMode;
  onSuccessNavigate?: (url: string) => void;
  onInterviewCreated?: (interview: StoredInterview) => void;
}

export const CreateInterviewModal: React.FC<CreateInterviewModalProps> = ({
  isOpen,
  onClose,
  mode = 'schedule',
  onSuccessNavigate,
  onInterviewCreated,
}) => {
  // Form State
  const [title, setTitle] = useState('Frontend Developer Interview');
  const [candidateName, setCandidateName] = useState('Aarav Mehta');
  const [candidateEmail, setCandidateEmail] = useState('aarav@gmail.com');
  const [role, setRole] = useState('Frontend Developer');
  const [date, setDate] = useState('2024-10-25');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [enableMonitoring, setEnableMonitoring] = useState(true);

  // Success State for Schedule / Calendar
  const [isCreated, setIsCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Pre-generate unique Instant Meeting code on open and ensure it is saved in store
  const [instantCode, setInstantCode] = useState('');
  const [instantCopied, setInstantCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCreated(false);
      setCopied(false);
      setInstantCopied(false);
      const codePart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const codePart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${codePart1}-${codePart2}`;
      setInstantCode(code);
      setGeneratedCode(code);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://interviewshield.dev';
      setGeneratedLink(`${origin}/join?code=${code}`);

      // Ensure instant meeting is immediately valid in appStore so candidate links work immediately
      if (mode === 'instant') {
        const todayStr = new Date().toISOString().split('T')[0];
        appStore.createInterview({
          title: title || 'Instant Technical Interview',
          candidateName: candidateName || 'Candidate',
          candidateEmail: candidateEmail || 'candidate@example.com',
          role,
          date: todayStr,
          time: 'Live',
          duration: '60',
          enableMonitoring: true,
        });
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://interviewshield.dev';
  const instantLink = `${origin}/join?code=${instantCode}`;

  // Mode A: Schedule Interview Submit
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = (title || 'Technical Interview').replace(/<[^>]*>/g, '').trim();
    const cleanName = (candidateName || 'Candidate').replace(/<[^>]*>/g, '').trim();
    const cleanEmail = (candidateEmail || '').replace(/[\r\n]/g, '').trim();

    const newInterview = appStore.createInterview({
      title: cleanTitle,
      candidateName: cleanName,
      candidateEmail: cleanEmail,
      role,
      date,
      time,
      duration,
      enableMonitoring,
    });

    const link = `${origin}/join?code=${newInterview.joinCode}`;
    setGeneratedLink(link);
    setGeneratedCode(newInterview.joinCode);
    setIsCreated(true);

    if (onInterviewCreated) {
      onInterviewCreated(newInterview);
    }
  };

  // Mode B: Start Instant Meeting Action
  const handleStartInstantMeeting = (e: React.FormEvent) => {
    e.preventDefault();

    // Release any lingering hardware locks before joining live room
    mediaManager.stopAll();

    const cleanTitle = (title || 'Instant Technical Interview').replace(/<[^>]*>/g, '').trim();
    const cleanName = (candidateName || 'Candidate').replace(/<[^>]*>/g, '').trim();
    const cleanEmail = (candidateEmail || '').replace(/[\r\n]/g, '').trim();
    const todayStr = new Date().toISOString().split('T')[0];

    const newInterview = appStore.createInterview({
      title: cleanTitle,
      candidateName: cleanName,
      candidateEmail: cleanEmail,
      role,
      date: todayStr,
      time: 'Live',
      duration: '60',
      enableMonitoring: true,
    });

    appStore.setActiveSession(newInterview);

    if (onInterviewCreated) {
      onInterviewCreated(newInterview);
    }

    onClose();

    if (onSuccessNavigate) {
      onSuccessNavigate(`/interview/recruiter?code=${newInterview.joinCode}&role=host`);
    }
  };

  // Mode C: Schedule in Google Calendar Submit
  const handleGoogleCalendarSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = (title || 'Technical Interview').replace(/<[^>]*>/g, '').trim();
    const cleanName = (candidateName || 'Candidate').replace(/<[^>]*>/g, '').trim();
    const cleanRole = (role || 'Frontend Developer').replace(/<[^>]*>/g, '').trim();
    const cleanEmail = (candidateEmail || '').replace(/[\r\n]/g, '').trim();

    const newInterview = appStore.createInterview({
      title: cleanTitle,
      candidateName: cleanName,
      candidateEmail: cleanEmail,
      role: cleanRole,
      date,
      time,
      duration,
      enableMonitoring,
    });

    const link = `${origin}/join?code=${newInterview.joinCode}`;
    setGeneratedLink(link);
    setGeneratedCode(newInterview.joinCode);

    if (onInterviewCreated) {
      onInterviewCreated(newInterview);
    }

    // Accurate Local-to-UTC math avoiding timezone offsets
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    const durationMin = Math.max(15, parseInt(duration, 10) || 60);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60000);

    const formatGCalDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const startUtc = !isNaN(startDateTime.getTime()) ? formatGCalDate(startDateTime) : '';
    const endUtc = !isNaN(endDateTime.getTime()) ? formatGCalDate(endDateTime) : '';

    const description = `InterviewShield Assessment for ${cleanRole}\nCandidate: ${cleanName}\n\nCandidate Join Link: ${link}\nCandidate Access Code: ${newInterview.joinCode}\n\nContinuous local telemetry proctoring active.`;

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${cleanTitle} - InterviewShield`
    )}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(
      description
    )}&location=${encodeURIComponent(link)}&add=${encodeURIComponent(cleanEmail)}`;

    // Open Google Calendar in new tab safely
    if (typeof window !== 'undefined') {
      window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    }

    setIsCreated(true);
  };

  const handleCopyLink = (textToCopy: string, setCopyState: (val: boolean) => void) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(`Interview Invitation: ${title}`);
    const body = encodeURIComponent(
      `Hello ${candidateName},\n\nYou are invited to join your remote interview for the ${role} position.\n\nJoin Link: ${generatedLink || instantLink}\nInterview Code: ${generatedCode || instantCode}\nDate: ${date} at ${time} (${duration} minutes)\n\nBest regards,\nInterviewShield Team`
    );
    window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleResetAndClose = () => {
    setIsCreated(false);
    onClose();
  };

  const getModalTitle = () => {
    if (isCreated) return 'Interview Created Successfully';
    if (mode === 'instant') return 'Start an Instant Meeting';
    if (mode === 'google-calendar') return 'Schedule in Google Calendar';
    return 'Create New Interview';
  };

  const getModalSubtitle = () => {
    if (isCreated) return 'Share the link with the candidate to join the interview.';
    if (mode === 'instant') return 'Set up your instant session, copy the candidate link, and launch.';
    if (mode === 'google-calendar') return 'Configure details and add the interview directly to Google Calendar.';
    return 'Set up your interview and share the link with the candidate.';
  };

  return (
    <div className="is-modal-backdrop" onClick={handleResetAndClose}>
      <div className="is-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--is-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--is-text-primary)',
              }}
            >
              {getModalTitle()}
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--is-text-secondary)',
                marginTop: '2px',
              }}
            >
              {getModalSubtitle()}
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="is-icon-btn"
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {isCreated ? (
            /* SUCCESS VIEW (Schedule / Google Calendar) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                  Interview Created Successfully
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', marginTop: '4px' }}>
                  {mode === 'google-calendar'
                    ? 'Google Calendar opened in a new tab. Share the link below with the candidate.'
                    : 'Share the link with the candidate to join the interview.'}
                </p>
                <div style={{ fontSize: '0.8125rem', color: 'var(--is-primary)', fontWeight: 600, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  Candidate Join Code: {generatedCode}
                </div>
              </div>

              {/* Link Box with Copy Button */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '6px',
                  borderRadius: '10px',
                  border: '1px solid var(--is-border)',
                  backgroundColor: 'var(--is-surface-muted)',
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    color: 'var(--is-text-primary)',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(generatedLink, setCopied)}
                  className="is-btn is-btn-primary"
                  style={{ padding: '8px 16px' }}
                  id="btn-copy-interview-link"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy link'}</span>
                </button>
              </div>

              {/* Secondary Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleInviteEmail}
                  className="is-btn is-btn-outline"
                  style={{ flex: 1 }}
                >
                  <Mail size={16} color="var(--is-primary)" />
                  <span>{emailSent ? 'Email Opened' : 'Invite via Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                    if (onSuccessNavigate) onSuccessNavigate(`/interview/recruiter?code=${generatedCode}`);
                  }}
                  className="is-btn is-btn-outline"
                  style={{ flex: 1 }}
                >
                  <ExternalLink size={16} color="var(--is-text-secondary)" />
                  <span>View Details</span>
                </button>
              </div>

              {/* Summary */}
              <div
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#fafbfc',
                  border: '1px solid var(--is-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--is-text-muted)', textTransform: 'uppercase' }}>
                  Interview Details
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                  <Briefcase size={16} color="#64748b" />
                  <span style={{ color: 'var(--is-text-secondary)', width: '90px' }}>Role</span>
                  <span style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>{role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                  <Calendar size={16} color="#64748b" />
                  <span style={{ color: 'var(--is-text-secondary)', width: '90px' }}>Date & Time</span>
                  <span style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    {date}, {time}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                  <Clock size={16} color="#64748b" />
                  <span style={{ color: 'var(--is-text-secondary)', width: '90px' }}>Duration</span>
                  <span style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>{duration} minutes</span>
                </div>
              </div>
            </div>
          ) : mode === 'instant' ? (
            /* MODE B: START AN INSTANT MEETING */
            <form onSubmit={handleStartInstantMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Interview Title */}
              <div className="is-form-group">
                <label className="is-label">Interview Title</label>
                <input
                  type="text"
                  className="is-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer Interview"
                  required
                />
              </div>

              {/* Candidate Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="is-form-group">
                  <label className="is-label">Candidate Name</label>
                  <input
                    type="text"
                    className="is-input"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                  />
                </div>
                <div className="is-form-group">
                  <label className="is-label">Candidate Email</label>
                  <input
                    type="email"
                    className="is-input"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="is-form-group">
                <label className="is-label">Role</label>
                <select
                  className="is-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                </select>
              </div>

              {/* Instant Meeting Sharing Box (Directly below Role) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--is-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    Candidate Access Link
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--is-primary)',
                      fontVariantNumeric: 'tabular-nums',
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Code: {instantCode}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '4px',
                    borderRadius: '8px',
                    border: '1px solid var(--is-border)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={instantLink}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      padding: '6px 10px',
                      fontSize: '0.8125rem',
                      color: 'var(--is-text-primary)',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(instantLink, setInstantCopied)}
                    className="is-btn is-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                    id="btn-copy-instant-link"
                  >
                    {instantCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{instantCopied ? 'Copied' : 'Copy link'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleInviteEmail}
                    className="is-btn is-btn-outline"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.8125rem' }}
                  >
                    <Mail size={14} color="var(--is-primary)" />
                    <span>{emailSent ? 'Email Client Opened' : 'Email Invitation to Candidate'}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions: Cancel & Direct Start Meeting */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="is-btn is-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="is-btn is-btn-primary"
                  id="btn-start-instant-meeting"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Video size={16} />
                  <span>Start meeting</span>
                </button>
              </div>
            </form>
          ) : (
            /* MODE A & MODE C: SCHEDULE MEETING / GOOGLE CALENDAR */
            <form
              onSubmit={mode === 'google-calendar' ? handleGoogleCalendarSubmit : handleScheduleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              {/* Interview Title */}
              <div className="is-form-group">
                <label className="is-label">Interview Title</label>
                <input
                  type="text"
                  className="is-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer Interview"
                  required
                />
              </div>

              {/* Candidate Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="is-form-group">
                  <label className="is-label">Candidate Name</label>
                  <input
                    type="text"
                    className="is-input"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                  />
                </div>
                <div className="is-form-group">
                  <label className="is-label">Candidate Email</label>
                  <input
                    type="email"
                    className="is-input"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="is-form-group">
                <label className="is-label">Role</label>
                <select
                  className="is-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                </select>
              </div>

              {/* Date & Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="is-form-group">
                  <label className="is-label">Date</label>
                  <input
                    type="date"
                    className="is-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="is-form-group">
                  <label className="is-label">Time</label>
                  <input
                    type="time"
                    className="is-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="is-form-group">
                <label className="is-label">Duration</label>
                <select
                  className="is-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* Toggle: Integrity telemetry monitoring (Anti-Slop Clean) */}
              <div className="is-toggle-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    Integrity telemetry monitoring
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)', marginTop: '2px' }}>
                    Continuous local signal and integrity telemetry analysis.
                  </span>
                </div>
                <label className="is-switch">
                  <input
                    type="checkbox"
                    checked={enableMonitoring}
                    onChange={(e) => setEnableMonitoring(e.target.checked)}
                  />
                  <span className="is-switch-slider" />
                </label>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="is-btn is-btn-outline"
                >
                  Cancel
                </button>

                {mode === 'google-calendar' ? (
                  <button
                    type="submit"
                    className="is-btn is-btn-primary"
                    id="btn-schedule-gcal"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Calendar size={16} />
                    <span>Save & Open Google Calendar</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="is-btn is-btn-primary"
                    id="btn-submit-create-interview"
                  >
                    Create Interview
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
