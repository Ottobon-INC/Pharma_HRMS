import { supabase } from '../supabase-client';
import { Task, TaskPriority, TaskStatus } from '../../types';

const LOCAL_STORAGE_KEY = 'pharma_tasks_local';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function mapDbRowToTask(row: any, employeesMap?: Record<string, string>): Task {
  const today = getTodayStr();
  const rawDate = row.due_date || (row.created_at ? row.created_at.split('T')[0] : today);
  let status: TaskStatus = (row.status || 'in_progress') as TaskStatus;

  // Normalize legacy status 'pending' to 'in_progress' or 'overdue' to 'incomplete'
  if (status === ('pending' as any)) {
    status = 'in_progress';
  } else if (status === ('overdue' as any)) {
    status = 'incomplete';
  }

  // Daily auto-close: If a task was from a past day and was never marked completed, it closed as incomplete
  if (status === 'in_progress' && rawDate < today) {
    status = 'incomplete';
  }

  const desc = row.description || row.title || '';
  const title = row.title || (desc.length > 80 ? desc.slice(0, 77) + '...' : desc);

  return {
    id: row.id,
    description: desc,
    title: title,
    priority: (row.priority || 'medium') as TaskPriority,
    status: status,
    taskDate: rawDate,
    assignedTo: row.assigned_to || undefined,
    assignedEmployeeName: row.assigned_employee_name || (employeesMap && row.assigned_to ? employeesMap[row.assigned_to] : undefined),
    createdBy: row.created_by || undefined,
    dueDate: rawDate,
    completedAt: row.completed_at || undefined,
    notes: row.notes || '',
    approvalStatus: row.approval_status || 'not_required',
    approvalNote: row.approval_note || undefined,
    approvedBy: row.approved_by || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined
  };
}

