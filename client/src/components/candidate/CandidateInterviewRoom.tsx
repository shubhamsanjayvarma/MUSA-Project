import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertTriangle,
  Loader2,
  Power,
} from 'lucide-react';
import { mediaManager } from '../../services/media-manager.js';
import { appStore } from '../../services/store.js';
import { sessionApi } from '../../services/api.js';
import { WSClient, ConnectionState } from '../../services/ws-client.js';
import { EventBuffer } from '../../services/event-buffer.js';
import {
  DetectorOrchestrator,
  TabDetector,
  FaceDetector,
  ScreenShareDetector,
  AudioDetector,
  AVCorrelator,
} from '../../detectors/index.js';
import { CandidateConsentGate } from './CandidateConsentGate.js';
import { NeutralStatusPill } from './NeutralStatusPill.js';
import '../../styles/candidate.css';

interface CandidateInterviewRoomProps {
  sessionId?: string;
  onSessionEnded?: () => void;
}

/**
 * CandidateInterviewRoom
 * Flagship Candidate Live Assessment View.
 *
 * STRICT COMPLIANCE RULES:
 * 1. Enforces Inverted Affirmative Consent: Media and detectors will NOT initialize
 *    unless consent was affirmatively granted.
 * 2. ANTI-GAMING GUARANTEE: NEVER displays numerical integrity score (0-100) or deduction amounts.
 *    Only neutral proctoring indicators ('Proctoring Active', 'Audio & Video Connected', etc.)
 * 3. Full integration with mediaManager, WSClient, and DetectorOrchestrator.
 */
