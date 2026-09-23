import React from 'react';
import { CandidateConsentGate } from '../candidate/CandidateConsentGate.js';

/**
 * Screen 6: Candidate Consent Screen
 * Canonical route: /consent
 * Delegates to CandidateConsentGate to enforce Inverted Affirmative Consent.
 */
export const CandidateConsentScreen: React.FC = () => {
  return <CandidateConsentGate nextRoute="/system-check" />;
};
