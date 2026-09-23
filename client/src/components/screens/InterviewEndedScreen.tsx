import React from 'react';
import { CandidateInterviewEnded } from '../candidate/CandidateInterviewEnded.js';

/**
 * Screen 8: Interview Ended Screen
 * Canonical route: /interview-ended
 * Delegates to CandidateInterviewEnded with dark slate design tokens.
 */
export const InterviewEndedScreen: React.FC = () => {
  return <CandidateInterviewEnded />;
};
