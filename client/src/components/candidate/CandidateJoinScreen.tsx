import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Shield,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
  X,
  ExternalLink,
  Check,
  Settings,
  Sliders,
  RefreshCw,
  MonitorUp,
} from 'lucide-react';
import { mediaManager } from '../../services/media-manager.js';
import { appStore } from '../../services/store.js';
import '../../styles/candidate.css';

interface CandidateJoinScreenProps {
  onJoinSuccess?: () => void;
}

type DropdownType = 'mic' | 'speaker' | 'camera' | 'effects' | 'menu' | null;
type EffectType = 'none' | 'slight_blur' | 'blur' | 'studio' | 'sepia';

/**
 * Authentic Google Meet Greenroom Pre-Join Screen
 * Directly connects to the browser's native hardware access:
 * - Real connected Bluetooth earbuds, microphones, speakers, and webcams via navigator.mediaDevices
 * - Pixel-accurate Google Meet device pills and dropdown menus matching native Meet ergonomics
 * - Real-time speech volume meter line directly integrated into the microphone menu
 * - Audible speaker test chime using Web Audio API
 * - Real-time CSS visual filters applied directly to the camera feed
 * - Zero fake mockups, zero static fallback images
 */
export const CandidateJoinScreen: React.FC<CandidateJoinScreenProps> = ({
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams<{ token?: string }>();
  const paramCode = searchParams.get('code') || routeToken || '';

  const activeSession = appStore.getActiveSession();
  const [code, setCode] = useState(paramCode || activeSession.joinCode || 'G6Y3-R4T2');
  const matchedInterview = appStore.findInterviewByCode(code.trim() || 'G6Y3-R4T2');

  const candidateName = matchedInterview.candidateName || activeSession.candidateName || 'Pratik Yadav';
  const candidateEmail = matchedInterview.candidateEmail || activeSession.candidateEmail || 'pratik.yadav2106@gmail.com';
  const interviewTitle = matchedInterview.title || activeSession.title || 'Frontend Developer Interview';
  const candidateRole = matchedInterview.role || activeSession.role || 'Frontend Developer';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hardware states
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [mediaInitializing, setMediaInitializing] = useState(true);
  const [cameraInUseWarning, setCameraInUseWarning] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [appliedEffect, setAppliedEffect] = useState<EffectType>('none');

  // Real native hardware device lists
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [micName, setMicName] = useState('Microphone');
  const [speakerName, setSpeakerName] = useState('Speakers');
  const [cameraName, setCameraName] = useState('Camera');
  const [micLevel, setMicLevel] = useState(0);

  // Sound test & dropdown states
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'video'>('audio');

  // Strict Inverted Affirmative Consent (default: FALSE)
  const [agreed, setAgreed] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simAnimRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paramCode) {
      setCode(paramCode);
    }
  }, [paramCode]);

  // Click outside to close active dropdown popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Ensure video element plays stream whenever camera and stream are active
  useEffect(() => {
    if (cameraActive && streamActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, streamActive]);

  // Resume Web Audio AudioContext on any user interaction (browser autoplay policy)
  useEffect(() => {
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Audio analyzer setup with live RMS speech volume metering
  const setupAudioAnalyzer = useCallback((stream: MediaStream) => {
    try {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const binsToSample = Math.min(dataArray.length, 32);
        for (let i = 0; i < binsToSample; i++) {
          sum += dataArray[i];
        }
        const avg = sum / binsToSample;
        // Responsive speech normalization (0 - 100%)
        const normalized = Math.min(100, Math.round((avg / 60) * 100));
        setMicLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn('[GoogleMeetGreenroom] Audio visualizer setup note:', e);
    }
  }, []);

  // Helper to persist and load verified hardware device labels
  const saveCachedDevices = (devices: MediaDeviceInfo[]) => {
    const labeled = devices.filter((d) => d.label && d.label.trim() !== '');
    if (labeled.length > 0) {
      try {
        localStorage.setItem(
          'interview_shield_cached_devices',
          JSON.stringify(
            labeled.map((d) => ({
              kind: d.kind,
              label: d.label,
              deviceId: d.deviceId,
              groupId: d.groupId,
            }))
          )
        );
      } catch {}
    }
  };

  const getCachedDevices = (): { aIn: any[]; aOut: any[]; vIn: any[] } => {
    try {
      const raw = localStorage.getItem('interview_shield_cached_devices');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            aIn: parsed.filter((d) => d.kind === 'audioinput'),
            aOut: parsed.filter((d) => d.kind === 'audiooutput'),
            vIn: parsed.filter((d) => d.kind === 'videoinput'),
          };
        }
      }
    } catch {}
    return { aIn: [], aOut: [], vIn: [] };
  };

  // Enumerate real connected hardware devices natively
  const enumerateNativeDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = devices.some((d) => d.label && d.label.trim() !== '');

      let aIn = devices.filter((d) => d.kind === 'audioinput');
      let aOut = devices.filter((d) => d.kind === 'audiooutput');
      let vIn = devices.filter((d) => d.kind === 'videoinput');

      if (hasLabels) {
        saveCachedDevices(devices);
      } else {
        // Fall back to previously cached real hardware labels if browser permissions haven't unlocked yet
        const cached = getCachedDevices();
        if (cached.aIn.length) aIn = cached.aIn as any;
        if (cached.aOut.length) aOut = cached.aOut as any;
        if (cached.vIn.length) vIn = cached.vIn as any;
      }

      // Deduplicate by deviceId or label
      const uniqueAIn = aIn.filter(
        (d, i, arr) =>
          (d.deviceId || d.label) &&
          arr.findIndex((x) => (d.deviceId && x.deviceId === d.deviceId) || (d.label && x.label === d.label)) === i
      );
      const uniqueAOut = aOut.filter(
        (d, i, arr) =>
          (d.deviceId || d.label) &&
          arr.findIndex((x) => (d.deviceId && x.deviceId === d.deviceId) || (d.label && x.label === d.label)) === i
      );
      const uniqueVIn = vIn.filter(
        (d, i, arr) =>
          (d.deviceId || d.label) &&
          arr.findIndex((x) => (d.deviceId && x.deviceId === d.deviceId) || (d.label && x.label === d.label)) === i
      );

      const finalAIn = uniqueAIn.length ? uniqueAIn : aIn;
      const finalAOut = uniqueAOut.length ? uniqueAOut : aOut;
      const finalVIn = uniqueVIn.length ? uniqueVIn : vIn;

      setAudioInputs(finalAIn);
      setAudioOutputs(finalAOut);
      setVideoInputs(finalVIn);

      // Match labels to active tracks
      if (streamRef.current) {
        const vTrack = streamRef.current.getVideoTracks()[0];
        if (vTrack?.label) {
          setCameraName(vTrack.label);
          const match = finalVIn.find((d) => d.label === vTrack.label || (d.deviceId && d.deviceId === vTrack.getSettings()?.deviceId));
          if (match?.deviceId) setSelectedCameraId(match.deviceId);
        } else if (finalVIn.length && finalVIn[0].label) {
          setCameraName(finalVIn[0].label);
          if (finalVIn[0].deviceId) setSelectedCameraId(finalVIn[0].deviceId);
        }

        const aTrack = streamRef.current.getAudioTracks()[0];
        if (aTrack?.label) {
          setMicName(aTrack.label);
          const match = finalAIn.find((d) => d.label === aTrack.label || (d.deviceId && d.deviceId === aTrack.getSettings()?.deviceId));
          if (match?.deviceId) setSelectedMicId(match.deviceId);
        } else if (finalAIn.length && finalAIn[0].label) {
          setMicName(finalAIn[0].label);
          if (finalAIn[0].deviceId) setSelectedMicId(finalAIn[0].deviceId);
        }
      } else {
        if (finalVIn.length && finalVIn[0].label) {
          setCameraName(finalVIn[0].label);
          if (finalVIn[0].deviceId) setSelectedCameraId(finalVIn[0].deviceId);
        }
        if (finalAIn.length && finalAIn[0].label) {
          setMicName(finalAIn[0].label);
          if (finalAIn[0].deviceId) setSelectedMicId(finalAIn[0].deviceId);
        }
      }

      if (finalAOut.length && finalAOut[0].label) {
        setSpeakerName(finalAOut[0].label);
        if (finalAOut[0].deviceId) setSelectedSpeakerId(finalAOut[0].deviceId);
      }
    } catch (err) {
      console.warn('[GoogleMeetGreenroom] Native device enumeration note:', err);
    }
  }, []);

  // Start / Switch native microphone
  const startMicrophone = useCallback(
    async (deviceId?: string) => {
      try {
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };
        if (deviceId && deviceId !== 'default' && deviceId.trim().length > 0) {
          audioConstraints.deviceId = { ideal: deviceId };
        }

        const newAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
        const newAudioTrack = newAudioStream.getAudioTracks()[0];
        if (!newAudioTrack) return;

        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((t) => {
            streamRef.current?.removeTrack(t);
            t.stop();
          });
          streamRef.current.addTrack(newAudioTrack);
        } else {
          streamRef.current = new MediaStream([newAudioTrack]);
        }

        newAudioTrack.enabled = true;
        mediaManager.setCameraStream(streamRef.current);

        setMicActive(true);
        setPermissionBlocked(false);
        if (newAudioTrack.label) {
          setMicName(newAudioTrack.label);
        }
        if (deviceId && deviceId !== 'default' && deviceId.trim().length > 0) {
          setSelectedMicId(deviceId);
        } else if (newAudioTrack.getSettings()?.deviceId) {
          setSelectedMicId(newAudioTrack.getSettings().deviceId!);
        }

        setupAudioAnalyzer(new MediaStream([newAudioTrack]));
        await enumerateNativeDevices();
      } catch (err: any) {
        console.warn('[GoogleMeetGreenroom] Failed to start native microphone:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
          setPermissionBlocked(true);
        }
        setMicActive(false);
      }
    },
    [enumerateNativeDevices, setupAudioAnalyzer]
  );

  // Start / Switch native camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setMediaInitializing(true);
      setCameraInUseWarning(false);
      try {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        if (deviceId && deviceId !== 'default' && deviceId.trim().length > 0) {
          videoConstraints.deviceId = { ideal: deviceId };
        } else {
          videoConstraints.facingMode = 'user';
        }

        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });
        const newVideoTrack = newVideoStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((t) => {
            streamRef.current?.removeTrack(t);
            t.stop();
          });
          streamRef.current.addTrack(newVideoTrack);
        } else {
          streamRef.current = new MediaStream([newVideoTrack]);
        }

        newVideoTrack.enabled = true;
        mediaManager.setCameraStream(streamRef.current);

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }

        if (simAnimRef.current) {
          cancelAnimationFrame(simAnimRef.current);
          simAnimRef.current = null;
        }
        setIsSimulatedStream(false);
        setStreamActive(true);
        setCameraActive(true);
        setCameraInUseWarning(false);
        setPermissionBlocked(false);
        if (newVideoTrack.label) {
          setCameraName(newVideoTrack.label);
        }
        if (deviceId && deviceId !== 'default' && deviceId.trim().length > 0) {
          setSelectedCameraId(deviceId);
        } else if (newVideoTrack.getSettings()?.deviceId) {
          setSelectedCameraId(newVideoTrack.getSettings().deviceId!);
        }

        await enumerateNativeDevices();
      } catch (err: any) {
        console.warn('[GoogleMeetGreenroom] Failed to start native camera:', err);
        if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
          setCameraInUseWarning(true);
        } else if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
          setPermissionBlocked(true);
        }
        setStreamActive(false);
        setCameraActive(false);
      } finally {
        setMediaInitializing(false);
      }
    },
    [enumerateNativeDevices]
  );

  // Initial media acquisition: request microphone first to unlock browser permission labels
  const initNativeMedia = useCallback(async () => {
    setMediaInitializing(true);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        // Enumerate immediately to read cached permissions
        await enumerateNativeDevices();

        // 1. Acquire native audio (unlocks browser device labels without camera conflict)
        try {
          await startMicrophone();
        } catch (audioErr) {
          console.warn('[GoogleMeetGreenroom] Initial audio note:', audioErr);
        }

        // 2. Acquire native camera stream
        try {
          await startCamera();
        } catch (videoErr) {
          console.warn('[GoogleMeetGreenroom] Initial camera note:', videoErr);
        }
      }
    } finally {
      setMediaInitializing(false);
    }
  }, [enumerateNativeDevices, startCamera, startMicrophone]);

  useEffect(() => {
    initNativeMedia();

    const handleDeviceChange = () => {
      enumerateNativeDevices();
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (simAnimRef.current) {
        cancelAnimationFrame(simAnimRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [initNativeMedia, enumerateNativeDevices]);

  // Fully Functional Mic Toggle
  const toggleMic = async () => {
    const activeTrack = streamRef.current?.getAudioTracks().find((t) => t.readyState === 'live');
    if (!activeTrack || !micActive) {
      if (activeTrack && !micActive) {
        activeTrack.enabled = true;
        setMicActive(true);
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } else {
        await startMicrophone(selectedMicId && selectedMicId.trim().length > 0 ? selectedMicId : undefined);
      }
    } else {
      activeTrack.enabled = false;
      setMicActive(false);
      setMicLevel(0);
    }
  };

  // Fully Functional Video Toggle
  const toggleVideo = async () => {
    const activeTrack = streamRef.current?.getVideoTracks().find((t) => t.readyState === 'live');
    if (!activeTrack || !cameraActive || !streamActive) {
      if (activeTrack && !cameraActive) {
        activeTrack.enabled = true;
        setCameraActive(true);
        setStreamActive(true);
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      } else {
        await startCamera(selectedCameraId && selectedCameraId.trim().length > 0 ? selectedCameraId : undefined);
      }
    } else {
      if (simAnimRef.current) {
        cancelAnimationFrame(simAnimRef.current);
        simAnimRef.current = null;
      }
      activeTrack.enabled = false;
      activeTrack.stop();
      streamRef.current?.removeTrack(activeTrack);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setStreamActive(false);
      setIsSimulatedStream(false);
    }
  };

  // Canvas-backed animated test stream (used if camera is locked by another app/tab like Google Meet or permissions are pending)
  const startSimulatedStream = useCallback(() => {
    try {
      if (simAnimRef.current) {
        cancelAnimationFrame(simAnimRef.current);
      }
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frameCount = 0;
      const drawFrame = () => {
        frameCount++;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(320, 180, 20, 320, 180, 220);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // User Avatar Circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(320, 140, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#60a5fa';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(candidateName.charAt(0).toUpperCase() || 'C', 320, 142);
        ctx.restore();

        // Name
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(candidateName, 320, 218);

        // Status indicator
        const pulse = Math.sin(frameCount * 0.08) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
        ctx.beginPath();
        ctx.arc(245, 252, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Test Stream Active (Camera Simulator)', 257, 256);

        simAnimRef.current = requestAnimationFrame(drawFrame);
      };

      const simStream = canvas.captureStream(30);
      const simTrack = simStream.getVideoTracks()[0];

      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((t) => {
          streamRef.current?.removeTrack(t);
          t.stop();
        });
        streamRef.current.addTrack(simTrack);
      } else {
        streamRef.current = new MediaStream([simTrack]);
      }

      mediaManager.setCameraStream(streamRef.current);
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }

      drawFrame();
      setIsSimulatedStream(true);
      setCameraActive(true);
      setStreamActive(true);
      setCameraInUseWarning(false);
      setPermissionBlocked(false);
      setCameraName('Virtual Test Video Stream');
    } catch (e) {
      console.warn('[GoogleMeetGreenroom] Simulated stream note:', e);
    }
  }, [candidateName]);

  const retryPermissions = useCallback(async () => {
    setPermissionBlocked(false);
    setCameraInUseWarning(false);
    await startMicrophone();
    await startCamera();
  }, [startMicrophone, startCamera]);

  // Switch Microphone Device
  const switchMicrophone = async (deviceId: string) => {
    setActiveDropdown(null);
    const validId = deviceId && deviceId !== 'default' && deviceId.trim().length > 0 ? deviceId : undefined;
    await startMicrophone(validId);
  };

  // Switch Camera Device
  const switchCamera = async (deviceId: string) => {
    setActiveDropdown(null);
    const validId = deviceId && deviceId !== 'default' && deviceId.trim().length > 0 ? deviceId : undefined;
    await startCamera(validId);
  };

  // Switch Speaker Device & play verification chime
  const switchSpeaker = async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    setActiveDropdown(null);
    const target = audioOutputs.find((d) => d.deviceId === deviceId);
    if (target) setSpeakerName(target.label || 'Selected Speaker');

    if (videoRef.current && 'setSinkId' in HTMLMediaElement.prototype) {
      try {
        await (videoRef.current as any).setSinkId(deviceId);
      } catch (e) {
        console.warn('[GoogleMeetGreenroom] setSinkId note:', e);
      }
    }
    await playSpeakerTestChime(deviceId);
  };

  // Speaker Test Chime (Audible Web Audio Melodic Chord C5 -> E5 -> G5)
  const playSpeakerTestChime = async (sinkId?: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (sinkId && sinkId !== 'default' && sinkId.trim() !== '' && typeof (ctx as any).setSinkId === 'function') {
        try {
          await (ctx as any).setSinkId(sinkId);
        } catch (e) {
          console.warn('[AudioTest] setSinkId note:', e);
        }
      }

      setIsPlayingTestSound(true);
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.38);
      });

      setTimeout(() => {
        setIsPlayingTestSound(false);
        ctx.close().catch(() => {});
      }, 1000);
    } catch (err) {
      console.warn('[AudioTest] Error playing chime:', err);
      setIsPlayingTestSound(false);
    }
  };

  // Screen Share "Present" Trigger (exact Google Meet ergonomics)
  const handlePresent = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaManager.setScreenStream(display);
      }
    } catch (err) {
      console.warn('[ScreenShare] Present cancelled:', err);
    }
  };

  // Real-time CSS visual effect styles
  const getFilterStyle = (): React.CSSProperties => {
    switch (appliedEffect) {
      case 'slight_blur':
        return { filter: 'blur(5px)' };
      case 'blur':
        return { filter: 'blur(12px)' };
      case 'studio':
        return { filter: 'contrast(1.15) brightness(1.1) saturate(1.1)' };
      case 'sepia':
        return { filter: 'sepia(0.3) contrast(1.1)' };
      default:
        return {};
    }
  };

  // Handle Join Action
  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!agreed) {
      setShowConsentModal(true);
      return;
    }

    const clean = code.trim();
    if (!clean) {
      setError('Please enter a valid interview access code');
      return;
    }

    setLoading(true);
    try {
      const interview = appStore.findInterviewByCode(clean);
      appStore.setActiveSession(interview);

      // Record affirmative consent in store
      appStore.setConsent(true, interview.id);

      if (onJoinSuccess) {
        onJoinSuccess();
      } else {
        navigate(`/interview/candidate?code=${encodeURIComponent(clean)}`);
      }
    } catch {
      setError('Invalid interview code. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
        color: '#202124',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Google Meet Header Bar */}
      <header
        style={{
          height: '64px',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f3f4',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a73e8',
            }}
          >
            <Shield size={24} />
          </div>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: '#3c4043',
              letterSpacing: '-0.01em',
            }}
          >
            Google Meet
          </span>
        </div>

        {/* User Profile on Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3c4043' }}>
              {candidateEmail}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#70757a', cursor: 'pointer' }}>
              Switch account
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#4a148c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            {candidateName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main 2-Column Workstation */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 48px',
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'minmax(480px, 1.45fr) minmax(360px, 1fr)',
            gap: '56px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: 16:9 Video Box & Device Pills */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Google Meet 16:9 Video Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9.5',
                backgroundColor: '#202124',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Top-Left Name Tag */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  zIndex: 10,
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}
              >
                {candidateName}
              </div>

              {/* Top-Right 3-Dots Button */}
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'menu' ? null : 'menu')}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: activeDropdown === 'menu' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'background-color 0.15s ease',
                }}
                aria-label="More options"
                title="More options"
              >
                <MoreVertical size={18} />
              </button>

              {/* 3-Dots Context Menu Popover */}
              {activeDropdown === 'menu' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '52px',
                    right: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)',
                    padding: '6px 0',
                    minWidth: '220px',
                    zIndex: 50,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(true);
                      setActiveDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      color: '#3c4043',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Settings size={16} color="#5f6368" />
                    <span>Audio &amp; video settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMirrored(!isMirrored);
                      setActiveDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      color: '#3c4043',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Sliders size={16} color="#5f6368" />
                    <span>{isMirrored ? 'Turn off mirror mode' : 'Turn on mirror mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSpeakerTestChime(selectedSpeakerId);
                      setActiveDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      color: '#3c4043',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Volume2 size={16} color="#5f6368" />
                    <span>Test speakers</span>
                  </button>
                </div>
              )}

              {/* Direct Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  display: cameraActive && streamActive ? 'block' : 'none',
                  ...getFilterStyle(),
                }}
              />

              {/* Simulated stream indicator badge */}
              {isSimulatedStream && cameraActive && streamActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '54px',
                    backgroundColor: 'rgba(32, 33, 36, 0.75)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 15,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34a853' }} />
                  <span style={{ fontSize: '0.6875rem', color: '#e8eaed', fontWeight: 500 }}>
                    Test stream
                  </span>
                  <button
                    type="button"
                    onClick={() => startCamera(selectedCameraId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8ab4f8',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '2px',
                      textDecoration: 'underline',
                    }}
                  >
                    Switch to camera
                  </button>
                </div>
              )}

              {/* Connecting / Initializing Media State */}
              {cameraActive && !streamActive && mediaInitializing && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    gap: '14px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#1a73e8',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <div style={{ fontSize: '0.9375rem', fontWeight: 400, color: '#e8eaed' }}>
                    Starting camera...
                  </div>
                </div>
              )}

              {/* Camera Off / Blocked / Conflict Placeholder */}
              {(!cameraActive || (!streamActive && !mediaInitializing)) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    gap: '14px',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VideoOff size={44} color="#9aa0a6" />
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      color: '#e8eaed',
                    }}
                  >
                    {permissionBlocked
                      ? 'Camera & microphone permissions needed'
                      : cameraInUseWarning
                      ? 'Camera in use by another tab (Google Meet)'
                      : 'Camera is off'}
                  </div>
                  {(permissionBlocked || cameraInUseWarning) && (
                    <div style={{ fontSize: '0.8125rem', color: '#9aa0a6', maxWidth: '360px', lineHeight: 1.45 }}>
                      {permissionBlocked
                        ? 'Click the camera / site settings icon in your browser address bar to allow camera and microphone access.'
                        : 'Your camera is currently active in another application or browser tab. Please close that tab or click below to use the test stream.'}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={permissionBlocked ? retryPermissions : toggleVideo}
                      style={{
                        padding: '7px 18px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>{permissionBlocked ? 'Retry permissions' : cameraInUseWarning ? 'Retry camera' : 'Turn on camera'}</span>
                    </button>

                    {(permissionBlocked || cameraInUseWarning) && (
                      <button
                        type="button"
                        onClick={startSimulatedStream}
                        style={{
                          padding: '7px 18px',
                          borderRadius: '9999px',
                          border: '1px solid #1a73e8',
                          backgroundColor: '#1a73e8',
                          color: '#ffffff',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Use test stream</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Center Floating Controls (Mic, Video, Effects) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 20,
                }}
              >
                {/* Mic Toggle Button */}
                <button
                  type="button"
                  onClick={toggleMic}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: micActive ? '#3c4043' : '#ea4335',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: micActive && micLevel > 15 ? '0 0 0 3px rgba(52, 168, 83, 0.8)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={micActive ? 'Turn off microphone' : 'Turn on microphone'}
                >
                  {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {/* Video Toggle Button */}
                <button
                  type="button"
                  onClick={toggleVideo}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: cameraActive ? '#3c4043' : '#ea4335',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
                >
                  {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                {/* Visual Effects Button */}
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'effects' ? null : 'effects')}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: activeDropdown === 'effects' || appliedEffect !== 'none'
                      ? '#1a73e8'
                      : '#3c4043',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Apply visual effects"
                >
                  <Sparkles size={20} />
                </button>
              </div>
            </div>

            {/* Exact Google Meet 4 Pills Below Video */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '16px',
                position: 'relative',
              }}
            >
              {/* Pill 1: Native Microphone Pill */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'mic' ? null : 'mic')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    border: activeDropdown === 'mic' ? '1px solid #1a73e8' : '1px solid #dadce0',
                    backgroundColor: activeDropdown === 'mic' ? '#f1f3f4' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#3c4043',
                    cursor: 'pointer',
                  }}
                >
                  <Mic size={14} color="#5f6368" />
                  <span>{micName.length > 20 ? micName.slice(0, 20) + '...' : micName}</span>
                  {activeDropdown === 'mic' ? <ChevronUp size={13} color="#5f6368" /> : <ChevronDown size={13} color="#5f6368" />}
                </button>

                {/* Microphone Dropdown (Exact Google Meet Layout from media_1790193107644.png) */}
                {activeDropdown === 'mic' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                      border: '1px solid #dadce0',
                      padding: '6px 0',
                      minWidth: '320px',
                      zIndex: 60,
                    }}
                  >
                    {audioInputs.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => switchMicrophone('')}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          fontSize: '0.8125rem',
                          color: '#1a73e8',
                          cursor: 'pointer',
                        }}
                      >
                        Default Microphone (Click to connect)
                      </button>
                    ) : (
                      audioInputs.map((device, idx) => {
                        const isSelected = selectedMicId === device.deviceId || (!selectedMicId && idx === 0);
                        const isDefault = device.deviceId === 'default' || idx === 0;
                        const labelText = device.label && device.label.trim() !== ''
                          ? device.label
                          : (idx === 0 ? 'Default Microphone (Click to connect)' : `Microphone Input ${idx + 1}`);
                        return (
                          <button
                            key={device.deviceId || idx}
                            type="button"
                            onClick={() => switchMicrophone(device.deviceId)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: isSelected ? '#f1f3f4' : 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f1f3f4' : 'transparent')}
                          >
                            <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <Check size={16} color="#1a73e8" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8125rem', color: isSelected ? '#1a73e8' : '#202124', fontWeight: isSelected ? 500 : 400 }}>
                                {labelText}
                              </div>
                              {isDefault && (
                                <div style={{ fontSize: '0.6875rem', color: '#5f6368', marginTop: '2px' }}>
                                  System default
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}

                    <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />

                    {/* Live Audio Level Line (matching media_1790193107644.png) */}
                    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mic size={15} color={micActive ? '#1a73e8' : '#ea4335'} />
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#e8eaed', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${micActive ? Math.max(8, micLevel) : 0}%`,
                            backgroundColor: '#1a73e8',
                            transition: 'width 0.08s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pill 2: Native Speaker Pill */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'speaker' ? null : 'speaker')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    border: activeDropdown === 'speaker' ? '1px solid #1a73e8' : '1px solid #dadce0',
                    backgroundColor: activeDropdown === 'speaker' ? '#f1f3f4' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#3c4043',
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={14} color="#5f6368" />
                  <span>{speakerName.length > 20 ? speakerName.slice(0, 20) + '...' : speakerName}</span>
                  {activeDropdown === 'speaker' ? <ChevronUp size={13} color="#5f6368" /> : <ChevronDown size={13} color="#5f6368" />}
                </button>

                {/* Speaker Dropdown (Exact Google Meet Layout from media_1790193107393.png) */}
                {activeDropdown === 'speaker' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                      border: '1px solid #dadce0',
                      padding: '6px 0',
                      minWidth: '320px',
                      zIndex: 60,
                    }}
                  >
                    {audioOutputs.length === 0 ? (
                      <div style={{ padding: '10px 16px', fontSize: '0.8125rem', color: '#5f6368' }}>
                        Default System Speakers
                      </div>
                    ) : (
                      audioOutputs.map((device, idx) => {
                        const isSelected = selectedSpeakerId === device.deviceId || (!selectedSpeakerId && idx === 0);
                        const isDefault = device.deviceId === 'default' || idx === 0;
                        const labelText = device.label && device.label.trim() !== ''
                          ? device.label
                          : (idx === 0 ? 'Default System Speakers' : `Audio Output ${idx + 1}`);
                        return (
                          <button
                            key={device.deviceId || idx}
                            type="button"
                            onClick={() => switchSpeaker(device.deviceId)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: isSelected ? '#f1f3f4' : 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f1f3f4' : 'transparent')}
                          >
                            <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <Check size={16} color="#1a73e8" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8125rem', color: isSelected ? '#1a73e8' : '#202124', fontWeight: isSelected ? 500 : 400 }}>
                                {labelText}
                              </div>
                              {isDefault && (
                                <div style={{ fontSize: '0.6875rem', color: '#5f6368', marginTop: '2px' }}>
                                  System default
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}

                    <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />

                    {/* Test Speakers Action (matching media_1790193107393.png) */}
                    <button
                      type="button"
                      onClick={() => playSpeakerTestChime(selectedSpeakerId)}
                      disabled={isPlayingTestSound}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#1a73e8',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Volume2 size={16} color="#1a73e8" />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {isPlayingTestSound ? 'Playing test chime...' : 'Test speakers'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pill 3: Native Camera Pill */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'camera' ? null : 'camera')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    border: activeDropdown === 'camera' ? '1px solid #1a73e8' : '1px solid #dadce0',
                    backgroundColor: activeDropdown === 'camera' ? '#f1f3f4' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#3c4043',
                    cursor: 'pointer',
                  }}
                >
                  <Video size={14} color="#5f6368" />
                  <span>{cameraName.length > 20 ? cameraName.slice(0, 20) + '...' : cameraName}</span>
                  {activeDropdown === 'camera' ? <ChevronUp size={13} color="#5f6368" /> : <ChevronDown size={13} color="#5f6368" />}
                </button>

                {/* Camera Dropdown (Exact Google Meet Layout from media_1790193107367.png) */}
                {activeDropdown === 'camera' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                      border: '1px solid #dadce0',
                      padding: '6px 0',
                      minWidth: '300px',
                      zIndex: 60,
                    }}
                  >
                    {videoInputs.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => switchCamera('')}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          fontSize: '0.8125rem',
                          color: '#1a73e8',
                          cursor: 'pointer',
                        }}
                      >
                        Integrated Webcam (Click to connect)
                      </button>
                    ) : (
                      videoInputs.map((device, idx) => {
                        const isSelected = selectedCameraId === device.deviceId || (!selectedCameraId && idx === 0);
                        const labelText = device.label && device.label.trim() !== ''
                          ? device.label
                          : (idx === 0 ? 'Integrated Webcam (Click to connect)' : `Camera Input ${idx + 1}`);
                        return (
                          <button
                            key={device.deviceId || idx}
                            type="button"
                            onClick={() => switchCamera(device.deviceId)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: isSelected ? '#f1f3f4' : 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f1f3f4' : 'transparent')}
                          >
                            <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <Check size={16} color="#1a73e8" />}
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: isSelected ? '#1a73e8' : '#202124', fontWeight: isSelected ? 500 : 400 }}>
                              {labelText}
                            </span>
                          </button>
                        );
                      })
                    )}

                    <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />

                    {/* Mirror Mode Quick Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsMirrored(!isMirrored)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#3c4043',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sliders size={16} color="#5f6368" />
                      </div>
                      <span style={{ fontSize: '0.8125rem' }}>
                        {isMirrored ? 'Turn off mirror mode' : 'Turn on mirror mode'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pill 4: Visual Effects / Backgrounds Pill (Exact Google Meet Layout from media_1790193107387.png) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'effects' ? null : 'effects')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    border: activeDropdown === 'effects' || appliedEffect !== 'none' ? '1px solid #1a73e8' : '1px solid #dadce0',
                    backgroundColor: activeDropdown === 'effects' ? '#f1f3f4' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#3c4043',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={14} color={appliedEffect !== 'none' ? '#1a73e8' : '#5f6368'} />
                  <span>Backgrounds &amp; effects...</span>
                  {activeDropdown === 'effects' ? <ChevronUp size={13} color="#5f6368" /> : <ChevronDown size={13} color="#5f6368" />}
                </button>

                {/* Backgrounds Dropdown (Exact Google Meet Layout from media_1790193107387.png) */}
                {activeDropdown === 'effects' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                      border: '1px solid #dadce0',
                      padding: '6px 0',
                      minWidth: '280px',
                      zIndex: 60,
                    }}
                  >
                    {[
                      { id: 'none', label: 'No background or effect' },
                      { id: 'slight_blur', label: 'Slight blur' },
                      { id: 'blur', label: 'Blur your background' },
                      { id: 'studio', label: 'Studio lighting' },
                      { id: 'sepia', label: 'Warm contrast' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAppliedEffect(item.id as EffectType);
                          setActiveDropdown(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          border: 'none',
                          background: appliedEffect === item.id ? '#f1f3f4' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = appliedEffect === item.id ? '#f1f3f4' : 'transparent')}
                      >
                        <div style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {appliedEffect === item.id && <Check size={16} color="#1a73e8" />}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: appliedEffect === item.id ? '#1a73e8' : '#202124', fontWeight: appliedEffect === item.id ? 500 : 400 }}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: "Ready to join?" + Code + Consent + Join Now */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 400,
                  color: '#202124',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Ready to join?
              </h1>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#5f6368',
                  marginTop: '8px',
                  lineHeight: 1.5,
                }}
              >
                {interviewTitle} &bull; {candidateRole}
              </p>
            </div>

            {/* Access / Verification Code Card */}
            <div
              style={{
                border: '1px solid #dadce0',
                borderRadius: '8px',
                padding: '14px 16px',
                backgroundColor: '#ffffff',
              }}
            >
              <label
                htmlFor="verification-code-input"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#5f6368',
                  marginBottom: '6px',
                }}
              >
                Verification Access Code
              </label>
              <input
                id="verification-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="G6Y3-R4T2"
                className="cand-tabular"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: error ? '1px solid #ea4335' : '1px solid #dadce0',
                  backgroundColor: '#f8f9fa',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#202124',
                  letterSpacing: '0.04em',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              {error && (
                <div style={{ fontSize: '0.75rem', color: '#ea4335', marginTop: '4px' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Inverted Affirmative Consent Checkbox */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: agreed ? '#f8f9fa' : '#ffffff',
                border: agreed ? '1px solid #1a73e8' : '1px solid #dadce0',
                transition: 'all 0.15s ease',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#1a73e8',
                    marginTop: '2px',
                    cursor: 'pointer',
                  }}
                  id="checkbox-affirmative-consent"
                />
                <span style={{ fontSize: '0.8125rem', color: '#3c4043', lineHeight: 1.45 }}>
                  I agree to assessment integrity monitoring (camera presence, audio level, tab focus, and screen share analyzed locally).
                </span>
              </label>

              <div style={{ marginTop: '6px', paddingLeft: '26px' }}>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#1a73e8',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View proctoring parameters</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Actions: "Join now" & "Present" */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleJoin()}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: agreed ? '#1a73e8' : '#dadce0',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: '0.01em',
                }}
                id="btn-candidate-join-now"
              >
                {loading ? 'Entering...' : 'Join now'}
              </button>

              <button
                type="button"
                onClick={handlePresent}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dadce0',
                  color: '#1a73e8',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <MonitorUp size={16} color="#1a73e8" />
                <span>Present</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Unified Audio & Video Settings Modal */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(32, 33, 36, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f3f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#202124', margin: 0 }}>
                Device Settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f3f4', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setSettingsTab('audio')}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: settingsTab === 'audio' ? '2px solid #1a73e8' : '2px solid transparent',
                  color: settingsTab === 'audio' ? '#1a73e8' : '#5f6368',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Audio
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('video')}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: settingsTab === 'video' ? '2px solid #1a73e8' : '2px solid transparent',
                  color: settingsTab === 'video' ? '#1a73e8' : '#5f6368',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Video
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {settingsTab === 'audio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Microphone Section */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5f6368', marginBottom: '8px' }}>
                      Microphone
                    </label>
                    <select
                      value={selectedMicId}
                      onChange={(e) => switchMicrophone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #dadce0',
                        fontSize: '0.875rem',
                        color: '#202124',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {audioInputs.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Microphone ${i + 1}`}
                        </option>
                      ))}
                    </select>

                    {/* Mic Audio Level Visualizer */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5f6368', marginBottom: '4px' }}>
                        <span>Input level:</span>
                        <span className="cand-tabular">{micActive ? micLevel : 0}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f3f4', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${micActive ? Math.max(4, micLevel) : 0}%`,
                            backgroundColor: '#34a853',
                            transition: 'width 0.08s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speaker Section */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5f6368', marginBottom: '8px' }}>
                      Speakers
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={selectedSpeakerId}
                        onChange={(e) => switchSpeaker(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #dadce0',
                          fontSize: '0.875rem',
                          color: '#202124',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {audioOutputs.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Speaker ${i + 1}`}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => playSpeakerTestChime(selectedSpeakerId)}
                        disabled={isPlayingTestSound}
                        style={{
                          padding: '0 16px',
                          borderRadius: '6px',
                          border: '1px solid #dadce0',
                          backgroundColor: '#ffffff',
                          color: '#1a73e8',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Volume2 size={16} />
                        <span>{isPlayingTestSound ? 'Testing...' : 'Test'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Camera Section */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5f6368', marginBottom: '8px' }}>
                      Camera
                    </label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => switchCamera(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #dadce0',
                        fontSize: '0.875rem',
                        color: '#202124',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {videoInputs.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mirror Video Toggle */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#202124',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isMirrored}
                      onChange={(e) => setIsMirrored(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#1a73e8' }}
                    />
                    <span>Mirror my video in preview</span>
                  </label>

                  <div style={{ fontSize: '0.75rem', color: '#5f6368', backgroundColor: '#f8f9fa', padding: '10px 12px', borderRadius: '6px' }}>
                    Resolution: 1280 &times; 720 (720p HD) &bull; Frame rate: 30 FPS
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Details Modal */}
      {showConsentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(32, 33, 36, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowConsentModal(false)}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#1a73e8" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#202124', margin: 0 }}>
                  Assessment Integrity Signals
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#5f6368', lineHeight: 1.5, marginBottom: '16px' }}>
              InterviewShield operates on affirmative consent. Signals are processed locally on your device:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#3c4043' }}>
                &bull; <strong>Webcam Presence</strong>: Landmark detection verifies you are present and facing the camera.
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#3c4043' }}>
                &bull; <strong>Audio Level</strong>: Monitors acoustic energy for speech. Raw audio is never recorded.
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#3c4043' }}>
                &bull; <strong>Screen Share</strong>: Confirms your shared test workspace.
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#3c4043' }}>
                &bull; <strong>Window Focus</strong>: Observes when the test tab loses focus.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dadce0',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#3c4043',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreed(true);
                  setShowConsentModal(false);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#1a73e8',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Agree &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
