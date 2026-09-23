import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Users,
  Video,
  Link2,
  MoreVertical,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  PhoneOff,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
  Eye,
  Sparkles,
  MoreHorizontal,
  AppWindow,
  FileText,
  Check,
  AudioLines,
} from 'lucide-react';
import './HomePage.css';

// SVG Vector Logos for Maximum Sharpness & Accuracy
const GoogleLogo: React.FC = () => (
  <svg height="28" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.5 16.2c0-.9-.1-1.8-.3-2.6H0v5h8.3c-.4 2-1.5 3.6-3.1 4.7v3.9h5c2.9-2.7 4.3-6.6 4.3-11z"
      fill="#4285F4"
      transform="translate(14, 0)"
    />
    <path
      d="M0 27.2c3.7 0 6.8-1.2 9.1-3.3l-4.4-3.5c-1.2.8-2.8 1.3-4.7 1.3-3.6 0-6.7-2.4-7.8-5.8h-4.6v3.6C-9.8 24.3-5.2 27.2 0 27.2z"
      fill="#34A853"
      transform="translate(14, 0)"
    />
    <path
      d="M-7.8 15.9c-.3-.9-.4-1.9-.4-2.9 0-1 .1-2 .4-2.9V6.5h-4.6C-13.8 9.3-14.5 11.5-14.5 13s.7 3.7 2.1 6.5l4.6-3.6z"
      fill="#FBBC05"
      transform="translate(14, 0)"
    />
    <path
      d="M0 4.6c2 0 3.8.7 5.3 2.1l4-4C6.8.8 3.7 0 0 0 -5.2 0-9.8 2.9-12.4 7.5l4.6 3.6c1.1-3.4 4.2-6.5 7.8-6.5z"
      fill="#EA4335"
      transform="translate(14, 0)"
    />
    <text x="36" y="22" fill="#5f6368" fontSize="21" fontFamily="Roboto, Google Sans, sans-serif" fontWeight="500" letterSpacing="-0.5px">
      Google
    </text>
  </svg>
);

const MicrosoftLogo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="22" height="22" viewBox="0 0 21 21">
      <rect x="0" y="0" width="10" height="10" fill="#f25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
      <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
      <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
    </svg>
    <span style={{ fontSize: '18px', fontWeight: 600, color: '#5e5e5e', letterSpacing: '-0.3px', fontFamily: "'Segoe UI', sans-serif" }}>
      Microsoft
    </span>
  </div>
);

const AmazonLogo: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>
      amazon
    </span>
    <svg width="50" height="9" viewBox="0 0 80 16" fill="none">
      <path d="M4 3C25 15 55 15 76 5" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 1L76 5L71 8" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const InfosysLogo: React.FC = () => (
  <span style={{ fontSize: '21px', fontWeight: 700, color: '#007cc3', letterSpacing: '-0.5px', fontFamily: "'Segoe UI', sans-serif" }}>
    Infosys
  </span>
);

const TcsLogo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ fontSize: '22px', fontWeight: 900, color: '#e60028', letterSpacing: '-0.5px' }}>
      tcs
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '7px', fontWeight: 800, color: '#004c97', lineHeight: 1.1, textTransform: 'uppercase' }}>
      <span>TATA</span>
      <span>CONSULTANCY</span>
      <span>SERVICES</span>
    </div>
  </div>
);

