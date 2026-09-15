import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const batch2Employees = [
  {
    id: 'EMP-2026-008',
    name: 'Shiva Kumar',
    email: 'balivada.shiva@gmail.com',
    password: 'balivada.shiva@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '846018424',
    gender: 'male',
    experience: 0,
    dob: '1989-08-06'
  },
  {
    id: 'EMP-2026-009',
    name: 'Gondu Srinivasa Rao',
    email: 'gondusrinivaskrishna@gmail.com',
    password: 'gondusrinivaskrishna@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9705686880',
    gender: 'male',
    experience: 0,
    dob: '1988-06-20'
  },
  {
    id: 'EMP-2026-010',
    name: 'Dhanusha Dadi',
    email: 'dhanushadadi88@gmail.com',
    password: 'dhanushadadi88@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '8008668844',
    gender: 'female',
    experience: 0,
    dob: '1993-09-03'
  },
  {
    id: 'EMP-2026-011',
    name: 'R. Ravi Kumar',
    email: 'ravildm09@gmail.com',
    password: 'ravildm09@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9182068148',
    gender: 'male',
    experience: 0,
    dob: '1978-06-01'
  },
  {
    id: 'EMP-2026-012',
    name: 'Gonti Shyam',
    email: 'sanjushyam7382@gmail.com',
    password: 'sanjushyam7382@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '7331140843',
    gender: 'male',
    experience: 0,
    dob: '2001-03-06'
  },
  {
    id: 'EMP-2026-013',
    name: 'U. Jayavani',
    email: 'ugrangijaya@gmail.com',
    password: 'ugrangijaya@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '8500880441',
    gender: 'female',
    experience: 0,
    dob: '1990-02-23'
  },
  {
    id: 'EMP-2026-014',
    name: 'S. Kishore Reddy',
    email: 'sattikishorereddy@gmail.com',
    password: 'sattikishorereddy@gmail.com',
    role: 'employee',
    designation: 'Employee',
    joining_date: '2026-09-01',
    basic_pay: 0.00,
    status: 'active',
    phone: '9959004840',
    gender: 'male',
    experience: 0,
    dob: '1988-06-28'
  }
];

async function seedBatch2() {
  console.log('🚀 Starting Batch 2 employee insertion...');

  // 1. Insert employees
  const { data: inserted, error: insErr } = await supabase
    .from('HRMS_employees')
    .upsert(batch2Employees, { onConflict: 'id' })
    .select('id, name, email, phone, role, gender');

  if (insErr) {
    console.error('❌ Error inserting batch 2 employees:', insErr);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted ${inserted?.length || 0} employees:`);
  inserted?.forEach(e => console.log(`   - [${e.id}] ${e.name} (${e.email}) | phone: ${e.phone} | gender: ${e.gender}`));

  // 2. Insert standard leave balances
  console.log('2️⃣ Setting up standard leave balances...');
  const leaveBalances: any[] = [];
  batch2Employees.forEach(emp => {
    leaveBalances.push(
      { employee_id: emp.id, leave_type: 'sick', total_allotted: 6, used: 0 },
      { employee_id: emp.id, leave_type: 'casual', total_allotted: 8, used: 0 }
    );
    if (emp.gender === 'female') {
      leaveBalances.push({ employee_id: emp.id, leave_type: 'maternity', total_allotted: 90, used: 0 });
    } else {
      leaveBalances.push({ employee_id: emp.id, leave_type: 'paternity', total_allotted: 7, used: 0 });
    }
  });

  const { error: balErr } = await supabase
    .from('HRMS_leave_balances')
    .upsert(leaveBalances, { onConflict: 'employee_id,leave_type' });

  if (balErr) {
    console.warn('⚠️ Notice on leave balances insert:', balErr.message);
  } else {
    console.log(`✅ Leave balances allotted for all ${batch2Employees.length} batch 2 employees.`);
  }

  // 3. Final verification of all employees in DB
  console.log('3️⃣ Final verification check from DB:');
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

  console.log('🎉 Batch 2 seeding completed successfully!');
}

seedBatch2();
