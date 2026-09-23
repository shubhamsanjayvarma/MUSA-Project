import React from 'react';
import { CandidateSystemCheck } from '../candidate/CandidateSystemCheck.js';

/**
 * Screen 5: Candidate System Check Screen
 * Canonical route: /system-check
 * Delegates to CandidateSystemCheck with strict consent gating and audio visualizer.
 */
export const CandidateSystemCheckScreen: React.FC = () => {
  return <CandidateSystemCheck nextRoute="/interview/candidate" />;
};
