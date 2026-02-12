'use client';

import { useEffect, useState } from 'react';

/**
 * Monitors bridge velocity data and identifies sustained social friction.
 * Efficiency < 80% for 3 consecutive days triggers a resonance alert.
 */
export const useSocialFriction = (velocityData: { requests: number[], approvals: number[] }, lastOutreach?: { content: string, contactId: string }) => {
  const [alert, setAlert] = useState<{ active: boolean; data: any; resonance: number } | null>(null);

  useEffect(() => {
    const { requests, approvals } = velocityData;
    if (requests.length < 3) return;

    // 1. Calculate the Friction Trend (Last 3 Days)
    const recentRequests = requests.slice(-3);
    const recentApprovals = approvals.slice(-3);
    
    let sustainedFriction = true;
    let totalRequests = 0;
    let totalApprovals = 0;

    for (let i = 0; i < 3; i++) {
      const efficiency = recentApprovals[i] / Math.max(recentRequests[i], 1);
      if (efficiency >= 0.80) {
        sustainedFriction = false;
      }
      totalRequests += recentRequests[i];
      totalApprovals += recentApprovals[i];
    }

    // Resilience/Resonance Score calculation based on the trend
    const resonanceScore = Math.round((totalApprovals / Math.max(totalRequests, 1)) * 100);

    // 2. Trigger the Architect's Intervention
    if (sustainedFriction && !alert?.active) {
      setAlert({
        active: true,
        resonance: resonanceScore,
        data: {
          originalHook: lastOutreach?.content || "No recent hook found.",
          contactId: lastOutreach?.contactId || "unknown",
          timestamp: new Date().toISOString(),
          score: `${resonanceScore}% Resonance`
        }
      });
    } else if (!sustainedFriction && alert?.active) {
      setAlert(null);
    }
  }, [velocityData, lastOutreach, alert?.active]);

  return { alert, dismissAlert: () => setAlert(null) };
};
