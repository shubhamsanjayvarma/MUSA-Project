import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X, Check } from 'lucide-react';
import '../../styles/interview-shield.css';

export const PricingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--is-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} color="#2563eb" fill="#2563eb" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
            InterviewShield
          </span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="is-icon-btn"
          style={{ border: 'none', background: 'transparent' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '36px',
        }}
      >
        {/* Title Header */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--is-text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            Upgrade to Unlock More
          </h1>

          {/* Monthly / Yearly Billing Toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '9999px',
              marginTop: '20px',
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
                color: billingCycle === 'monthly' ? 'var(--is-text-primary)' : 'var(--is-text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: billingCycle === 'monthly' ? 'var(--is-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
              id="toggle-billing-monthly"
            >
              Monthly
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: billingCycle === 'yearly' ? '#ffffff' : 'transparent',
                color: billingCycle === 'yearly' ? 'var(--is-text-primary)' : 'var(--is-text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: billingCycle === 'yearly' ? 'var(--is-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              id="toggle-billing-yearly"
            >
              <span>Yearly</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Tier Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            width: '100%',
          }}
        >
          {/* Tier 1: Free */}
          <div
            className="is-card"
            style={{
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                Free
              </h2>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--is-text-primary)' }}>
                  ₹0
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>Up to 5 interviews</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>Basic monitoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>7 days storage</span>
                </div>
              </div>
            </div>

            <button
              disabled
              className="is-btn is-btn-outline"
              style={{
                width: '100%',
                marginTop: '36px',
                padding: '12px',
                backgroundColor: '#f1f5f9',
                color: 'var(--is-text-muted)',
                cursor: 'default',
              }}
            >
              Current Plan
            </button>
          </div>

          {/* Tier 2: Pro (Highlighted) */}
          <div
            className="is-card"
            style={{
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              border: '2px solid var(--is-primary)',
              position: 'relative',
              boxShadow: 'var(--is-shadow-lg)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                  Pro
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--is-primary-light)',
                    color: 'var(--is-primary)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  POPULAR
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--is-text-primary)' }}>
                  {billingCycle === 'monthly' ? '₹999' : '₹799'}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--is-text-muted)' }}>
                  /month
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="var(--is-primary)" strokeWidth={2.5} />
                  <span style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>Unlimited interviews</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="var(--is-primary)" strokeWidth={2.5} />
                  <span>Advanced monitoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="var(--is-primary)" strokeWidth={2.5} />
                  <span>90 days storage</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="var(--is-primary)" strokeWidth={2.5} />
                  <span>AI insights</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Upgraded to Pro plan!')}
              className="is-btn is-btn-primary"
              style={{ width: '100%', marginTop: '36px', padding: '12px', fontWeight: 600 }}
              id="btn-upgrade-pro"
            >
              Upgrade
            </button>
          </div>

          {/* Tier 3: Enterprise */}
          <div
            className="is-card"
            style={{
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                Enterprise
              </h2>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--is-text-primary)' }}>
                  Custom
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>Everything in Pro</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>Dedicated support</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>Custom retention</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--is-text-secondary)' }}>
                  <Check size={16} color="#16a34a" />
                  <span>API access</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Contacting enterprise sales team...')}
              className="is-btn is-btn-outline"
              style={{ width: '100%', marginTop: '36px', padding: '12px' }}
              id="btn-contact-sales"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
