-- ====================================================================
-- 02. SEED PHARMA HRMS EMPLOYEES (35 PERSONNEL ACCORDING TO SPREADSHEET)
-- 2 Admins, 1 GM, 2 ZSMs (TS/AP), 7 RSMs, 23 BEs
-- Initial Balances: 12 CL, 4 PL
-- ====================================================================

-- Ensure required columns exist
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "employee_code" VARCHAR(50);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "hospital" VARCHAR(50) DEFAULT 'orca_labs';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "branch" VARCHAR(50) DEFAULT 'corporate';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "hierarchy_level" VARCHAR(50) DEFAULT 'be';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "zone" VARCHAR(50) DEFAULT 'AP';
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "territory" VARCHAR(100);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "reporting_to" VARCHAR(255);
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "cl_balance" INT DEFAULT 12;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "pl_balance" INT DEFAULT 4;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "joining_date" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_employees" ADD COLUMN IF NOT EXISTS "basic_pay" NUMERIC(12, 2) DEFAULT 0.00;

-- Drop any strict NOT NULL constraints on legacy tables
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "joining_date" DROP NOT NULL;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "joining_date" SET DEFAULT CURRENT_DATE;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "basic_pay" DROP NOT NULL;
ALTER TABLE "pharma_hrms_employees" ALTER COLUMN "basic_pay" SET DEFAULT 0.00;

-- Remove legacy constraints that might reject 'manager' or 'zsm' / 'rsm' / 'be'
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "pharma_hrms_employees_role_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "HRMS_employees_role_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "pharma_hrms_employees_hierarchy_level_check";
ALTER TABLE "pharma_hrms_employees" DROP CONSTRAINT IF EXISTS "HRMS_employees_hierarchy_level_check";

-- Purge any legacy Medcy hospital employees (EMP-*) and OL001 from pharma tables
DELETE FROM "pharma_hrms_employees" WHERE "id" LIKE 'EMP-%' OR "id" = 'OL001' OR "hospital" NOT IN ('orca_labs');
DELETE FROM "pharma_hrms_leave_balances" WHERE "employee_id" LIKE 'EMP-%' OR "employee_id" = 'OL001';
DELETE FROM "pharma_hrms_attendance" WHERE "employee_id" LIKE 'EMP-%' OR "employee_id" = 'OL001';
DELETE FROM "pharma_hrms_leave_requests" WHERE "employee_id" LIKE 'EMP-%' OR "employee_id" = 'OL001';

INSERT INTO "pharma_hrms_employees" (
    "id", "employee_code", "name", "email", "password", "phone",
    "designation", "role", "hierarchy_level", "zone", "reporting_to", "cl_balance", "pl_balance", "status", "joining_date", "basic_pay"
) VALUES
-- 1. Admins & GM
('OL009', 'OL009', 'N V DIVYA SIRISHA', 'admin.hr@orcalabs.in', 'admin.hr@orcalabs.in', '9348292555', 'HR & FIN', 'admin', 'admin', 'Corporate', NULL, 12, 4, 'active', CURRENT_DATE, 0.00),
('OL026', 'OL026', 'P ASWANI', 'ap.gm@orcalabs.in', 'ap.gm@orcalabs.in', '8374959148', 'GM', 'admin', 'admin', 'Corporate', NULL, 12, 4, 'active', CURRENT_DATE, 0.00),

-- 2. Zonal Sales Managers (ZSM)
('OL004', 'OL004', 'B V JANARDHAN', 'janardhan.bv@yahoo.com', 'janardhan.bv@yahoo.com', '8096380380', 'ZSM(AP)', 'manager', 'zsm', 'AP', 'OL026', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL003', 'OL003', 'Ramendra Kumar', 'ramendrakumar1213@gmail.com', 'ramendrakumar1213@gmail.com', '8074838509', 'ZSM(TS)', 'manager', 'zsm', 'TS', 'OL026', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 3. Regional Sales Managers (RSM) - AP Zone under B V JANARDHAN (OL004)
('OL002', 'OL002', 'G.A.Naidu', 'naidugumpana0710@gmail.com', 'naidugumpana0710@gmail.com', '9515889928', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL023', 'OL023', 'K NAGESWARA RAO', 'nageswararaokokkirala1@gmail.com', 'nageswararaokokkirala1@gmail.com', '9246623369', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL015', 'OL015', 'B V SATYANARAYANA', 'SATYANANI1983@GMAIL.COM', 'SATYANANI1983@GMAIL.COM', '9985432144', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL019', 'OL019', 'Byrisetty Ravi', 'ravi8073994795@gmail.com', 'ravi8073994795@gmail.com', '8073994795', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),
('OL005', 'OL005', 'Lanka Dhana Veera Venkata Rao', 'venkatraolanka22@gmail.com', 'venkatraolanka22@gmail.com', '9849392564', 'RSM', 'manager', 'rsm', 'AP', 'OL004', 12, 4, 'active', CURRENT_DATE, 0.00),

-- 4. Regional Sales Managers (RSM) - TS Zone under Ramendra Kumar (OL003)
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
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "email" = EXCLUDED."email",
    "phone" = EXCLUDED."phone",
    "designation" = EXCLUDED."designation",
    "role" = EXCLUDED."role",
    "hierarchy_level" = EXCLUDED."hierarchy_level",
    "zone" = EXCLUDED."zone",
    "reporting_to" = EXCLUDED."reporting_to",
    "cl_balance" = EXCLUDED."cl_balance",
    "pl_balance" = EXCLUDED."pl_balance",
    "status" = EXCLUDED."status",
    "joining_date" = COALESCE("pharma_hrms_employees"."joining_date", EXCLUDED."joining_date", CURRENT_DATE),
    "basic_pay" = COALESCE("pharma_hrms_employees"."basic_pay", EXCLUDED."basic_pay", 0.00);

-- Initialize leave balances
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_pharma_hrms_emp_leave_type') THEN
    ALTER TABLE "pharma_hrms_leave_balances" 
    ADD CONSTRAINT unique_pharma_hrms_emp_leave_type UNIQUE ("employee_id", "leave_type");
  END IF;
END $$;

ALTER TABLE "pharma_hrms_leave_balances" DROP CONSTRAINT IF EXISTS "pharma_hrms_leave_balances_leave_type_check";
ALTER TABLE "pharma_hrms_leave_balances" DROP CONSTRAINT IF EXISTS "HRMS_leave_balances_leave_type_check";
ALTER TABLE "pharma_hrms_leave_balances" ADD CONSTRAINT "pharma_hrms_leave_balances_leave_type_check" 
CHECK (leave_type IN ('sick', 'casual', 'maternity', 'paternity', 'privilege', 'casual_paid'));

INSERT INTO "pharma_hrms_leave_balances" ("employee_id", "leave_type", "total_allotted", "used")
SELECT id, 'casual', 12, 0 FROM "pharma_hrms_employees"
ON CONFLICT ("employee_id", "leave_type") DO NOTHING;

INSERT INTO "pharma_hrms_leave_balances" ("employee_id", "leave_type", "total_allotted", "used")
SELECT id, 'privilege', 4, 0 FROM "pharma_hrms_employees"
ON CONFLICT ("employee_id", "leave_type") DO NOTHING;

INSERT INTO "pharma_hrms_leave_balances" ("employee_id", "leave_type", "total_allotted", "used")
SELECT id, 'sick', 6, 0 FROM "pharma_hrms_employees"
ON CONFLICT ("employee_id", "leave_type") DO NOTHING;

