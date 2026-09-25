// ====================================================================
// Analytics Service - Cognitive-Optimized Metrics Engine
// Aggregates Cost, Revenue, Time, and Resource data across
// Vizianagaram, Visakhapatnam, and Srikakulam.
// ====================================================================

import { DistrictId, DistrictOption, AnalyticalMetrics, TopPerformer } from '../../types/analytics.types';

export const DISTRICT_OPTIONS: DistrictOption[] = [
  {
    id: 'all',
    label: 'Overall (All 3 Districts)',
    shortLabel: 'All Districts',
    description: 'Consolidated view of Visakhapatnam, Vizianagaram, & Srikakulam'
  },
  {
    id: 'visakhapatnam',
    label: 'Visakhapatnam',
    shortLabel: 'Visakhapatnam',
    description: 'Urban healthcare hubs, corporate hospital chains & polyclinics'
  },
  {
    id: 'vizianagaram',
    label: 'Vizianagaram',
    shortLabel: 'Vizianagaram',
    description: 'Semi-urban retail chemists, dispensary clinics & nursing homes'
  },
  {
    id: 'srikakulam',
    label: 'Srikakulam',
    shortLabel: 'Srikakulam',
    description: 'Rural healthcare centers, primary care physicians & district medical stores'
  }
];

// District-specific baseline data store
const RAW_DISTRICT_DATA: Record<DistrictId, {
  name: string;
  totalLeads: number;
  costHoursPerLead: number;
  avgTurnaroundDays: number;
  activeConnectionsCount: number;
  contextHeadline: string;
  contextNarrative: string;
  efficiencyScore: number;
  anomaly?: string;
}> = {
  all: {
    name: 'Overall (All 3 Districts)',
    totalLeads: 1284,
    costHoursPerLead: 2.8,
    avgTurnaroundDays: 3.4,
    activeConnectionsCount: 685,
    contextHeadline: 'Consolidated Regional Efficiency at 88%',
    contextNarrative: 'Across North Coastal Andhra, resource networking has grown by 24% this quarter. Field representatives are closing leads 18% faster with an average turnaround time of 3.4 days.',
    efficiencyScore: 88,
    anomaly: 'Visakhapatnam holds 50% of the active professional connection network.'
  },
  visakhapatnam: {
    name: 'Visakhapatnam District',
    totalLeads: 620,
    costHoursPerLead: 2.3,
    avgTurnaroundDays: 2.6,
    activeConnectionsCount: 340,
    contextHeadline: 'High Lead Velocity & Corporate Hospital Penetration',
    contextNarrative: 'Visakhapatnam shows the lowest acquisition time per lead (2.3 hours). High density of specialist doctors and institutional chemists is driving rapid conversion cycles.',
    efficiencyScore: 93
  },
  vizianagaram: {
    name: 'Vizianagaram District',
    totalLeads: 395,
    costHoursPerLead: 3.1,
    avgTurnaroundDays: 3.8,
    activeConnectionsCount: 215,
    contextHeadline: 'Steady Retail Chemist Expansion',
    contextNarrative: 'Vizianagaram representatives maintain high doctor relationship retention. Lead turnaround is 3.8 days with solid repeat prescription engagement from nursing homes.',
    efficiencyScore: 84
  },
  srikakulam: {
    name: 'Srikakulam District',
    totalLeads: 269,
    costHoursPerLead: 3.6,
    avgTurnaroundDays: 4.2,
    activeConnectionsCount: 130,
    contextHeadline: 'High-Touch Outreach with Growing Territory Coverage',
    contextNarrative: 'Srikakulam travel times increase human hours per lead (3.6 hrs), but customer connection loyalty remains exceptionally high at 92% doctor retention.',
    efficiencyScore: 79,
    anomaly: 'Travel buffer time between clinics is 35% higher due to geographic spread.'
  }
};

/**
 * Fetch calculated 3-Pillar metrics normalized for pie/donut chart visualization
 */
