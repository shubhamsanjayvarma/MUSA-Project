import React from 'react';
import { CandidateJoinScreen } from '../candidate/CandidateJoinScreen.js';

/**
 * Screen 5: Candidate System Check / Greenroom Screen
 * Canonical route: /system-check
 * Unified Google Meet style pre-join screen with hardware verification,
 * access code input, and inverted affirmative consent.
 */
export const CandidateSystemCheckScreen: React.FC = () => {
  return <CandidateJoinScreen />;
};
