import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addExecLeaveBalances() {
  const balances = [
    { employee_id: 'EMP-EXEC-001', leave_type: 'sick', total_allotted: 12, used: 0 },
    { employee_id: 'EMP-EXEC-001', leave_type: 'casual', total_allotted: 12, used: 0 },
    { employee_id: 'EMP-EXEC-002', leave_type: 'sick', total_allotted: 12, used: 0 },
    { employee_id: 'EMP-EXEC-002', leave_type: 'casual', total_allotted: 12, used: 0 },
  ];

  const { data, error } = await supabase
    .from('HRMS_leave_balances')
    .upsert(balances, { onConflict: 'employee_id,leave_type' })
    .select();

  console.log('Leave balances upsert:', data, error);
}

addExecLeaveBalances();
