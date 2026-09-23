import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Check,
} from 'lucide-react';

export type CheckStatus = 'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED' | 'SKIPPED';

export interface SystemCheckResult {
  camera: CheckStatus;
  mic: CheckStatus;
  screen: CheckStatus;
  browser: CheckStatus;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
}

interface SystemCheckProps {
  onComplete: (result: SystemCheckResult) => void;
  candidateName?: string;
  interviewTitle?: string;
}

export const SystemCheck: React.FC<SystemCheckProps> = ({
  onComplete,
  candidateName,
  interviewTitle,
}) => {
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>('PENDING');
  const [micStatus, setMicStatus] = useState<CheckStatus>('PENDING');
  const [screenStatus, setScreenStatus] = useState<CheckStatus>('PENDING');
  const [browserStatus, setBrowserStatus] = useState<CheckStatus>('CHECKING');

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inverted Affirmative Consent: default FALSE
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check browser capabilities immediately
  useEffect(() => {
    const hasMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMedia && typeof navigator.mediaDevices.getUserMedia === 'function';
    if (hasGetUserMedia) {
      setBrowserStatus('PASSED');
    } else {
      setBrowserStatus('FAILED');
    }
  }, []);

  // Run camera & mic check ONLY after explicit affirmative consent
  const checkCameraAndMic = async () => {
    if (!consentChecked) return;
    setCameraStatus('CHECKING');
    setMicStatus('CHECKING');
    setErrorMessage(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        setCameraStatus(hasVideo ? 'PASSED' : 'FAILED');
        setMicStatus(hasAudio ? 'PASSED' : 'FAILED');
        setCameraStream(stream);
      } else {
        throw new Error('MediaDevices API not supported');
      }
    } catch (err: any) {
      console.warn('[SystemCheck] Media access error:', err);
      setCameraStatus('FAILED');
      setMicStatus('FAILED');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera/microphone permission was denied. Please allow camera and microphone access in browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera or microphone hardware found on this machine.'
          : 'Unable to access media devices: ' + (err.message || 'Unknown error')
      );
    }
  };

  // Strictly trigger hardware checks ONLY when affirmative consent is accepted
  useEffect(() => {
    if (consentChecked) {
      checkCameraAndMic();
    }
  }, [consentChecked]);

  // Screen share check (requires user interaction gesture)
  const requestScreenShare = async () => {
    setScreenStatus('CHECKING');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(display);
        setScreenStatus('PASSED');

        display.getVideoTracks()[0].onended = () => {
          setScreenStatus('FAILED');
          setScreenStream(null);
        };
      } else {
        setScreenStatus('SKIPPED');
      }
    } catch (err: any) {
      console.warn('[SystemCheck] Screen share error:', err);
      setScreenStatus('FAILED');
    }
  };

  // Fallback simulator for automated / headless environments
  const useSimulatedDevices = () => {
    setCameraStatus('PASSED');
    setMicStatus('PASSED');
    setScreenStatus('PASSED');
    setBrowserStatus('PASSED');
    setErrorMessage(null);
  };

  const isAllReady =
    (cameraStatus === 'PASSED' || cameraStatus === 'SKIPPED') &&
    (micStatus === 'PASSED' || micStatus === 'SKIPPED') &&
    browserStatus === 'PASSED';

  const handleStartSession = () => {
    if (!isAllReady || !consentChecked || isSubmitting) return;
    setIsSubmitting(true);
    onComplete({
      camera: cameraStatus,
      mic: micStatus,
      screen: screenStatus,
      browser: browserStatus,
      cameraStream,
      screenStream,
    });
  };

  return (
    <div className="system-check-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Pre-Interview System Check
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {interviewTitle ? `Session: ${interviewTitle}` : 'Verifying camera, microphone, and browser readiness'}
          </p>
        </div>
      </div>

      {candidateName && (
        <div style={{ marginBottom: 'var(--space-md)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.875rem', color: '#93c5fd' }}>
          Welcome, <span style={{ fontWeight: 600, color: '#ffffff' }}>{candidateName}</span>. Please complete this brief hardware check before proceeding.
        </div>
      )}

      {/* Check list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        {/* Camera Check */}
        <div className="check-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-secondary)' }}>
              <Camera size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>Webcam Feed</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Used for local face and presence detection</p>
            </div>
          </div>
          <div>
            {cameraStatus === 'CHECKING' && (
              <span className="indicator-pill warning">
                <Loader2 size={14} className="animate-spin" /> Checking
              </span>
            )}
            {cameraStatus === 'PASSED' && (
              <span className="indicator-pill success">
                <CheckCircle2 size={14} /> Ready
              </span>
            )}
            {cameraStatus === 'FAILED' && (
              <span className="indicator-pill danger">
                <XCircle size={14} /> Not Detected
              </span>
            )}
            {cameraStatus === 'SKIPPED' && (
              <span className="indicator-pill neutral">
                Simulated
              </span>
            )}
          </div>
        </div>

        {/* Microphone Check */}
        <div className="check-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-secondary)' }}>
              <Mic size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>Microphone Audio</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Used for local audio activity verification</p>
            </div>
          </div>
          <div>
            {micStatus === 'CHECKING' && (
              <span className="indicator-pill warning">
                <Loader2 size={14} className="animate-spin" /> Checking
              </span>
            )}
            {micStatus === 'PASSED' && (
              <span className="indicator-pill success">
                <CheckCircle2 size={14} /> Ready
              </span>
            )}
            {micStatus === 'FAILED' && (
              <span className="indicator-pill danger">
                <XCircle size={14} /> Not Detected
              </span>
            )}
            {micStatus === 'SKIPPED' && (
              <span className="indicator-pill neutral">
                Simulated
              </span>
            )}
          </div>
        </div>

        {/* Screen Share Check */}
        <div className="check-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-secondary)' }}>
              <Monitor size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>Screen Sharing</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Enables workspace integrity monitoring</p>
            </div>
          </div>
          <div>
            {screenStatus === 'PENDING' && (
              <button
                type="button"
                onClick={requestScreenShare}
                className="btn btn-outline"
                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              >
                Enable Screen
              </button>
            )}
            {screenStatus === 'CHECKING' && (
              <span className="indicator-pill warning">
                <Loader2 size={14} className="animate-spin" /> Selecting
              </span>
            )}
            {screenStatus === 'PASSED' && (
              <span className="indicator-pill success">
                <CheckCircle2 size={14} /> Active
              </span>
            )}
            {screenStatus === 'FAILED' && (
              <button
                type="button"
                onClick={requestScreenShare}
                className="indicator-pill danger"
                style={{ cursor: 'pointer' }}
              >
                <XCircle size={14} /> Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error / Bypass Notice */}
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-md)', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-high-risk)', color: '#fca5a5', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={16} color="var(--color-high-risk)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={checkCameraAndMic}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ffffff' }}
            >
              <RefreshCw size={12} /> Retry Access
            </button>
            <button
              type="button"
              onClick={useSimulatedDevices}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}
            >
              Bypass / Test Environment
            </button>
          </div>
        </div>
      )}

      {/* Informed Consent Agreement */}
      <div style={{ marginBottom: 'var(--space-md)', padding: '12px 14px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        <p style={{ margin: '0 0 10px 0', lineHeight: 1.45 }}>
          Integrity signals are analyzed locally on your device. Raw video and audio are not recorded.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            style={{ accentColor: '#0f172a' }}
          />
          <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
            I agree to assessment integrity monitoring.
          </span>
        </label>
      </div>

      {/* Start Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          disabled={!isAllReady || !consentChecked || isSubmitting}
          onClick={handleStartSession}
          className="btn btn-primary"
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            opacity: isAllReady && consentChecked && !isSubmitting ? 1 : 0.5,
            cursor: isAllReady && consentChecked && !isSubmitting ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Starting Session...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Enter Interview Room</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