export function getAnalyticalMetrics(district: DistrictId): AnalyticalMetrics {
  const data = RAW_DISTRICT_DATA[district] || RAW_DISTRICT_DATA.all;

  // Normalized slice proportions for Cost, Time, Resource (sum = 100%)
  let proportions: { cost: number; time: number; resource: number };

  switch (district) {
    case 'visakhapatnam':
      proportions = { cost: 26, time: 34, resource: 40 };
      break;
    case 'vizianagaram':
      proportions = { cost: 34, time: 34, resource: 32 };
      break;
    case 'srikakulam':
      proportions = { cost: 42, time: 34, resource: 24 };
      break;
    case 'all':
    default:
      proportions = { cost: 32, time: 33, resource: 35 };
      break;
  }

  return {
    district,
    districtName: data.name,
    totalLeadsEvaluated: data.totalLeads,
    pillars: {
      cost: {
        id: 'cost',
        name: 'Cost (Effort per Lead)',
        tagline: 'Time & human hours spent securing each lead',
        rawDisplayValue: `${data.costHoursPerLead} hrs`,
        normalizedPercentage: proportions.cost,
        colorHex: '#F59E0B', // Amber
        twTextClass: 'text-amber-500',
        twBgClass: 'bg-amber-500',
        twBorderClass: 'border-amber-400',
        unit: 'hrs/lead',
        insightSummary: `Field reps spend ~${data.costHoursPerLead}h active work time per qualified lead.`,
        details: [
          { label: 'Time Spent Per Lead', value: `${data.costHoursPerLead} hrs` },
          { label: 'Travel Buffer Ratio', value: district === 'srikakulam' ? '38%' : '22%' },
          { label: 'Visit Frequency', value: '2.4 calls/lead' }
        ]
      },
      time: {
        id: 'time',
        name: 'Time (Turnaround & Workflow)',
        tagline: 'Speed of employee workflow from lead to conversion',
        rawDisplayValue: `${data.avgTurnaroundDays} days`,
        normalizedPercentage: proportions.time,
        colorHex: '#0EA5E9', // Sky/Cyan
        twTextClass: 'text-sky-500',
        twBgClass: 'bg-sky-500',
        twBorderClass: 'border-sky-400',
        unit: 'days TAT',
        insightSummary: `Average turnaround from introduction to closed prescription is ${data.avgTurnaroundDays} days.`,
        details: [
          { label: 'Avg Turnaround (TAT)', value: `${data.avgTurnaroundDays} Days` },
          { label: 'Workflow Milestone Velocity', value: '4.8 steps/week' },
          { label: 'Follow-up Lag', value: '< 24 Hours' }
        ]
      },
      resource: {
        id: 'resource',
        name: 'Resource (Network Connections)',
        tagline: 'Doctor & chemist network cultivated by employees',
        rawDisplayValue: `${data.activeConnectionsCount} nodes`,
        normalizedPercentage: proportions.resource,
        colorHex: '#8B5CF6', // Purple/Violet
        twTextClass: 'text-purple-500',
        twBgClass: 'bg-purple-500',
        twBorderClass: 'border-purple-400',
        unit: 'connections',
        insightSummary: `${data.activeConnectionsCount} active doctor and retail pharmacy nodes cultivated.`,
        details: [
          { label: 'Active Professional Connections', value: `${data.activeConnectionsCount} Nodes` },
          { label: 'Connections-to-Lead Ratio', value: '1 node : 1.8 leads' },
          { label: 'Network Expansion Rate', value: '+14% MoM' }
        ]
      }
    },
    contextSummary: {
      headline: data.contextHeadline,
      narrative: data.contextNarrative,
      primaryEfficiencyScore: data.efficiencyScore,
      anomalyAlert: data.anomaly
    }
  };
}

