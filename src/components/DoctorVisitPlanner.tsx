import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Save, 
  X, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Check, 
  Stethoscope, 
  Building, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { Language, Employee, FieldVisit } from '../types';
import { translations } from '../translations';
import * as fieldVisitService from '../lib/services/field-visit-service';
import AssignVisitModal from './AssignVisitModal';

interface DoctorVisitPlannerProps {
  language: Language;
  currentUser: Employee;
  employees: Employee[];
}

export default function DoctorVisitPlanner({ language, currentUser, employees }: DoctorVisitPlannerProps) {
  const t = translations[language];

  // Hierarchy role checks
  const level = currentUser.hierarchyLevel || 'be';
  const isRSM = level === 'rsm' || level === 'team_lead' || level === 'manager';
  const isTeamLead = isRSM;
  const isZSM = level === 'zsm';
  const isExecutive = level === 'executive' || level === 'admin' || currentUser.role === 'admin';
  const hasTeam = isRSM || isZSM || isExecutive;

  // Active top-level tab for leaders
  const [plannerTab, setPlannerTab] = useState<'my_schedule' | 'team_approvals'>('my_schedule');

  // Subordinate Team Members resolution
  const directTeamMembers = useMemo(() => {
    if (isRSM) {
      return employees.filter(e => e.reportingTo === currentUser.id || (e.zone === currentUser.zone && (e.hierarchyLevel === 'be' || e.role === 'employee')));
    }
    if (isZSM) {
      return employees.filter(e => e.reportingTo === currentUser.id || e.zone === currentUser.zone);
    }
    if (isExecutive) {
      return employees.filter(e => e.id !== currentUser.id);
    }
    return [];
  }, [employees, currentUser, isRSM, isZSM, isExecutive]);

  const teamMemberIds = useMemo(() => directTeamMembers.map(e => e.id), [directTeamMembers]);

  // Calendar State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Visits State
  const [myVisits, setMyVisits] = useState<FieldVisit[]>([]);
  const [teamVisits, setTeamVisits] = useState<FieldVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'self' | 'assign'>('self');

  // Team Approvals Filter
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');

  const weekDates = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => { // Mon - Sat
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  // Load My Visits and Team Visits
  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch my visits across this week
      const allDates = weekDates.map(d => d.toISOString().split('T')[0]);
      const myVisitsPromises = allDates.map(date => fieldVisitService.getVisitsForDate(currentUser.id, date));
      const myVisitsArrays = await Promise.all(myVisitsPromises);
      const flattenedMyVisits = myVisitsArrays.flat();
      setMyVisits(flattenedMyVisits);

      // 2. If leader, fetch team visits
      if (hasTeam && teamMemberIds.length > 0) {
        const teamData = await fieldVisitService.getTeamVisits(teamMemberIds);
        setTeamVisits(teamData);
      }
    } catch (err: any) {
      console.error("Failed to load doctor visits:", err);
      setError("Failed to load visits. Please check network connection.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, weekDates, hasTeam, teamMemberIds]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Approvals & Rejections
  const handleApprove = async (visitId: string) => {
    try {
      await fieldVisitService.approveFieldVisit(visitId, currentUser.id);
      await loadVisits();
    } catch (err: any) {
      alert("Failed to approve visit: " + err.message);
    }
  };

  const handleReject = async (visitId: string) => {
    const reason = window.prompt("Enter rejection / reschedule guidance for the representative:");
    if (reason === null) return; // cancelled prompt
    try {
      await fieldVisitService.rejectFieldVisit(visitId, currentUser.id, reason);
      await loadVisits();
    } catch (err: any) {
      alert("Failed to reject visit: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this doctor call?")) {
      try {
        await fieldVisitService.deleteVisit(id);
        await loadVisits();
      } catch (err: any) {
        alert("Failed to delete visit");
      }
    }
  };

  // Filtered views
  const selectedDayVisits = useMemo(() => {
    return myVisits.filter(v => v.scheduledDate === selectedDate);
  }, [myVisits, selectedDate]);

  const pendingApprovalsCount = useMemo(() => {
    return teamVisits.filter(v => v.approvalStatus === 'pending').length;
  }, [teamVisits]);

  const filteredTeamVisits = useMemo(() => {
    return teamVisits.filter(v => {
      const matchesStatus = approvalFilter === 'all' || v.approvalStatus === approvalFilter;
      const matchesEmp = selectedEmployeeFilter === 'all' || v.employeeId === selectedEmployeeFilter;
      return matchesStatus && matchesEmp;
    });
  }, [teamVisits, approvalFilter, selectedEmployeeFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── Apple-Style Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-6 py-5 rounded-[20px] shadow-sm border border-[#E5E5EA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-tight">Doctor Visit Planner</h1>
            {isTeamLead && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#E8F4FF] text-[#0A84FF]">
                Team Lead
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">
            Plan, track and verify daily clinic &amp; doctor visits across hospital networks
          </p>
        </div>

        {/* iOS Segmented Control — Tab Switcher */}
        {hasTeam && (
          <div className="flex items-center bg-[#EFEFF4] p-1 rounded-[12px] gap-0.5 shrink-0">
            <button
              onClick={() => setPlannerTab('my_schedule')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-medium transition-all cursor-pointer ${
                plannerTab === 'my_schedule'
                  ? 'bg-white text-[#0A84FF] shadow'
                  : 'text-[#8E8E93] hover:text-[#3C3C43]'
              }`}
            >
              <CalendarIcon size={14} />
              <span>My Doctor Visits</span>
            </button>
            <button
              onClick={() => setPlannerTab('team_approvals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-medium transition-all cursor-pointer relative ${
                plannerTab === 'team_approvals'
                  ? 'bg-white text-[#0A84FF] shadow'
                  : 'text-[#8E8E93] hover:text-[#3C3C43]'
              }`}
            >
              <Users size={14} />
              <span>Team Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className={`px-1.5 rounded-full text-[9px] font-bold ${
                  plannerTab === 'team_approvals' ? 'bg-[#0A84FF] text-white' : 'bg-[#FF3B30] text-white animate-pulse'
                }`}>
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── View Mode 1: Personal Schedule ── */}
      {plannerTab === 'my_schedule' ? (
        <div className="space-y-5">
          {/* Week Navigation Bar */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-[16px] border border-[#E5E5EA] shadow-sm">
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-colors cursor-pointer">
                <ChevronLeft size={16} className="text-[#3C3C43]" />
              </button>
              <span className="text-[13px] font-medium text-[#1C1C1E] px-2">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                {weekDates[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-colors cursor-pointer">
                <ChevronRight size={16} className="text-[#3C3C43]" />
              </button>
            </div>

            <button
              onClick={() => { setModalMode('self'); setIsAssignModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A84FF] hover:bg-[#0070DB] text-white rounded-full text-[13px] font-semibold transition-all cursor-pointer shadow-md shadow-[#0A84FF]/20"
            >
              <Plus size={15} />
              <span>Plan Doctor Visit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Week Day Picker */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[20px] shadow-sm border border-[#E5E5EA] p-4">
                <h3 className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3 px-1">Select Day</h3>
                <div className="space-y-1.5">
                  {weekDates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    const dayVisits = myVisits.filter(v => v.scheduledDate === dateStr);
                    const pendingDayCount = dayVisits.filter(v => v.approvalStatus === 'pending').length;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20'
                            : isToday
                              ? 'bg-[#E8F4FF] text-[#0A84FF] border border-[#0A84FF]/20'
                              : 'hover:bg-[#F2F2F7] text-[#1C1C1E]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 flex flex-col items-center justify-center rounded-[10px] shrink-0 ${
                            isSelected ? 'bg-white/20' : isToday ? 'bg-[#0A84FF]/10' : 'bg-[#F2F2F7]'
                          }`}>
                            <span className={`text-[8px] font-semibold uppercase tracking-wide ${isSelected ? 'text-white/80' : isToday ? 'text-[#0A84FF]' : 'text-[#8E8E93]'}`}>
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={`text-[14px] font-bold leading-tight ${isSelected ? 'text-white' : isToday ? 'text-[#0A84FF]' : 'text-[#1C1C1E]'}`}>
                              {date.getDate()}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className={`text-[13px] font-medium block ${isSelected ? 'text-white' : 'text-[#1C1C1E]'}`}>
                              {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                            <span className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-[#8E8E93]'}`}>
                              {dayVisits.length} call{dayVisits.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {pendingDayCount > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {pendingDayCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Day Visits Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[20px] shadow-sm border border-[#E5E5EA] p-6 min-h-[460px] flex flex-col">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#F2F2F7]">
                  <div>
                    <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5">{selectedDayVisits.length} calls scheduled</p>
                  </div>
                  <button
                    onClick={() => { setModalMode('self'); setIsAssignModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E8F4FF] hover:bg-[#D0E8FF] text-[#0A84FF] rounded-full text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Doctor</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : selectedDayVisits.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center mb-4">
                      <Stethoscope size={28} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-1.5">No doctor calls planned</h3>
                    <p className="text-[13px] text-[#8E8E93] max-w-xs mb-5 leading-relaxed">
                      {currentUser.hierarchyLevel === 'employee'
                        ? 'Plan your clinic visits now. They will route to your Team Lead for approval.'
                        : 'Schedule visits directly — your calls are ready for instant photo execution.'}
                    </p>
                    <button
                      onClick={() => { setModalMode('self'); setIsAssignModalOpen(true); }}
                      className="px-5 py-2.5 bg-[#0A84FF] hover:bg-[#0070DB] text-white rounded-full text-[13px] font-semibold transition-all shadow-md shadow-[#0A84FF]/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={14} /> Plan a Doctor Call
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {selectedDayVisits.map((visit) => {
                      const isPending = visit.approvalStatus === 'pending';
                      const isRejected = visit.approvalStatus === 'rejected';
                      const isApproved = visit.approvalStatus === 'approved' || !visit.approvalStatus;

                      return (
                        <div
                          key={visit.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-[14px] bg-[#F9F9FB] hover:bg-[#F2F2F7] border border-[#E5E5EA] transition-all"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
                                {visit.doctorName || visit.title}
                              </h3>
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                  Awaiting Approval
                                </span>
                              )}
                              {isApproved && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E3F9E5] text-[#1C8139]">
                                  ✓ Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-[#FF3B30]">
                                  ✗ Rejected
                                </span>
                              )}
                            </div>
                            {visit.clinicName && (
                              <p className="text-[12px] text-[#3C3C43] font-medium flex items-center gap-1.5">
                                <Building size={11} className="text-[#8E8E93]" />
                                {visit.clinicName}
                              </p>
                            )}
                            {visit.assignedAddress && (
                              <p className="text-[11px] text-[#8E8E93] flex items-center gap-1.5 truncate max-w-md">
                                <MapPin size={10} className="shrink-0" />
                                {visit.assignedAddress}
                              </p>
                            )}
                            {visit.rejectionReason && (
                              <p className="text-[11px] text-[#FF3B30] bg-red-50 px-2.5 py-1.5 rounded-lg mt-1 font-medium">
                                <strong>Feedback:</strong> {visit.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E5EA]">
                            {visit.scheduledStart && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E5EA] rounded-full text-[11px] font-medium text-[#3C3C43]">
                                <Clock size={11} className="text-[#8E8E93]" />
                                <span>{visit.scheduledStart}</span>
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="w-7 h-7 flex items-center justify-center text-[#C7C7CC] hover:text-[#FF3B30] hover:bg-red-50 rounded-full transition-all cursor-pointer"
                              title="Delete Plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── View Mode 2: Team Approvals ── */
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-4 py-3 rounded-[16px] border border-[#E5E5EA] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {/* iOS-style segmented filter */}
              <div className="flex items-center bg-[#EFEFF4] p-1 rounded-[10px] gap-0.5">
                {(['pending', 'all', 'approved'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setApprovalFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer ${
                      approvalFilter === f ? 'bg-white shadow text-[#0A84FF]' : 'text-[#8E8E93] hover:text-[#3C3C43]'
                    }`}
                  >
                    <span className="capitalize">{f === 'pending' ? 'Pending' : f === 'all' ? 'All Visits' : 'Approved'}</span>
                    {f === 'pending' && pendingApprovalsCount > 0 && (
                      <span className={`px-1.5 rounded-full text-[9px] font-bold ${approvalFilter === 'pending' ? 'bg-[#FF3B30] text-white' : 'bg-[#FF3B30] text-white'}`}>
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F2F2F7] border-0 rounded-[10px] text-[12px] font-medium text-[#1C1C1E] cursor-pointer outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
              >
                <option value="all">All Members ({directTeamMembers.length})</option>
                {directTeamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Staff'})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setModalMode('assign'); setIsAssignModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A84FF] hover:bg-[#0070DB] text-white rounded-full text-[13px] font-semibold transition-all shadow-md shadow-[#0A84FF]/20 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Assign Call to Member</span>
            </button>
          </div>

          {/* Team Visits Roster */}
          <div className="bg-white rounded-[20px] shadow-sm border border-[#E5E5EA] p-6 min-h-[460px]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#F2F2F7]">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                  {approvalFilter === 'pending' ? 'Pending Approvals' : 'Team Field Operations'}
                </h2>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">{filteredTeamVisits.length} records</p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="w-7 h-7 border-[3px] border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredTeamVisits.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#E3F9E5] text-[#1C8139] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-[15px] font-semibold text-[#1C1C1E]">All caught up!</h3>
                <p className="text-[13px] text-[#8E8E93] mt-1 max-w-xs mx-auto">
                  {approvalFilter === 'pending'
                    ? 'No pending doctor visit approvals from your team members right now.'
                    : 'No team visit records found for this filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeamVisits.map((visit) => {
                  const emp = employees.find(e => e.id === visit.employeeId);
                  const isPending = visit.approvalStatus === 'pending';

                  return (
                    <div
                      key={visit.id}
                      className={`px-4 py-4 rounded-[14px] border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isPending
                          ? 'bg-amber-50/60 border-amber-200/70'
                          : 'bg-[#F9F9FB] border-[#E5E5EA]'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-[#E5E5EA] text-[#3C3C43]">
                            {emp?.name || 'Representative'}
                          </span>
                          <span className="text-[#C7C7CC] text-xs">•</span>
                          <span className="text-[13px] font-semibold text-[#1C1C1E]">
                            {visit.doctorName || visit.title}
                          </span>
                          {visit.scheduledDate && (
                            <span className="text-[11px] text-[#8E8E93] bg-white border border-[#E5E5EA] px-2 py-0.5 rounded-full font-mono">
                              {visit.scheduledDate}{visit.scheduledStart && ` · ${visit.scheduledStart}`}
                            </span>
                          )}
                        </div>
                        {visit.clinicName && (
                          <p className="text-[12px] text-[#3C3C43] font-medium flex items-center gap-1.5">
                            <Building size={11} className="text-[#0A84FF]" />
                            {visit.clinicName}
                          </p>
                        )}
                        {visit.assignedAddress && (
                          <p className="text-[11px] text-[#8E8E93] flex items-center gap-1.5">
                            <MapPin size={10} className="shrink-0" />
                            {visit.assignedAddress}
                          </p>
                        )}
                        {visit.visitPurpose && (
                          <p className="text-[11px] text-[#3C3C43] bg-white border border-[#E5E5EA] px-2.5 py-1.5 rounded-lg font-medium inline-block">
                            <strong>Agenda:</strong> {visit.visitPurpose}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(visit.id)}
                              className="px-4 py-1.5 bg-[#30D158] hover:bg-[#25A244] text-white rounded-full text-[12px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(visit.id)}
                              className="px-4 py-1.5 bg-white border border-[#E5E5EA] hover:bg-red-50 hover:border-red-200 text-[#FF3B30] rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              visit.approvalStatus === 'approved'
                                ? 'bg-[#E3F9E5] text-[#1C8139]'
                                : 'bg-red-50 text-[#FF3B30]'
                            }`}>
                              {visit.approvalStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                            </span>
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="w-7 h-7 flex items-center justify-center text-[#C7C7CC] hover:text-[#FF3B30] hover:bg-red-50 rounded-full transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {isAssignModalOpen && (
        <AssignVisitModal
          language={language}
          onClose={() => setIsAssignModalOpen(false)}
          employees={employees}
          adminId={currentUser.id}
          currentUser={currentUser}
          initialDate={selectedDate}
          isSelfSchedule={modalMode === 'self'}
          targetEmployeeId={modalMode === 'self' ? currentUser.id : undefined}
          onVisitCreated={async () => { await loadVisits(); }}
        />
      )}
    </div>
  );
}