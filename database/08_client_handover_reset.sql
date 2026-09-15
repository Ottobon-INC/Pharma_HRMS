-- ====================================================================
-- 08. CLIENT HANDOVER DATABASE RESET (PRISTINE DAY-1 STATE)
-- ORCA LABS PHARMA HRMS
--
-- Instructions:
-- Run this script in the Supabase SQL Editor to reset the database
-- for official client handover. It safely clears all demo/test logs,
-- resets leave quotas, and restores the 35 official personnel.
-- ====================================================================

BEGIN;

-- 1. Ensure tasks table & columns are up to date
CREATE TABLE IF NOT EXISTS pharma_hrms_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'incomplete')),
    due_date DATE DEFAULT CURRENT_DATE,
    assigned_to VARCHAR(255) REFERENCES pharma_hrms_employees(id) ON DELETE SET NULL,
    created_by VARCHAR(255) REFERENCES pharma_hrms_employees(id) ON DELETE SET NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    approval_status TEXT DEFAULT 'not_required' CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    approval_note TEXT,
    approved_by VARCHAR(255) REFERENCES pharma_hrms_employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pharma_hrms_tasks
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_required'
    CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approval_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255) REFERENCES pharma_hrms_employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pharma_tasks_approval_status ON pharma_hrms_tasks(approval_status);
CREATE INDEX IF NOT EXISTS idx_pharma_tasks_assigned_to ON pharma_hrms_tasks(assigned_to);

-- 2. Safely Purge Operational Tables (Checks for table existence to prevent 42P01 errors)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'pharma_hrms_field_visit_proofs',
    'pharma_hrms_field_visit_events',
    'pharma_hrms_field_visits',
    'pharma_hrms_breaks',
    'pharma_hrms_field_sessions',
    'pharma_hrms_attendance',
    'pharma_hrms_tasks',
    'pharma_hrms_doctor_list_submissions',
    'pharma_hrms_leave_requests',
    'pharma_hrms_location_pins',
    'pharma_hrms_missed_punches',
    'pharma_hrms_message_reads',
    'pharma_hrms_chat_messages',
    'pharma_hrms_chat_participants',
    'pharma_hrms_chat_channels',
    'pharma_hrms_invoices',
    'pharma_hrms_payroll',
    'pharma_hrms_advance_requests',
    'pharma_hrms_special_event_assignees',
    'pharma_hrms_special_location_events',
    'pharma_hrms_duty_roster'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE 'DELETE FROM public.' || quote_ident(tbl);
    END IF;
  END LOOP;
END $$;

-- 3. Purge Test / Non-Orca Employees
DO $$
BEGIN
  IF to_regclass('public.pharma_hrms_leave_balances') IS NOT NULL THEN
    DELETE FROM pharma_hrms_leave_balances WHERE employee_id NOT LIKE 'OL%';
  END IF;
END $$;

DELETE FROM pharma_hrms_employees WHERE id NOT LIKE 'OL%' OR id = 'OL001';

-- 4. Upsert Pristine Official 35 Personnel with Standard Credentials
INSERT INTO pharma_hrms_employees (
    id, employee_code, name, email, password, phone,
    designation, role, hierarchy_level, zone, reporting_to, cl_balance, pl_balance, status, joining_date, basic_pay
) VALUES
-- 1. Corporate Leadership & Admins
('OL009', 'OL009', 'N V DIVYA SIRISHA', 'admin.hr@orcalabs.in', 'admin.hr@orcalabs.in', '9348292555', 'HR & FIN', 'admin', 'admin', 'Corporate', NULL, 12, 4, 'active', CURRENT_DATE, 0.00),
('OL026', 'OL026', 'P ASWANI', 'ap.gm@orcalabs.in', 'ap.gm@orcalabs.in', '8374959148', 'GM', 'admin', 'admin', 'Corporate', NULL, 12, 4, 'active', CURRENT_DATE, 0.00),

