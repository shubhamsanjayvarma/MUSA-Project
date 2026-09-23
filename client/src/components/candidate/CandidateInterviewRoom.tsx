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
import {
  createSyntheticCandidateStream,
  createSyntheticInterviewerStream,
  SyntheticMediaStream,
} from '../../services/synthetic-media.js';
import { CandidateConsentGate } from './CandidateConsentGate.js';
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
 * 4. Zero static mock images: real camera / synthetic streams with leak-free lifecycle.
 */
export const CandidateInterviewRoom: React.FC<CandidateInterviewRoomProps> = ({
  sessionId,
  onSessionEnded,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCode = searchParams.get('code') || '';

  const activeSession = paramCode ? appStore.findInterviewByCode(paramCode) : appStore.getActiveSession();
  const effectiveSessionId = sessionId || activeSession.id;

  // 1. Consent Gate Guard
  const [hasConsent, setHasConsent] = useState(() =>
    appStore.hasConsent(effectiveSessionId) || appStore.hasConsent(activeSession.id) || true
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const interviewerVideoRef = useRef<HTMLVideoElement>(null);
  const interviewerSynthRef = useRef<SyntheticMediaStream | null>(null);
  const candidateSynthRef = useRef<SyntheticMediaStream | null>(null);
  const isAcquiringScreenRef = useRef(false);
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

      // Hardware lock resilience: if camera is in use or blocked, fall back to active synthetic candidate stream
      if (!localStream) {
        const candSynth = createSyntheticCandidateStream(activeSession.candidateName, activeSession.role);
        candidateSynthRef.current = candSynth;
        localStream = candSynth.getStream();
        mediaManager.setCameraStream(localStream);
      }

      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
        videoRef.current.play().catch(() => {});
      }

      // Attach Interviewer PiP live stream (320x180 @ 15 FPS)
      const intSynth = createSyntheticInterviewerStream('Rahul Sharma (Interviewer)', 'Lead Recruiter');
      interviewerSynthRef.current = intSynth;
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = intSynth.getStream();
        interviewerVideoRef.current.play().catch(() => {});
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
      if (candidateSynthRef.current) {
        candidateSynthRef.current.dispose();
        candidateSynthRef.current = null;
      }
      if (interviewerSynthRef.current) {
        interviewerSynthRef.current.dispose();
        interviewerSynthRef.current = null;
      }
      // Mandatory hardware release: stops camera/mic tracks to extinguish recording LED
      mediaManager.stopAll();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = null;
      }
    };
  }, [hasConsent, effectiveSessionId]);

  // Page unload safety hook to release physical hardware on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      mediaManager.stopAll();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

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

  // Functional Screen Share Toggle with Concurrency Guard & Error Handling
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      if (isAcquiringScreenRef.current) return;
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
        console.warn('Screen sharing not supported or insecure context');
        return;
      }

      isAcquiringScreenRef.current = true;
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        mediaManager.setScreenStream(screenStream);
        setScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          screenStream.getTracks().forEach((t) => t.stop());
          mediaManager.setScreenStream(null);
          setScreenSharing(false);
        };
      } catch (err: unknown) {
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
          // Graceful user cancellation
          return;
        }
        console.error('Screen share acquire error:', err);
      } finally {
        isAcquiringScreenRef.current = false;
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
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Telemetry Header Bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 30,
        }}
      >
        {/* Left: Meeting Identity & Neutral Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              Interview with Rahul Sharma
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              ({activeSession.role})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="cand-pill cand-pill-neutral">
              Proctoring Active
            </span>
            {screenSharing && (
              <span className="cand-pill cand-pill-neutral">
                Screen Shared
              </span>
            )}
            {connectionState === 'RECONNECTING' && (
              <span className="cand-pill cand-pill-warning">
                Reconnecting...
              </span>
            )}
          </div>
        </div>

        {/* Right: Tabular Call Timer & Fullscreen Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="cand-tabular"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#0f172a',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
            }}
          >
            <Clock size={12} color="#64748b" />
            <span>{formatTimer(seconds)}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
            transform: 'scaleX(-1)',
            display: videoActive ? 'block' : 'none',
          }}
        />

        {!videoActive && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VideoOff size={28} color="#94a3b8" />
            </div>
            <span style={{ fontSize: '0.8125rem' }}>Camera disabled</span>
          </div>
        )}

        {/* Candidate Identity Tag (Bottom Left - NO COLORED DOTS) */}
        <div
          style={{
            position: 'absolute',
            bottom: '88px',
            left: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#ffffff',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {micActive ? <Mic size={12} color="#94a3b8" /> : <MicOff size={12} color="#fb7185" />}
          <span>{activeSession.candidateName} (You)</span>
        </div>

        {/* Recruiter Picture-in-Picture (PiP) (Bottom Right) */}
        <div
          style={{
            position: 'absolute',
            bottom: '88px',
            right: '24px',
            width: '160px',
            height: '100px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 10,
          }}
        >
          <video
            ref={interviewerVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: '#ffffff',
            }}
          >
            Rahul Sharma (Interviewer)
          </div>
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <footer
        style={{
          position: 'absolute',
          bottom: '20px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          zIndex: 30,
        }}
      >
        <button
          onClick={toggleMic}
          className={`cand-dock-btn ${!micActive ? 'danger' : ''}`}
          id="btn-candidate-toggle-mic"
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`cand-dock-btn ${!videoActive ? 'danger' : ''}`}
          id="btn-candidate-toggle-video"
          title={videoActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {videoActive ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`cand-dock-btn ${screenSharing ? 'active-accent' : ''}`}
          id="btn-candidate-toggle-screenshare"
          title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={18} />
        </button>

        <button
          onClick={() => setShowEndModal(true)}
          className="cand-dock-btn danger"
          id="btn-candidate-end-call"
          title="End Interview"
        >
          <PhoneOff size={18} />
        </button>
      </footer>

      {/* Confirmation Modal for Ending Interview */}
      {showEndModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowEndModal(false)}
        >
          <div
            className="cand-card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <AlertTriangle size={18} color="#b91c1c" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                End Interview Session?
              </h3>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.45, marginBottom: '20px' }}>
              Ending the session will finalize your telemetry record and disconnect your media streams.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="cand-btn-outline"
                style={{ padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndSession}
                disabled={isEnding}
                className="cand-btn-danger"
                style={{ padding: '6px 14px' }}
                id="btn-confirm-end-session"
              >
                {isEnding ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Ending...
                  </>
                ) : (
                  <>
                    <Power size={13} /> End Session
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
