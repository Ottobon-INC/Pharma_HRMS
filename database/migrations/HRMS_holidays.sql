-- Migration: HRMS_holidays.sql
-- Description: Create HRMS_holidays table and seed 2026 Holiday Calendar for Pharma HRMS

CREATE TABLE IF NOT EXISTS HRMS_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gazetted', 'sunday_compensatory')),
  year INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_hrms_holidays_date_name UNIQUE (date, name)
);

-- Row Level Security (RLS)
ALTER TABLE HRMS_holidays ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hrms_holidays' AND policyname = 'allow_read_all'
  ) THEN
    CREATE POLICY allow_read_all ON HRMS_holidays FOR SELECT USING (true);
  END IF;
END $$;

-- Seed 2026 holidays for Pharma HRMS
INSERT INTO HRMS_holidays (date, day, name, type, year) VALUES
  ('2026-01-14', 'Wednesday', 'Bhogi', 'gazetted', 2026),
  ('2026-01-15', 'Thursday', 'Sankranthi', 'gazetted', 2026),
  ('2026-01-16', 'Friday', 'Kanuma', 'gazetted', 2026),
  ('2026-01-17', 'Saturday', 'Mukanuma', 'gazetted', 2026),
  ('2026-01-26', 'Monday', 'Republic Day', 'gazetted', 2026),
  ('2026-02-16', 'Wednesday', 'Shivarathri Next Day', 'gazetted', 2026),
  ('2026-03-19', 'Thursday', 'Ugadi', 'gazetted', 2026),
  ('2026-03-27', 'Friday', 'Sri Rama Navami', 'gazetted', 2026),
  ('2026-05-01', 'Thursday', 'May Day', 'gazetted', 2026),
  ('2026-08-15', 'Saturday', 'Independence Day', 'gazetted', 2026),
  ('2026-09-14', 'Monday', 'Ganesh Puja', 'gazetted', 2026),
  ('2026-10-02', 'Friday', 'Gandhi Jayanthi', 'gazetted', 2026),
  ('2026-10-20', 'Tuesday', 'Dasara', 'gazetted', 2026),
  ('2026-11-12', 'Thursday', 'Nagula Chavathi', 'gazetted', 2026),
  ('2026-12-25', 'Friday', 'Christmas', 'gazetted', 2026),
  ('2026-11-08', 'Sunday', 'Deepavali', 'sunday_compensatory', 2026)
ON CONFLICT (date, name) DO NOTHING;
