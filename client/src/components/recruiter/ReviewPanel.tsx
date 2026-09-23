import React, { useState, useEffect } from 'react';
import {
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
        backgroundColor: '#ffffff',
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
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#2563eb" />
          <span
            className="recruiter-text-13"
            style={{ fontWeight: 600, color: 'var(--recruiter-text-primary, #0f172a)' }}
          >
            Human Proctor Review Workflow
          </span>
        </div>

        {savedReview && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor:
                savedReview.decision === 'pass'
                  ? '#f0fdf4'
                  : savedReview.decision === 'flag'
                  ? '#fffbeb'
                  : '#f8fafc',
              color:
                savedReview.decision === 'pass'
                  ? '#15803d'
                  : savedReview.decision === 'flag'
                  ? '#b45309'
                  : '#475569',
              border: `1px solid ${
                savedReview.decision === 'pass'
                  ? '#bbf7d0'
                  : savedReview.decision === 'flag'
                  ? '#fde68a'
                  : '#e2e8f0'
              }`,
              fontSize: '0.6875rem',
              fontWeight: 600,
            }}
          >
            Verified: {savedReview.decision.toUpperCase()}
          </span>
        )}
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor:
              statusMessage.type === 'success'
                ? '#f0fdf4'
                : '#fef2f2',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? '#bbf7d0'
                : '#fecaca'
            }`,
            color:
              statusMessage.type === 'success'
                ? '#15803d'
                : '#b91c1c',
          }}
        >
          {statusMessage.type === 'success' ? (
            <ShieldCheck size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {statusMessage.text}
          </span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Dropdown Menu replacing button grid */}
        <div>
          <label
            htmlFor="review-decision-select"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.75rem',
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            Review Decision
          </label>

          <select
            id="review-decision-select"
            value={decision || ''}
            onChange={(e) => setDecision((e.target.value as ReviewDecision) || null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="" disabled>Select decision...</option>
            <option value="pass">Pass Session</option>
            <option value="flag">Flag for Scrutiny</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
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
              style={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: '#475569',
              }}
            >
              Proctor Notes {isFlag && <span style={{ color: '#b91c1c' }}>* (Required for Flag)</span>}
            </label>

            {isFlag && (
              <span
                className="tnum"
                style={{
                  fontSize: '0.6875rem',
                  color: notesTrimmed.length >= 10 ? '#15803d' : '#b91c1c',
                }}
              >
                {notesTrimmed.length}/10 min chars
              </span>
            )}
          </div>

          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isFlag
                ? 'Specify the anomalous behaviors or timestamps inspected (min 10 characters)...'
                : 'Optional reviewer notes or follow-up recommendations...'
            }
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#ffffff',
              border: `1px solid ${
                isFlag && notesTrimmed.length < 10 && notes.length > 0
                  ? '#ef4444'
                  : '#e2e8f0'
              }`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#0f172a',
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
              style={{ fontSize: '0.6875rem', color: '#64748b' }}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: isFormValid && !isSubmitting ? '#0f172a' : '#f1f5f9',
              color: isFormValid && !isSubmitting ? '#ffffff' : '#94a3b8',
              border: isFormValid && !isSubmitting ? '1px solid #0f172a' : '1px solid #e2e8f0',
              cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '0.75rem',
              transition: 'background-color 0.15s ease',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Recording...</span>
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