// Master pool of field medical representatives across the 3 districts
// NOTE: REVENUE IS STRICTLY EXCLUDED as requested
const MASTER_FIELD_REPRESENTATIVES: Omit<TopPerformer, 'rank'>[] = [
  {
    id: 'emp-vskp-1',
    name: 'Rajesh Kumar Naidu',
    role: 'Senior Medical Representative',
    district: 'visakhapatnam',
    districtLabel: 'Visakhapatnam',
    connectionsCount: 48,
    conversionRatePercent: 94,
    avgTurnaroundDays: 1.8,
    leadsHandled: 84,
    efficiencyRating: 5,
    badgeLabel: 'District Top Performer'
  },
  {
    id: 'emp-vskp-2',
    name: 'P. Anitha Reddy',
    role: 'Territory Specialist',
    district: 'visakhapatnam',
    districtLabel: 'Visakhapatnam',
    connectionsCount: 42,
    conversionRatePercent: 91,
    avgTurnaroundDays: 2.1,
    leadsHandled: 76,
    efficiencyRating: 5,
    badgeLabel: 'Lead Conversion Ace'
  },
  {
    id: 'emp-vzm-1',
    name: 'M. Sravani Rao',
    role: 'Area Medical Executive',
    district: 'vizianagaram',
    districtLabel: 'Vizianagaram',
    connectionsCount: 39,
    conversionRatePercent: 89,
    avgTurnaroundDays: 2.3,
    leadsHandled: 68,
    efficiencyRating: 5,
    badgeLabel: 'Network Champion'
  },
  {
    id: 'emp-sklm-1',
    name: 'K. Suresh Varma',
    role: 'Senior Field Representative',
    district: 'srikakulam',
    districtLabel: 'Srikakulam',
    connectionsCount: 36,
    conversionRatePercent: 87,
    avgTurnaroundDays: 2.5,
    leadsHandled: 62,
    efficiencyRating: 4,
    badgeLabel: 'Relationship Leader'
  },
  {
    id: 'emp-vskp-3',
    name: 'V. Kalyan Chakravarthy',
    role: 'Hospital Relationship Manager',
    district: 'visakhapatnam',
    districtLabel: 'Visakhapatnam',
    connectionsCount: 34,
    conversionRatePercent: 86,
    avgTurnaroundDays: 2.4,
    leadsHandled: 59,
    efficiencyRating: 4,
    badgeLabel: 'Speed Master'
  },
  {
    id: 'emp-vzm-2',
    name: 'V. Ramesh Babu',
    role: 'Field Representative',
    district: 'vizianagaram',
    districtLabel: 'Vizianagaram',
    connectionsCount: 31,
    conversionRatePercent: 84,
    avgTurnaroundDays: 2.8,
    leadsHandled: 54,
    efficiencyRating: 4
  },
  {
    id: 'emp-vzm-3',
    name: 'G. Lakshmi Prasanna',
    role: 'Pharma Business Executive',
    district: 'vizianagaram',
    districtLabel: 'Vizianagaram',
    connectionsCount: 29,
    conversionRatePercent: 82,
    avgTurnaroundDays: 3.0,
    leadsHandled: 51,
    efficiencyRating: 4
  },
  {
    id: 'emp-vzm-4',
    name: 'B. Venkat Rao',
    role: 'Field Officer',
    district: 'vizianagaram',
    districtLabel: 'Vizianagaram',
    connectionsCount: 26,
    conversionRatePercent: 80,
    avgTurnaroundDays: 3.2,
    leadsHandled: 47,
    efficiencyRating: 4
  },
  {
    id: 'emp-vzm-5',
    name: 'T. Harish',
    role: 'Junior Medical Rep',
    district: 'vizianagaram',
    districtLabel: 'Vizianagaram',
    connectionsCount: 23,
    conversionRatePercent: 78,
    avgTurnaroundDays: 3.5,
    leadsHandled: 41,
    efficiencyRating: 3
  },
  {
    id: 'emp-sklm-2',
    name: 'D. Sai Krishna',
    role: 'Field Territory Executive',
    district: 'srikakulam',
    districtLabel: 'Srikakulam',
    connectionsCount: 27,
    conversionRatePercent: 83,
    avgTurnaroundDays: 2.9,
    leadsHandled: 48,
    efficiencyRating: 4
  },
  {
    id: 'emp-sklm-3',
    name: 'N. Padmavathi',
    role: 'Medical Representative',
    district: 'srikakulam',
    districtLabel: 'Srikakulam',
    connectionsCount: 24,
    conversionRatePercent: 81,
    avgTurnaroundDays: 3.1,
    leadsHandled: 44,
    efficiencyRating: 4
  },
  {
    id: 'emp-sklm-4',
    name: 'Y. Jagadeesh',
    role: 'Field Executive',
    district: 'srikakulam',
    districtLabel: 'Srikakulam',
    connectionsCount: 22,
    conversionRatePercent: 79,
    avgTurnaroundDays: 3.4,
    leadsHandled: 39,
    efficiencyRating: 3
  },
  {
    id: 'emp-sklm-5',
    name: 'P. Govinda Rao',
    role: 'Field Officer',
    district: 'srikakulam',
    districtLabel: 'Srikakulam',
    connectionsCount: 20,
    conversionRatePercent: 76,
    avgTurnaroundDays: 3.7,
    leadsHandled: 35,
    efficiencyRating: 3
  }
];

/**
 * Get Top 5 employees for a given district or overall.
 * Sorted by connections count and conversion efficiency.
 * Revenue is explicitly omitted.
 */
export function getTopPerformers(district: DistrictId): TopPerformer[] {
  let pool = [...MASTER_FIELD_REPRESENTATIVES];

  if (district !== 'all') {
    pool = pool.filter(emp => emp.district === district);
  }

  // Sort by composite performance score:
  // Weight: Connections (50%) + Conversion Rate (30%) + TAT Speed (20%)
  pool.sort((a, b) => {
    const scoreA = (a.connectionsCount * 2) + (a.conversionRatePercent * 1) - (a.avgTurnaroundDays * 10);
    const scoreB = (b.connectionsCount * 2) + (b.conversionRatePercent * 1) - (b.avgTurnaroundDays * 10);
    return scoreB - scoreA;
  });

  // Take top 5 and assign rank
  return pool.slice(0, 5).map((emp, index) => ({
    ...emp,
    rank: index + 1
  }));
}
