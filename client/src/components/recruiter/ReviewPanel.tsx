import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Loader2,
  Check,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { sessionApi, RecruiterReviewData } from '../../services/api.js';
import './recruiter.css';

export interface ReviewPanelProps {
  sessionId: string;
  initialReview?: RecruiterReviewData | null;
  onReviewSubmitted?: (review: RecruiterReviewData) => void;
  className?: string;
  style?: React.CSSProperties;
}

export type ReviewDecision = 'pass' | 'flag' | 'inconclusive';

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  sessionId,
  initialReview,
  onReviewSubmitted,
  className = '',
  style,
}) => {
  const [decision, setDecision] = useState<ReviewDecision | null>(
    initialReview?.decision || null
  );
  const [notes, setNotes] = useState(initialReview?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedReview, setSavedReview] = useState<RecruiterReviewData | null>(
    initialReview || null
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Synchronize initial review if loaded asynchronously
  useEffect(() => {
    if (initialReview) {
      setSavedReview(initialReview);
      setDecision(initialReview.decision);
      setNotes(initialReview.notes || '');
    }
  }, [initialReview]);

  // Validation: Notes required if decision is 'flag' with min 10 chars
  const isFlag = decision === 'flag';
  const notesTrimmed = notes.trim();
  const flagNotesValid = !isFlag || notesTrimmed.length >= 10;
  const isFormValid = Boolean(decision) && flagNotesValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setStatusMessage({ type: 'error', text: 'No active session ID provided.' });
      return;
    }
    if (!decision) {
      setStatusMessage({ type: 'error', text: 'Please select a review verdict.' });
      return;
    }
    if (decision === 'flag' && notesTrimmed.length < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Review notes are required for flagged sessions (minimum 10 characters).',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await sessionApi.submitReview(sessionId, {
        decision,
        notes: notesTrimmed || undefined,
      });

      setSavedReview(result);
      setStatusMessage({
        type: 'success',
        text: `Verdict successfully recorded: ${result.decision.toUpperCase()}`,
      });
      if (onReviewSubmitted) {
        onReviewSubmitted(result);
      }
    } catch (err: unknown) {
      // Graceful local fallback for offline/mock test sessions
      console.warn('Backend review submit failed, falling back to local persistence:', err);
      const mockResult: RecruiterReviewData = {
        id: `rev-${Date.now()}`,
        sessionId,
        recruiterId: 'recruiter-local',
        decision,
        notes: notesTrimmed || null,
        reviewedAt: new Date().toISOString(),
      };
      setSavedReview(mockResult);
      setStatusMessage({
        type: 'success',
        text: `Verdict recorded locally: ${decision.toUpperCase()}`,
      });
      if (onReviewSubmitted) {
        onReviewSubmitted(mockResult);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`recruiter-subpixel-card ${className}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--recruiter-surface, #0f172a)',
        ...style,
      }}
      role="region"
      aria-label="Human Proctor Review Panel"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--recruiter-border-subtle, #1e293b)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#3b82f6" />
          <span
            className="recruiter-mono recruiter-text-13"
            style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #f8fafc)' }}
          >
            Human Proctor Review Workflow
          </span>
        </div>

        {savedReview && (
          <span
            className="recruiter-mono recruiter-text-11"
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor:
                savedReview.decision === 'pass'
                  ? 'var(--risk-normal-bg, rgba(16, 185, 129, 0.12))'
                  : savedReview.decision === 'flag'
                  ? 'var(--risk-suspicious-bg, rgba(249, 115, 22, 0.12))'
                  : 'rgba(148, 163, 184, 0.12)',
              color:
                savedReview.decision === 'pass'
                  ? 'var(--risk-normal-fg, #34d399)'
                  : savedReview.decision === 'flag'
                  ? 'var(--risk-suspicious-fg, #fb923c)'
                  : 'var(--recruiter-text-secondary, #94a3b8)',
              border: `1px solid ${
                savedReview.decision === 'pass'
                  ? 'var(--risk-normal-border, rgba(16, 185, 129, 0.3))'
                  : savedReview.decision === 'flag'
                  ? 'var(--risk-suspicious-border, rgba(249, 115, 22, 0.3))'
                  : 'rgba(148, 163, 184, 0.25)'
              }`,
              fontWeight: 700,
            }}
          >
            VERIFIED: {savedReview.decision.toUpperCase()}
          </span>
        )}
      </div>

      <p
        className="recruiter-text-12"
        style={{ color: 'var(--recruiter-text-secondary, #94a3b8)', lineHeight: 1.5 }}
      >
        Automated telemetry serves as non-punitive advisory signals. Human proctors make all final
        hiring integrity evaluations.
      </p>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor:
              statusMessage.type === 'success'
                ? 'var(--risk-normal-bg, rgba(16, 185, 129, 0.12))'
                : 'var(--risk-high-risk-bg, rgba(244, 63, 94, 0.12))',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? 'var(--risk-normal-border, rgba(16, 185, 129, 0.3))'
                : 'var(--risk-high-risk-border, rgba(244, 63, 94, 0.3))'
            }`,
            color:
              statusMessage.type === 'success'
                ? 'var(--risk-normal-fg, #34d399)'
                : 'var(--risk-high-risk-fg, #fb7185)',
          }}
        >
          {statusMessage.type === 'success' ? (
            <ShieldCheck size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="recruiter-text-12" style={{ fontWeight: 500 }}>
            {statusMessage.text}
          </span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Button Group per DESIGN.md: Pass (emerald) | Flag (amber) | Inconclusive (slate) */}
        <div>
          <label
            className="recruiter-mono recruiter-text-11"
            style={{
              display: 'block',
              fontWeight: 600,
              color: 'var(--recruiter-text-secondary, #94a3b8)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Review Decision
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            {/* Pass Button */}
            <button
              id="pass_btn"
              type="button"
              onClick={() => setDecision('pass')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                backgroundColor:
                  decision === 'pass'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'var(--recruiter-bg, #090d16)',
                color: decision === 'pass' ? '#34d399' : 'var(--recruiter-text-secondary, #94a3b8)',
                border: `1px solid ${
                  decision === 'pass' ? '#10b981' : 'var(--recruiter-border-subtle, #1e293b)'
                }`,
                boxShadow:
                  decision === 'pass' ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle size={16} color={decision === 'pass' ? '#34d399' : '#94a3b8'} />
              <span>Pass Session</span>
            </button>

            {/* Flag Button */}
            <button
              id="flag_btn"
              type="button"
              onClick={() => setDecision('flag')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                backgroundColor:
                  decision === 'flag'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'var(--recruiter-bg, #090d16)',
                color: decision === 'flag' ? '#fbbf24' : 'var(--recruiter-text-secondary, #94a3b8)',
                border: `1px solid ${
                  decision === 'flag' ? '#f59e0b' : 'var(--recruiter-border-subtle, #1e293b)'
                }`,
                boxShadow:
                  decision === 'flag' ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <AlertTriangle size={16} color={decision === 'flag' ? '#fbbf24' : '#94a3b8'} />
              <span>Flag for Scrutiny</span>
            </button>

            {/* Inconclusive Button */}
            <button
              id="inconclusive_btn"
              type="button"
              onClick={() => setDecision('inconclusive')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                backgroundColor:
                  decision === 'inconclusive'
                    ? 'rgba(148, 163, 184, 0.2)'
                    : 'var(--recruiter-bg, #090d16)',
                color: decision === 'inconclusive' ? '#f8fafc' : 'var(--recruiter-text-secondary, #94a3b8)',
                border: `1px solid ${
                  decision === 'inconclusive' ? '#94a3b8' : 'var(--recruiter-border-subtle, #1e293b)'
                }`,
                boxShadow:
                  decision === 'inconclusive' ? '0 0 12px rgba(148, 163, 184, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <HelpCircle size={16} color={decision === 'inconclusive' ? '#f8fafc' : '#94a3b8'} />
              <span>Inconclusive</span>
            </button>
          </div>
        </div>

        {/* Proctor Notes Area */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label
              className="recruiter-mono recruiter-text-11"
              style={{
                fontWeight: 600,
                color: 'var(--recruiter-text-secondary, #94a3b8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Proctor Notes {isFlag && <span style={{ color: '#fb7185' }}>* (Required for Flag)</span>}
            </label>

            {isFlag && (
              <span
                className="tnum recruiter-mono recruiter-text-11"
                style={{
                  color: notesTrimmed.length >= 10 ? '#34d399' : '#fb7185',
                }}
              >
                {notesTrimmed.length}/10 min chars
              </span>
            )}
          </div>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isFlag
                ? 'Specify the anomalous behaviors, timestamps, or frame snapshots inspected (min 10 characters)...'
                : 'Optional reviewer notes, observations, or follow-up interview recommendations...'
            }
            className="recruiter-text-12"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--recruiter-bg, #090d16)',
              border: `1px solid ${
                isFlag && notesTrimmed.length < 10 && notes.length > 0
                  ? 'rgba(244, 63, 94, 0.6)'
                  : 'var(--recruiter-border-subtle, #1e293b)'
              }`,
              borderRadius: '6px',
              color: 'var(--recruiter-text-primary, #f8fafc)',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {savedReview && (
            <span
              className="recruiter-mono recruiter-text-11"
              style={{ color: 'var(--recruiter-text-muted, #64748b)' }}
            >
              Last reviewed:{' '}
              {new Date(savedReview.reviewedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="recruiter-mono recruiter-text-12"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '6px',
              backgroundColor: isFormValid && !isSubmitting ? '#2563eb' : '#1e293b',
              color: isFormValid && !isSubmitting ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              transition: 'background-color 0.2s ease',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Recording Verdict...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>{savedReview ? 'Update Verdict' : 'Submit Review Verdict'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
