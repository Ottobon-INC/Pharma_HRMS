-- ====================================================================
-- 01. PHARMA HRMS - CORE DATABASE SCHEMA
-- All 16 Tables formatted to pharma_hrms_* naming with idempotent column checks
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES
CREATE TABLE IF NOT EXISTS "pharma_hrms_employees" (
    "id" VARCHAR(255) PRIMARY KEY,
    "employee_code" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'employee',
    "designation" VARCHAR(255) NOT NULL,
    "joining_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "basic_pay" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "phone" VARCHAR(100),
    "gender" VARCHAR(10) DEFAULT 'male',
    "experience" NUMERIC(4, 1) DEFAULT 0.0,
    "dob" DATE,
    "hospital" VARCHAR(50) DEFAULT 'orca_labs',
    "branch" VARCHAR(50) DEFAULT 'corporate',
    "hierarchy_level" VARCHAR(50) NOT NULL DEFAULT 'be',
    "zone" VARCHAR(50) DEFAULT 'AP',
    "territory" VARCHAR(100),
    "reporting_to" VARCHAR(255),
    "cl_balance" INT DEFAULT 12,
    "pl_balance" INT DEFAULT 4,
    "bank_details" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "employee_code" VARCHAR(50);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "hospital" VARCHAR(50) DEFAULT 'orca_labs';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "branch" VARCHAR(50) DEFAULT 'corporate';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "hierarchy_level" VARCHAR(50) DEFAULT 'be';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "zone" VARCHAR(50) DEFAULT 'AP';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "territory" VARCHAR(100);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "reporting_to" VARCHAR(255);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "cl_balance" INT DEFAULT 12;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "pl_balance" INT DEFAULT 4;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "bank_details" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "joining_date" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "basic_pay" NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'active';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(100);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10) DEFAULT 'male';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "experience" NUMERIC(4, 1) DEFAULT 0.0;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "dob" DATE;

ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "joining_date" DROP NOT NULL;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "joining_date" SET DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "basic_pay" DROP NOT NULL;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "basic_pay" SET DEFAULT 0.00;

UPDATE "pharma_hrms_employees" SET "employee_code" = "id" WHERE "employee_code" IS NULL;

ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "pharma_hrms_employees_role_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "HRMS_employees_role_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "pharma_hrms_employees_hierarchy_level_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "HRMS_employees_hierarchy_level_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "pharma_hrms_employees_status_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "HRMS_employees_status_check";

-- 2. ATTENDANCE
CREATE TABLE IF NOT EXISTS "pharma_hrms_attendance" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(100) NOT NULL DEFAULT 'present',
    "check_in_time" TIME WITHOUT TIME ZONE,
    "check_out_time" TIME WITHOUT TIME ZONE,
    "check_in_location" TEXT,
    "check_in_lat_lng" VARCHAR(50),
    "check_in_photo_url" TEXT,
    "check_out_photo_url" TEXT,
    "punch_type" VARCHAR(50) DEFAULT 'in_office',
    "punch_note" TEXT,
    "session_number" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "check_in_lat_lng" VARCHAR(50);
ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "check_in_photo_url" TEXT;
ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "check_out_photo_url" TEXT;
ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "punch_type" VARCHAR(50) DEFAULT 'in_office';
ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "punch_note" TEXT;
ALTER TABLE "pharma_hrms_attendance" ADD COLUMN IF NOT EXISTS "session_number" INTEGER DEFAULT 1;

-- 3. BREAKS
CREATE TABLE IF NOT EXISTS "pharma_hrms_breaks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "start_time" TIMESTAMP WITH TIME ZONE,
    "end_time" TIMESTAMP WITH TIME ZONE,
    "reason" VARCHAR(100) DEFAULT 'Lunch Break',
    "duration_minutes" INT DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_breaks" ADD COLUMN IF NOT EXISTS "date" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_breaks" ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "pharma_hrms_breaks" ADD COLUMN IF NOT EXISTS "end_time" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "pharma_hrms_breaks" ADD COLUMN IF NOT EXISTS "reason" VARCHAR(100) DEFAULT 'Lunch Break';
ALTER TABLE "pharma_hrms_breaks" ADD COLUMN IF NOT EXISTS "duration_minutes" INT DEFAULT 0;

-- 4. CHAT CHANNELS
CREATE TABLE IF NOT EXISTS "pharma_hrms_chat_channels" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" VARCHAR(255),
    "type" VARCHAR(50) DEFAULT 'direct',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS "pharma_hrms_chat_messages" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "channel_id" UUID NOT NULL,
    "sender_id" VARCHAR(255) NOT NULL,
    "text" TEXT,
    "attachment_url" VARCHAR(255),
    "attachment_type" VARCHAR(50),
    "attachment_name" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DOCTOR LIST SUBMISSIONS
