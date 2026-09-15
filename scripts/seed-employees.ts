import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const realEmployees = [
  {
    id: 'EMP-2026-001',
    name: 'M. Karan',
    email: 'karanking035@gmail.com',
    password: 'karanking035@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9704945077',
    gender: 'male',
    experience: 0,
    dob: '2000-12-19'
  },
  {
    id: 'EMP-2026-002',
    name: 'Rajesh',
    email: 'inkallurajesh9@gmail.com',
    password: 'inkallurajesh9@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9494477778',
    gender: 'male',
    experience: 0,
    dob: '1983-01-11'
  },
  {
    id: 'EMP-2026-003',
    name: 'P. Mahesh Babu',
    email: 'purrimaheshbabu@gmail.com',
    password: 'purrimaheshbabu@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9494906392',
    gender: 'male',
    experience: 0,
    dob: '1995-06-20'
  },
  {
    id: 'EMP-2026-004',
    name: 'G. Rambabu',
    email: 'rambabu@gmail.com',
    password: 'rambabu@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9493940820',
    gender: 'male',
    experience: 0,
    dob: null
  },
  {
    id: 'EMP-2026-005',
    name: 'S. Manoj Kumar',
    email: 'mrmandy222@gmail.com',
    password: 'mrmandy222@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9182867219',
    gender: 'male',
    experience: 0,
    dob: '2000-07-16'
  },
  {
    id: 'EMP-2026-006',
    name: 'T. Appalanaidu',
    email: 'appunaiduterli2345@gmail.com',
    password: 'appunaiduterli2345@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9951839088',
    gender: 'male',
    experience: 0,
    dob: '1995-06-15'
  },
  {
    id: 'EMP-2026-007',
    name: 'A. Hari Krishna',
    email: 'hemnathharry81@gmail.com',
    password: 'hemnathharry81@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9885728580',
    gender: 'male',
    experience: 0,
    dob: '1999-11-30'
  }
];

async function seed() {
  console.log('🚀 Starting employee seed process...');

  // 1. Delete all non-admin employees
  console.log('1️⃣ Deleting existing non-admin employees...');
  const { error: delErr } = await supabase
    .from('HRMS_employees')
    .delete()
    .eq('role', 'employee');

  if (delErr) {
    console.error('❌ Error deleting non-admin employees:', delErr);
    process.exit(1);
  }
  console.log('✅ Old non-admin employees deleted successfully.');

  // 2. Insert the 7 confirmed employees
  console.log('2️⃣ Inserting 7 new employees...');
  const { data: insertedEmps, error: insErr } = await supabase
    .from('HRMS_employees')
    .upsert(realEmployees, { onConflict: 'id' })
    .select('id, name, email, phone, role');

  if (insErr) {
    console.error('❌ Error inserting employees:', insErr);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted ${insertedEmps?.length || 0} employees:`);
  insertedEmps?.forEach(e => console.log(`   - [${e.id}] ${e.name} (${e.email}) | phone: ${e.phone}`));

  // 3. Insert leave balances for all 7
  console.log('3️⃣ Creating standard leave balances...');
  const leaveBalances: any[] = [];
  realEmployees.forEach(emp => {
    leaveBalances.push(
      { employee_id: emp.id, leave_type: 'sick', total_allotted: 6, used: 0 },
      { employee_id: emp.id, leave_type: 'casual', total_allotted: 8, used: 0 },
      { employee_id: emp.id, leave_type: 'paternity', total_allotted: 7, used: 0 }
    );
  });

  const { error: balErr } = await supabase
    .from('HRMS_leave_balances')
    .upsert(leaveBalances, { onConflict: 'employee_id,leave_type' });

  if (balErr) {
    console.warn('⚠️ Notice on leave balances insert:', balErr.message);
  } else {
    console.log(`✅ Leave balances allotted for all ${realEmployees.length} employees.`);
  }

  // 4. Final verification
  console.log('4️⃣ Final verification check from DB:');
  const { data: allEmps, error: fetchErr } = await supabase
    .from('HRMS_employees')
    .select('id, name, role, email, password, phone, dob')
    .order('id', { ascending: true });

  if (fetchErr) {
    console.error('❌ Error fetching employees for verification:', fetchErr);
  } else {
    console.log(`Total employees in DB: ${allEmps?.length}`);
    console.table(allEmps);
  }

  console.log('🎉 Seeding completed successfully!');
}

seed();
