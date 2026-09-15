import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  UserCheck, 
  ArrowRight, 
  Check, 
  X, 
  RefreshCw, 
  Calendar, 
  Briefcase, 
  Layers, 
  ChevronRight,
  UserX,
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';
import { Employee, Task, TaskPriority, TaskApprovalStatus, Language } from '../types';
import { MemberDetailSheet } from './MemberDetailSheet';

interface TeamHubProps {
  language?: Language;
  currentUser: Employee;
  employees: Employee[];
  tasks: Task[];
  onApproveTask?: (taskId: string, approverId: string, note?: string) => Promise<boolean | void>;
  onRejectTask?: (taskId: string, approverId: string, note: string) => Promise<boolean | void>;
  onReassignTask?: (taskId: string, newAssigneeId: string, newAssigneeName?: string) => Promise<boolean | void>;
  onCreateTask?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | void>;
  onSelectTab?: (tab: string) => void;
}

export const TeamHub: React.FC<TeamHubProps> = ({
  currentUser,
  employees,
  tasks,
  onApproveTask,
  onRejectTask,
  onReassignTask,
  onCreateTask,
  onSelectTab
}) => {
  // Main view tab: 'roster' | 'approvals'
  const [activeSegment, setActiveSegment] = useState<'roster' | 'approvals'>('roster');
  
  // Search & Filters for Team Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offline' | 'on_leave'>('all');
  
  // Approval Tab Filter: 'pending' | 'all' | 'approved' | 'rejected'
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');

  // Selected Member for Sheet
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);

  // Modals for Actions
  const [rejectModalTask, setRejectModalTask] = useState<Task | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reassignModalTask, setReassignModalTask] = useState<Task | null>(null);
  const [targetAssigneeId, setTargetAssigneeId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine Direct Reports
  const directReports = useMemo(() => {
    const isExecOrAdmin = 
      currentUser.hierarchyLevel === 'executive' || 
      currentUser.hierarchyLevel === 'admin' || 
      currentUser.role === 'admin';

    if (isExecOrAdmin) {
      return employees.filter(e => e.id !== currentUser.id);
    }

    // Direct reports linked by reportingTo
    const reports = employees.filter(e => 
      e.reportingTo === currentUser.id || 
      e.reportingTo === currentUser.employeeCode ||
      (e.reportingTo && e.reportingTo.toLowerCase() === currentUser.name.toLowerCase())
    );

    // Fallback if reportingTo is not populated yet
    if (reports.length === 0) {
      if (currentUser.hierarchyLevel === 'zsm') {
        return employees.filter(e => 
          e.id !== currentUser.id && 
          (e.zone === currentUser.zone || e.branch === currentUser.branch)
        );
      }
      if (currentUser.hierarchyLevel === 'rsm' || currentUser.hierarchyLevel === 'manager' || currentUser.hierarchyLevel === 'team_lead') {
        return employees.filter(e => 
          e.id !== currentUser.id && 
          (e.hierarchyLevel === 'be' || e.role === 'employee') && 
          (e.zone === currentUser.zone || e.branch === currentUser.branch)
        );
      }
    }

    return reports;
  }, [employees, currentUser]);

  const directReportIds = useMemo(() => new Set(directReports.map(e => e.id)), [directReports]);

  // Tasks associated with the manager's team
  const teamTasks = useMemo(() => {
    return tasks.filter(t => t.assignedTo && directReportIds.has(t.assignedTo));
  }, [tasks, directReportIds]);

  // Tasks requiring approval
  const approvalTasks = useMemo(() => {
    return teamTasks.filter(t => {
      // Direct pending approval status or completed tasks needing manager sign-off
      const isPending = t.approvalStatus === 'pending' || (t.status === 'completed' && (!t.approvalStatus || t.approvalStatus === 'pending' || t.approvalStatus === 'not_required'));
      if (approvalFilter === 'pending') {
        return isPending && t.approvalStatus !== 'approved' && t.approvalStatus !== 'rejected';
      }
      if (approvalFilter === 'approved') {
        return t.approvalStatus === 'approved';
      }
      if (approvalFilter === 'rejected') {
        return t.approvalStatus === 'rejected';
      }
      return true;
    });
  }, [teamTasks, approvalFilter]);

  const pendingCount = useMemo(() => {
    return teamTasks.filter(t => 
      (t.approvalStatus === 'pending' || (t.status === 'completed' && (!t.approvalStatus || t.approvalStatus === 'pending' || t.approvalStatus === 'not_required'))) &&
      t.approvalStatus !== 'approved' &&
      t.approvalStatus !== 'rejected'
    ).length;
  }, [teamTasks]);

  // Filtered Roster
  const filteredMembers = useMemo(() => {
    return directReports.filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.designation && member.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.employeeCode && member.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.territory && member.territory.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return member.isCheckedIn;
      if (statusFilter === 'offline') return !member.isCheckedIn;
      if (statusFilter === 'on_leave') {
        const todayStr = new Date().toISOString().split('T')[0];
        return member.attendanceRecords?.some(r => r.date === todayStr && r.status === 'on_leave');
      }

      return true;
    });
  }, [directReports, searchQuery, statusFilter]);

  // Handlers
  const handleApprove = async (task: Task) => {
    if (!onApproveTask) return;
    try {
      setIsProcessing(true);
      await onApproveTask(task.id, currentUser.id, 'Approved by ' + currentUser.name);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTask || !onRejectTask) return;
    try {
      setIsProcessing(true);
      await onRejectTask(rejectModalTask.id, currentUser.id, rejectionReason || 'Requires revision');
      setRejectModalTask(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!reassignModalTask || !targetAssigneeId || !onReassignTask) return;
    const targetEmp = employees.find(e => e.id === targetAssigneeId);
    try {
      setIsProcessing(true);
      await onReassignTask(reassignModalTask.id, targetAssigneeId, targetEmp?.name);
      setReassignModalTask(null);
      setTargetAssigneeId('');
    } catch (err) {
      console.error('Reassignment failed:', err);
    } finally {
      setIsProcessing(false);
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

  const activeCount = directReports.filter(m => m.isCheckedIn).length;
  const offlineCount = directReports.length - activeCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header Card with Apple Aesthetic */}
      <div className="bg-white rounded-[28px] p-6 shadow-xs border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A84FF] bg-[#0A84FF]/10 px-2.5 py-1 rounded-full">
              Leadership Portal
            </span>
            <span className="text-xs text-[#8E8E93] font-medium">
              {currentUser.designation || currentUser.hierarchyLevel?.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] mt-1 tracking-tight">Team Hub</h1>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Oversee your direct reports, track active field duties, and review task sign-offs.
          </p>
        </div>

        {/* Apple Segmented Control */}
        <div className="bg-[#EFEFF4] p-1 rounded-full flex items-center shrink-0 self-start md:self-auto border border-[#E5E5EA]">
          <button
            onClick={() => setActiveSegment('roster')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSegment === 'roster'
                ? 'bg-white text-[#0A84FF] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <Users size={14} />
            <span>Team Members</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeSegment === 'roster' ? 'bg-[#0A84FF]/15 text-[#0A84FF]' : 'bg-[#E5E5EA] text-[#8E8E93]'
            }`}>
              {directReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSegment('approvals')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSegment === 'approvals'
                ? 'bg-white text-[#0A84FF] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Task Approvals</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-[#FF3B30] text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats Strip (Apple Clean Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center shrink-0 font-bold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Direct Reports</p>
            <p className="text-xl font-bold text-[#1C1C1E]">{directReports.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#30D158]/10 text-[#30D158] flex items-center justify-center shrink-0 font-bold">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Active On Duty</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-[#1C1C1E]">{activeCount}</span>
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-[#8E8E93] flex items-center justify-center shrink-0 font-bold">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Offline / Off Duty</p>
            <p className="text-xl font-bold text-[#1C1C1E]">{offlineCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FF9F0A]/10 text-[#FF9F0A] flex items-center justify-center shrink-0 font-bold">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Pending Sign-Off</p>
            <p className="text-xl font-bold text-[#1C1C1E]">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* VIEW 1: TEAM MEMBERS ROSTER */}
      {activeSegment === 'roster' && (
        <div className="space-y-4">
          
          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-[24px] p-3.5 shadow-xs border border-[#E5E5EA] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team member by name, ID..."
                className="w-full bg-[#F2F2F7] rounded-full pl-9 pr-4 py-2 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#0A84FF]/30 outline-none placeholder-[#8E8E93]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-[#1C1C1E] text-white'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                All ({directReports.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-[#30D158] text-white'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'offline'
                    ? 'bg-slate-700 text-white'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-[28px] p-12 text-center border border-[#E5E5EA]">
              <Users size={36} className="mx-auto text-[#8E8E93] opacity-40 mb-3" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">No team members match your filter</h3>
              <p className="text-xs text-[#8E8E93] mt-1">
                Try adjusting your search criteria or resetting the status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map(member => {
                const memberTasks = teamTasks.filter(t => t.assignedTo === member.id);
                const openCount = memberTasks.filter(t => t.status === 'in_progress').length;
                const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                const latestCheckIn = member.checkInLogs && member.checkInLogs.length > 0
                  ? member.checkInLogs[member.checkInLogs.length - 1]
                  : null;

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="bg-white hover:bg-slate-50/70 rounded-[24px] p-5 shadow-xs border border-[#E5E5EA] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Avatar + Status + Code */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="relative">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0A84FF] to-[#64D2FF] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              member.isCheckedIn ? 'bg-[#30D158]' : 'bg-[#8E8E93]'
                            }`}
                          />
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            member.isCheckedIn 
                              ? 'bg-[#30D158]/15 text-[#30D158]' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {member.isCheckedIn ? '● Active' : 'Offline'}
                          </span>
                          <p className="text-[10px] font-mono text-[#8E8E93] mt-1">
                            {member.employeeCode || `ID: ${member.id.slice(0, 4)}`}
                          </p>
                        </div>
                      </div>

                      {/* Name & Designation */}
                      <h3 className="text-sm font-bold text-[#1C1C1E] group-hover:text-[#0A84FF] transition-colors truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                        {member.designation || 'Field Representative'}
                      </p>

                      {/* Zone / Territory Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {member.zone && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
                            {member.zone.toUpperCase()}
                          </span>
                        )}
                        {member.territory && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {member.territory}
                          </span>
                        )}
                        {member.branch && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {member.branch === 'visakhapatnam' ? 'Vizag' : 'Vizianagaram'}
                          </span>
                        )}
                      </div>

                      {/* Duty / Activity Snapshot */}
                      <div className="mt-4 pt-3 border-t border-[#E5E5EA] space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-[#8E8E93]">
                          <span>Duty Status:</span>
                          <span className="font-semibold text-[#1C1C1E]">
                            {member.isCheckedIn 
                              ? latestCheckIn?.timestamp 
                                ? `In since ${new Date(latestCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                : 'Punched In'
                              : 'Not on duty today'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#8E8E93]">
                          <span>Work Assignments:</span>
                          <span className="font-semibold text-[#1C1C1E]">
                            <span className="text-[#0A84FF]">{openCount} active</span> · {completedCount} done
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center transition-colors"
                            title="Call"
                          >
                            <Phone size={12} />
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center transition-colors"
                            title="Email"
                          >
                            <Mail size={12} />
                          </a>
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#0A84FF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View Details</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: TASK APPROVALS */}
      {activeSegment === 'approvals' && (
        <div className="space-y-4">
          
          {/* Approval Filter Bar */}
          <div className="bg-white rounded-[24px] p-3.5 shadow-xs border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setApprovalFilter('pending')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  approvalFilter === 'pending'
                    ? 'bg-[#0A84FF] text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <span>Pending Approval</span>
                {pendingCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    approvalFilter === 'pending' ? 'bg-white text-[#0A84FF]' : 'bg-[#FF3B30] text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setApprovalFilter('approved')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  approvalFilter === 'approved'
                    ? 'bg-[#30D158] text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                Approved
              </button>

              <button
                onClick={() => setApprovalFilter('rejected')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  approvalFilter === 'rejected'
                    ? 'bg-[#FF3B30] text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                Rejected
              </button>

              <button
                onClick={() => setApprovalFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  approvalFilter === 'all'
                    ? 'bg-[#1C1C1E] text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                All Team Tasks ({teamTasks.length})
              </button>
            </div>
          </div>

          {/* Tasks List */}
          {approvalTasks.length === 0 ? (
            <div className="bg-white rounded-[28px] p-12 text-center border border-[#E5E5EA]">
              <CheckCircle2 size={36} className="mx-auto text-[#30D158] mb-3" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                {approvalFilter === 'pending' ? 'All caught up! No tasks pending approval' : 'No tasks in this category'}
              </h3>
              <p className="text-xs text-[#8E8E93] mt-1 max-w-sm mx-auto">
                {approvalFilter === 'pending'
                  ? 'When team members submit completed assignments or require manager approvals, they will appear here.'
                  : 'Tasks will appear once they match the selected approval state.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvalTasks.map(task => {
                const assignee = employees.find(e => e.id === task.assignedTo);
                const isApproved = task.approvalStatus === 'approved';
                const isRejected = task.approvalStatus === 'rejected';
                const isPending = !isApproved && !isRejected;

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-[24px] p-5 shadow-xs border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Assignee + Task Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        
                        {isApproved && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] flex items-center gap-1">
                            <Check size={10} strokeWidth={3} /> Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] flex items-center gap-1">
                            <X size={10} strokeWidth={3} /> Rejected
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] flex items-center gap-1">
                            <Clock size={10} /> Needs Review
                          </span>
                        )}

                        <span className="text-[10px] text-[#8E8E93] font-medium">
                          Created {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#1C1C1E]">
                        {task.title || task.description}
                      </h4>

                      {task.title && task.description && task.title !== task.description && (
                        <p className="text-xs text-[#8E8E93] line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Assignee Strip */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-6 h-6 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] text-[10px] font-bold flex items-center justify-center">
                          {assignee ? assignee.name[0] : 'U'}
                        </div>
                        <span className="text-xs font-semibold text-[#1C1C1E]">
                          {assignee?.name || task.assignedEmployeeName || 'Unassigned'}
                        </span>
                        {assignee?.designation && (
                          <span className="text-xs text-[#8E8E93]">· {assignee.designation}</span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-[#8E8E93] ml-2 flex items-center gap-1">
                            <Calendar size={11} /> Due: {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Notes / Submission Info */}
                      {task.notes && (
                        <div className="p-2.5 bg-[#F2F2F7] rounded-xl text-xs text-[#1C1C1E]">
                          <span className="font-semibold text-[#8E8E93] uppercase text-[9px] block">Progress Notes:</span>
                          {task.notes}
                        </div>
                      )}

                      {task.approvalNote && (
                        <p className="text-[11px] text-[#8E8E93] italic">
                          Decision Note: "{task.approvalNote}"
                        </p>
                      )}
                    </div>

                    {/* Right: Actions (Approve / Reject / Reassign) */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(task)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#30D158] hover:bg-[#28C04E] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Check size={14} strokeWidth={2.5} />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectModalTask(task);
                              setRejectionReason('');
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-rose-50 text-[#FF3B30] border border-[#FF3B30]/30 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <X size={14} strokeWidth={2.5} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Reassign Button (Always allowed by manager) */}
                      <button
                        onClick={() => {
                          setReassignModalTask(task);
                          setTargetAssigneeId('');
                        }}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Reassign to another team member"
                      >
                        <RefreshCw size={13} />
                        <span>Reassign</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Member Details Slide-over Sheet */}
      {selectedMember && (
        <MemberDetailSheet
          member={selectedMember}
          currentUser={currentUser}
          tasks={tasks}
          onClose={() => setSelectedMember(null)}
          onCreateTask={onCreateTask}
        />
      )}

      {/* Rejection Modal */}
      {rejectModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-[28px] p-6 shadow-2xl border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#FF3B30]">
                <AlertCircle size={20} />
                <h3 className="text-base font-bold text-[#1C1C1E]">Reject Assignment</h3>
              </div>
              <button
                onClick={() => setRejectModalTask(null)}
                className="w-7 h-7 rounded-full bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93]">
              Provide feedback on why this work assignment is being rejected or needs revision.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete doctor feedback attached, please re-visit and update the report..."
              className="w-full bg-[#F2F2F7] rounded-xl p-3 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#FF3B30]/30 outline-none resize-none"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                className="flex-1 py-2.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-full bg-[#FF3B30] hover:bg-[#E02E24] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-[28px] p-6 shadow-2xl border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0A84FF]">
                <RefreshCw size={20} />
                <h3 className="text-base font-bold text-[#1C1C1E]">Reassign Task</h3>
              </div>
              <button
                onClick={() => setReassignModalTask(null)}
                className="w-7 h-7 rounded-full bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93]">
              Select which direct report should take over <span className="font-semibold text-[#1C1C1E]">"{reassignModalTask.title || reassignModalTask.description.slice(0, 30)}"</span>.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase mb-1.5">
                New Assignee
              </label>
              <select
                value={targetAssigneeId}
                onChange={(e) => setTargetAssigneeId(e.target.value)}
                className="w-full bg-[#F2F2F7] rounded-xl p-3 text-xs text-[#1C1C1E] border-0 focus:ring-2 focus:ring-[#0A84FF]/30 outline-none"
              >
                <option value="">Choose a team member...</option>
                {directReports.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation || 'Field Rep'} · {emp.zone || emp.branch || 'Main'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="flex-1 py-2.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={!targetAssigneeId || isProcessing}
                className="flex-1 py-2.5 rounded-full bg-[#0A84FF] hover:bg-[#0070DB] disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isProcessing ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamHub;
