// ====================================================================
// Analytics Domain Types - Pharma HRMS Cognitive-Optimized Dashboard
// ====================================================================

export type DistrictId = 'all' | 'vizianagaram' | 'visakhapatnam' | 'srikakulam';

export interface DistrictOption {
  id: DistrictId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface MetricPillarDetail {
  id: 'cost' | 'time' | 'resource';
  name: string;
  tagline: string;
  rawDisplayValue: string;
  normalizedPercentage: number; // For the Pie Chart representation (0 - 100)
  colorHex: string;
  twTextClass: string;
  twBgClass: string;
  twBorderClass: string;
  insightSummary: string;
  unit: string;
  details: {
    label: string;
    value: string;
  }[];
}

export interface AnalyticalMetrics {
  district: DistrictId;
  districtName: string;
  totalLeadsEvaluated: number;
  pillars: {
    cost: MetricPillarDetail;
    time: MetricPillarDetail;
    resource: MetricPillarDetail;
  };
  contextSummary: {
    headline: string;
    narrative: string;
    primaryEfficiencyScore: number; // 0-100
    anomalyAlert?: string;
  };
}

// NOTE: Revenue is intentionally EXCLUDED from TopPerformer to reduce cognitive load
// and keep the focus purely on relationship strength, speed, and lead conversion efficiency.
export interface TopPerformer {
  id: string;
  rank: number;
  name: string;
  role: string;
  district: DistrictId;
  districtLabel: string;
  avatarUrl?: string;
  connectionsCount: number;       // Number of doctor, clinic & chemist network connections
  conversionRatePercent: number;  // Lead-to-active conversion rate (e.g. 92%)
  avgTurnaroundDays: number;      // Turnaround time (TAT) to close/engage leads
  leadsHandled: number;          // Total leads engaged
  efficiencyRating: number;       // 1 - 5 score
  badgeLabel?: string;
}
