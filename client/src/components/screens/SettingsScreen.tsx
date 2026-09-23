import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Link2,
  Users,
  CreditCard,
  Check,
} from 'lucide-react';
import '../../styles/interview-shield.css';

export const SettingsScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'security' | 'notifications' | 'integrations' | 'team' | 'billing'>('general');
  const [orgName, setOrgName] = useState('InterviewShield');
  const [timezone, setTimezone] = useState('(GMT+05:30) Mumbai, India');
  const [defaultDuration, setDefaultDuration] = useState('60 minutes');
  const [enableMonitoring, setEnableMonitoring] = useState(true);
  const [sendEmails, setSendEmails] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const subTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ] as const;

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1
        style={{
          fontSize: '1.65rem',
          fontWeight: 700,
          color: 'var(--is-text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        Settings
      </h1>

      {/* Two Column Layout: Sub-navigation (Left) & Form Card (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Sub-Navigation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: '#ffffff',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid var(--is-border)',
          }}
        >
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--is-primary-light)' : 'transparent',
                  color: isActive ? 'var(--is-primary)' : 'var(--is-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                id={`subtab-${tab.id}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Card */}
        <div className="is-card" style={{ padding: '28px' }}>
          {activeSubTab === 'general' ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                  General Settings
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)', marginTop: '2px' }}>
                  Manage your organization defaults and interview preferences.
                </p>
              </div>

              {/* Organization Name */}
              <div className="is-form-group">
                <label className="is-label">Organization Name</label>
                <input
                  type="text"
                  className="is-input"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              {/* Timezone */}
              <div className="is-form-group">
                <label className="is-label">Timezone</label>
                <select
                  className="is-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="(GMT+05:30) Mumbai, India">(GMT+05:30) Mumbai, India</option>
                  <option value="(GMT+00:00) UTC / London">(GMT+00:00) UTC / London</option>
                  <option value="(GMT-05:00) New York, USA">(GMT-05:00) New York, USA</option>
                  <option value="(GMT-08:00) San Francisco, USA">(GMT-08:00) San Francisco, USA</option>
                  <option value="(GMT+08:00) Singapore">(GMT+08:00) Singapore</option>
                </select>
              </div>

              {/* Default Interview Duration */}
              <div className="is-form-group">
                <label className="is-label">Default Interview Duration</label>
                <select
                  className="is-select"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                >
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="90 minutes">90 minutes</option>
                </select>
              </div>

              {/* Toggle 1: Enable monitoring by default */}
              <div className="is-toggle-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    Enable monitoring by default
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)', marginTop: '2px' }}>
                    All newly created interviews will have telemetry tracking active.
                  </span>
                </div>
                <label className="is-switch">
                  <input
                    type="checkbox"
                    checked={enableMonitoring}
                    onChange={(e) => setEnableMonitoring(e.target.checked)}
                  />
                  <span className="is-switch-slider" />
                </label>
              </div>

              {/* Toggle 2: Send email notifications */}
              <div className="is-toggle-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    Send email notifications
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)', marginTop: '2px' }}>
                    Receive automated summary reports after each session completes.
                  </span>
                </div>
                <label className="is-switch">
                  <input
                    type="checkbox"
                    checked={sendEmails}
                    onChange={(e) => setSendEmails(e.target.checked)}
                  />
                  <span className="is-switch-slider" />
                </label>
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="is-btn is-btn-primary"
                  style={{ padding: '10px 24px' }}
                  id="btn-save-settings"
                >
                  {saved ? (
                    <>
                      <Check size={16} /> Saved Changes
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--is-text-secondary)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                {activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)} Settings
              </h3>
              <p style={{ fontSize: '0.875rem', marginTop: '6px' }}>
                Configurations for {activeSubTab} are active and enforced across your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