export async function fetchTasks(employeesMap?: Record<string, string>): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Could not fetch tasks from Supabase (falling back to local cache):", error.message);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    }

    const today = getTodayStr();
    const tasks = (data || []).map(row => mapDbRowToTask(row, employeesMap));

    // Background sync: update any past tasks that were in_progress in DB to incomplete
    const pastOpenIds = (data || [])
      .filter(row => {
        const rawDate = row.due_date || (row.created_at ? row.created_at.split('T')[0] : today);
        return (row.status === 'in_progress' || row.status === 'pending') && rawDate < today;
      })
      .map(row => row.id);

    if (pastOpenIds.length > 0) {
      Promise.resolve(
        supabase
          .from('pharma_hrms_tasks')
          .update({ status: 'incomplete', updated_at: new Date().toISOString() })
          .in('id', pastOpenIds)
      ).catch(err => console.warn("Background task auto-close sync:", err));
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    return tasks;
  } catch (err) {
    console.warn("Error in fetchTasks:", err);
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Task> {
  const today = getTodayStr();
  const taskDate = taskData.taskDate || taskData.dueDate || today;
  const description = taskData.description || taskData.title || '';
  const title = taskData.title || (description.length > 80 ? description.slice(0, 77) + '...' : description);
  const status: TaskStatus = taskData.status || 'in_progress';

  const insertPayload = {
    title: title,
    description: description,
    priority: taskData.priority || 'medium',
    status: status,
    assigned_to: taskData.assignedTo || null,
    created_by: taskData.createdBy || null,
    due_date: taskDate,
    notes: taskData.notes || '',
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    approval_status: taskData.approvalStatus || 'not_required',
    approval_note: taskData.approvalNote || null,
    approved_by: taskData.approvedBy || null
  };

  try {
    const { data, error } = await supabase
      .from('pharma_hrms_tasks')
      .insert([insertPayload])
      .select('*')
      .single();

    if (error) {
      console.warn("Supabase insert error, saving locally:", error.message);
      const fallbackTask: Task = {
        id: 'local_' + Date.now(),
        description,
        title,
        priority: taskData.priority || 'medium',
        status: status,
        taskDate: taskDate,
        assignedTo: taskData.assignedTo,
        createdBy: taskData.createdBy,
        notes: taskData.notes || '',
        approvalStatus: taskData.approvalStatus || 'not_required',
        approvalNote: taskData.approvalNote,
        approvedBy: taskData.approvedBy,
        createdAt: new Date().toISOString()
      };
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const list: Task[] = cached ? JSON.parse(cached) : [];
      list.unshift(fallbackTask);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      return fallbackTask;
    }

    const created = mapDbRowToTask(data);
    return created;
  } catch (err) {
    console.warn("Error creating task, saving locally:", err);
    const fallbackTask: Task = {
      id: 'local_' + Date.now(),
      description,
      title,
      priority: taskData.priority || 'medium',
      status: status,
      taskDate: taskDate,
      assignedTo: taskData.assignedTo,
      createdBy: taskData.createdBy,
      notes: taskData.notes || '',
      approvalStatus: taskData.approvalStatus || 'not_required',
      approvalNote: taskData.approvalNote,
      approvedBy: taskData.approvedBy,
      createdAt: new Date().toISOString()
    };
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: Task[] = cached ? JSON.parse(cached) : [];
    list.unshift(fallbackTask);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    return fallbackTask;
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (updates.description !== undefined) {
    updatePayload.description = updates.description;
    updatePayload.title = updates.title || (updates.description.length > 80 ? updates.description.slice(0, 77) + '...' : updates.description);
  } else if (updates.title !== undefined) {
    updatePayload.title = updates.title;
  }

  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.status !== undefined) {
    updatePayload.status = updates.status;
    if (updates.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.completed_at = null;
    }
  }
  if (updates.assignedTo !== undefined) updatePayload.assigned_to = updates.assignedTo || null;
  if (updates.taskDate !== undefined) updatePayload.due_date = updates.taskDate || null;
  else if (updates.dueDate !== undefined) updatePayload.due_date = updates.dueDate || null;
  if (updates.notes !== undefined) updatePayload.notes = updates.notes;
  if (updates.approvalStatus !== undefined) updatePayload.approval_status = updates.approvalStatus;
  if (updates.approvalNote !== undefined) updatePayload.approval_note = updates.approvalNote;
  if (updates.approvedBy !== undefined) updatePayload.approved_by = updates.approvedBy;

  try {
    const { error } = await supabase
      .from('pharma_hrms_tasks')
      .update(updatePayload)
      .eq('id', taskId);

    if (error) {
      console.warn("Supabase update error:", error.message);
    }
  } catch (err) {
    console.warn("Error updating task in Supabase:", err);
  }

  // Update local cache
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    const list: Task[] = JSON.parse(cached);
    const updatedList = list.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  notes?: string
): Promise<void> {
  const updates: Partial<Task> = {
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined
  };
  if (notes !== undefined) updates.notes = notes;
  await updateTask(taskId, updates);
}

export async function approveTask(
  taskId: string,
  approverId: string,
  note?: string
): Promise<void> {
  const updates: Partial<Task> = {
    approvalStatus: 'approved',
    approvedBy: approverId,
    approvalNote: note || 'Approved by manager'
  };
  await updateTask(taskId, updates);
}

export async function rejectTask(
  taskId: string,
  approverId: string,
  note: string
): Promise<void> {
  const updates: Partial<Task> = {
    approvalStatus: 'rejected',
    approvedBy: approverId,
    approvalNote: note || 'Rejected by manager'
  };
  await updateTask(taskId, updates);
}

export async function reassignTask(
  taskId: string,
  newAssigneeId: string,
  newAssigneeName?: string
): Promise<void> {
  const updates: Partial<Task> = {
    assignedTo: newAssigneeId,
    assignedEmployeeName: newAssigneeName
  };
  await updateTask(taskId, updates);
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pharma_hrms_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.warn("Supabase delete error:", error.message);
    }
  } catch (err) {
    console.warn("Error deleting task in Supabase:", err);
  }

  // Update local cache
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    const list: Task[] = JSON.parse(cached);
    const filtered = list.filter(t => t.id !== taskId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }
}
