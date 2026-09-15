import { supabase } from '../supabase-client';

export interface PayrollTier {
  id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  hra: number;
  ma: number;
  ca: number;
}

export interface PayrollConfig {
  payroll_tiers?: PayrollTier[];
  [key: string]: any;
}

export const defaultPayrollTiers: PayrollTier[] = [
  { id: '1', name: 'Tier 1: Basic Salary Below ₹10,000', minSalary: 0, maxSalary: 9999, hra: 2000, ma: 1500, ca: 1000 },
  { id: '2', name: 'Tier 2: Basic Salary Exactly ₹10,000', minSalary: 10000, maxSalary: 10000, hra: 3000, ma: 2000, ca: 1500 },
  { id: '3', name: 'Tier 3: Basic Salary Above ₹10,000', minSalary: 10001, maxSalary: 9999999, hra: 4800, ma: 2000, ca: 1500 }
];

export const defaultPayrollConfig: PayrollConfig = {
  payroll_tiers: [...defaultPayrollTiers],
  // Deductions
  pf_percent: 12,
  professional_tax: 200,
  
  // Legacy fields (kept for backward compatibility during migration)
  hra_fixed: 4800,
  medical_allowance: 2000,
  conveyance_allowance: 1500,
};

export async function fetchPayrollConfig(): Promise<PayrollConfig> {
  const { data, error } = await supabase
    .from('pharma_hrms_payroll_config')
    .select('config_key, config_value, label');

  if (error) {
    console.warn("Failed to fetch payroll config, using defaults:", error);
    return { ...defaultPayrollConfig, payroll_tiers: [...defaultPayrollTiers] };
  }

  const config: PayrollConfig = { ...defaultPayrollConfig, payroll_tiers: [...defaultPayrollTiers] };
  
  if (data) {
    let hasCustomTiers = false;
    data.forEach((row) => {
      if (row.config_key === 'payroll_tiers_json' && row.label) {
        try {
          config.payroll_tiers = JSON.parse(row.label);
          hasCustomTiers = true;
        } catch (e) {
          console.error("Failed to parse dynamic payroll tiers:", e);
        }
      } else if (row.config_key !== 'payroll_tiers_json') {
        config[row.config_key] = row.config_value;
      }
    });

    // Backwards compatibility: If no dynamic tiers are set, try to build them from legacy keys
    if (!hasCustomTiers && data.some(r => r.config_key.startsWith('tier'))) {
      config.payroll_tiers = [
        { 
          id: '1', name: 'Tier 1: Basic Salary Below ₹10,000', minSalary: 0, maxSalary: 9999, 
          hra: data.find(r => r.config_key === 'tier1_hra')?.config_value ?? 2000,
          ma: data.find(r => r.config_key === 'tier1_ma')?.config_value ?? 1500,
          ca: data.find(r => r.config_key === 'tier1_ca')?.config_value ?? 1000
        },
        { 
          id: '2', name: 'Tier 2: Basic Salary Exactly ₹10,000', minSalary: 10000, maxSalary: 10000, 
          hra: data.find(r => r.config_key === 'tier2_hra')?.config_value ?? 3000,
          ma: data.find(r => r.config_key === 'tier2_ma')?.config_value ?? 2000,
          ca: data.find(r => r.config_key === 'tier2_ca')?.config_value ?? 1500
        },
        { 
          id: '3', name: 'Tier 3: Basic Salary Above ₹10,000', minSalary: 10001, maxSalary: 9999999, 
          hra: data.find(r => r.config_key === 'tier3_hra')?.config_value ?? 4800,
          ma: data.find(r => r.config_key === 'tier3_ma')?.config_value ?? 2000,
          ca: data.find(r => r.config_key === 'tier3_ca')?.config_value ?? 1500
        }
      ];
    }
  }

  return config;
}

export async function upsertPayrollConfig(key: string, value: number, label?: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_payroll_config')
    .upsert({
      config_key: key,
      config_value: value,
      label: label,
      updated_at: new Date().toISOString()
    }, { onConflict: 'config_key' });

  if (error) {
    throw error;
  }
}

