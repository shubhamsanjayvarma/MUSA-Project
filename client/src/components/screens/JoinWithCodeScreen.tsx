import React from 'react';
import { CandidateJoinScreen } from '../candidate/CandidateJoinScreen.js';

/**
 * Screen 4: Join With Code Screen
 * Canonical route: /join and /join-code
 * Delegates to CandidateJoinScreen and directs to the Consent Gate first.
 */
export const JoinWithCodeScreen: React.FC = () => {
  return <CandidateJoinScreen />;
};
