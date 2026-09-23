import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import '../../styles/interview-shield.css';

export const ReportsAnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'integrity' | 'hiring'>('overview');
  const dateRange = 'Oct 1, 2024 - Oct 31, 2024';

  // Distribution chart heights in percentages
  const distributionData = [
    { label: '0-20', height: 18, count: 2 },
    { label: '21-40', height: 28, count: 3 },
    { label: '41-60', height: 42, count: 5 },
    { label: '61-80', height: 68, count: 12 },
    { label: '81-100', height: 94, count: 26 },
  ];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header with Title and Date Range Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--is-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Reports
        </h1>

        {/* Date Filter Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--is-border)',
            backgroundColor: '#ffffff',
            fontSize: '0.875rem',
            color: 'var(--is-text-secondary)',
            boxShadow: 'var(--is-shadow-xs)',
          }}
        >
          <Calendar size={15} color="var(--is-text-muted)" />
          <span>{dateRange}</span>
          <ChevronDown size={14} color="var(--is-text-muted)" />
        </div>
      </div>

      {/* Analytics Tabs (Overview | Trends | Integrity | Hiring) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--is-border)',
          paddingBottom: '2px',
        }}
      >
        {(['overview', 'trends', 'integrity', 'hiring'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? 'var(--is-primary)' : 'var(--is-text-secondary)',
              borderBottom: activeTab === tab ? '2.5px solid var(--is-primary)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
            id={`tab-analytics-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 4 Key Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: Total Interviews */}
        <div className="is-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', fontWeight: 500 }}>
            Total Interviews
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
              48
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#16a34a',
              }}
            >
              <TrendingUp size={14} /> +12%
            </span>
          </div>
        </div>

        {/* Card 2: Avg. Integrity Score */}
        <div className="is-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', fontWeight: 500 }}>
            Avg. Integrity Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
              87
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#16a34a',
              }}
            >
              <TrendingUp size={14} /> +5%
            </span>
          </div>
        </div>

        {/* Card 3: Flagged Interviews */}
        <div className="is-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', fontWeight: 500 }}>
            Flagged Interviews
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
              6
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#dc2626',
              }}
            >
              <TrendingDown size={14} /> -20%
            </span>
          </div>
        </div>

        {/* Card 4: Hired Candidates */}
        <div className="is-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', fontWeight: 500 }}>
            Hired Candidates
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
              18
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#16a34a',
              }}
            >
              <TrendingUp size={14} /> +26%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 2 Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Chart 1: Integrity Score Distribution */}
        <div className="is-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--is-text-primary)', marginBottom: '24px' }}>
            Integrity Score Distribution
          </h2>

          <div
            style={{
              height: '180px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 12px 10px',
              borderBottom: '1px solid var(--is-border)',
            }}
          >
            {distributionData.map((bar, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  width: '44px',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--is-text-muted)' }}>{bar.count}</span>
                <div
                  style={{
                    width: '28px',
                    height: `${bar.height}%`,
                    backgroundColor: i >= 3 ? '#3b82f6' : '#93c5fd',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${bar.label}: ${bar.count} interviews`}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 8px 0',
              fontSize: '0.75rem',
              color: 'var(--is-text-muted)',
            }}
          >
            {distributionData.map((bar, i) => (
              <span key={i} style={{ width: '44px', textAlign: 'center' }}>
                {bar.label}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Interview Activity Line Chart */}
        <div className="is-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--is-text-primary)', marginBottom: '24px' }}>
            Interview Activity
          </h2>

          <div
            style={{
              height: '180px',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              borderBottom: '1px solid var(--is-border)',
            }}
          >
            {/* SVG Trend Line */}
            <svg
              viewBox="0 0 400 160"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Soft area gradient */}
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M 10 130 Q 80 140 100 90 T 200 60 T 300 40 T 390 20 L 390 150 L 10 150 Z"
                fill="url(#activityGradient)"
              />
              <path
                d="M 10 130 Q 80 140 100 90 T 200 60 T 300 40 T 390 20"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="10" cy="130" r="4" fill="#2563eb" />
              <circle cx="100" cy="90" r="4" fill="#2563eb" />
              <circle cx="200" cy="60" r="4" fill="#2563eb" />
              <circle cx="300" cy="40" r="4" fill="#2563eb" />
              <circle cx="390" cy="20" r="4" fill="#2563eb" />
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 4px 0',
              fontSize: '0.75rem',
              color: 'var(--is-text-muted)',
            }}
          >
            <span>Oct 1</span>
            <span>Oct 8</span>
            <span>Oct 15</span>
            <span>Oct 22</span>
            <span>Oct 31</span>
          </div>
        </div>
      </div>
    </div>
  );
};
