import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Link2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import '../../styles/interview-shield.css';

export const ProfileScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'security' | 'notifications' | 'integrations'>('personal');
  const [name, setName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@company.com');
  const password = '••••••••';
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const subTabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
  ] as const;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setNewPassword('');
    }, 1500);
  };

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
        My Profile
      </h1>

      {/* Two Column Layout */}
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
                id={`profile-subtab-${tab.id}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Card: Profile Form */}
        <div className="is-card" style={{ padding: '28px' }}>
          {/* Header Card Row: Avatar, Name, Role, Edit Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '24px',
              borderBottom: '1px solid var(--is-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                className="is-avatar-circle"
                style={{ width: '56px', height: '56px', fontSize: '1.35rem', backgroundColor: '#3b82f6' }}
              >
                R
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--is-text-primary)' }}>
                  {name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-secondary)' }}>
                  Recruiter
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--is-text-muted)', marginTop: '2px' }}>
                  {email}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="is-btn is-btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
              id="btn-edit-profile"
            >
              <Edit2 size={13} />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            <div className="is-form-group">
              <label className="is-label">Full Name</label>
              <input
                type="text"
                className="is-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                style={{ backgroundColor: isEditing ? '#ffffff' : '#fafbfc' }}
              />
            </div>

            <div className="is-form-group">
              <label className="is-label">Email</label>
              <input
                type="email"
                className="is-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                style={{ backgroundColor: isEditing ? '#ffffff' : '#fafbfc' }}
              />
            </div>

            {/* Password Row */}
            <div className="is-form-group">
              <label className="is-label">Password</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="password"
                  className="is-input"
                  value={password}
                  readOnly
                  style={{ flex: 1, backgroundColor: '#fafbfc', letterSpacing: '0.2em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="is-btn is-btn-outline"
                  id="btn-change-password"
                >
                  Change password
                </button>
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="is-btn is-btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Save Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="is-modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="is-modal-card" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--is-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--is-text-primary)' }}>
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="is-icon-btn"
                style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="is-form-group">
                <label className="is-label">Current Password</label>
                <input type="password" className="is-input" defaultValue="demo123" required />
              </div>

              <div className="is-form-group">
                <label className="is-label">New Password</label>
                <input
                  type="password"
                  className="is-input"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="is-btn is-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="is-btn is-btn-primary"
                  id="btn-confirm-password"
                >
                  {passwordSuccess ? <Check size={16} /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
