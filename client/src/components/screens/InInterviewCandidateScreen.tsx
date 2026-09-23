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
import '../../styles/interview-shield.css';

export const InInterviewCandidateScreen: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeSession = appStore.getActiveSession();

  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(754); // starts around 00:12:34 for fidelity
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

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

  // Setup local webcam from mediaManager or getUserMedia
  useEffect(() => {
    let localStream = mediaManager.getCameraStream();

    const attachStream = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    if (localStream) {
      attachStream(localStream);
    } else {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          mediaManager.setCameraStream(stream);
          attachStream(stream);
        })
        .catch(() => {
          // Fallback to photo if media denied
        });
    }

    return () => {
      // Don't kill tracks prematurely
    };
  }, []);

  // Functional Mic Toggle
  const toggleMic = () => {
    const stream = mediaManager.getCameraStream();
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !micActive;
      });
    }
    setMicActive(!micActive);
  };

  // Functional Video Toggle
  const toggleVideo = () => {
    const stream = mediaManager.getCameraStream();
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !videoActive;
      });
    }
    setVideoActive(!videoActive);
  };

  // Functional Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        if (navigator.mediaDevices?.getDisplayMedia) {
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
        // cancelled
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

  const handleConfirmEndSession = () => {
    setIsEnding(true);
    setTimeout(() => {
      mediaManager.stopAll();
      setIsEnding(false);
      navigate('/interview-ended');
    }, 600);
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
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Floating Overlay Bar */}
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
        {/* Left: Meeting Status */}
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
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            Interview with Rahul Sharma
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
            ({activeSession.role})
          </span>
        </div>

        {/* Right: Timer & Fullscreen */}
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

      {/* Main Video Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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
              gap: '12px',
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VideoOff size={36} color="#64748b" />
            </div>
            <span style={{ fontSize: '0.9375rem' }}>Camera is turned off</span>
          </div>
        )}

        {/* Fallback candidate photo if video stream isn't attaching */}
        <img
          src="/candidate_aarav.jpg"
          alt="Candidate"
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

        {/* "You" Tag Pill bottom left of candidate video */}
        <div
          style={{
            position: 'absolute',
            bottom: '96px',
            left: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f8fafc',
            zIndex: 10,
          }}
        >
          You ({activeSession.candidateName})
        </div>

        {/* Recruiter Picture-in-Picture (PiP) on bottom right */}
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
            alt="Recruiter"
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
            Rahul Sharma
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
          gap: '14px',
          zIndex: 30,
        }}
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
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
            transition: 'all 0.15s ease',
          }}
          id="btn-toggle-mic"
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
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
            transition: 'all 0.15s ease',
          }}
          id="btn-toggle-video"
          title={videoActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
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
            transition: 'all 0.15s ease',
          }}
          id="btn-toggle-screenshare"
          title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => setShowEndModal(true)}
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
            transition: 'all 0.15s ease',
          }}
          id="btn-end-call"
          title="End Interview"
        >
          <PhoneOff size={20} />
        </button>
      </footer>

      {/* Confirmation Modal for Ending Interview */}
      {showEndModal && (
        <div className="is-modal-backdrop" onClick={() => setShowEndModal(false)}>
          <div className="is-modal-card" style={{ maxWidth: '440px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                Conclude Interview?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--is-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you wish to end this interview session? Your camera and microphone streams will be immediately stopped and your evaluation submitted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="is-btn is-btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndSession}
                disabled={isEnding}
                className="is-btn is-btn-danger"
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