const AccentureLogo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ fontSize: '19px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>
      accenture
    </span>
    <span style={{ fontSize: '21px', fontWeight: 900, color: '#a100ff', marginLeft: '1px' }}>
      &gt;
    </span>
  </div>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Interactive Mock State
  const [activeTab, setActiveTab] = useState<'monitoring' | 'events' | 'insights'>('monitoring');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenShared, setIsScreenShared] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(1457); // 24:17
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTokenInput, setJoinTokenInput] = useState('');

  // Realistic interview session timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTokenInput.trim()) return;
    const cleanToken = joinTokenInput.trim().replace(/^.*\/join\//, '');
    navigate(`/join/${cleanToken}`);
  };

  return (
    <div className="ishield-home">
      {/* --------------------------------------------------------------------------
          Top Navigation Bar (Sticky with Active Home indicator)
         -------------------------------------------------------------------------- */}
      <header className="ishield-nav">
        <div className="ishield-nav-container">
          <Link to="/" className="ishield-brand-link">
            <div className="ishield-logo-icon">
              {/* Premium Shield Vector Matching Screenshot */}
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 0L0 5.33333V14.6667C0 23.28 5.97333 31.2533 14 33.3333C22.0267 31.2533 28 23.28 28 14.6667V5.33333L14 0Z"
                  fill="#1D4ED8"
                />
                <path
                  d="M14 2.8L2.4 7.2V14.8C2.4 22 7.36 28.6 14 30.4C20.64 28.6 25.6 22 25.6 14.8V7.2L14 2.8Z"
                  fill="#2563EB"
                />
                <path
                  d="M12.2 18.8L8.6 15.2L7 16.8L12.2 22L21 13.2L19.4 11.6L12.2 18.8Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <span className="ishield-brand-text">InterviewShield</span>
          </Link>

          <nav>
            <ul className="ishield-nav-links">
              <li className="ishield-nav-item">
                <a href="#home" className="ishield-nav-link active">
                  Home
                </a>
              </li>
              <li className="ishield-nav-item">
                <a href="#features" className="ishield-nav-link">
                  Features
                </a>
              </li>
              <li className="ishield-nav-item">
                <a href="#how-it-works" className="ishield-nav-link">
                  How It Works
                </a>
              </li>
              <li className="ishield-nav-item">
                <a href="#pricing" className="ishield-nav-link">
                  Pricing
                </a>
              </li>
              <li className="ishield-nav-item">
                <a href="#about" className="ishield-nav-link">
                  About
                </a>
              </li>
            </ul>
          </nav>

          <div className="ishield-nav-actions">
            <button
              onClick={() => navigate('/login')}
              className="ishield-btn-signin"
              title="Recruiter and Admin Login"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="ishield-btn-getstarted"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------------
          Hero Section
         -------------------------------------------------------------------------- */}
      <section className="ishield-hero" id="home">
        <div className="ishield-hero-grid">
          {/* Left Hero Content */}
          <div className="ishield-hero-content">
            <span className="ishield-eyebrow">FAIR INTERVIEWS. BRIGHTER FUTURES.</span>
            <h1 className="ishield-hero-title">
              Build Trust in
              <span className="highlight">Every Interview</span>
            </h1>
            <p className="ishield-hero-desc">
              InterviewShield helps organizations conduct secure and integrity-driven remote
              interviews with real-time monitoring, detailed evidence, and human-in-the-loop review.
            </p>

            <div className="ishield-hero-cta">
              <button
                onClick={() => navigate('/login')}
                className="ishield-cta-primary"
              >
                <Video size={18} />
                Get started
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="ishield-cta-secondary"
              >
                <Link2 size={18} />
                Join with code
              </button>
            </div>

            <div className="ishield-trust-badges">
              <div className="ishield-badge-item">
                <Lock size={17} />
                <span>Secure</span>
              </div>
              <div className="ishield-badge-item">
                <Users size={17} />
                <span>Easy to use</span>
              </div>
              <div className="ishield-badge-item">
                <ShieldCheck size={18} />
                <span>Built for modern hiring</span>
              </div>
            </div>
          </div>

          {/* Right Hero: High-Fidelity Mockup Window */}
          <div className="ishield-mockup-wrapper">
            <div className="ishield-mockup-window">
              {/* Left Pane: Realistic Video Conference Feed */}
              <div className="ishield-video-pane">
                {/* Video Header */}
                <div className="ishield-video-header">
                  <div className="ishield-video-title-wrap">
                    <span className="ishield-live-dot" />
                    <span>Interview with Aarav Mehta</span>
                  </div>
                  <div className="ishield-video-header-right">
                    <span>{formatTimer(timerSeconds)}</span>
                    <span className="ishield-more-dots">
                      <MoreVertical size={16} />
                    </span>
                  </div>
                </div>

                {/* Candidate Video Frame (Aarav Mehta photo) */}
                <div className="ishield-video-body">
                  <img
                    src="/candidate_aarav.jpg"
                    alt="Aarav Mehta - Candidate"
                    className="ishield-candidate-img"
                    onError={(e) => {
                      // Fallback if image path differs
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Candidate Badge (Bottom Left) */}
                <div className="ishield-candidate-pill">
                  <div className="ishield-waveform-icon">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Candidate</span>
                </div>

                {/* Recruiter Picture-in-Picture Box (Top Right) */}
                <div className="ishield-pip-box">
                  <img
                    src="/recruiter.jpg"
                    alt="Recruiter"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="ishield-pip-label">Recruiter</span>
                </div>

                {/* Video Call Controls (Bottom Center) */}
                <div className="ishield-call-controls">
                  <button
                    className={`ishield-ctrl-btn ${!isMicOn ? 'off' : ''}`}
                    onClick={() => setIsMicOn(!isMicOn)}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn ? <Mic size={15} /> : <MicOff size={15} />}
                  </button>
                  <button
                    className={`ishield-ctrl-btn ${!isCamOn ? 'off' : ''}`}
                    onClick={() => setIsCamOn(!isCamOn)}
                    title={isCamOn ? 'Stop Camera' : 'Start Camera'}
                  >
                    {isCamOn ? <Camera size={15} /> : <CameraOff size={15} />}
                  </button>
                  <button
                    className={`ishield-ctrl-btn ${!isScreenShared ? 'off' : ''}`}
                    onClick={() => setIsScreenShared(!isScreenShared)}
                    title="Screen Share Active"
                  >
                    <Monitor size={15} />
                  </button>
                  <button className="ishield-ctrl-btn" title="More Options">
                    <MoreHorizontal size={16} />
                  </button>
                  <button
                    className="ishield-ctrl-btn hangup"
                    onClick={() => alert('Demo Interview Preview. Click "Get Started" to launch an active session!')}
                    title="End Call"
                  >
                    <PhoneOff size={15} />
                  </button>
                </div>
              </div>

              {/* Right Pane: Live Telemetry & Monitoring Panel */}
              <div className="ishield-telemetry-pane">
                {/* Tabs */}
                <div>
                  <div className="ishield-pane-tabs">
                    <button
                      className={`ishield-pane-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
                      onClick={() => setActiveTab('monitoring')}
                    >
                      Monitoring
                    </button>
                    <button
                      className={`ishield-pane-tab ${activeTab === 'events' ? 'active' : ''}`}
                      onClick={() => setActiveTab('events')}
                    >
                      Events
                    </button>
                    <button
                      className={`ishield-pane-tab ${activeTab === 'insights' ? 'active' : ''}`}
                      onClick={() => setActiveTab('insights')}
                    >
                      Insights
                    </button>
                  </div>

                  {/* Tab 1: Live Monitoring */}
                  {activeTab === 'monitoring' && (
                    <>
                      <div className="ishield-section-label">Live Monitoring</div>
                      <div className="ishield-monitor-list">
                        <div className="ishield-monitor-row">
                          <div className="ishield-monitor-label">
                            <span className="ishield-monitor-icon">
                              <Camera size={14} />
                            </span>
                            <span>Camera</span>
                          </div>
                          <span className="ishield-pill-badge normal">Normal</span>
                        </div>

                        <div className="ishield-monitor-row">
                          <div className="ishield-monitor-label">
                            <span className="ishield-monitor-icon">
                              <Mic size={14} />
                            </span>
                            <span>Microphone</span>
                          </div>
                          <span className="ishield-pill-badge normal">Normal</span>
                        </div>

                        <div className="ishield-monitor-row">
                          <div className="ishield-monitor-label">
                            <span className="ishield-monitor-icon">
                              <Monitor size={14} />
                            </span>
                            <span>Screen Sharing</span>
                          </div>
                          <span className="ishield-pill-badge active">Active</span>
                        </div>

                        <div className="ishield-monitor-row">
                          <div className="ishield-monitor-label">
                            <span className="ishield-monitor-icon">
                              <AppWindow size={14} />
                            </span>
                            <span>Tab Activity</span>
                          </div>
                          <span className="ishield-pill-badge normal">Normal</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tab 2: Live Audit Events */}
                  {activeTab === 'events' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', marginBottom: '16px' }}>
                      <div className="ishield-section-label">Live Event Feed</div>
                      <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #22c55e' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>24:10 Face presence steady</div>
                        <div style={{ color: '#64748b', fontSize: '0.6875rem' }}>MediaPipe tracking single face</div>
                      </div>
                      <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>18:45 Screen stream verified</div>
                        <div style={{ color: '#64748b', fontSize: '0.6875rem' }}>Full display sharing active</div>
                      </div>
                      <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #22c55e' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>08:12 Audio correlation normal</div>
                        <div style={{ color: '#64748b', fontSize: '0.6875rem' }}>Candidate speech matched</div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Insights */}
                  {activeTab === 'insights' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', marginBottom: '16px' }}>
                      <div className="ishield-section-label">Telemetry Insights</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                        <span>Gaze Stability</span>
                        <strong style={{ color: '#16a34a' }}>96%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                        <span>Audio Match</span>
                        <strong style={{ color: '#16a34a' }}>98%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                        <span>Tab Focus</span>
                        <strong style={{ color: '#16a34a' }}>100%</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Integrity Score Radial Progress Section */}
                <div className="ishield-score-section">
                  <div className="ishield-section-label">Integrity Score</div>
                  <div className="ishield-score-gauge-wrap">
                    <div className="ishield-gauge-ring">
                      <svg viewBox="0 0 36 36">
                        {/* Background Track Circle */}
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3.2"
                        />
                        {/* Progress Arc (72%) */}
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3.2"
                          strokeDasharray="72, 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ishield-gauge-value">72/100</div>
                    </div>
                    <div className="ishield-score-meta">
                      <span className="ishield-score-rating">Good</span>
                      <span className="ishield-score-hint">No critical issues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Trusted Organizations & Stats Section
         -------------------------------------------------------------------------- */}
      <section className="ishield-trusted-section">
        <div className="ishield-trusted-label">TRUSTED BY INNOVATIVE ORGANIZATIONS</div>
        <div className="ishield-trusted-grid">
          {/* Logos Row */}
          <div className="ishield-logos-row">
            <div className="ishield-logo-item">
              <GoogleLogo />
            </div>
            <div className="ishield-logo-item">
              <MicrosoftLogo />
            </div>
            <div className="ishield-logo-item">
              <AmazonLogo />
            </div>
            <div className="ishield-logo-item">
              <InfosysLogo />
            </div>
            <div className="ishield-logo-item">
              <TcsLogo />
            </div>
            <div className="ishield-logo-item">
              <AccentureLogo />
            </div>
          </div>

          {/* Stats Divider & Row */}
          <div className="ishield-stats-divider" />

          <div className="ishield-stats-row">
            <div className="ishield-stat-col">
              <span className="ishield-stat-number">10K+</span>
              <span className="ishield-stat-desc">Interviews Monitored</span>
            </div>
            <div className="ishield-stat-col">
              <span className="ishield-stat-number">95%</span>
              <span className="ishield-stat-desc">Detection Accuracy</span>
            </div>
            <div className="ishield-stat-col">
              <span className="ishield-stat-number">500+</span>
              <span className="ishield-stat-desc">Hiring Teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          "How It Works" Section
         -------------------------------------------------------------------------- */}
      <section className="ishield-howitworks" id="how-it-works">
        <div className="ishield-hiw-header">
          <div className="ishield-hiw-eyebrow">HOW IT WORKS</div>
          <h2 className="ishield-hiw-title">
            A Simple Process for More Reliable Interviews
          </h2>
          <p className="ishield-hiw-subtitle">
            From creating an interview to making the final decision, InterviewShield keeps the process
            secure, transparent, and simple.
          </p>
        </div>

        {/* 4-Step Process with Dotted Line Connector */}
        <div className="ishield-process-stepper">
          <div className="ishield-stepper-connector" />

          {/* Step 1 */}
          <div className="ishield-step-item">
            <div className="ishield-step-icon-wrap">
              <Calendar size={22} />
            </div>
            <h3 className="ishield-step-title">1. Create Interview</h3>
            <p className="ishield-step-desc">
              Set up and share a secure interview link.
            </p>
          </div>

          {/* Step 2 */}
          <div className="ishield-step-item">
            <div className="ishield-step-icon-wrap">
              <AudioLines size={22} />
            </div>
            <h3 className="ishield-step-title">2. Monitor in Real-Time</h3>
            <p className="ishield-step-desc">
              Our AI monitors key integrity signals.
            </p>
          </div>

          {/* Step 3 */}
          <div className="ishield-step-item">
            <div className="ishield-step-icon-wrap">
              <FileText size={22} />
            </div>
            <h3 className="ishield-step-title">3. Review Evidence</h3>
            <p className="ishield-step-desc">
              Get a detailed timeline with evidence.
            </p>
          </div>

          {/* Step 4 */}
          <div className="ishield-step-item">
            <div className="ishield-step-icon-wrap">
              <Check size={22} />
            </div>
            <h3 className="ishield-step-title">4. Make a Decision</h3>
            <p className="ishield-step-desc">
              You stay in control. AI assists, you decide.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Key Features Section (High Polish)
         -------------------------------------------------------------------------- */}
      <section className="ishield-features-section" id="features">
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div className="ishield-hiw-eyebrow">ENTERPRISE INTEGRITY</div>
          <h2 className="ishield-hiw-title" style={{ fontSize: '2rem' }}>
            Built for Fair, Transparent Assessments
          </h2>
          <p className="ishield-hiw-subtitle" style={{ margin: '0 auto' }}>
            InterviewShield combines on-device vision models with audio-visual correlation to protect interview credibility without invading privacy.
          </p>
        </div>

        <div className="ishield-features-grid">
          <div className="ishield-feature-card">
            <div className="ishield-feat-icon">
              <Eye size={22} />
            </div>
            <h3 className="ishield-feat-title">Local MediaPipe Vision</h3>
            <p className="ishield-feat-desc">
              Detects multiple faces, gaze shifts, and absent candidate states entirely on-device at 2 FPS. Raw camera streams never leave the browser.
            </p>
          </div>

          <div className="ishield-feature-card">
            <div className="ishield-feat-icon">
              <Monitor size={22} />
            </div>
            <h3 className="ishield-feat-title">Screen & Tab Auditing</h3>
            <p className="ishield-feat-desc">
              Monitors tab focus losses and multi-display transitions in real time, pairing anomalies with clear timeline evidence.
            </p>
          </div>

          <div className="ishield-feature-card">
            <div className="ishield-feat-icon">
              <Sparkles size={22} />
            </div>
            <h3 className="ishield-feat-title">Human-in-the-Loop Review</h3>
            <p className="ishield-feat-desc">
              AI provides contextual timestamps and confidence scores. Recruiters retain complete authority with single-click incident verification.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Enterprise Footer
         -------------------------------------------------------------------------- */}
      <footer className="ishield-footer" id="about">
        <div className="ishield-footer-container">
          <div className="ishield-footer-brand">
            <Shield size={20} color="#3b82f6" />
            <span>InterviewShield</span>
          </div>

          <div className="ishield-footer-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Recruiter Portal</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">Documentation</a>
          </div>

          <div className="ishield-footer-copy">
            &copy; {new Date().getFullYear()} InterviewShield Inc. All rights reserved. Designed for fair, trust-driven technical evaluations.
          </div>
        </div>
      </footer>

      {/* --------------------------------------------------------------------------
          Interactive Modal: Join with Code
         -------------------------------------------------------------------------- */}
      {showJoinModal && (
        <div className="ishield-modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="ishield-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="ishield-modal-close"
              onClick={() => setShowJoinModal(false)}
            >
              <X size={18} />
            </button>
            <h3 className="ishield-modal-title">Join Interview Session</h3>
            <p className="ishield-modal-desc">
              Enter the unique interview token or link provided in your candidate invitation email.
            </p>

            <form onSubmit={handleJoinSubmit}>
              <div className="ishield-modal-input-group">
                <label className="ishield-modal-label">Interview Token / Code</label>
                <input
                  type="text"
                  placeholder="e.g. tok_demo_candidate or 123456"
                  value={joinTokenInput}
                  onChange={(e) => setJoinTokenInput(e.target.value)}
                  className="ishield-modal-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick demo:</span>
                <button
                  type="button"
                  onClick={() => setJoinTokenInput('tok_demo_candidate')}
                  style={{
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  tok_demo_candidate
                </button>
              </div>

              <button type="submit" className="ishield-modal-submit">
                Proceed to System Check <ArrowRight size={15} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '6px' }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