CREATE TABLE IF NOT EXISTS "pharma_hrms_doctor_list_submissions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "doctor_name" VARCHAR(255),
    "specialization" VARCHAR(255),
    "clinic_hospital_name" VARCHAR(255),
    "area" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "preferred_time" VARCHAR(50),
    "potential" VARCHAR(50) DEFAULT 'medium',
    "status" VARCHAR(50) DEFAULT 'pending',
    "submitted_by" VARCHAR(255),
    "approved_by" VARCHAR(255),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "doctor_name" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "specialization" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "clinic_hospital_name" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "area" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "city" VARCHAR(100);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "state" VARCHAR(100);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "preferred_time" VARCHAR(50);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "potential" VARCHAR(50) DEFAULT 'medium';
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "submitted_by" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "approved_by" VARCHAR(255);
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "pharma_hrms_doctor_list_submissions" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 7. DUTY ROSTER
CREATE TABLE IF NOT EXISTS "pharma_hrms_duty_roster" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "shift_date" DATE NOT NULL,
    "shift_start" TIME NOT NULL,
    "shift_end" TIME NOT NULL,
    "shift_label" VARCHAR(255),
    "notes" TEXT,
    "is_published" BOOLEAN DEFAULT FALSE,
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. FIELD SESSIONS
CREATE TABLE IF NOT EXISTS "pharma_hrms_field_sessions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "session_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP WITH TIME ZONE,
    "start_latitude" NUMERIC(10, 7),
    "start_longitude" NUMERIC(10, 7),
    "start_address" TEXT,
    "end_latitude" NUMERIC(10, 7),
    "end_longitude" NUMERIC(10, 7),
    "end_address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. FIELD VISITS
CREATE TABLE IF NOT EXISTS "pharma_hrms_field_visits" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" UUID,
    "employee_id" VARCHAR(255) NOT NULL,
    "assigned_by" VARCHAR(255),
    "visit_type" VARCHAR(100) NOT NULL DEFAULT 'DOCTOR_VISIT',
    "category" VARCHAR(50) DEFAULT 'doctor',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduled_date" DATE NOT NULL,
    "scheduled_start" VARCHAR(20),
    "scheduled_end" VARCHAR(20),
    "assigned_latitude" NUMERIC(10, 7),
    "assigned_longitude" NUMERIC(10, 7),
    "assigned_address" TEXT,
    "allowed_radius_meters" INTEGER DEFAULT 300,
    "priority" VARCHAR(20) DEFAULT 'normal',
    "status" VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    "started_at" TIMESTAMP WITH TIME ZONE,
    "arrived_at" TIMESTAMP WITH TIME ZONE,
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "actual_latitude" NUMERIC(10, 7),
    "actual_longitude" NUMERIC(10, 7),
    "actual_address" TEXT,
    "arrival_distance_m" NUMERIC(8, 2),
    "duration_minutes" INTEGER,
    "proof_photo_url" TEXT,
    "completion_notes" TEXT,
    "location_exception" BOOLEAN DEFAULT FALSE,
    "reschedule_reason" TEXT,
    "approval_status" VARCHAR(50) DEFAULT 'approved',
    "approved_by" VARCHAR(255),
    "rejection_reason" TEXT,
    "doctor_name" VARCHAR(255),
    "clinic_name" VARCHAR(255),
    "area" VARCHAR(255),
    "time_slot" VARCHAR(50),
    "visit_purpose" VARCHAR(255),
    "products_detailed" JSONB DEFAULT '[]'::jsonb,
    "samples_given" JSONB DEFAULT '[]'::jsonb,
    "pob_amount" NUMERIC(12, 2) DEFAULT 0.00,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) DEFAULT 'doctor';
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "approval_status" VARCHAR(50) DEFAULT 'approved';
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "approved_by" VARCHAR(255);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "doctor_name" VARCHAR(255);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "clinic_name" VARCHAR(255);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "area" VARCHAR(255);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "time_slot" VARCHAR(50);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "visit_purpose" VARCHAR(255);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "products_detailed" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "samples_given" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "pob_amount" NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "scheduled_start" VARCHAR(20);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "scheduled_end" VARCHAR(20);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "allowed_radius_meters" INTEGER DEFAULT 300;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "arrival_distance_m" NUMERIC(8, 2);
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "proof_photo_url" TEXT;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "completion_notes" TEXT;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "location_exception" BOOLEAN DEFAULT FALSE;
ALTER TABLE "pharma_hrms_field_visits" ADD COLUMN IF NOT EXISTS "reschedule_reason" TEXT;

-- 10. FIELD VISIT EVENTS
CREATE TABLE IF NOT EXISTS "pharma_hrms_field_visit_events" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "visit_id" UUID,
    "session_id" UUID,
    "employee_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "occurred_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "latitude" NUMERIC(10, 7),
    "longitude" NUMERIC(10, 7),
    "accuracy_m" NUMERIC(8, 2),
    "address" TEXT,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "synced" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. FIELD VISIT PROOFS
