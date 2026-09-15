import React, { useState, useMemo } from 'react';
import { 
 CheckSquare, 
 Plus, 
 Search, 
 Filter, 
 User, 
 Calendar, 
 Clock, 
 AlertCircle, 
 CheckCircle2, 
 Edit3, 
 Trash2, 
 Send, 
 X, 
 Check, 
 AlertTriangle,
 ChevronDown,
 LayoutGrid,
 List,
 Sparkles,
 History,
 FileText
} from 'lucide-react';
import { Language, Task, TaskPriority, TaskStatus, Employee } from '../types';
import { translations } from '../translations';
import BulkAssignModal from './fieldops/BulkAssignModal';
import { Navigation2 } from 'lucide-react';

interface AdminTaskManagerProps {
 language: Language;
 currentUser: Employee;
 employees: Employee[];
 tasks: Task[];
 onCreateTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
 onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
 onDeleteTask: (taskId: string) => Promise<boolean>;
 onUpdateStatus: (taskId: string, status: TaskStatus, notes?: string) => Promise<boolean>;
}

export default function AdminTaskManager({
 language,
 currentUser,
 employees,
 tasks,
 onCreateTask,
 onUpdateTask,
 onDeleteTask,
 onUpdateStatus
}: AdminTaskManagerProps) {
 const t = translations[language] || translations.en;

 const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
 const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
 const [timeFilter, setTimeFilter] = useState<'today' | 'history'>('today');
 const [selectedDate, setSelectedDate] = useState<string>('');
 const [searchQuery, setSearchQuery] = useState('');
 const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
 const [priorityFilter, setPriorityFilter] = useState<string>('all');
 const [statusFilter, setStatusFilter] = useState<string>('all');

 // Modal States
 const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const fieldEmployees = employees.filter(
  e => e.hierarchyLevel === 'be' || (e.hierarchyLevel !== 'executive' && e.hierarchyLevel !== 'admin')
 );
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [editingTask, setEditingTask] = useState<Task | null>(null);
 const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
 const [nudgeSuccessTaskId, setNudgeSuccessTaskId] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Form State (Single Work Description, No separate title, No Due Date)
 const [formData, setFormData] = useState({
  description: '',
  priority: 'medium' as TaskPriority,
  assignedTo: '',
  taskDate: todayStr,
  status: 'in_progress' as TaskStatus,
  notes: ''
 });

 const employeesMap = useMemo(() => {
  const map: Record<string, Employee> = {};
  employees.forEach(emp => {
   map[emp.id] = emp;
  });
  return map;
 }, [employees]);

 // Filter tasks
 const filteredTasks = useMemo(() => {
  return tasks.filter(task => {
   const taskDate = task.taskDate || (task.createdAt ? task.createdAt.split('T')[0] : todayStr);

   // Time filter (Today's Work vs History/All)
   if (timeFilter === 'today' && taskDate !== todayStr) {
    return false;
   }
   if (timeFilter === 'history' && selectedDate && taskDate !== selectedDate) {
    return false;
   }

   // Assignee
   if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) {
    return false;
   }

   // Priority
   if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
    return false;
   }

   // Status
   if (statusFilter !== 'all' && task.status !== statusFilter) {
    return false;
   }

   // Search
   if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const descMatch = (task.description || task.title || '').toLowerCase().includes(q);
    const notesMatch = (task.notes || '').toLowerCase().includes(q);
    const empName = task.assignedTo && employeesMap[task.assignedTo] ? employeesMap[task.assignedTo].name.toLowerCase() : '';
    const empMatch = empName.includes(q);
    if (!descMatch && !notesMatch && !empMatch) return false;
   }

   return true;
  });
 }, [tasks, timeFilter, selectedDate, assigneeFilter, priorityFilter, statusFilter, searchQuery, employeesMap, todayStr]);

 // Statistics
 const stats = useMemo(() => {
  const relevant = timeFilter === 'today'
   ? tasks.filter(t => (t.taskDate || t.createdAt.split('T')[0]) === todayStr)
   : tasks;

  const total = relevant.length;
  const inProgress = relevant.filter(t => t.status === 'in_progress').length;
  const completed = relevant.filter(t => t.status === 'completed').length;
  const incomplete = relevant.filter(t => t.status === 'incomplete').length;
  const urgent = relevant.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  return { total, inProgress, completed, incomplete, urgent };
 }, [tasks, timeFilter, todayStr]);

 const handleOpenCreateModal = () => {
  setFormData({
   description: '',
   priority: 'medium',
   assignedTo: employees.length > 0 ? employees[0].id : '',
   taskDate: todayStr,
   status: 'in_progress',
   notes: ''
  });
  setShowCreateModal(true);
 };

 const handleOpenEditModal = (task: Task) => {
  setEditingTask(task);
  setFormData({
   description: task.description || task.title || '',
   priority: task.priority,
   assignedTo: task.assignedTo || '',
   taskDate: task.taskDate || task.createdAt.split('T')[0],
   status: task.status,
   notes: task.notes || ''
  });
 };

 const handleSaveForm = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.description.trim()) return;

  setIsSubmitting(true);

  if (editingTask) {
   // Update
   await onUpdateTask(editingTask.id, {
    description: formData.description.trim(),
    title: formData.description.trim().slice(0, 80),
    priority: formData.priority,
    assignedTo: formData.assignedTo || undefined,
    taskDate: formData.taskDate,
    status: formData.status,
    notes: formData.notes
   });
   setEditingTask(null);
  } else {
   // Create
   await onCreateTask({
    description: formData.description.trim(),
    title: formData.description.trim().slice(0, 80),
    priority: formData.priority,
    status: 'in_progress',
    assignedTo: formData.assignedTo || undefined,
    createdBy: currentUser.id,
    taskDate: formData.taskDate || todayStr,
    notes: formData.notes
   });
   setShowCreateModal(false);
  }

  setIsSubmitting(false);
 };

 const handleDelete = async () => {
  if (!deletingTaskId) return;
  setIsSubmitting(true);
  await onDeleteTask(deletingTaskId);
  setDeletingTaskId(null);
  setIsSubmitting(false);
 };

 const handleNudge = (taskId: string) => {
  setNudgeSuccessTaskId(taskId);
  setTimeout(() => {
   setNudgeSuccessTaskId(null);
  }, 3000);
 };

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

 return (
  <div id="admin-work-manager-container"className="space-y-6 sm:space-y-8 animate-fadeIn">
   
   {/* Top Header Card */}
   <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
     <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
       <CheckSquare className="w-5 h-5"/>
      </div>
      <div>
       <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
        {t.taskManager || 'Work Assignment Panel'}
       </h2>
       <p className="text-xs text-slate-400 mt-0.5">
        {language === 'te' 
         ? 'సిబ్బందికి రోజువారీ పనులను కేటాయించండి మరియు పూర్తయిన స్థితిని పర్యవేక్షించండి' 
         : 'Assign daily work directly to staff, inspect historical records, and track completion'}
       </p>
      </div>
     </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
     
     {/* Time Filter: Today vs All History */}
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
       {t.historyTasks ||"All Dates"}
      </button>
     </div>

     {/* View toggle */}
     <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
      <button
       onClick={() => setViewMode('table')}
       className={`p-1.5 rounded-lg transition-all cursor-pointer ${
        viewMode === 'table' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
       title="Table View"
      >
       <List className="w-4 h-4"/>
      </button>
      <button
       onClick={() => setViewMode('kanban')}
       className={`p-1.5 rounded-lg transition-all cursor-pointer ${
        viewMode === 'kanban' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
       title="Kanban View"
      >
       <LayoutGrid className="w-4 h-4"/>
      </button>
     </div>

     {/* Create Assignment Button */}
     <div className="flex items-center gap-2">
      <button
       onClick={() => setShowBulkAssignModal(true)}
       className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
      >
       <Navigation2 className="w-4 h-4"/>
       <span>Bulk Assign</span>
      </button>
      <button
       id="admin-btn-create-task"
       onClick={handleOpenCreateModal}
      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-teal-600/10 cursor-pointer"
     >
      <Plus className="w-4 h-4"/>
      <span>{t.createTask || 'Assign New Work'}</span>
     </button>
     </div>


    </div>
   </div>

   {/* KPI Stats Cards */}
   <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
      {timeFilter === 'today' ? (language === 'te' ? 'ఈరోజు కేటాయించినవి' :"Today's Total") : (t.totalTasks || 'Total Assigned')}
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

    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
     <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
      {t.priorityUrgent || 'Urgent Active'}
     </span>
     <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-2">
      {stats.urgent}
     </p>
    </div>
   </div>

   {/* Search & Multi-Filters Toolbar */}
   <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
    <div className="relative flex-1 w-full">
     <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400"/>
     <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={t.searchTasks || 'Search work description, notes, or staff name...'}
      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
     />
    </div>

    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
     {/* History Date Picker */}
     {timeFilter === 'history' && (
      <input
       type="date"
       value={selectedDate}
       onChange={(e) => setSelectedDate(e.target.value)}
       className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
       title="Filter by specific date"
      />
     )}

     {/* Assignee Filter */}
     <select
      value={assigneeFilter}
      onChange={(e) => setAssigneeFilter(e.target.value)}
      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
     >
      <option value="all">{t.filterByAssignee || 'All Staff'}</option>
      {employees.map(emp => (
       <option key={emp.id} value={emp.id}>{emp.name}</option>
      ))}
     </select>

     {/* Priority Filter */}
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

     {/* Status Filter */}
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

   {/* Main Display: Table or Kanban */}
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
       ? (language === 'te' ? 'ఈరోజు ఎలాంటి పనులు కేటాయించలేదు. కొత్త పనిని చేర్చడానికి పైన ఉన్న బటన్‌ను క్లిక్ చేయండి.' : 'No assignments created for today yet. Click"Assign New Work"above to assign tasks.')
       : (language === 'te' ? 'ఎంచుకున్న ఫిల్టర్‌కు అనుగుణంగా రికార్డులేవీ లేవు.' : 'No historical work assignments found for the selected filter criteria.')}
     </p>
    </div>
   ) : viewMode === 'table' ? (
    /* TABLE VIEW */
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
       <thead>
        <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
         <th className="py-4 px-6">{t.taskDescription || 'Work Description'}</th>
         <th className="py-4 px-4">{t.assignedTo || 'Assigned Staff'}</th>
         <th className="py-4 px-4">{t.taskPriority || 'Priority'}</th>
         <th className="py-4 px-4">{t.taskDate || 'Date'}</th>
         <th className="py-4 px-4">{t.taskStatus || 'Status'}</th>
         <th className="py-4 px-6 text-right">Actions</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
        {filteredTasks.map((task) => {
         const assignedEmp = task.assignedTo ? employeesMap[task.assignedTo] : null;
         const taskDate = task.taskDate || (task.createdAt ? task.createdAt.split('T')[0] : todayStr);

         return (
          <tr key={task.id} className="hover:bg-slate-50/60 transition-colors group">
           
           {/* Work Description */}
           <td className="py-4 px-6 max-w-md">
            <div className="space-y-1">
             <p className="text-xs font-bold text-slate-800 leading-snug whitespace-pre-wrap">
              {task.description || task.title}
             </p>
             {task.notes && (
              <p className="text-[10px] text-amber-700 bg-amber-50/70 p-1.5 rounded-lg font-mono border border-amber-100/50">
               {task.notes}
              </p>
             )}
            </div>
           </td>

           {/* Assigned Staff */}
           <td className="py-4 px-4">
            {assignedEmp ? (
             <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-[10px]">
               {assignedEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
               <span className="font-bold text-slate-800 block text-xs">{assignedEmp.name}</span>
               <span className="text-[10px] text-slate-400 block">{assignedEmp.id}</span>
              </div>
             </div>
            ) : (
             <span className="text-[10px] text-slate-400 italic">Unassigned</span>
            )}
           </td>

           {/* Priority */}
           <td className="py-4 px-4">
            {getPriorityBadge(task.priority)}
           </td>

           {/* Date */}
           <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
            {taskDate === todayStr ? (
             <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {language === 'te' ? 'ఈరోజు' : 'Today'}
             </span>
            ) : (
             taskDate
            )}
           </td>

           {/* Status */}
           <td className="py-4 px-4">
            {getStatusBadge(task.status)}
           </td>

           {/* Actions */}
           <td className="py-4 px-6 text-right">
            <div className="flex items-center justify-end gap-1.5">
             
             {/* Nudge / Remind */}
             {task.status !== 'completed' && task.assignedTo && (
              <button
               onClick={() => handleNudge(task.id)}
               className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all cursor-pointer"
               title={t.nudgeEmployee ||"Send Reminder Nudge"}
              >
               {nudgeSuccessTaskId === task.id ? (
                <Check className="w-4 h-4 text-emerald-600"/>
               ) : (
                <Send className="w-4 h-4"/>
               )}
              </button>
             )}

             {/* Edit */}
             <button
              onClick={() => handleOpenEditModal(task)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
              title="Edit Assignment"
             >
              <Edit3 className="w-4 h-4"/>
             </button>

             {/* Delete */}
             <button
              onClick={() => setDeletingTaskId(task.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Delete Assignment"
             >
              <Trash2 className="w-4 h-4"/>
             </button>

            </div>
           </td>

          </tr>
         );
        })}
       </tbody>
      </table>
     </div>
    </div>
   ) : (
    /* KANBAN VIEW */
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {/* In Progress */}
     <div className="space-y-3">
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

      {filteredTasks
       .filter(t => t.status === 'in_progress')
       .map(task => (
        <div key={task.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
         <div className="flex items-center justify-between">
          {getPriorityBadge(task.priority)}
          <span className="text-[10px] font-mono text-slate-400">{task.taskDate || todayStr}</span>
         </div>
         <p className="text-xs font-bold text-slate-800 leading-snug">
          {task.description || task.title}
         </p>
         <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-600">
           {task.assignedTo && employeesMap[task.assignedTo] ? employeesMap[task.assignedTo].name : 'Unassigned'}
          </span>
          <div className="flex items-center gap-1">
           <button onClick={() => handleOpenEditModal(task)} className="p-1 text-slate-400 hover:text-blue-600">
            <Edit3 className="w-3.5 h-3.5"/>
           </button>
           <button onClick={() => setDeletingTaskId(task.id)} className="p-1 text-slate-400 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5"/>
           </button>
          </div>
         </div>
        </div>
       ))}
     </div>

     {/* Completed */}
     <div className="space-y-3">
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

      {filteredTasks
       .filter(t => t.status === 'completed')
       .map(task => (
        <div key={task.id} className="bg-white rounded-2xl p-4 border border-emerald-100/80 bg-emerald-50/10 shadow-sm space-y-3">
         <div className="flex items-center justify-between">
          {getPriorityBadge(task.priority)}
          <span className="text-[10px] font-mono text-slate-400">{task.taskDate || todayStr}</span>
         </div>
         <p className="text-xs font-bold text-slate-800 leading-snug">
          {task.description || task.title}
         </p>
         <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-600">
           {task.assignedTo && employeesMap[task.assignedTo] ? employeesMap[task.assignedTo].name : 'Unassigned'}
          </span>
          <div className="flex items-center gap-1">
           <button onClick={() => handleOpenEditModal(task)} className="p-1 text-slate-400 hover:text-blue-600">
            <Edit3 className="w-3.5 h-3.5"/>
           </button>
           <button onClick={() => setDeletingTaskId(task.id)} className="p-1 text-slate-400 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5"/>
           </button>
          </div>
         </div>
        </div>
       ))}
     </div>

     {/* In-Complete */}
     <div className="space-y-3">
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

      {filteredTasks
       .filter(t => t.status === 'incomplete')
       .map(task => (
        <div key={task.id} className="bg-white rounded-2xl p-4 border border-rose-100 bg-rose-50/10 shadow-sm space-y-3">
         <div className="flex items-center justify-between">
          {getPriorityBadge(task.priority)}
          <span className="text-[10px] font-mono text-slate-400">{task.taskDate || todayStr}</span>
         </div>
         <p className="text-xs font-bold text-slate-800 leading-snug">
          {task.description || task.title}
         </p>
         <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-600">
           {task.assignedTo && employeesMap[task.assignedTo] ? employeesMap[task.assignedTo].name : 'Unassigned'}
          </span>
          <div className="flex items-center gap-1">
           <button onClick={() => handleOpenEditModal(task)} className="p-1 text-slate-400 hover:text-blue-600">
            <Edit3 className="w-3.5 h-3.5"/>
           </button>
           <button onClick={() => setDeletingTaskId(task.id)} className="p-1 text-slate-400 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5"/>
           </button>
          </div>
         </div>
        </div>
       ))}
     </div>
    </div>
   )}

   {/* CREATE / EDIT WORK ASSIGNMENT MODAL */}
   {(showCreateModal || editingTask) && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
     <div className="bg-white rounded-[32px] w-full max-w-lg shadow-md overflow-hidden">
      
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
       <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
         <CheckSquare className="w-4 h-4"/>
        </div>
        <h3 className="text-base font-black text-slate-800 tracking-tight">
         {editingTask ? (t.editTask || 'Edit Work Assignment') : (t.createTask || 'Assign New Work')}
        </h3>
       </div>
       <button
        onClick={() => {
         setShowCreateModal(false);
         setEditingTask(null);
        }}
        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
       >
        <X className="w-5 h-5"/>
       </button>
      </div>

      <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
       
       {/* Direct Work Description */}
       <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
         {t.taskDescription || 'Work Description'} <span className="text-rose-500">*</span>
        </label>
        <textarea
         required
         rows={4}
         value={formData.description}
         onChange={(e) => setFormData({ ...formData, description: e.target.value })}
         placeholder={language === 'te' ? 'కేటాయించాల్సిన పని వివరాలను ఇక్కడ రాయండి...' : 'Enter full details of the work to be done...'}
         className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
        />
       </div>

       {/* Assignee & Date */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Assignee */}
        <div className="space-y-1.5">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.assignedTo || 'Assign To Staff'}
         </label>
         <select
          value={formData.assignedTo}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
         >
          <option value="">Unassigned</option>
          {employees.map(emp => (
           <option key={emp.id} value={emp.id}>
            {emp.name} ({emp.designation || emp.role})
           </option>
          ))}
         </select>
        </div>

        {/* Assignment Date */}
        <div className="space-y-1.5">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.taskDate || 'Assignment Date'}
         </label>
         <input
          type="date"
          value={formData.taskDate}
          onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
         />
        </div>

       </div>

       {/* Priority & Status (if editing) */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Priority */}
        <div className="space-y-1.5">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.taskPriority || 'Priority'}
         </label>
         <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
         >
          <option value="urgent">{t.priorityUrgent || 'Urgent'}</option>
          <option value="high">{t.priorityHigh || 'High'}</option>
          <option value="medium">{t.priorityMedium || 'Medium'}</option>
          <option value="low">{t.priorityLow || 'Low'}</option>
         </select>
        </div>

        {/* Status (Editable when modifying) */}
        {editingTask ? (
         <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
           {t.taskStatus || 'Status'}
          </label>
          <select
           value={formData.status}
           onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
          >
           <option value="in_progress">{t.taskStatusInProgress || 'In Progress'}</option>
           <option value="completed">{t.taskStatusCompleted || 'Completed'}</option>
           <option value="incomplete">{t.taskStatusIncomplete || 'In-Complete'}</option>
          </select>
         </div>
        ) : (
         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600"/>
          <div>
           <span className="text-[9px] font-bold text-slate-400 uppercase block">Initial Status</span>
           <span className="text-xs font-bold text-blue-700">In Progress (Active Today)</span>
          </div>
         </div>
        )}

       </div>

       {/* Remarks / Guidance Notes */}
       <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
         {t.taskNotes || 'Initial Notes / Instructions'}
        </label>
        <input
         type="text"
         value={formData.notes}
         onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
         placeholder="Optional guidance notes or instructions..."
         className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-700"
        />
       </div>

       {/* Submit Buttons */}
       <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        <button
         type="button"
         onClick={() => {
          setShowCreateModal(false);
          setEditingTask(null);
         }}
         className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
        >
         {t.cancel || 'Cancel'}
        </button>

        <button
         type="submit"
         disabled={isSubmitting || !formData.description.trim()}
         className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-teal-600/10 cursor-pointer"
        >
         {isSubmitting ? (t.loading || 'Saving...') : (editingTask ? (t.save || 'Save Changes') : (t.createTask || 'Assign Work'))}
        </button>
       </div>

      </form>

     </div>
    </div>
   )}

   {/* DELETE CONFIRMATION MODAL */}
   {deletingTaskId && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
     <div className="bg-white rounded-[32px] w-full max-w-sm p-6 space-y-5 shadow-md text-center">
      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
       <Trash2 className="w-6 h-6"/>
      </div>
      
      <div className="space-y-1">
       <h3 className="text-base font-black text-slate-800">
        {language === 'te' ? 'పని కేటాయింపును తొలగించాలా?' : 'Delete Work Assignment?'}
       </h3>
       <p className="text-xs text-slate-400 leading-relaxed">
        {t.deleteTaskConfirm || 'Are you sure you want to delete this work assignment? This action cannot be undone.'}
       </p>
      </div>

      <div className="flex gap-2">
       <button
        onClick={() => setDeletingTaskId(null)}
        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
       >
        {t.cancel || 'Cancel'}
       </button>
       <button
        onClick={handleDelete}
        disabled={isSubmitting}
        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-rose-600/10"
       >
        {t.deleteEmployee || 'Delete'}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Bulk Assign Modal */}
   {showBulkAssignModal && (
    <BulkAssignModal
     onClose={() => {
      setShowBulkAssignModal(false);
     }}
     employees={fieldEmployees}
     adminId={currentUser.id}
    />
   )}
  </div>
 );
}
