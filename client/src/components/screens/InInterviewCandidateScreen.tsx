import React from 'react';
import { CandidateInterviewRoom } from '../candidate/CandidateInterviewRoom.js';

/**
 * Screen 7: Candidate In-Interview Screen
 * Canonical route: /interview/candidate
 * Delegates to CandidateInterviewRoom with full mediaManager, WSClient,
 * DetectorOrchestrator integration, and strict Anti-Gaming Neutral Indicators.
 */
export const InInterviewCandidateScreen: React.FC = () => {
  return <CandidateInterviewRoom />;
};
