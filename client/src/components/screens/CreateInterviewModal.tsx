import React, { useState } from 'react';
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
} from 'lucide-react';
import { appStore, StoredInterview } from '../../services/store.js';
import '../../styles/interview-shield.css';

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: (url: string) => void;
  onInterviewCreated?: (interview: StoredInterview) => void;
}

export const CreateInterviewModal: React.FC<CreateInterviewModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
  onInterviewCreated,
}) => {
  // Screen 2 Form State
  const [title, setTitle] = useState('Frontend Developer Interview');
  const [candidateName, setCandidateName] = useState('Aarav Mehta');
  const [candidateEmail, setCandidateEmail] = useState('aarav@gmail.com');
  const [role, setRole] = useState('Frontend Developer');
  const [date, setDate] = useState('2024-10-25');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [enableMonitoring, setEnableMonitoring] = useState(true);

  // Screen 3 Success State
  const [isCreated, setIsCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('https://interviewshield.com/j/7tH34L9p');
  const [generatedCode, setGeneratedCode] = useState('A4F7 - 9K2L');
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    // Persist via appStore
    const newInterview = appStore.createInterview({
      title,
      candidateName,
      candidateEmail,
      role,
      date,
      time,
      duration,
      enableMonitoring,
    });

    const link = `${window.location.origin}/join?code=${newInterview.joinCode}`;
    setGeneratedLink(link);
    setGeneratedCode(newInterview.joinCode);
    setIsCreated(true);

    if (onInterviewCreated) {
      onInterviewCreated(newInterview);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(`Interview Invitation: ${title}`);
    const body = encodeURIComponent(`Hello ${candidateName},\n\nYou are invited to join your remote interview for the ${role} position.\n\nJoin Link: ${generatedLink}\nInterview Code: ${generatedCode}\nDate: ${date} at ${time} (${duration} minutes)\n\nBest regards,\nInterviewShield Team`);
    window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleResetAndClose = () => {
    setIsCreated(false);
    onClose();
  };

  return (
    <div className="is-modal-backdrop" onClick={handleResetAndClose}>
      <div className="is-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Title and Close X */}
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
              {isCreated ? 'Interview Created Successfully' : 'Create New Interview'}
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--is-text-secondary)',
                marginTop: '2px',
              }}
            >
              {isCreated
                ? 'Share the link with the candidate to join the interview.'
                : 'Set up your interview and share the link with the candidate.'}
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
          {!isCreated ? (
            /* SCREEN 2: CREATE INTERVIEW FORM */
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

              {/* Toggle: Enable monitoring */}
              <div className="is-toggle-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    Enable monitoring
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)', marginTop: '2px' }}>
                    AI-powered monitoring will be enabled for this interview.
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
                <button
                  type="submit"
                  className="is-btn is-btn-primary"
                  id="btn-submit-create-interview"
                >
                  Create Interview
                </button>
              </div>
            </form>
          ) : (
            /* SCREEN 3: INTERVIEW LINK GENERATED SUCCESS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'center' }}>
              {/* Checkmark Shield Graphic */}
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
                  Share the link with the candidate to join the interview.
                </p>
                <div style={{ fontSize: '0.8125rem', color: 'var(--is-primary)', fontWeight: 600, marginTop: '4px' }}>
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
                  onClick={handleCopy}
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
                  onClick={handleInviteEmail}
                  className="is-btn is-btn-outline"
                  style={{ flex: 1 }}
                >
                  <Mail size={16} color="var(--is-primary)" />
                  <span>{emailSent ? 'Email Opened' : 'Invite via Email'}</span>
                </button>
                <button
                  onClick={() => {
                    handleResetAndClose();
                    if (onSuccessNavigate) onSuccessNavigate(`/interview/recruiter?code=${generatedCode}`);
                  }}
                  className="is-btn is-btn-outline"
                  style={{ flex: 1 }}
                >
                  <ExternalLink size={16} color="var(--is-text-secondary)" />
                  <span>View Interview Details</span>
                </button>
              </div>

              {/* Interview Details Summary Card */}
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
          )}
        </div>
      </div>
    </div>
  );
};
