import React, { useEffect, useState, useMemo } from 'react';
import './recruiter.css';

export interface RadialScoreGaugeProps {
  score: number; // 0 - 100
  previousScore?: number;
  label?: string;
  subtext?: string;
  size?: 'standard' | 'compact' | 'mini';
  showBadge?: boolean;
  showTicks?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type RiskState = 'normal' | 'attention' | 'suspicious' | 'high_risk';

export function getRiskState(score: number): RiskState {
  if (score >= 80) return 'normal';
  if (score >= 60) return 'attention';
  if (score >= 40) return 'suspicious';
  return 'high_risk';
}

export function getRiskTheme(riskState: RiskState) {
  switch (riskState) {
    case 'normal':
      return {
        label: 'NORMAL',
        color: '#10b981',
        textColor: '#15803d',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        glow: 'rgba(16, 185, 129, 0.15)',
      };
    case 'attention':
      return {
        label: 'ATTENTION',
        color: '#f59e0b',
        textColor: '#b45309',
        bg: '#fffbeb',
        border: '#fde68a',
        glow: 'rgba(245, 158, 11, 0.15)',
      };
    case 'suspicious':
      return {
        label: 'SUSPICIOUS',
        color: '#f97316',
        textColor: '#c2410c',
        bg: '#fff7ed',
        border: '#ffedd5',
        glow: 'rgba(249, 115, 22, 0.15)',
      };
    case 'high_risk':
      return {
        label: 'HIGH_RISK',
        color: '#ef4444',
        textColor: '#b91c1c',
        bg: '#fef2f2',
        border: '#fecaca',
        glow: 'rgba(239, 68, 68, 0.15)',
      };
  }
}

export const RadialScoreGauge: React.FC<RadialScoreGaugeProps> = ({
  score,
  previousScore,
  label = 'Integrity Score',
  subtext,
  size = 'standard',
  showBadge = true,
  showTicks = true,
  className = '',
  style,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const riskState = getRiskState(clampedScore);
  const theme = getRiskTheme(riskState);

  // Smooth numeric counter
  const [displayScore, setDisplayScore] = useState(clampedScore);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayScore;
    const endValue = clampedScore;
    const duration = 400; // ms to match CSS arc transition

    if (startValue === endValue) return;

    let animFrame: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayScore(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [clampedScore]);

  // Dimensions based on size
  const config = useMemo(() => {
    if (size === 'mini') {
      return {
        width: 64,
        height: 64,
        radius: 26,
        strokeWidth: 5,
        arcSweepAngle: 360,
        fontSize: '1rem',
        containerWidth: 64,
        containerHeight: 64,
      };
    }
    if (size === 'compact') {
      return {
        width: 140,
        height: 120,
        radius: 46,
        strokeWidth: 8,
        arcSweepAngle: 240,
        startAngle: 150,
        fontSize: '1.75rem',
        containerWidth: 160,
        containerHeight: 130,
      };
    }
    // Standard: 280px x 180px fixed container per DESIGN.md
    return {
      width: 240,
      height: 140,
      radius: 72,
      strokeWidth: 10,
      arcSweepAngle: 240,
      startAngle: 150,
      fontSize: '48px',
      containerWidth: 280,
      containerHeight: 180,
    };
  }, [size]);

  // Mini circular variant
  if (size === 'mini') {
    const r = config.radius;
    const c = 2 * Math.PI * r;
    const offset = c - (clampedScore / 100) * c;

    return (
      <div
        className={`recruiter-gauge-mini ${className}`}
        style={{
          position: 'relative',
          width: config.width,
          height: config.height,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        role="region"
        aria-label="Integrity Score Mini Gauge"
      >
        <svg width={config.width} height={config.height} viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={config.strokeWidth}
          />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={theme.color}
            strokeWidth={config.strokeWidth}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
            className="recruiter-gauge-arc"
          />
        </svg>
        <div
          className="tnum recruiter-mono"
          style={{
            position: 'absolute',
            fontSize: config.fontSize,
            fontWeight: 700,
            color: 'var(--recruiter-text-primary, #f8fafc)',
          }}
        >
          {displayScore}
        </div>
      </div>
    );
  }

  // 240-degree Tachometer Gauge for compact & standard
  const r = config.radius;
  const fullCircumference = 2 * Math.PI * r;
  const arcLength = (config.arcSweepAngle / 360) * fullCircumference;
  const strokeOffset = arcLength * (1 - clampedScore / 100);

  const cx = config.width / 2;
  const cy = config.height * 0.72;

  // Score delta if previousScore provided
  const delta = previousScore !== undefined ? clampedScore - previousScore : null;

  return (
    <div
      className={`recruiter-subpixel-card recruiter-gauge-container ${className}`}
      style={{
        width: `${config.containerWidth}px`,
        height: `${config.containerHeight}px`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
        ...style,
      }}
      role="region"
      aria-label="Candidate Integrity Score Gauge"
      aria-live="polite"
    >
      {/* Top Header Label */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '2px',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            fontWeight: 600,
          }}
        >
          {label}
        </span>

        {/* Delta Pill */}
        {delta !== null && delta !== 0 && (
          <span
            className="tnum"
            style={{
              fontSize: '0.6875rem',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontWeight: 600,
              backgroundColor: delta < 0 ? '#fef2f2' : '#f0fdf4',
              color: delta < 0 ? '#b91c1c' : '#15803d',
              border: `1px solid ${delta < 0 ? '#fecaca' : '#bbf7d0'}`,
            }}
          >
            {delta > 0 ? `+${delta}` : delta} pts
          </span>
        )}
      </div>

      {/* SVG Arc with Tabular Value Centered */}
      <div
        style={{
          position: 'relative',
          width: `${config.width}px`,
          height: `${config.height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          style={{ overflow: 'visible' }}
        >
          {/* Background Track Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${arcLength} ${fullCircumference}`}
            strokeLinecap="round"
            transform={`rotate(${config.startAngle} ${cx} ${cy})`}
          />

          {/* Active Score Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={theme.color}
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${arcLength} ${fullCircumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(${config.startAngle} ${cx} ${cy})`}
            className="recruiter-gauge-arc"
          />

          {/* Visual Boundary Ticks (0%, 40%, 60%, 80%, 100%) */}
          {showTicks && size === 'standard' && (
            <g opacity="0.8">
              {[0, 0.4, 0.6, 0.8, 1].map((pct, idx) => {
                const angleDeg = (config.startAngle || 150) + pct * (config.arcSweepAngle || 240);
                const angleRad = (angleDeg * Math.PI) / 180;
                const innerR = r - 12;
                const outerR = r - 7;
                const x1 = cx + innerR * Math.cos(angleRad);
                const y1 = cy + innerR * Math.sin(angleRad);
                const x2 = cx + outerR * Math.cos(angleRad);
                const y2 = cy + outerR * Math.sin(angleRad);
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Center Display: Tabular Digits Exactly Centered in Arc Cavity */}
        <div
          style={{
            position: 'absolute',
            top: size === 'standard' ? '58%' : '56%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          <span
            className="tnum"
            style={{
              fontSize: size === 'standard' ? '42px' : '26px',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {displayScore}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              color: '#64748b',
              fontWeight: 500,
              marginTop: '4px',
            }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Bottom Semantic Pill Badge */}
      {showBadge && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '-4px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: '9999px',
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
              transition: 'all 300ms ease',
            }}
          >
            <span
              style={{
                color: theme.textColor,
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {theme.label}
            </span>
          </div>
        </div>
      )}

      {subtext && (
        <span
          className="recruiter-text-11"
          style={{
            color: 'var(--recruiter-text-muted, #64748b)',
            textAlign: 'center',
            marginTop: '4px',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};
