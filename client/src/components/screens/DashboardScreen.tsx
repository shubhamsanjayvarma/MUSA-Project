import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  KeyRound,
  MoreVertical,
  Video,
  FileText,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import { appStore, StoredInterview } from '../../services/store.js';
import '../../styles/interview-shield.css';

interface DashboardScreenProps {
  onNewInterviewClick: () => void;
  onJoinCodeClick: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNewInterviewClick,
  onJoinCodeClick,
}) => {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [interviews, setInterviews] = useState<StoredInterview[]>([]);
  const [profile, setProfile] = useState({ name: 'Rahul Sharma' });

  useEffect(() => {
    setInterviews(appStore.getInterviews());
    setProfile(appStore.getProfile());
  }, []);

  const handleCopyLink = (interview: StoredInterview) => {
    const link = `${window.location.origin}/join?code=${interview.joinCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(interview.id);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  const handleStartRecruiterCall = (interview: StoredInterview) => {
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/interview/recruiter?code=${interview.joinCode}`);
  };

  const handleJoinAsCandidate = (interview: StoredInterview) => {
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/join?code=${interview.joinCode}`);
  };

  const handleViewReport = (interview: StoredInterview) => {
    appStore.setActiveSession(interview);
    setActiveMenuId(null);
    navigate(`/report?code=${interview.joinCode}`);
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
            Good morning, {profile.name.split(' ')[0]} 👋
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
            onClick={onNewInterviewClick}
            className="is-btn is-btn-primary"
            id="btn-new-interview"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Interview</span>
          </button>

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
        <div className="is-table-container">
          <table className="is-table">
            <tbody>
              {interviews.map((item) => (
                <tr key={item.id} style={{ height: '68px' }}>
                  {/* Candidate Name & Avatar Dot */}
                  <td style={{ width: '28%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: item.avatarColor || '#3b82f6',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>
                        {item.candidateName}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ width: '28%', color: 'var(--is-text-secondary)', fontSize: '0.875rem' }}>
                    {item.role}
                  </td>

                  {/* Date & Time */}
                  <td style={{ width: '24%', color: 'var(--is-text-secondary)', fontSize: '0.875rem' }}>
                    {item.dateTime}
                  </td>

                  {/* Status Pill */}
                  <td style={{ width: '12%' }}>
                    <span
                      className={`is-pill ${
                        item.status === 'Upcoming' ? 'is-pill-upcoming' : 'is-pill-scheduled'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Action Menu (...) */}
                  <td style={{ width: '8%', textAlign: 'right', position: 'relative' }}>
                    <button
                      className="is-icon-btn"
                      style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      title="More actions"
                      aria-label="More actions"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === item.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '40px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--is-border)',
                          borderRadius: '8px',
                          boxShadow: 'var(--is-shadow-lg)',
                          padding: '6px',
                          width: '190px',
                          zIndex: 20,
                          textAlign: 'left',
                        }}
                      >
                        <button
                          onClick={() => handleStartRecruiterCall(item)}
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
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Video size={14} color="var(--is-primary)" />
                          <span>Start Recruiter Call</span>
                        </button>

                        <button
                          onClick={() => handleJoinAsCandidate(item)}
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
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <UserCheck size={14} color="#16a34a" />
                          <span>Join as Candidate</span>
                        </button>

                        <button
                          onClick={() => handleViewReport(item)}
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
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <FileText size={14} color="#64748b" />
                          <span>View Report</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(item)}
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
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--is-surface-muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {copiedId === item.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#64748b" />}
                          <span>{copiedId === item.id ? 'Copied Link' : 'Copy Join Link'}</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
