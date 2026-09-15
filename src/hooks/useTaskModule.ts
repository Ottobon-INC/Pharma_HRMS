import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, Employee } from '../types';
import * as taskService from '../lib/services/task-service';
import { supabase } from '../lib/supabase-client';

export function useTaskModule(employees: Employee[] = []) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const employeesMap = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach(emp => {
      map[emp.id] = emp.name;
    });
    return map;
  }, [employees]);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskService.fetchTasks(employeesMap);
      setTasks(data);
    } catch (err: any) {
      console.error("Failed to load work assignments:", err);
      setError(err.message || "Failed to load work assignments.");
    } finally {
      setIsLoading(false);
    }
  }, [employeesMap]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Realtime subscription for work assignments
  useEffect(() => {
    const channel = supabase
      .channel('pharma-tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharma_hrms_tasks' },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTasks]);

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      return true;
    } catch (err: any) {
      console.error("Failed to create work assignment:", err);
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
      await taskService.updateTask(taskId, updates);
      return true;
    } catch (err: any) {
      console.error("Failed to update work assignment:", err);
      await loadTasks();
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus, notes?: string) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            notes: notes !== undefined ? notes : t.notes,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      await taskService.updateTaskStatus(taskId, status, notes);
      return true;
    } catch (err: any) {
      console.error("Failed to update status:", err);
      await loadTasks();
      return false;
    }
  };

  const approveTask = async (taskId: string, approverId: string, note?: string) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            approvalStatus: 'approved',
            approvedBy: approverId,
            approvalNote: note || 'Approved by manager',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      await taskService.approveTask(taskId, approverId, note);
      return true;
    } catch (err: any) {
      console.error("Failed to approve task:", err);
      await loadTasks();
      return false;
    }
  };

  const rejectTask = async (taskId: string, approverId: string, note: string) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            approvalStatus: 'rejected',
            approvedBy: approverId,
            approvalNote: note,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      await taskService.rejectTask(taskId, approverId, note);
      return true;
    } catch (err: any) {
      console.error("Failed to reject task:", err);
      await loadTasks();
      return false;
    }
  };

  const reassignTask = async (taskId: string, newAssigneeId: string, newAssigneeName?: string) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            assignedTo: newAssigneeId,
            assignedEmployeeName: newAssigneeName,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      await taskService.reassignTask(taskId, newAssigneeId, newAssigneeName);
      return true;
    } catch (err: any) {
      console.error("Failed to reassign task:", err);
      await loadTasks();
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await taskService.deleteTask(taskId);
      return true;
    } catch (err: any) {
      console.error("Failed to delete work assignment:", err);
      await loadTasks();
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    loadTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    approveTask,
    rejectTask,
    reassignTask,
    deleteTask
  };
}
