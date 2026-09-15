import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function safeDelete(table: string, filterCol = 'id', filterVal = '00000000-0000-0000-0000-000000000000') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await supabase.from(table).delete().neq(filterCol, filterVal);
      if (res.error) {
        console.warn(`  ⚠️ ${table} attempt ${attempt} error:`, res.error.message);
      } else {
        console.log(`  ✅ ${table}: successfully deleted.`);
        return;
      }
    } catch (e: any) {
      console.warn(`  ⚠️ ${table} attempt ${attempt} fetch failed:`, e.message);
    }
    await sleep(1000);
  }
}

async function resetTestData() {
  console.log('🔄 Starting Production Reset...');

  console.log('1️⃣ Clearing Field Ops test data...');
  await safeDelete('HRMS_field_visit_proofs');
  await sleep(500);
  await safeDelete('HRMS_field_visit_events');
  await sleep(500);
  await safeDelete('HRMS_field_visit_positions');
  await sleep(500);
  await safeDelete('HRMS_field_visit_pins');
  await sleep(500);
  await safeDelete('HRMS_field_visits');
  await sleep(500);
  await safeDelete('HRMS_field_sessions');
  await sleep(500);

  console.log('2️⃣ Clearing Tasks & Work Assignments...');
  await safeDelete('HRMS_tasks');
  await sleep(500);

  console.log('3️⃣ Clearing Attendance & Breaks...');
  await safeDelete('HRMS_breaks');
  await sleep(500);
  await safeDelete('HRMS_attendance');
  await sleep(500);

  console.log('4️⃣ Clearing Leaves, Advances, Missed Punches...');
  await safeDelete('HRMS_leave_requests');
  await sleep(500);
  await safeDelete('HRMS_advance_requests');
  await sleep(500);
  await safeDelete('HRMS_missed_punches');
  await sleep(500);

  console.log('5️⃣ Clearing Live Location Pins & Duty Roster...');
  await safeDelete('HRMS_location_pins');
  await sleep(500);
  await safeDelete('HRMS_duty_roster');
  await sleep(500);
  await safeDelete('HRMS_chat_messages');
  await sleep(500);

  console.log('6️⃣ Resetting leave balances used = 0...');
  try {
    const { error: balErr } = await supabase
      .from('HRMS_leave_balances')
      .update({ used: 0 })
      .gte('used', 0);
    console.log('  HRMS_leave_balances reset:', balErr?.message || '✅ successfully reset used to 0');
  } catch (e: any) {
    console.warn('  ⚠️ HRMS_leave_balances error:', e.message);
  }

  // 7. Verification of remaining counts
  console.log('\n📊 VERIFICATION POST-CLEANUP:');
  const verifyTables = [
    'HRMS_employees',
    'HRMS_attendance',
    'HRMS_breaks',
    'HRMS_leave_requests',
    'HRMS_tasks',
    'HRMS_field_sessions',
    'HRMS_field_visits',
    'HRMS_field_visit_events',
    'HRMS_field_visit_proofs',
    'HRMS_duty_roster',
    'HRMS_office_locations',
    'HRMS_leave_balances'
  ];

  for (const t of verifyTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${error ? error.message : count} rows`);
  }

  console.log('\n✨ Reset completed!');
}

resetTestData();
