import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncHierarchyEmployees() {
  console.log('1. Checking existing Ravi Kumar...');
  const { data: ravi, error: raviFetchErr } = await supabase
    .from('HRMS_employees')
    .select('*')
    .or('id.eq.EMP-2026-011,name.ilike.%Ravi Kumar%');

  console.log('Ravi found:', ravi, raviFetchErr);

  console.log('2. Updating Ravi Kumar to Manager/Admin...');
  const { data: updateRavi, error: updateRaviErr } = await supabase
    .from('HRMS_employees')
    .update({
      role: 'admin',
      designation: 'Branch Operations Manager',
      hierarchy_level: 'manager'
    })
    .or('id.eq.EMP-2026-011,name.ilike.%Ravi Kumar%')
    .select();

  console.log('Update Ravi result:', updateRavi, updateRaviErr);

  console.log('3. Inserting/Upserting Indra Mam...');
  const indraData = {
    id: 'EMP-EXEC-001',
    name: 'Indra Mam',
    email: 'indra@vizagivf.com',
    password: 'password',
    role: 'admin',
    designation: 'Executive Director',
    joining_date: '2026-01-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9999999901',
    gender: 'female',
    experience: 10.0,
    hierarchy_level: 'executive'
  };

  const { data: insertIndra, error: indraErr } = await supabase
    .from('HRMS_employees')
    .upsert([indraData])
    .select();

  console.log('Insert Indra result:', insertIndra, indraErr);

  console.log('4. Inserting/Upserting Anoopama Mam...');
  const anoopamaData = {
    id: 'EMP-EXEC-002',
    name: 'Anoopama Mam',
    email: 'anoopama@vizagivf.com',
    password: 'password',
    role: 'admin',
    designation: 'Executive Director',
    joining_date: '2026-01-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9999999902',
    gender: 'female',
    experience: 10.0,
    hierarchy_level: 'executive'
  };

  const { data: insertAnoopama, error: anoopamaErr } = await supabase
    .from('HRMS_employees')
    .upsert([anoopamaData])
    .select();

  console.log('Insert Anoopama result:', insertAnoopama, anoopamaErr);
}

syncHierarchyEmployees();
