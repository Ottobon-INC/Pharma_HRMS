export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'in_progress' | 'completed' | 'incomplete';
export type TaskApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface Task {
  id: string;
  description: string;         // Direct work description
  title?: string;              // Work summary / title for compatibility
  priority: TaskPriority;
  status: TaskStatus;          // 'in_progress' | 'completed' | 'incomplete'
  taskDate?: string;           // YYYY-MM-DD assignment date
  assignedTo?: string;         // Employee ID
  assignedEmployeeName?: string;
  createdBy?: string;          // Admin / Creator Employee ID
  createdByName?: string;
  dueDate?: string;            // Optional
  completedAt?: string;        // ISO timestamp
  notes?: string;              // Notes / updates
  approvalStatus?: TaskApprovalStatus;
  approvalNote?: string;
  approvedBy?: string;
  createdAt: string;           // ISO timestamp
  updatedAt?: string;          // ISO timestamp
}
