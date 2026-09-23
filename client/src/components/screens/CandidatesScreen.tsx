import React, { useState } from 'react';
import {
  Search,
  Plus,
  X,
} from 'lucide-react';
import '../../styles/interview-shield.css';

interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  interviewsCount: number;
  status: 'Active' | 'Invited';
}

export const CandidatesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Candidate Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Frontend Developer');

  const [candidates, setCandidates] = useState<CandidateRecord[]>([
    {
      id: 'c1',
      name: 'Aarav Mehta',
      email: 'aarav@gmail.com',
      role: 'Frontend Dev',
      interviewsCount: 3,
      status: 'Active',
    },
    {
      id: 'c2',
      name: 'Priya Singh',
      email: 'priya@gmail.com',
      role: 'Product Manager',
      interviewsCount: 2,
      status: 'Active',
    },
    {
      id: 'c3',
      name: 'Karan Verma',
      email: 'karan@gmail.com',
      role: 'UI/UX Designer',
      interviewsCount: 1,
      status: 'Invited',
    },
    {
      id: 'c4',
      name: 'Sneha Iyer',
      email: 'sneha@gmail.com',
      role: 'Data Analyst',
      interviewsCount: 2,
      status: 'Active',
    },
  ]);

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newCand: CandidateRecord = {
      id: `c-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      interviewsCount: 0,
      status: 'Invited',
    };

    setCandidates([newCand, ...candidates]);
    setNewName('');
    setNewEmail('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Row with Title, Search, and Add Candidate CTA */}
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
          Candidates
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} className="is-search-icon" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="is-search-input"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="is-btn is-btn-primary"
            id="btn-add-candidate"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Candidates Table Card */}
      <div className="is-card">
        <div className="is-table-container">
          <table className="is-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Name</th>
                <th style={{ width: '25%' }}>Email</th>
                <th style={{ width: '20%' }}>Role</th>
                <th style={{ width: '15%' }}>Interviews</th>
                <th style={{ width: '15%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr key={c.id} style={{ height: '62px' }}>
                  <td style={{ fontWeight: 600, color: 'var(--is-text-primary)' }}>
                    {c.name}
                  </td>

                  <td style={{ color: 'var(--is-text-secondary)' }}>
                    {c.email}
                  </td>

                  <td style={{ color: 'var(--is-text-secondary)' }}>
                    {c.role}
                  </td>

                  <td style={{ color: 'var(--is-text-primary)', fontWeight: 600 }}>
                    {c.interviewsCount}
                  </td>

                  <td>
                    <span
                      className={`is-pill ${
                        c.status === 'Active' ? 'is-pill-active' : 'is-pill-invited'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="is-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
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
                Add New Candidate
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="is-icon-btn"
                style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="is-form-group">
                <label className="is-label">Candidate Name</label>
                <input
                  type="text"
                  className="is-input"
                  placeholder="e.g. Ananya Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="is-form-group">
                <label className="is-label">Email Address</label>
                <input
                  type="email"
                  className="is-input"
                  placeholder="ananya@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="is-form-group">
                <label className="is-label">Target Role</label>
                <select
                  className="is-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Frontend Dev">Frontend Dev</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Backend Dev">Backend Dev</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="is-btn is-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="is-btn is-btn-primary"
                  id="btn-confirm-add-candidate"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
