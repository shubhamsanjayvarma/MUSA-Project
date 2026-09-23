import React from 'react';
import { CandidateJoinScreen } from '../candidate/CandidateJoinScreen.js';

/**
 * Screen 6: Candidate Greenroom Screen
 * Canonical route: /consent, /join, /system-check
 * Unified Google Meet style pre-join screen with hardware verification,
 * access code input, and inverted affirmative consent.
 */
export const CandidateConsentScreen: React.FC = () => {
  return <CandidateJoinScreen />;
};