export const CandidateInterviewRoom: React.FC<CandidateInterviewRoomProps> = ({
  sessionId,
  onSessionEnded,
}) => {
  const navigate = useNavigate();
  const activeSession = appStore.getActiveSession();
  const effectiveSessionId = sessionId || activeSession.id;

  // 1. Consent Gate Guard
  const [hasConsent, setHasConsent] = useState(() =>
    appStore.hasConsent(effectiveSessionId) || appStore.hasConsent(activeSession.id)
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Connection & Orchestration States
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Background Services References
  const wsClientRef = useRef<WSClient | null>(null);
  const orchestratorRef = useRef<DetectorOrchestrator | null>(null);

  // Running call timer (tabular numerals)
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

  // 2. Hardware Stream & Detector Initialization
  useEffect(() => {
    if (!hasConsent) return;

    let isDisposed = false;

    const setupSession = async () => {
      // A. Attach or acquire camera stream
      let localStream = mediaManager.getCameraStream();

      if (!localStream && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true,
          });
          mediaManager.setCameraStream(localStream);
        } catch (e) {
          console.warn('[CandidateInterviewRoom] Media acquire note:', e);
        }
      }

      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
      }

      const existingScreen = mediaManager.getScreenStream();
      if (existingScreen && existingScreen.active) {
        setScreenSharing(true);
      }

      if (isDisposed) return;

      // B. WebSocket & Event Buffer Initialization
      try {
        const token = sessionApi.getCandidateToken() || activeSession.joinCode || 'candidate-token';
        const envWs = import.meta.env?.VITE_WS_URL as string;
        const wsUrl = envWs
          ? `${envWs}/ws/session/${effectiveSessionId}`
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/session/${effectiveSessionId}`;

        const wsClient = new WSClient({
          wsUrl,
          sessionId: effectiveSessionId,
          token,
          onStateChange: (state) => setConnectionState(state),
          onAck: (seq) => eventBuffer.acknowledge(seq),
          onConnect: () => eventBuffer.replayUnacknowledged(),
        });

        const eventBuffer = new EventBuffer(wsClient);
        wsClientRef.current = wsClient;

        // C. Local Telemetry Detectors & Orchestration
        let evidenceSeq = 50000;
        const orchestrator = new DetectorOrchestrator({
          intervalMs: 500, // 2 FPS local sampling
          videoElement: videoRef.current,
          onEvents: (events) => {
            eventBuffer.enqueue(events);
          },
          onEvidence: (_ev, snapshotDataUrl) => {
            if (wsClientRef.current && wsClientRef.current.isConnected) {
              wsClientRef.current.send({
                type: 'evidence:snapshot',
                sequenceNumber: evidenceSeq++,
                payload: {
                  imageDataUrl: snapshotDataUrl,
                  capturedAt: Date.now(),
                },
              } as any);
            }
          },
        });

        const tabDetector = new TabDetector();
        const faceDetector = new FaceDetector();
        const screenDetector = new ScreenShareDetector();
        const audioDetector = new AudioDetector();
        const avCorrelator = new AVCorrelator(faceDetector, audioDetector);

        orchestrator.registerDetector(tabDetector);
        orchestrator.registerDetector(faceDetector);
        orchestrator.registerDetector(screenDetector);
        orchestrator.registerDetector(audioDetector);
        orchestrator.registerDetector(avCorrelator);

        orchestratorRef.current = orchestrator;

        await orchestrator.initializeAll();

        if (!isDisposed) {
          orchestrator.start();
          wsClient.connect();
        }
      } catch (err) {
        console.warn('[CandidateInterviewRoom] Background detector init fallback:', err);
      }
    };

    setupSession();

    return () => {
      isDisposed = true;
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
        orchestratorRef.current.dispose();
        orchestratorRef.current = null;
      }
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [hasConsent, effectiveSessionId]);

  // Functional Mic Toggle
  const toggleMic = () => {
    const stream = mediaManager.getCameraStream();
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !micActive;
      });
    }
    setMicActive(!micActive);
  };

  // Functional Video Toggle
  const toggleVideo = () => {
    const stream = mediaManager.getCameraStream();
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !videoActive;
      });
    }
    setVideoActive(!videoActive);
  };

  // Functional Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          mediaManager.setScreenStream(screenStream);
          setScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
          };
        } else {
          setScreenSharing(true);
        }
      } catch {
        // user cancelled picker
      }
    } else {
      const s = mediaManager.getScreenStream();
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
      mediaManager.setScreenStream(null);
      setScreenSharing(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Safe Session Conclusion
  const handleConfirmEndSession = async () => {
    setIsEnding(true);

    try {
      // 1. Notify server if session API active
      if (effectiveSessionId && effectiveSessionId.startsWith('sess-')) {
        await sessionApi.update(effectiveSessionId, {
          ended: true,
          endReason: 'completed_by_candidate',
        }).catch(() => {});
      }

      // 2. Stop detectors & telemetry
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
        orchestratorRef.current.dispose();
        orchestratorRef.current = null;
      }

      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }

      // 3. Stop all media hardware tracks cleanly
      mediaManager.stopAll();

      if (onSessionEnded) {
        onSessionEnded();
      } else {
        navigate('/interview-ended');
      }
    } catch {
      mediaManager.stopAll();
      navigate('/interview-ended');
    } finally {
      setIsEnding(false);
    }
  };

  // If candidate hasn't consented yet, gate with Consent Screen
  if (!hasConsent) {
    return (
      <CandidateConsentGate
        onConsentAccepted={() => {
          setHasConsent(true);
        }}
      />
    );
  }

  return (
    <div
      className="cand-root"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#090d16',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Floating Telemetry Overlay Bar */}
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
          background: 'linear-gradient(180deg, rgba(9, 13, 22, 0.92) 0%, rgba(9, 13, 22, 0) 100%)',
          zIndex: 30,
        }}
      >
        {/* Left: Meeting Identity & Neutral Status Indicators (NO SCORES) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
              Interview with Rahul Sharma
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)' }}>
              ({activeSession.role})
            </span>
          </div>

          {/* Strict Anti-Gaming: Neutral Status Pills ONLY */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NeutralStatusPill type="proctoring-active" />
            {screenSharing && <NeutralStatusPill type="screen-active" />}
            {connectionState === 'RECONNECTING' && <NeutralStatusPill type="reconnecting" />}
          </div>
        </div>

        {/* Right: Tabular Call Timer & Fullscreen Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Tabular Numerals Timer */}
          <div
            className="cand-card cand-tabular"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            <Clock size={13} color="var(--cand-text-secondary)" />
            <span>{formatTimer(seconds)}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
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

      {/* Main Video Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: '#090d16',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror effect for candidate comfort
            display: videoActive ? 'block' : 'none',
          }}
        />

        {/* Turned Off Camera State */}
        {!videoActive && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--cand-text-secondary)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VideoOff size={34} color="#64748b" />
            </div>
            <span style={{ fontSize: '0.875rem' }}>Camera is currently disabled</span>
          </div>
        )}

        {/* Fallback image if video element not rendering */}
        <img
          src="/candidate_aarav.jpg"
          alt="Candidate Stream"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            display: videoActive && (!videoRef.current || !videoRef.current.srcObject) ? 'block' : 'none',
          }}
        />

        {/* Candidate Identity Pill (Bottom Left) */}
        <div
          style={{
            position: 'absolute',
            bottom: '96px',
            left: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#ffffff',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: micActive ? '#22c55e' : '#ef4444' }} />
          <span>You ({activeSession.candidateName})</span>
        </div>

        {/* Recruiter Picture-in-Picture (PiP) (Bottom Right) */}
        <div
          className="cand-card-elevated"
          style={{
            position: 'absolute',
            bottom: '96px',
            right: '24px',
            width: '180px',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#1e293b',
            zIndex: 10,
          }}
        >
          <img
            src="/recruiter.jpg"
            alt="Interviewer"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(4px)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Rahul Sharma (Lead)
          </div>
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <footer
        style={{
          position: 'absolute',
          bottom: '24px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          zIndex: 30,
        }}
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`cand-dock-btn ${!micActive ? 'danger' : ''}`}
          id="btn-candidate-toggle-mic"
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`cand-dock-btn ${!videoActive ? 'danger' : ''}`}
          id="btn-candidate-toggle-video"
          title={videoActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`cand-dock-btn ${screenSharing ? 'active-accent' : ''}`}
          id="btn-candidate-toggle-screenshare"
          title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="cand-dock-btn danger"
          id="btn-candidate-end-call"
          title="End Interview"
        >
          <PhoneOff size={20} />
        </button>
      </footer>

      {/* Confirmation Modal for Ending Interview */}
      {showEndModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowEndModal(false)}
        >
          <div
            className="cand-card-elevated"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--cand-rose-fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cand-text-primary)' }}>
                  Conclude Interview Session?
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--cand-text-muted)' }}>
                  Finalizing will close your media streams and submit your evaluation.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--cand-text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you wish to exit? Camera, microphone, and screen share feeds will cease immediately and your assessment session will be finalized for the recruiting team.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="cand-btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndSession}
                disabled={isEnding}
                className="cand-btn-danger"
                id="btn-confirm-end-session"
              >
                {isEnding ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Concluding...
                  </>
                ) : (
                  <>
                    <Power size={15} /> Yes, End Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
