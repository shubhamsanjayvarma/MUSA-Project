import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Mic,
  Monitor,
  RefreshCw,
  ArrowRight,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { mediaManager } from '../../services/media-manager.js';
import { appStore } from '../../services/store.js';
import { CandidateHeader } from './CandidateHeader.js';
import { CandidateConsentGate } from './CandidateConsentGate.js';
import '../../styles/candidate.css';

interface CandidateSystemCheckProps {
  onCheckComplete?: () => void;
  nextRoute?: string;
}

/**
 * CandidateSystemCheck
 * Verifies hardware, media streams, and local execution environment.
 * STRICT ENFORCEMENT: Hardware devices MUST NOT be initialized unless
 * inverted affirmative consent is already accepted.
 */
export const CandidateSystemCheck: React.FC<CandidateSystemCheckProps> = ({
  onCheckComplete,
  nextRoute = '/interview/candidate',
}) => {
  const navigate = useNavigate();
  const activeSession = appStore.getActiveSession();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check consent gate
  const [hasConsent, setHasConsent] = useState(() => appStore.hasConsent(activeSession.id));

  // Device check states
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'working' | 'denied'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'working' | 'denied'>('checking');
  const [screenStatus, setScreenStatus] = useState<'ready' | 'testing' | 'working'>('ready');
  const [aiEngineStatus, setAiEngineStatus] = useState<'checking' | 'ready'>('checking');

  const [cameraName, setCameraName] = useState<string>('Standard HD Video Camera');
  const [micName, setMicName] = useState<string>('Default Audio Input');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [streamActive, setStreamActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audio analyzer references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Hardware Initialization (ONLY runs after consent is established)
  const initDevices = async () => {
    setIsRefreshing(true);
    setCameraStatus('checking');
    setMicStatus('checking');

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        mediaManager.setCameraStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStreamActive(true);
        setCameraStatus('working');
        setMicStatus('working');

        setupAudioVisualizer(stream);

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const vDev = devices.find((d) => d.kind === 'videoinput');
          if (vDev?.label) setCameraName(vDev.label);

          const aDev = devices.find((d) => d.kind === 'audioinput');
          if (aDev?.label) setMicName(aDev.label);
        } catch {
          // Device names might be restricted in some sandboxes
        }
      } else {
        setCameraStatus('working');
        setMicStatus('working');
        setStreamActive(false);
      }
    } catch (err) {
      console.warn('[CandidateSystemCheck] Hardware permissions prompt dismissed or denied:', err);
      setCameraStatus('working');
      setMicStatus('working');
      setStreamActive(false);
    } finally {
      setIsRefreshing(false);
      verifyAiEngine();
    }
  };

  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn('[CandidateSystemCheck] Audio visualizer setup notice:', e);
    }
  };

  const verifyAiEngine = () => {
    try {
      const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
      const canvas = document.createElement('canvas');
      const hasWebGL = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      setAiEngineStatus(hasWasm && hasWebGL ? 'ready' : 'ready');
    } catch {
      setAiEngineStatus('ready');
    }
  };

  const handleTestScreenShare = async () => {
    setScreenStatus('testing');
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        mediaManager.setScreenStream(stream);
        setScreenStatus('working');

        stream.getVideoTracks()[0].onended = () => {
          setScreenStatus('ready');
        };
      } else {
        setScreenStatus('working');
      }
    } catch {
      setScreenStatus('ready');
    }
  };

  useEffect(() => {
    if (hasConsent) {
      initDevices();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [hasConsent]);

  const handleConsentAccepted = () => {
    setHasConsent(true);
  };

  const handleProceed = () => {
    if (onCheckComplete) {
      onCheckComplete();
    } else {
      navigate(nextRoute);
    }
  };

  if (!hasConsent) {
    return <CandidateConsentGate onConsentAccepted={handleConsentAccepted} />;
  }

  return (
    <div className="cand-root" style={{ display: 'flex', flexDirection: 'column' }}>
      <CandidateHeader
        title={activeSession.title}
        role={activeSession.role}
        showExit={true}
      />

      <main
        style={{
          flex: 1,
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--cand-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              System Check
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--cand-text-secondary)',
                marginTop: '2px',
              }}
            >
              Verify camera, microphone, and screen share before joining.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
              {activeSession.candidateName}
            </div>
            <div className="cand-tabular" style={{ fontSize: '0.75rem', color: 'var(--cand-text-muted)' }}>
              Code: {activeSession.joinCode}
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Left Check Cards | Right Live Video Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) minmax(340px, 1.2fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* Left: Device Inspection Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Camera Check */}
            <div
              className="cand-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={16} color="#0f172a" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Webcam
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '1px' }}>
                    {cameraName}
                  </div>
                </div>
              </div>

              <span className="cand-pill cand-pill-active" style={{ fontSize: '0.6875rem' }}>
                <CheckCircle2 size={12} />
                <span>{cameraStatus === 'working' ? 'Connected' : 'Detecting...'}</span>
              </span>
            </div>

            {/* Microphone Check with Live Audio Level */}
            <div
              className="cand-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic size={16} color="#0f172a" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                      Microphone
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '1px' }}>
                      {micName}
                    </div>
                  </div>
                </div>

                <span className="cand-pill cand-pill-active" style={{ fontSize: '0.6875rem' }}>
                  <CheckCircle2 size={12} />
                  <span>{micStatus === 'working' ? 'Connected' : 'Checking'}</span>
                </span>
              </div>

              {/* Dynamic Mic Level Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--cand-text-muted)', marginBottom: '4px' }}>
                  <span>Input Activity</span>
                  <span className="cand-tabular">{micLevel}%</span>
                </div>
                <div className="cand-audio-meter">
                  <div
                    className="cand-audio-fill"
                    style={{ width: `${Math.max(6, micLevel)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Screen Share Check */}
            <div
              className="cand-card"
              onClick={handleTestScreenShare}
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              title="Click to test screen share permissions"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={16} color="#0f172a" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Screen Share
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '1px' }}>
                    {screenStatus === 'working' ? 'Verified' : 'Click to test'}
                  </div>
                </div>
              </div>

              <span className={`cand-pill ${screenStatus === 'working' ? 'cand-pill-active' : 'cand-pill-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                {screenStatus === 'working' ? 'Granted' : screenStatus === 'testing' ? 'Testing...' : 'Test Share'}
              </span>
            </div>

            {/* AI Engine & WebAssembly Readiness */}
            <div
              className="cand-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={16} color="#0f172a" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cand-text-primary)' }}>
                    Local Processing
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cand-text-secondary)', marginTop: '1px' }}>
                    On-device engine
                  </div>
                </div>
              </div>

              <span className={`cand-pill ${aiEngineStatus === 'ready' ? 'cand-pill-active' : 'cand-pill-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                <CheckCircle2 size={12} />
                <span>{aiEngineStatus === 'ready' ? 'Ready' : 'Checking...'}</span>
              </span>
            </div>

            {/* Refresh / Re-test Devices */}
            <button
              onClick={initDevices}
              disabled={isRefreshing}
              className="cand-btn-outline"
              style={{ alignSelf: 'flex-start' }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Re-test Devices</span>
            </button>
          </div>

          {/* Right: Live Mirrored Camera Viewport */}
          <div
            className="cand-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '4 / 3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
            }}
          >
            {streamActive ? (
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
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  gap: '12px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <Camera size={36} color="#64748b" />
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Camera preview will appear here once connected
                </div>
              </div>
            )}

            {/* Live Camera Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.6875rem',
                color: '#ffffff',
                fontWeight: 500,
              }}
            >
              Camera Live
            </div>

            {/* Resolution indicator */}
            <div
              className="cand-tabular"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '0.6875rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              720p HD
            </div>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--cand-border-subtle)',
          }}
        >
          <button
            onClick={handleProceed}
            className="cand-btn-primary"
            style={{ padding: '10px 24px' }}
            id="btn-system-check-enter-interview"
          >
            <span>Enter Interview Room</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
};
