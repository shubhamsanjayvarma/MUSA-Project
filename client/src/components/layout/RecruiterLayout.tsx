import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Sparkles,
} from 'lucide-react';
import '../../styles/interview-shield.css';

interface RecruiterLayoutProps {
  children: React.ReactNode;
  onNewInterviewClick?: () => void;
  onJoinCodeClick?: () => void;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Session Completed', time: '10 mins ago', desc: 'Aarav Mehta completed Frontend Dev interview' },
    { id: 2, title: 'Integrity Alert', time: '1 hour ago', desc: 'Tab switch detected in Priya Singh session' },
  ];

  return (
    <div className="is-layout">
      {/* Sidebar Navigation */}
      <aside className="is-sidebar">
        <Link to="/dashboard" className="is-sidebar-brand">
          <Shield size={22} color="#2563eb" fill="#2563eb" />
          <span>InterviewShield</span>
        </Link>

        <nav className="is-sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `is-nav-item ${isActive || location.pathname === '/' ? 'active' : ''}`
            }
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/interviews"
            className={({ isActive }) => `is-nav-item ${isActive ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Interviews</span>
          </NavLink>

          <NavLink
            to="/candidates"
            className={({ isActive }) => `is-nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Candidates</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `is-nav-item ${isActive || location.pathname.startsWith('/report') ? 'active' : ''}`
            }
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `is-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer — Recruiter Profile */}
        <div className="is-sidebar-footer">
          <Link
            to="/profile"
            className="is-user-profile-badge"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="View Profile / Account"
          >
            <div className="is-avatar-circle avatar-r">R</div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--is-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Rahul Sharma
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--is-text-muted)' }}>
                Recruiter
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="is-content-wrapper">
        {/* Top Header Bar */}
        <header className="is-header">
          <div className="is-search-box">
            <Search size={16} className="is-search-icon" />
            <input
              type="text"
              placeholder="Search interviews, candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="is-search-input"
            />
          </div>

          <div className="is-header-actions">
            {/* Quick Link to Upgrade */}
            <Link
              to="/pricing"
              className="is-btn is-btn-outline"
              style={{
                fontSize: '0.8125rem',
                padding: '6px 12px',
                borderColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#475569',
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>Upgrade</span>
            </Link>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="is-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={17} />
                <span className="is-notification-dot" />
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '300px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--is-border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--is-shadow-lg)',
                    padding: '12px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Notifications</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--is-primary)', cursor: 'pointer' }}>Mark read</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{ padding: '8px', borderRadius: '6px', background: 'var(--is-surface-muted)', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>{n.title}</div>
                        <div style={{ color: 'var(--is-text-secondary)', marginTop: '2px' }}>{n.desc}</div>
                        <div style={{ color: 'var(--is-text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            <Link
              to="/profile"
              style={{ textDecoration: 'none' }}
              title="Rahul Sharma Account"
            >
              <div className="is-avatar-circle avatar-r" style={{ width: '36px', height: '36px' }}>
                R
              </div>
            </Link>
          </div>
        </header>

        {/* Child Screen Content */}
        <main className="is-page-body">
          {children}
        </main>
      </div>
    </div>
  );
};