-- 2. Zonal Sales Managers (ZSM)
('OL004', 'OL004', 'B V JANARDHAN', 'janardhan.bv@yahoo.com', 'janardhan.bv@yahoo.com', '8096380380', 'ZSM(AP)', 'manager', 'zsm', 'AP', 'OL026', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL003', 'OL003', 'Ramendra Kumar', 'ramendrakumar1213@gmail.com', 'ramendrakumar1213@gmail.com', '8074838509', 'ZSM(TS)', 'manager', 'zsm', 'TS', 'OL026', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 3. Regional Sales Managers (RSM) - AP Zone (Reporting to B V Janardhan - OL004)
('OL002', 'OL002', 'G.A.Naidu', 'naidugumpana0710@gmail.com', 'naidugumpana0710@gmail.com', '9515889928', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL023', 'OL023', 'K NAGESWARA RAO', 'nageswararaokokkirala1@gmail.com', 'nageswararaokokkirala1@gmail.com', '9246623369', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL015', 'OL015', 'B V SATYANARAYANA', 'SATYANANI1983@GMAIL.COM', 'SATYANANI1983@GMAIL.COM', '9985432144', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL019', 'OL019', 'Byrisetty Ravi', 'ravi8073994795@gmail.com', 'ravi8073994795@gmail.com', '8073994795', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL005', 'OL005', 'Lanka Dhana Veera Venkata Rao', 'venkatraolanka22@gmail.com', 'venkatraolanka22@gmail.com', '9849392564', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 4. Regional Sales Managers (RSM) - TS Zone (Reporting to Ramendra Kumar - OL003)
('OL011', 'OL011', 'P Ravinder Reddy', 'ravinder5408@yahoo.co.in', 'ravinder5408@yahoo.co.in', '9177082666', 'RSM', 'manager', 'rsm', 'TS', 'OL003', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL032', 'OL032', 'Tadapnuri Laxminarayana', 'laxman.pharmacy@gmail.com', 'laxman.pharmacy@gmail.com', '9948272864', 'RSM', 'manager', 'rsm', 'TS', 'OL003', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 5. Business Executives (BE) - AP Zone: under G. A. Naidu (OL002)
('OL013', 'OL013', 'J POLIRAJU', 'jpraju796@gmail.com', 'jpraju796@gmail.com', '7569453583', 'BE', 'employee', 'be', 'AP', 'OL002', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL043', 'OL043', 'P. SHIVA', 'shiva001.p@gmail.com', 'shiva001.p@gmail.com', '9948321560', 'BE', 'employee', 'be', 'AP', 'OL002', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 6. Business Executives (BE) - AP Zone: under K. Nageswara Rao (OL023)
('OL010', 'OL010', 'E S SURYA PRAKASH YADAV', 'nammiprakash5@gmail.com', 'nammiprakash5@gmail.com', '8179993763', 'BE', 'employee', 'be', 'AP', 'OL023', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL029', 'OL029', 'L NAVEEN', 'naveenlukulapu01@gmail.com', 'naveenlukulapu01@gmail.com', '8688593606', 'BE', 'employee', 'be', 'AP', 'OL023', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 7. Business Executives (BE) - AP Zone: under B. V. Satyanarayana (OL015)
('OL024', 'OL024', 'R.VENKATA SAITEJA', 'saitejavenkata19@gmail.com', 'saitejavenkata19@gmail.com', '9908663523', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL007', 'OL007', 'K.Karthiek', 'karthiek1987@gmail.com', 'karthiek1987@gmail.com', '9703009755', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL025', 'OL025', 'PATHAN INJUMAM KHAN', 'INJUMAM.DEV@GMAIL.COM', 'INJUMAM.DEV@GMAIL.COM', '6300067510', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL035', 'OL035', 'BURRI TIRUPATHI RAO', 'WWWTIRUPATHI29@GMAIL.COM', 'WWWTIRUPATHI29@GMAIL.COM', '9182179233', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL036', 'OL036', 'EKKIRALA SURENDRA', 'SURENDRACHOWDARY236@GMAIL.COM', 'SURENDRACHOWDARY236@GMAIL.COM', '6281257295', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL034', 'OL034', 'Syed Hayath Basha', 'SDHAYATHBASHA7@GMAIL.COM', 'SDHAYATHBASHA7@GMAIL.COM', '8686924736', 'BE', 'employee', 'be', 'AP', 'OL015', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 8. Business Executives (BE) - AP Zone: under Byrisetty Ravi (OL019)
('OL028', 'OL028', 'V MAHESH', 'maheshvadanapalli786@gmail.com', 'maheshvadanapalli786@gmail.com', '9177101334', 'BE', 'employee', 'be', 'AP', 'OL019', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL041', 'OL041', 'V SUDHAKAR', 'vaddesudhakar75771@gmail.com', 'vaddesudhakar75771@gmail.com', '8688993153', 'BE', 'employee', 'be', 'AP', 'OL019', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL044', 'OL044', 'P NAGARAJU', 'nagarajupeddigani@gmail.com', 'nagarajupeddigani@gmail.com', '9642140314', 'BE', 'employee', 'be', 'AP', 'OL019', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL018', 'OL018', 'D Nagaraj', 'duggineningrj97@gmail.com', 'duggineningrj97@gmail.com', '9160466942', 'BE', 'employee', 'be', 'AP', 'OL019', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 9. Business Executives (BE) - AP Zone: under LDV Venkat Rao (OL005)
('OL037', 'OL037', 'GALI SANTHOSH BABU', 'galisanthoshbabu143@gmail.com', 'galisanthoshbabu143@gmail.com', '9701836995', 'BE', 'employee', 'be', 'AP', 'OL005', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL038', 'OL038', 'P SANTHOSH KUMAR', 'SANTHOSHKUMARPARAMBILLI@GMAIL.COM', 'SANTHOSHKUMARPARAMBILLI@GMAIL.COM', '8919961199', 'BE', 'employee', 'be', 'AP', 'OL005', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL040', 'OL040', 'P VEERESH', 'patnalaveeresh@gmail.com', 'patnalaveeresh@gmail.com', '7013133636', 'BE', 'employee', 'be', 'AP', 'OL005', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 10. Business Executives (BE) - TS Zone: under P Ravinder Reddy (OL011)
('OL045', 'OL045', 'M. KIRAN', 'm.kiran@orcalabs.in', 'm.kiran@orcalabs.in', '9876543210', 'BE', 'employee', 'be', 'TS', 'OL011', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL033', 'OL033', 'N Lakshmi Reddy', 'nussamlakshmireddy@gmail.com', 'nussamlakshmireddy@gmail.com', '7013382967', 'BE', 'employee', 'be', 'TS', 'OL011', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL021', 'OL021', 'R Veerabhadram', 'bhadramreddimalla@gmail.com', 'bhadramreddimalla@gmail.com', '9010115696', 'BE', 'employee', 'be', 'TS', 'OL011', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 11. Business Executives (BE) - TS Zone: Direct under Ramendra Kumar (OL003)
('OL006', 'OL006', 'Thirupathi Aedla', 'thirupathi2341@gmail.com', 'thirupathi2341@gmail.com', '9059958075', 'BE', 'employee', 'be', 'TS', 'OL003', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL008', 'OL008', 'N . Venkat', 'venkatrao.nagodi@gmail.com', 'venkatrao.nagodi@gmail.com', '9014326235', 'BE', 'employee', 'be', 'TS', 'OL003', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 12. Business Executives (BE) - TS Zone: under T Laxminarayana (OL032)
('OL020', 'OL020', 'Rupavath Dathu', 'dathurupavath63@gmail.com', 'dathurupavath63@gmail.com', '7671054947', 'BE', 'employee', 'be', 'TS', 'OL032', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL030', 'OL030', 'S Prashanth', 'spsangishetti@gmail.com', 'spsangishetti@gmail.com', '7396533965', 'BE', 'employee', 'be', 'TS', 'OL032', 12, 4, 'active', CURRENT_DATE, 0.00)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    phone = EXCLUDED.phone,
    designation = EXCLUDED.designation,
    role = EXCLUDED.role,
    hierarchy_level = EXCLUDED.hierarchy_level,
    zone = EXCLUDED.zone,
    reporting_to = EXCLUDED.reporting_to,
    cl_balance = 12,
    pl_balance = 4,
    status = 'active',
    joining_date = CURRENT_DATE,
    basic_pay = 0.00;

-- 5. Reset Official Leave Balances (12 Casual, 4 Privilege, 6 Sick)
DO $$
BEGIN
  IF to_regclass('public.pharma_hrms_leave_balances') IS NOT NULL THEN
    DELETE FROM pharma_hrms_leave_balances;

    INSERT INTO pharma_hrms_leave_balances (employee_id, leave_type, total_allotted, used)
    SELECT id, 'casual', 12, 0 FROM pharma_hrms_employees
    ON CONFLICT (employee_id, leave_type) DO UPDATE SET total_allotted = 12, used = 0;

    INSERT INTO pharma_hrms_leave_balances (employee_id, leave_type, total_allotted, used)
    SELECT id, 'privilege', 4, 0 FROM pharma_hrms_employees
    ON CONFLICT (employee_id, leave_type) DO UPDATE SET total_allotted = 4, used = 0;

    INSERT INTO pharma_hrms_leave_balances (employee_id, leave_type, total_allotted, used)
    SELECT id, 'sick', 6, 0 FROM pharma_hrms_employees
    ON CONFLICT (employee_id, leave_type) DO UPDATE SET total_allotted = 6, used = 0;
  END IF;
END $$;

COMMIT;

-- 6. Safe Verification Summary Query
SELECT 
  (SELECT COUNT(*) FROM pharma_hrms_employees) AS total_employees,
  (SELECT COUNT(*) FROM pharma_hrms_attendance) AS total_attendance_logs,
  (SELECT COUNT(*) FROM pharma_hrms_field_visits) AS total_field_visits,
  (SELECT COUNT(*) FROM pharma_hrms_tasks) AS total_tasks,
  (SELECT COUNT(*) FROM pharma_hrms_leave_requests) AS total_leave_requests;
