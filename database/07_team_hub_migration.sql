-- Migration: 07_team_hub_migration.sql
-- Description: Add approval workflow and team management columns to tasks table

ALTER TABLE pharma_hrms_tasks
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_required'
    CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approval_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT REFERENCES pharma_hrms_employees(id);

-- Create index for faster pending approval queries
CREATE INDEX IF NOT EXISTS idx_pharma_tasks_approval_status ON pharma_hrms_tasks(approval_status);
CREATE INDEX IF NOT EXISTS idx_pharma_tasks_assigned_to ON pharma_hrms_tasks(assigned_to);

COMMENT ON COLUMN pharma_hrms_tasks.approval_status IS 'Workflow approval state: not_required, pending, approved, rejected';
COMMENT ON COLUMN pharma_hrms_tasks.approval_note IS 'Approver or rejecter comments';
COMMENT ON COLUMN pharma_hrms_tasks.approved_by IS 'Employee ID of manager who approved or rejected the task';
