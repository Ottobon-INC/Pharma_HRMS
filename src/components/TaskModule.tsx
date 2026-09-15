import React, { useState, useMemo } from 'react';
import { 
 CheckSquare, 
 Clock, 
 Calendar, 
 User, 
 Search, 
 Filter, 
 AlertCircle, 
 CheckCircle2, 
 PlayCircle, 
 MessageSquare, 
 ChevronRight, 
 X, 
 Sparkles,
 LayoutGrid,
 List,
 AlertTriangle,
 History,
 Check
} from 'lucide-react';
import { Language, Task, TaskPriority, TaskStatus, Employee } from '../types';
import { translations } from '../translations';

interface TaskModuleProps {
 language: Language;
 currentUser: Employee;
 employees: Employee[];
 tasks: Task[];
 onUpdateStatus: (taskId: string, status: TaskStatus, notes?: string) => Promise<boolean>;
}

export default function TaskModule({
 language,
 currentUser,
 employees,
 tasks,
 onUpdateStatus
}: TaskModuleProps) {
 const t = translations[language] || translations.en;

 const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
 const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
 const [scope, setScope] = useState<'mine' | 'all'>('mine');
 const [timeFilter, setTimeFilter] = useState<'today' | 'history'>('today');
 const [selectedDate, setSelectedDate] = useState<string>('');
 const [searchQuery, setSearchQuery] = useState('');
 const [priorityFilter, setPriorityFilter] = useState<string>('all');
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [selectedTask, setSelectedTask] = useState<Task | null>(null);
 const [newNote, setNewNote] = useState('');
 const [isUpdating, setIsUpdating] = useState(false);

 const employeesMap = useMemo(() => {
  const map: Record<string, Employee> = {};
  employees.forEach(emp => {
   map[emp.id] = emp;
  });
  return map;
 }, [employees]);

 // Filter tasks based on today vs history, scope, search, priority, status
 const filteredTasks = useMemo(() => {
  return tasks.filter(task => {
   const taskDate = task.taskDate || (task.createdAt ? task.createdAt.split('T')[0] : todayStr);

   // Time filter (Today's Work vs History/All dates)
   if (timeFilter === 'today' && taskDate !== todayStr && task.status !== 'in_progress') {
    return false;
   }
   if (timeFilter === 'history' && selectedDate && taskDate !== selectedDate) {
    return false;
   }

   // Scope filter (Assigned to Me vs All Assignments)
   if (scope === 'mine' && task.assignedTo !== currentUser.id) {
    return false;
   }

   // Priority filter
   if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
    return false;
   }

   // Status filter
   if (statusFilter !== 'all' && task.status !== statusFilter) {
    return false;
   }

   // Search query
   if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    const descMatch = (task.description || task.title || '').toLowerCase().includes(query);
    const notesMatch = (task.notes || '').toLowerCase().includes(query);
    const assignee = task.assignedTo && employeesMap[task.assignedTo] ? employeesMap[task.assignedTo].name.toLowerCase() : '';
    const assigneeMatch = assignee.includes(query);
    if (!descMatch && !notesMatch && !assigneeMatch) {
     return false;
    }
   }
   return true;
  });
 }, [tasks, timeFilter, selectedDate, scope, currentUser.id, priorityFilter, statusFilter, searchQuery, employeesMap, todayStr]);

 // Statistics for Today's Work
 const stats = useMemo(() => {
  const relevant = timeFilter === 'today' 
   ? tasks.filter(t => (t.taskDate || t.createdAt.split('T')[0]) === todayStr)
   : tasks;

  const total = relevant.length;
  const mine = relevant.filter(t => t.assignedTo === currentUser.id).length;
  const inProgress = relevant.filter(t => t.status === 'in_progress').length;
  const completed = relevant.filter(t => t.status === 'completed').length;
  const incomplete = relevant.filter(t => t.status === 'incomplete').length;

  return { total, mine, inProgress, completed, incomplete };
 }, [tasks, timeFilter, todayStr, currentUser.id]);

 const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
   case 'urgent':
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
      <AlertCircle className="w-3 h-3"/>
      {t.priorityUrgent || 'Urgent'}
     </span>
    );
   case 'high':
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
      {t.priorityHigh || 'High'}
     </span>
    );
   case 'medium':
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
      {t.priorityMedium || 'Medium'}
     </span>
    );
   case 'low':
   default:
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
      {t.priorityLow || 'Low'}
     </span>
    );
  }
 };

 const getStatusBadge = (status: TaskStatus) => {
  switch (status) {
   case 'completed':
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3 text-emerald-600"/>
      {t.taskStatusCompleted || 'Completed'}
     </span>
    );
   case 'incomplete':
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
      <AlertTriangle className="w-3 h-3 text-rose-600"/>
      {t.taskStatusIncomplete || 'In-Complete'}
     </span>
    );
   case 'in_progress':
   default:
    return (
     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
      <Clock className="w-3 h-3 text-blue-600 animate-spin"/>
      {t.taskStatusInProgress || 'In Progress'}
     </span>
    );
  }
 };

 const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
  setIsUpdating(true);
  await onUpdateStatus(taskId, newStatus);
  setIsUpdating(false);
  if (selectedTask && selectedTask.id === taskId) {
   setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
  }
 };

 const handleAddNote = async (taskId: string) => {
  if (!newNote.trim()) return;
  setIsUpdating(true);
  const existingNotes = selectedTask?.notes || '';
  const dateStamp = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  const formattedNote = existingNotes 
   ? `${existingNotes}\n[${dateStamp} - ${currentUser.name}]: ${newNote.trim()}`
   : `[${dateStamp} - ${currentUser.name}]: ${newNote.trim()}`;
  
  await onUpdateStatus(taskId, selectedTask?.status || 'in_progress', formattedNote);
  setNewNote('');
  setIsUpdating(false);
  if (selectedTask) {
   setSelectedTask(prev => prev ? { ...prev, notes: formattedNote } : null);
  }
 };

 const renderTaskCard = (task: Task) => {
  const isAssignedToMe = task.assignedTo === currentUser.id;
  const assignedEmp = task.assignedTo ? employeesMap[task.assignedTo] : null;
  const taskDate = task.taskDate || (task.createdAt ? task.createdAt.split('T')[0] : todayStr);

  return (
   <div 
    key={task.id}
    onClick={() => setSelectedTask(task)}
    className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group ${
     task.status === 'completed'
      ? 'border-emerald-100/80 bg-emerald-50/20'
      : task.status === 'incomplete'
       ? 'border-rose-200/80 bg-rose-50/10'
       : isAssignedToMe
        ? 'border-teal-200 hover:border-teal-300'
        : 'border-slate-100 hover:border-slate-200'
    }`}
   >
    <div className="space-y-2.5">
     <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
       {getPriorityBadge(task.priority)}
       {isAssignedToMe && (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700">
         {language === 'te' ? 'నాకు' : 'Mine'}
        </span>
       )}
      </div>
      {getStatusBadge(task.status)}
     </div>

     <div>
      {/* Directly display the Work Description */}
      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
       {task.description || task.title}
      </p>
     </div>
    </div>

    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
     {/* Assignee info */}
     <div className="flex items-center gap-2">
      {assignedEmp ? (
       <div className="flex items-center gap-1.5"title={`Assigned to: ${assignedEmp.name}`}>
        <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-[9px]">
         {assignedEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <span className={`text-[11px] font-medium truncate max-w-[120px] ${isAssignedToMe ? 'text-teal-700 font-bold' : 'text-slate-600'}`}>
         {isAssignedToMe ? (language === 'te' ? 'నాకు' : 'Me') : assignedEmp.name}
        </span>
       </div>
      ) : (
       <span className="text-[10px] text-slate-400 italic">Unassigned</span>
      )}
     </div>

     {/* Date info */}
     <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
      <Calendar className="w-3.5 h-3.5 text-slate-400"/>
      <span>{taskDate === todayStr ? (language === 'te' ? 'ఈరోజు' : 'Today') : taskDate}</span>
     </div>
    </div>

    {/* Quick action buttons for task assignee */}
    {isAssignedToMe && (
     <div className="pt-1 flex items-center gap-2"onClick={(e) => e.stopPropagation()}>
      {task.status !== 'completed' && (taskDate <= todayStr) && (
       <button
        onClick={() => handleStatusChange(task.id, 'completed')}
        disabled={isUpdating}
        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-600/10 cursor-pointer"
       >
        <Check className="w-3.5 h-3.5"/>
        {t.markComplete || 'Complete'}
       </button>
      )}

      {task.status !== 'completed' && taskDate > todayStr && (
       <div className="w-full bg-slate-50 text-slate-400 py-1.5 px-2.5 rounded-lg text-[10px] font-bold text-center border border-slate-100">
        Scheduled for {taskDate}
       </div>
      )}

      {task.status === 'in_progress' && (
       <button
        onClick={() => handleStatusChange(task.id, 'incomplete')}
        disabled={isUpdating}
        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
        title="Mark as In-Complete"
       >
        <AlertTriangle className="w-3.5 h-3.5"/>
        {t.markIncomplete || 'In-Complete'}
       </button>
      )}

      {task.status === 'incomplete' && (
       <button
        onClick={() => handleStatusChange(task.id, 'in_progress')}
        disabled={isUpdating}
        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
       >
        <PlayCircle className="w-3.5 h-3.5"/>
        {t.markInProgress || 'Resume'}
       </button>
      )}
     </div>
    )}
   </div>
  );
 };

 return (
  <div id="work-assignment-container"className="space-y-6 sm:space-y-8 animate-fadeIn">
   
   {/* Top Header Panel */}
   <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
     <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
       <CheckSquare className="w-5 h-5"/>
      </div>
      <div>
       <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
        {t.tasks || 'Work Assignment'}
       </h2>
       <p className="text-xs text-slate-400 mt-0.5">
        {language === 'te' 
         ? 'రోజువారీ పని కేటాయింపులు, లక్ష్యాలు మరియు పురోగతి స్థితి' 
         : 'Daily work assignments, checklist progress, and completion records'}
       </p>
      </div>
     </div>
    </div>

    {/* View mode toggle & Scope tabs */}
    <div className="flex flex-wrap items-center gap-3">
     
     {/* Time filter: Today vs History */}
     <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
      <button
       onClick={() => setTimeFilter('today')}
       className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
        timeFilter === 'today'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-700'
       }`}
      >
       {t.todayTasks ||"Today's Work"}
      </button>
      <button
       onClick={() => setTimeFilter('history')}
       className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
        timeFilter === 'history'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-700'
       }`}
      >
       {t.historyTasks ||"History"}
      </button>
     </div>

     {/* Scope filter (Assigned to Me vs All Assignments) */}
     <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
      <button
       onClick={() => setScope('mine')}
       className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
        scope === 'mine'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-700'
       }`}
      >
       {t.assignedToMe || 'My Work'}
      </button>
      <button
       onClick={() => setScope('all')}
       className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
        scope === 'all'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-700'
       }`}
      >
       {t.allTasks || 'All Staff'}
      </button>
     </div>

     {/* View mode toggle (List vs Kanban) */}
     <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
      <button
       onClick={() => setViewMode('list')}
       className={`p-1.5 rounded-lg transition-all cursor-pointer ${
        viewMode === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
       title="List View"
      >
       <List className="w-4 h-4"/>
      </button>
      <button
       onClick={() => setViewMode('kanban')}
       className={`p-1.5 rounded-lg transition-all cursor-pointer ${
        viewMode === 'kanban' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
       title="Kanban Board"
      >
       <LayoutGrid className="w-4 h-4"/>
      </button>
     </div>

    </div>
   </div>

   {/* KPI Stats Strip */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
      {timeFilter === 'today' ? (language === 'te' ? 'ఈరోజు మొత్తం' :"Today's Total") : (t.totalTasks || 'Total Assigned')}
     </span>
     <p className="text-2xl sm:text-3xl font-black text-slate-800 font-mono mt-2">
      {stats.total}
     </p>
    </div>

    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
     <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
      {t.inProgressTasks || 'In Progress'}
     </span>
     <p className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-2">
      {stats.inProgress}
     </p>
    </div>

    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
      {t.completedTasks || 'Completed'}
     </span>
     <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-2">
      {stats.completed}
     </p>
    </div>

    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
     <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
      {t.incompleteTasks || 'In-Complete'}
     </span>
     <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-2">
      {stats.incomplete}
     </p>
    </div>
   </div>

   {/* Search & Filter Bar */}
   <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
    <div className="relative flex-1 w-full">
     <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400"/>
     <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={t.searchTasks || 'Search work description, notes, or staff...'}
      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
     />
    </div>

    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
     {/* History date picker */}
     {timeFilter === 'history' && (
      <input
       type="date"
       value={selectedDate}
       onChange={(e) => setSelectedDate(e.target.value)}
       className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
       title="Filter by specific date"
      />
     )}

     {/* Priority filter */}
     <select
      value={priorityFilter}
      onChange={(e) => setPriorityFilter(e.target.value)}
      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
     >
      <option value="all">{t.filterByPriority || 'All Priorities'}</option>
      <option value="urgent">{t.priorityUrgent || 'Urgent'}</option>
      <option value="high">{t.priorityHigh || 'High'}</option>
      <option value="medium">{t.priorityMedium || 'Medium'}</option>
      <option value="low">{t.priorityLow || 'Low'}</option>
     </select>

     {/* Status filter */}
     <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
     >
      <option value="all">{t.filterByStatus || 'All Statuses'}</option>
      <option value="in_progress">{t.taskStatusInProgress || 'In Progress'}</option>
      <option value="completed">{t.taskStatusCompleted || 'Completed'}</option>
      <option value="incomplete">{t.taskStatusIncomplete || 'In-Complete'}</option>
     </select>
    </div>
   </div>

   {/* Main Work Assignments Display */}
   {filteredTasks.length === 0 ? (
    <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm space-y-3">
     <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
      <CheckSquare className="w-8 h-8"/>
     </div>
     <h3 className="text-base font-bold text-slate-700">
      {t.noTasks || 'No work assignments found.'}
     </h3>
     <p className="text-xs text-slate-400 max-w-sm mx-auto">
      {timeFilter === 'today'
       ? (language === 'te' ? 'ఈరోజు ఎలాంటి పనులు కేటాయించలేదు.' : 'No work assignments scheduled for today.')
       : (language === 'te' ? 'ఫిల్టర్‌కు అనుగుణంగా పనులేవీ లేవు.' : 'No assignments matching your selected filter.')}
     </p>
    </div>
   ) : viewMode === 'kanban' ? (
    /* KANBAN BOARD VIEW */
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {/* 1. In Progress Column */}
     <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
       <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"/>
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
         {t.taskStatusInProgress || 'In Progress'}
        </h3>
       </div>
       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 font-mono">
        {filteredTasks.filter(t => t.status === 'in_progress').length}
       </span>
      </div>

      <div className="space-y-3">
       {filteredTasks
        .filter(t => t.status === 'in_progress')
        .map(renderTaskCard)}
       {filteredTasks.filter(t => t.status === 'in_progress').length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200/60 rounded-2xl text-xs text-slate-400 font-medium">
         No active assignments
        </div>
       )}
      </div>
     </div>

     {/* 2. Completed Column */}
     <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
       <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"/>
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
         {t.taskStatusCompleted || 'Completed'}
        </h3>
       </div>
       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 font-mono">
        {filteredTasks.filter(t => t.status === 'completed').length}
       </span>
      </div>

      <div className="space-y-3">
       {filteredTasks
        .filter(t => t.status === 'completed')
        .map(renderTaskCard)}
       {filteredTasks.filter(t => t.status === 'completed').length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200/60 rounded-2xl text-xs text-slate-400 font-medium">
         No completed assignments yet
        </div>
       )}
      </div>
     </div>

     {/* 3. In-Complete Column */}
     <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
       <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500"/>
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
         {t.taskStatusIncomplete || 'In-Complete'}
        </h3>
       </div>
       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 font-mono">
        {filteredTasks.filter(t => t.status === 'incomplete').length}
       </span>
      </div>

      <div className="space-y-3">
       {filteredTasks
        .filter(t => t.status === 'incomplete')
        .map(renderTaskCard)}
       {filteredTasks.filter(t => t.status === 'incomplete').length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200/60 rounded-2xl text-xs text-slate-400 font-medium">
         No in-complete assignments
        </div>
       )}
      </div>
     </div>
    </div>
   ) : (
    /* LIST / CARD STREAM VIEW */
    <div className="space-y-3">
     {filteredTasks.map((task) => {
      const isAssignedToMe = task.assignedTo === currentUser.id;
      const assignedEmp = task.assignedTo ? employeesMap[task.assignedTo] : null;
      const taskDate = task.taskDate || (task.createdAt ? task.createdAt.split('T')[0] : todayStr);

      return (
       <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
         task.status === 'completed'
          ? 'border-emerald-100 bg-emerald-50/10'
          : task.status === 'incomplete'
           ? 'border-rose-100 bg-rose-50/10'
           : isAssignedToMe
            ? 'border-teal-200'
            : 'border-slate-100'
        }`}
       >
        <div className="space-y-2 flex-1">
         <div className="flex items-center gap-2 flex-wrap">
          {getPriorityBadge(task.priority)}
          {getStatusBadge(task.status)}
          {isAssignedToMe && (
           <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700">
            {language === 'te' ? 'నాకు కేటాయించబడింది' : 'Assigned to Me'}
           </span>
          )}
         </div>
         
         {/* Direct Work Description */}
         <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
          {task.description || task.title}
         </p>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-center">
         {assignedEmp && (
          <div className="flex items-center gap-1.5 text-slate-600">
           <User className="w-3.5 h-3.5 text-slate-400"/>
           <span className="font-medium">{assignedEmp.name}</span>
          </div>
         )}

         <div className="flex items-center gap-1 font-mono text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400"/>
          <span>{taskDate === todayStr ? (language === 'te' ? 'ఈరోజు' : 'Today') : taskDate}</span>
         </div>

         {/* Quick toggle if mine */}
         {isAssignedToMe && task.status !== 'completed' && (taskDate <= todayStr) && (
          <button
           onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(task.id, 'completed');
           }}
           className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
           <Check className="w-3 h-3"/>
           {t.markComplete || 'Done'}
          </button>
         )}

         {isAssignedToMe && task.status !== 'completed' && (taskDate > todayStr) && (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200">
           Upcoming
          </span>
         )}

         <ChevronRight className="w-4 h-4 text-slate-400"/>
        </div>
       </div>
      );
     })}
    </div>
   )}

   {/* Task Detail & Notes Modal */}
   {selectedTask && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
     <div className="bg-white rounded-[32px] w-full max-w-lg shadow-md overflow-hidden flex flex-col max-h-[90vh]">
      
      {/* Modal Header */}
      <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
       <div className="space-y-1.5 pr-4">
        <div className="flex items-center gap-2">
         {getPriorityBadge(selectedTask.priority)}
         {getStatusBadge(selectedTask.status)}
        </div>
        <h3 className="text-base font-black text-slate-800 leading-snug">
         {t.taskDescription || 'Work Description'}
        </h3>
       </div>
       <button
        onClick={() => setSelectedTask(null)}
        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
       >
        <X className="w-5 h-5"/>
       </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
       
       {/* Main Work Description Text */}
       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">
        {selectedTask.description || selectedTask.title}
       </div>

       {/* Meta Grid */}
       <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.assignedTo || 'Assigned Staff'}
         </span>
         <p className="text-xs font-bold text-slate-700 mt-1 truncate">
          {selectedTask.assignedTo && employeesMap[selectedTask.assignedTo] 
           ? employeesMap[selectedTask.assignedTo].name 
           : 'Unassigned'}
         </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.taskDate || 'Date'}
         </span>
         <p className="text-xs font-bold text-slate-700 font-mono mt-1">
          {selectedTask.taskDate || selectedTask.createdAt.split('T')[0]}
         </p>
        </div>
       </div>

       {/* Status Action Buttons */}
       <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
         {language === 'te' ? 'పని స్థితి మార్చండి' : 'Update Work Status'}
        </label>
        <div className="grid grid-cols-3 gap-2">
         <button
          onClick={() => handleStatusChange(selectedTask.id, 'in_progress')}
          disabled={isUpdating}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
           selectedTask.status === 'in_progress'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
         >
          {t.taskStatusInProgress || 'In Progress'}
         </button>

         <button
          onClick={() => handleStatusChange(selectedTask.id, 'completed')}
          disabled={isUpdating}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
           selectedTask.status === 'completed'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
         >
          {t.taskStatusCompleted || 'Completed'}
         </button>

         <button
          onClick={() => handleStatusChange(selectedTask.id, 'incomplete')}
          disabled={isUpdating}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
           selectedTask.status === 'incomplete'
            ? 'bg-rose-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
         >
          {t.taskStatusIncomplete || 'In-Complete'}
         </button>
        </div>
       </div>

       {/* Notes Stream */}
       <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
         {t.taskNotes || 'Progress Notes / Remarks'}
        </label>
        
        {selectedTask.notes ? (
         <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl text-slate-700 leading-relaxed font-mono text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto">
          {selectedTask.notes}
         </div>
        ) : (
         <p className="text-[11px] text-slate-400 italic">No notes recorded yet.</p>
        )}

        <div className="flex gap-2 pt-2">
         <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={language === 'te' ? 'నోట్ రాయండి...' : 'Add a quick update remark...'}
          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
          onKeyDown={(e) => {
           if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNote(selectedTask.id);
           }
          }}
         />
         <button
          onClick={() => handleAddNote(selectedTask.id)}
          disabled={isUpdating || !newNote.trim()}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
         >
          {language === 'te' ? 'చేర్చు' : 'Add'}
         </button>
        </div>
       </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px]">
       <span>Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
       {selectedTask.completedAt && (
        <span className="text-emerald-600 font-bold">
         Completed: {new Date(selectedTask.completedAt).toLocaleTimeString()}
        </span>
       )}
      </div>

     </div>
    </div>
   )}

  </div>
 );
}
