import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Briefcase, 
  Building2, 
  Award,
  ChevronRight,
  Send
} from 'lucide-react';
import { Employee, Task, TaskPriority } from '../types';

interface MemberDetailSheetProps {
  member: Employee | null;
  currentUser: Employee;
  tasks: Task[];
  onClose: () => void;
  onCreateTask?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | void>;
  onSelectTask?: (task: Task) => void;
}

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({
  member,
  currentUser,
  tasks,
  onClose,
  onCreateTask,
  onSelectTask
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!member) return null;

  const memberTasks = tasks.filter(t => t.assignedTo === member.id);
  const pendingTasks = memberTasks.filter(t => t.status === 'in_progress');
  const completedTasks = memberTasks.filter(t => t.status === 'completed');

  // 7-day attendance simulation / derivation from member records
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const record = member.attendanceRecords?.find(r => r.date === dateStr);
    
    let status: 'present' | 'absent' | 'leave' | 'weekend' = 'absent';
    if (d.getDay() === 0) {
      status = 'weekend';
    } else if (record) {
      status = record.status === 'present' ? 'present' : record.status === 'on_leave' ? 'leave' : 'absent';
    } else if (i === 6 && member.isCheckedIn) {
      status = 'present';
    }

    return {
      dateStr,
      dayName,
      dayNum: d.getDate(),
      isToday: i === 6,
      status,
      checkInTime: record?.checkInTime || (i === 6 && member.isCheckedIn ? 'Checked In' : null)
    };
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim() || !onCreateTask) return;
    
    try {
      setIsSubmitting(true);
      await onCreateTask({
        title: taskDescription.slice(0, 70),
        description: taskDescription,
        priority: taskPriority,
        status: 'in_progress',
        assignedTo: member.id,
        assignedEmployeeName: member.name,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        taskDate: taskDueDate,
        dueDate: taskDueDate,
        approvalStatus: 'not_required'
      });
      setTaskDescription('');
      setShowAssignModal(false);
    } catch (err) {
      console.error('Failed to assign task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A]">High</span>;
      case 'medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">Medium</span>;
      case 'low':
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Low</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Apple-style translucent backdrop */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur-[4px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Sheet Panel */}
      <div className="relative w-full max-w-lg bg-[#F2F2F7] shadow-2xl flex flex-col h-full z-10 overflow-hidden sm:rounded-l-[28px] border-l border-[#E5E5EA]">
        
        {/* Header Bar */}
        <div className="bg-white/90 backdrop-blur-md px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Member Details</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E5E5EA] hover:bg-[#D1D1D6] active:scale-95 text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Profile Card */}
          <div className="bg-white rounded-[24px] p-5 shadow-xs border border-[#E5E5EA] flex flex-col items-center text-center relative">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#64D2FF] text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span 
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                  member.isCheckedIn ? 'bg-[#30D158]' : 'bg-[#8E8E93]'
                }`}
                title={member.isCheckedIn ? 'Checked In Today' : 'Offline'}
              >
                {member.isCheckedIn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1C1C1E] tracking-tight">{member.name}</h2>
            <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
              {member.designation || 'Field Representative'} · {member.employeeCode || `EMP-${member.id.slice(0, 4)}`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                member.isCheckedIn 
                  ? 'bg-[#30D158]/15 text-[#30D158]' 
                  : 'bg-[#8E8E93]/15 text-[#8E8E93]'
              }`}>
                {member.isCheckedIn ? '● Active Duty' : '○ Offline'}
              </span>

              {member.zone && (
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
                  {member.zone.toUpperCase()} Zone
                </span>
              )}

              {member.branch && (
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {member.branch === 'visakhapatnam' ? 'Vizag' : 'Vizianagaram'}
                </span>
              )}
            </div>

            {/* Quick Action Buttons (Apple Pill Style) */}
            <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-4 border-t border-[#E5E5EA]">
              {member.phone ? (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#0A84FF] hover:bg-[#0070DB] text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
                >
                  <Phone size={14} />
                  <span>Call Member</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
                >
                  <Phone size={14} />
                  <span>No Phone</span>
                </button>
              )}

              {member.email ? (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] text-xs font-semibold transition-all active:scale-98"
                >
                  <Mail size={14} />
                  <span>Send Email</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
                >
                  <Mail size={14} />
                  <span>No Email</span>
                </button>
              )}
            </div>
          </div>

          {/* 7-Day Attendance Strip */}
          <div className="bg-white rounded-[24px] p-5 shadow-xs border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#0A84FF]" />
                <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">Past 7 Days Attendance</h3>
              </div>
              <span className="text-[11px] font-medium text-[#8E8E93]">
                {member.attendanceRecords?.length || 0} logs this month
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {last7Days.map((d, i) => (
                <div 
                  key={i}
                  className={`p-2 rounded-2xl flex flex-col items-center transition-all ${
                    d.isToday 
                      ? 'ring-2 ring-[#0A84FF] bg-[#0A84FF]/5' 
                      : 'bg-[#F2F2F7]'
                  }`}
                >
                  <span className="text-[10px] font-medium text-[#8E8E93] uppercase">{d.dayName}</span>
                  <span className="text-xs font-bold text-[#1C1C1E] my-1">{d.dayNum}</span>
                  <span 
                    className={`w-2.5 h-2.5 rounded-full ${
                      d.status === 'present' 
                        ? 'bg-[#30D158]' 
                        : d.status === 'leave' 
                        ? 'bg-[#FF9F0A]' 
                        : d.status === 'weekend'
                        ? 'bg-slate-300'
                        : 'bg-[#FF3B30]/50'
                    }`}
                    title={`${d.dateStr}: ${d.status}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-[#8E8E93] mt-3 pt-3 border-t border-[#E5E5EA]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#30D158]" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" /> On Leave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF3B30]/50" /> Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Rest Day
              </span>
            </div>
          </div>

          {/* Leave Balances Card */}
          <div className="bg-white rounded-[24px] p-5 shadow-xs border border-[#E5E5EA]">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-[#0A84FF]" />
              <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">Leave Balance</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
                <span className="text-[10px] font-semibold text-[#8E8E93] uppercase">Casual</span>
                <p className="text-base font-bold text-[#1C1C1E] mt-0.5">
                  {member.leaveBalance?.casual ?? 0} <span className="text-[10px] font-normal text-[#8E8E93]">days</span>
                </p>
              </div>
              <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
                <span className="text-[10px] font-semibold text-[#8E8E93] uppercase">Sick</span>
                <p className="text-base font-bold text-[#1C1C1E] mt-0.5">
                  {member.leaveBalance?.sick ?? 0} <span className="text-[10px] font-normal text-[#8E8E93]">days</span>
                </p>
              </div>
              <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
                <span className="text-[10px] font-semibold text-[#8E8E93] uppercase">Earned</span>
                <p className="text-base font-bold text-[#1C1C1E] mt-0.5">
                  {member.leaveBalance?.earned ?? 0} <span className="text-[10px] font-normal text-[#8E8E93]">days</span>
                </p>
              </div>
            </div>
          </div>

          {/* Work Assignments / Tasks Section */}
          <div className="bg-white rounded-[24px] p-5 shadow-xs border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#0A84FF]" />
                <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">Active Tasks</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
                  {pendingTasks.length}
                </span>
              </div>
              {onCreateTask && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#0A84FF] hover:underline cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Assign</span>
                </button>
              )}
            </div>

            {memberTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8E8E93]">
                No tasks assigned to {member.name.split(' ')[0]} yet.
              </div>
            ) : (
              <div className="space-y-2">
                {memberTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA]/60 rounded-2xl flex items-start justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityBadge(task.priority)}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.status === 'completed'
                            ? 'bg-[#30D158]/15 text-[#30D158]'
                            : task.status === 'incomplete'
                            ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                            : 'bg-[#0A84FF]/15 text-[#0A84FF]'
                        }`}>
                          {task.status === 'completed' ? 'Done' : task.status === 'incomplete' ? 'Overdue' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1C1E] truncate">
                        {task.title || task.description}
                      </p>
                      {task.dueDate && (
                        <p className="text-[10px] text-[#8E8E93] mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> Due: {task.dueDate}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-[#8E8E93] shrink-0 mt-1" />
                  </div>
                ))}

                {memberTasks.length > 5 && (
                  <p className="text-center text-[11px] font-semibold text-[#8E8E93] pt-1">
                    + {memberTasks.length - 5} more assignments
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Inline Quick Task Assignment Modal */}
        {showAssignModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-30">
            <div className="bg-white w-full rounded-[24px] p-5 shadow-2xl border border-[#E5E5EA] space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1C1C1E]">
                  Assign Task to {member.name.split(' ')[0]}
                </h4>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-7 h-7 rounded-full bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase mb-1">
                    Task Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g. Conduct field visit at Care Hospital and collect doctor feedback..."
                    className="w-full bg-[#F2F2F7] rounded-xl p-3 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#0A84FF]/30 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="w-full bg-[#F2F2F7] rounded-xl p-2.5 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#0A84FF]/30 outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-[#F2F2F7] rounded-xl p-2.5 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#0A84FF]/30 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !taskDescription.trim()}
                    className="flex-1 py-2.5 rounded-full bg-[#0A84FF] hover:bg-[#0070DB] disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>{isSubmitting ? 'Assigning...' : 'Assign'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MemberDetailSheet;