CREATE TABLE IF NOT EXISTS "pharma_hrms_field_visit_proofs" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "visit_id" UUID,
    "proof_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "captured_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "latitude" NUMERIC(10, 7),
    "longitude" NUMERIC(10, 7),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. INVOICES
CREATE TABLE IF NOT EXISTS "pharma_hrms_invoices" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "invoice_number" VARCHAR(255) UNIQUE NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "client_details" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "total" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "payable_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "created_by" VARCHAR(255),
    "due_date" DATE,
    "tax_percent" NUMERIC(5, 2) DEFAULT 18.00,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. LEAVE BALANCES
CREATE TABLE IF NOT EXISTS "pharma_hrms_leave_balances" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "leave_type" VARCHAR(100) NOT NULL,
    "total_allotted" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_leave_balances" DROP CONSTRAINT IF EXISTS "pharma_hrms_leave_balances_leave_type_check";
ALTER TABLE "pharma_hrms_leave_balances" DROP CONSTRAINT IF EXISTS "HRMS_leave_balances_leave_type_check";

-- 14. LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS "pharma_hrms_leave_requests" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "leave_type" VARCHAR(100) NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "submitted_at" DATE DEFAULT CURRENT_DATE,
    "admin_note" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_leave_requests" DROP CONSTRAINT IF EXISTS "pharma_hrms_leave_requests_leave_type_check";
ALTER TABLE "pharma_hrms_leave_requests" DROP CONSTRAINT IF EXISTS "HRMS_leave_requests_leave_type_check";
ALTER TABLE "pharma_hrms_leave_requests" DROP CONSTRAINT IF EXISTS "pharma_hrms_leave_requests_status_check";
ALTER TABLE "pharma_hrms_leave_requests" DROP CONSTRAINT IF EXISTS "HRMS_leave_requests_status_check";

-- 15. LOCATION PINS
CREATE TABLE IF NOT EXISTS "pharma_hrms_location_pins" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "visit_id" UUID,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "pinned_at" TIME WITHOUT TIME ZONE,
    "title" VARCHAR(255),
    "label" TEXT,
    "category" VARCHAR(100) DEFAULT 'Other',
    "description" TEXT,
    "note" TEXT,
    "photo_url" TEXT,
    "location_name" TEXT,
    "pin_type" VARCHAR(50) DEFAULT 'doctor_visit',
    "latitude" NUMERIC(10, 7) NOT NULL,
    "longitude" NUMERIC(10, 7) NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "visit_id" UUID;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "date" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "pinned_at" TIME WITHOUT TIME ZONE;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255);
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "category" VARCHAR(100) DEFAULT 'Other';
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "location_name" TEXT;
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "pin_type" VARCHAR(50) DEFAULT 'doctor_visit';
ALTER TABLE "pharma_hrms_location_pins" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- 16. MISSED PUNCHES
CREATE TABLE IF NOT EXISTS "pharma_hrms_missed_punches" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employee_id" VARCHAR(255) NOT NULL,
    "missed_date" DATE NOT NULL,
    "punch_type" VARCHAR(10) NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    "resolved_by" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_emp_code ON "pharma_hrms_employees"("employee_code");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_emp_reporting ON "pharma_hrms_employees"("reporting_to");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_visits_emp_date ON "pharma_hrms_field_visits"("employee_id", "scheduled_date");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_visits_approval ON "pharma_hrms_field_visits"("approval_status");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_att_emp_date ON "pharma_hrms_attendance"("employee_id", "date");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_doc_sub_emp ON "pharma_hrms_doctor_list_submissions"("employee_id");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_doc_sub_status ON "pharma_hrms_doctor_list_submissions"("status");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_pins_emp ON "pharma_hrms_location_pins"("employee_id");
CREATE INDEX IF NOT EXISTS idx_pharma_hrms_chat_msg_chan ON "pharma_hrms_chat_messages"("channel_id");

-- Enable RLS with permissive policies
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'pharma_hrms_attendance', 'pharma_hrms_breaks', 'pharma_hrms_chat_channels',
    'pharma_hrms_chat_messages', 'pharma_hrms_doctor_list_submissions', 'pharma_hrms_duty_roster',
    'pharma_hrms_employees', 'pharma_hrms_field_sessions', 'pharma_hrms_field_visit_events',
    'pharma_hrms_field_visit_proofs', 'pharma_hrms_field_visits', 'pharma_hrms_invoices',
    'pharma_hrms_leave_balances', 'pharma_hrms_leave_requests', 'pharma_hrms_location_pins',
    'pharma_hrms_missed_punches'
  ]
  LOOP
    EXECUTE format('ALTER TABLE "%I" ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON "%I";', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_all" ON "%I" FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
