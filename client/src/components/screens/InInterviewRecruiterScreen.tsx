import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Maximize2,
  Minimize2,
  Clock,
  Send,
  Layers,
} from 'lucide-react';
import { appStore } from '../../services/store.js';
import { RadialScoreGauge, IncidentTimeline, IncidentEvent } from '../recruiter/index.js';
import '../../styles/interview-shield.css';

export const InInterviewRecruiterScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'events' ? 'events' : 'monitoring';
  const paramCode = searchParams.get('code') || '';

  const activeSession = paramCode ? appStore.findInterviewByCode(paramCode) : appStore.getActiveSession();

  // Tabs: 'monitoring' (Screen 8) | 'events' (Screen 9) | 'chat'
  const [activeTab, setActiveTab] = useState<'monitoring' | 'events' | 'chat'>(initialTab);

  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(754); // starts around 00:12:34 for fidelity

  // Chat message state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Local integrity monitoring initiated.', time: '10:00 AM' },
    { sender: `${activeSession.candidateName}`, text: 'Hi Rahul, I can hear and see you clearly.', time: '10:01 AM' },
  ]);
  const [newMsg, setNewMsg] = useState('');

  // Events list
  const [events] = useState<IncidentEvent[]>([
    {
      id: 'e1',
      sequenceNumber: 1,
      time: '10:05 AM',
      eventType: 'tab_hidden',
      detectorId: 'tab-blur-detector',
      title: 'Tab switched',
      detail: '1 min 12 sec',
      severity: 'medium',
      scoreBefore: 100,
      scoreAfter: 95,
      hasEvidence: true,
      evidenceUrl: '/candidate_aarav.jpg',
    },
    {
      id: 'e2',
      sequenceNumber: 2,
      time: '10:08 AM',
      eventType: 'multiple_faces',
      detectorId: 'vision-face-detector',
      title: 'Multiple faces detected',
      detail: '2 people seen',
      severity: 'critical',
      scoreBefore: 95,
      scoreAfter: 78,
      hasEvidence: true,
      evidenceUrl: '/candidate_aarav.jpg',
    },
    {
      id: 'e3',
      sequenceNumber: 3,
      time: '10:12 AM',
      eventType: 'screen_share_stopped',
      detectorId: 'screen-detector',
      title: 'Screen sharing stopped',
      severity: 'critical',
      scoreBefore: 78,
      scoreAfter: 72,
    },
    {
      id: 'e4',
      sequenceNumber: 4,
      time: '10:15 AM',
      eventType: 'face_absent',
      detectorId: 'vision-face-detector',
      title: 'Face not detected',
      detail: '8 sec',
      severity: 'medium',
      scoreBefore: 72,
      scoreAfter: 72,
    },
    {
      id: 'e5',
      sequenceNumber: 5,
      time: '10:18 AM',
      eventType: 'av_mismatch',
      detectorId: 'av-correlator',
      title: 'Audio-visual mismatch',
      severity: 'medium',
      scoreBefore: 72,
      scoreAfter: 72,
    },
  ]);

  // Running call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const userMsg = newMsg.trim();
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Rahul Sharma (You)',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewMsg('');

    // Automated simulated candidate response for evaluation
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: activeSession.candidateName,
          text: 'Understood. Proceeding with the technical problem.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#090d16',
        display: 'flex',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Left Area: Video Viewport & Controls */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#090d16',
        }}
      >
        {/* Top Video Overlay Bar */}
        <header
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(9, 13, 22, 0.85) 0%, rgba(9, 13, 22, 0) 100%)',
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f8fafc' }}>
              {activeSession.candidateName}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
              ({activeSession.role})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            >
              <Clock size={13} color="#94a3b8" />
              <span>{formatTimer(seconds)}</span>
            </div>

            <button
              onClick={toggleFullscreen}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>

        {/* Video Screen Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Main candidate stream */}
          <img
            src="/candidate_aarav.jpg"
            alt="Candidate Stream"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Corner PiP: Recruiter Video */}
          <div
            style={{
              position: 'absolute',
              bottom: '96px',
              right: '24px',
              width: '170px',
              height: '115px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: '#1e293b',
              zIndex: 10,
            }}
          >
            <img
              src="/recruiter.jpg"
              alt="Recruiter (You)"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              You (Rahul)
            </div>
          </div>
        </div>

        {/* Floating Call Controls Dock */}
        <footer
          style={{
            position: 'absolute',
            bottom: '20px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            zIndex: 30,
          }}
        >
          {/* Mic */}
          <button
            onClick={() => setMicActive(!micActive)}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: micActive ? 'rgba(30, 41, 59, 0.85)' : '#ef4444',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            id="btn-recruiter-mic"
            title="Toggle Mic"
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Video */}
          <button
            onClick={() => setVideoActive(!videoActive)}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: videoActive ? 'rgba(30, 41, 59, 0.85)' : '#ef4444',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            id="btn-recruiter-video"
            title="Toggle Camera"
          >
            {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setScreenSharing(!screenSharing)}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: screenSharing ? 'var(--is-primary)' : 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            id="btn-recruiter-screenshare"
            title="Toggle Screen Share"
          >
            <Monitor size={20} />
          </button>

          {/* End Call */}
          <button
            onClick={() => navigate(`/report?code=${activeSession.joinCode}`)}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            }}
            id="btn-recruiter-end-call"
            title="End Interview & View Report"
          >
            <PhoneOff size={20} />
          </button>
        </footer>
      </div>

      {/* Right Sidebar: Recruiter Monitoring & Events Panel */}
      <aside
        style={{
          width: '360px',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid var(--is-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        {/* Navigation Tabs (Monitoring | Events | Chat) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--is-border)',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            onClick={() => setActiveTab('monitoring')}
            style={{
              flex: 1,
              padding: '14px 8px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'monitoring' ? 600 : 500,
              color: activeTab === 'monitoring' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'monitoring' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            id="tab-monitoring"
          >
            Monitoring
          </button>

          <button
            onClick={() => setActiveTab('events')}
            style={{
              flex: 1,
              padding: '14px 8px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'events' ? 600 : 500,
              color: activeTab === 'events' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'events' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            id="tab-events"
          >
            Events ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '14px 8px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'chat' ? 600 : 500,
              color: activeTab === 'chat' ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === 'chat' ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            id="tab-chat"
          >
            Chat
          </button>
        </div>

        {/* Tab 1: MONITORING (Screen 8) */}
        {activeTab === 'monitoring' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', flex: 1, overflowY: 'auto' }}>
            {/* Live Status Section */}
            <div>
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--is-text-primary)',
                  marginBottom: '16px',
                }}
              >
                Live Status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Camera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--is-border)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Video size={16} color="var(--is-primary)" />
                    <span>Camera</span>
                  </div>
                  <span className="is-pill is-pill-active">Normal</span>
                </div>

                {/* Microphone */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--is-border)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Mic size={16} color="var(--is-primary)" />
                    <span>Microphone</span>
                  </div>
                  <span className="is-pill is-pill-active">Normal</span>
                </div>

                {/* Screen Sharing */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--is-border)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Monitor size={16} color="var(--is-primary)" />
                    <span>Screen Sharing</span>
                  </div>
                  <span className="is-pill is-pill-active">Active</span>
                </div>

                {/* Tab Activity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--is-border)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Layers size={16} color="var(--is-primary)" />
                    <span>Tab Activity</span>
                  </div>
                  <span className="is-pill is-pill-active">Normal</span>
                </div>
              </div>
            </div>

            {/* Integrity Score Section */}
            <div>
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--is-text-primary)',
                  marginBottom: '16px',
                }}
              >
                Integrity Score
              </h3>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--is-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <RadialScoreGauge
                  score={92}
                  size="compact"
                  showBadge={true}
                  showTicks={false}
                  subtext="Real-time multi-signal telemetry"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: EVENTS (Screen 9) */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            <IncidentTimeline
              events={events}
              maxHeight="calc(100vh - 120px)"
              virtualizeThreshold={50}
              showFilters={true}
              showSearch={true}
            />
          </div>
        )}

        {/* Tab 3: CHAT */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--is-text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--is-text-secondary)' }}>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: msg.sender.includes('You') ? 'var(--is-primary-light)' : 'var(--is-surface-muted)',
                      border: '1px solid var(--is-border-subtle)',
                      fontSize: '0.8125rem',
                      color: 'var(--is-text-primary)',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '12px',
                borderTop: '1px solid var(--is-border)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Send message to candidate..."
                className="is-input"
                style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
              />
              <button
                type="submit"
                className="is-btn is-btn-primary"
                style={{ padding: '8px 14px' }}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
};
