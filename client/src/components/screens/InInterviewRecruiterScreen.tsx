import React, { useState, useEffect, useRef } from 'react';
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
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { appStore } from '../../services/store.js';
import { mediaManager } from '../../services/media-manager.js';
import {
  createSyntheticCandidateStream,
  createSyntheticInterviewerStream,
  SyntheticMediaStream,
} from '../../services/synthetic-media.js';
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

  // Retractable Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(754); // starts around 00:12:34 for fidelity

  // Video & Stream References
  const candidateVideoRef = useRef<HTMLVideoElement>(null);
  const recruiterVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const candidateSyntheticRef = useRef<SyntheticMediaStream | null>(null);
  const hostSyntheticRef = useRef<SyntheticMediaStream | null>(null);

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

  // Real Media Pipeline Lifecycle with Hardware Lock Resilience & Indicator Extinction
  useEffect(() => {
    let isDisposed = false;

    // A. Candidate Live Stream (SyntheticMediaStream: 640x360 @ 20 FPS, dynamic speech wave, 0 static images)
    const candSynth = createSyntheticCandidateStream(activeSession.candidateName, activeSession.role);
    candidateSyntheticRef.current = candSynth;
    const candStream = candSynth.getStream();
    if (candidateVideoRef.current) {
      candidateVideoRef.current.srcObject = candStream;
      candidateVideoRef.current.play().catch(() => {});
    }

    // B. Host Local Webcam & Mic Acquisition with Hardware Lock Fallback
    const setupHostMedia = async () => {
      let hostStream = mediaManager.getCameraStream();

      if (!hostStream && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          hostStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 360 },
            audio: true,
          });
          mediaManager.setCameraStream(hostStream);
        } catch (err) {
          console.warn('[InInterviewRecruiterScreen] Camera access note (will fallback to simulated host stream):', err);
        }
      }

      if (isDisposed) {
        if (hostStream) {
          hostStream.getTracks().forEach((t) => t.stop());
        }
        return;
      }

      if (hostStream && hostStream.active) {
        localStreamRef.current = hostStream;
        if (recruiterVideoRef.current) {
          recruiterVideoRef.current.srcObject = hostStream;
          recruiterVideoRef.current.play().catch(() => {});
        }
      } else {
        // Fallback: Animated Host Stream prevents camera lock blackouts when testing both tabs on single machine
        const hostSynth = createSyntheticInterviewerStream('Rahul Sharma', 'Recruiter (You)');
        hostSyntheticRef.current = hostSynth;
        const synthStream = hostSynth.getStream();
        localStreamRef.current = synthStream;
        if (recruiterVideoRef.current) {
          recruiterVideoRef.current.srcObject = synthStream;
          recruiterVideoRef.current.play().catch(() => {});
        }
      }
    };

    setupHostMedia();

    // C. Emergency Hardware Release on Pagehide / Beforeunload
    const handleUnloadTeardown = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      mediaManager.stopAll();
    };

    window.addEventListener('beforeunload', handleUnloadTeardown);
    window.addEventListener('pagehide', handleUnloadTeardown);

    return () => {
      isDisposed = true;
      window.removeEventListener('beforeunload', handleUnloadTeardown);
      window.removeEventListener('pagehide', handleUnloadTeardown);

      // Stop all tracks unconditionally so physical camera LED turns OFF
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (candidateSyntheticRef.current) {
        candidateSyntheticRef.current.dispose();
        candidateSyntheticRef.current = null;
      }
      if (hostSyntheticRef.current) {
        hostSyntheticRef.current.dispose();
        hostSyntheticRef.current = null;
      }
      if (candidateVideoRef.current) {
        candidateVideoRef.current.srcObject = null;
      }
      if (recruiterVideoRef.current) {
        recruiterVideoRef.current.srcObject = null;
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
    };
  }, [activeSession.candidateName, activeSession.role]);

  // Functional Mic Toggle
  const toggleMic = () => {
    const nextState = !micActive;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setMicActive(nextState);
  };

  // Functional Video Toggle
  const toggleVideo = () => {
    const nextState = !videoActive;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setVideoActive(nextState);
  };

  // Functional Screen Share Toggle with OS Bar Sync
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          screenStreamRef.current = displayStream;
          setScreenSharing(true);

          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = displayStream;
            screenVideoRef.current.play().catch(() => {});
          }

          // Handle OS bar "Stop sharing" button click
          displayStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((t) => t.stop());
              screenStreamRef.current = null;
            }
          };
        } else {
          setScreenSharing(true);
        }
      } catch {
        // User cancelled picker
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenSharing(false);
    }
  };

  // Functional End Call with Complete Hardware Teardown
  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (candidateSyntheticRef.current) {
      candidateSyntheticRef.current.dispose();
      candidateSyntheticRef.current = null;
    }
    if (hostSyntheticRef.current) {
      hostSyntheticRef.current.dispose();
      hostSyntheticRef.current = null;
    }
    mediaManager.stopAll();
    navigate(`/report?code=${activeSession.joinCode}`);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f8fafc' }}>
              {activeSession.candidateName}
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              · {activeSession.role}
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
                fontVariantNumeric: 'tabular-nums',
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
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Retractable Sidebar Toggle Button in Header */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: isSidebarOpen ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              id="btn-recruiter-toggle-sidebar-header"
              title={isSidebarOpen ? 'Collapse analysis sidebar' : 'Open analysis sidebar'}
              aria-label="Toggle analysis sidebar"
            >
              {isSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
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
            backgroundColor: '#090d16',
            overflow: 'hidden',
          }}
        >
          {/* Main Viewport: Candidate Stream OR Active Screen Share */}
          {screenSharing ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000000',
              }}
            >
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '74px',
                  left: '20px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 20,
                }}
              >
                <Monitor size={14} color="#3b82f6" />
                <span>Screen Share Active (You are presenting)</span>
              </div>
            </div>
          ) : (
            <video
              ref={candidateVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#090d16',
              }}
            />
          )}

          {/* Candidate Name Tag Pill (Google Meet Style) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 20,
            }}
          >
            <Mic size={13} color="#22c55e" />
            <span>{activeSession.candidateName}</span>
          </div>

          {/* Corner PiP: Recruiter Host Video Stream */}
          <div
            style={{
              position: 'absolute',
              bottom: '96px',
              right: '24px',
              width: '180px',
              height: '115px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: '#1e293b',
              zIndex: 20,
            }}
          >
            {videoActive ? (
              <video
                ref={recruiterVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f172a',
                  color: '#94a3b8',
                  gap: '4px',
                }}
              >
                <VideoOff size={20} />
                <span style={{ fontSize: '0.6875rem' }}>Camera off</span>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {micActive ? <Mic size={10} color="#22c55e" /> : <MicOff size={10} color="#ef4444" />}
            </div>
          </div>

          {/* Floating Expand Sidebar Button when Retracted */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                position: 'absolute',
                top: '76px',
                right: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#f8fafc',
                fontSize: '0.8125rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                zIndex: 35,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease',
              }}
              id="btn-recruiter-expand-floating"
              title="Expand analysis sidebar"
              aria-label="Expand analysis sidebar"
            >
              <PanelRightOpen size={15} color="#38bdf8" />
              <span>Show Analysis</span>
            </button>
          )}
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
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              pointerEvents: 'auto',
            }}
          >
            {/* Mic */}
            <button
              onClick={toggleMic}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: micActive ? 'rgba(255, 255, 255, 0.1)' : '#ef4444',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              id="btn-recruiter-mic"
              title="Toggle Mic"
              aria-label="Toggle Mic"
            >
              {micActive ? <Mic size={19} /> : <MicOff size={19} />}
            </button>

            {/* Video */}
            <button
              onClick={toggleVideo}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: videoActive ? 'rgba(255, 255, 255, 0.1)' : '#ef4444',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              id="btn-recruiter-video"
              title="Toggle Camera"
              aria-label="Toggle Camera"
            >
              {videoActive ? <Video size={19} /> : <VideoOff size={19} />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: screenSharing ? 'var(--is-primary)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              id="btn-recruiter-screenshare"
              title="Toggle Screen Share"
              aria-label="Toggle Screen Share"
            >
              <Monitor size={19} />
            </button>

            {/* Retractable Analysis Sidebar Toggle Button in Dock */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: isSidebarOpen ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                border: isSidebarOpen ? '1px solid rgba(59, 130, 246, 0.6)' : 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              id="btn-recruiter-toggle-sidebar-dock"
              title={isSidebarOpen ? 'Hide analysis sidebar' : 'Show analysis sidebar'}
              aria-label="Toggle analysis sidebar"
            >
              {isSidebarOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              id="btn-recruiter-end-call"
              title="End Interview & View Report"
              aria-label="End Interview"
            >
              <PhoneOff size={19} />
            </button>
          </div>
        </footer>
      </div>

      {/* Right Sidebar: Recruiter Monitoring & Events Panel (Retractable) */}
      <aside
        style={{
          width: isSidebarOpen ? '400px' : '0px',
          minWidth: isSidebarOpen ? '400px' : '0px',
          maxWidth: isSidebarOpen ? '400px' : '0px',
          backgroundColor: '#ffffff',
          borderLeft: isSidebarOpen ? '1px solid var(--is-border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          visibility: isSidebarOpen ? 'visible' : 'hidden',
        }}
        id="recruiter-analysis-sidebar"
      >
        {/* Navigation Tabs (Monitoring | Events | Chat) + Direct Collapse Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
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

          {/* Direct Sidebar Collapse Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              borderLeft: '1px solid #f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            id="btn-recruiter-collapse-sidebar"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelRightClose size={16} />
          </button>
        </div>

        {/* Tab 1: MONITORING (Screen 8) */}
        {activeTab === 'monitoring' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
            {/* Live Telemetry Sensors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--is-text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Live Telemetry Sensors
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)' }}>4 active</span>
              </div>

              <div
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--is-border)',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {/* Camera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Video size={15} color="#64748b" />
                    <span>Camera Stream</span>
                  </div>
                  <span className="is-pill is-pill-active" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Normal</span>
                </div>

                {/* Microphone */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Mic size={15} color="#64748b" />
                    <span>Microphone</span>
                  </div>
                  <span className="is-pill is-pill-active" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Normal</span>
                </div>

                {/* Screen Sharing */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Monitor size={15} color="#64748b" />
                    <span>Screen Sharing</span>
                  </div>
                  <span className="is-pill is-pill-active" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Active</span>
                </div>

                {/* Tab Activity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--is-text-primary)', fontWeight: 500 }}>
                    <Layers size={15} color="#64748b" />
                    <span>Tab Activity</span>
                  </div>
                  <span className="is-pill is-pill-active" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Normal</span>
                </div>
              </div>
            </div>

            {/* Integrity Score Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--is-text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Integrity Score
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--is-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <RadialScoreGauge
                  score={92}
                  size="compact"
                  showBadge={true}
                  showTicks={false}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--is-text-muted)',
                    textAlign: 'center',
                    marginTop: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  Proctor primacy active. Final evaluation remains under human reviewer authority.
                </p>
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
