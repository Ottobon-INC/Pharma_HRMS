import React from 'react';
import {
 Home,
 Users,
 Calendar,
 Clock,
 Moon,
 CalendarDays,
 MapPin,
 MessageSquare,
 CheckSquare,
 Settings,
 Radio
} from 'lucide-react';
import { Employee } from '../../types';

interface AppMobileNavProps {
 currentUser: Employee;
 activeTab: string;
 onSelectTab: (tab: string) => void;
}

export const AppMobileNav: React.FC<AppMobileNavProps> = ({
 currentUser,
 activeTab,
 onSelectTab
}) => {
 const isAdmin = currentUser.role === 'admin';

 return (
  <nav id="mobile-navigation"className="print:hidden lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center overflow-x-auto px-4 py-1 gap-2 z-40 no-print hide-scrollbar">
   {isAdmin ? (
    /* --- ADMIN MOBILE BUTTONS --- */
    <>
     <button
      onClick={() => onSelectTab('adminDashboard')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'adminDashboard' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Home className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Home</span>
     </button>

     <button
      onClick={() => onSelectTab('adminTasks')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'adminTasks' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <CheckSquare className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Work</span>
     </button>

     <button
      onClick={() => onSelectTab('directory')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'directory' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Users className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Staff</span>
     </button>

     <button
      onClick={() => onSelectTab('attendanceOverview')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'attendanceOverview' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Calendar className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Attend</span>
     </button>

     <button
      onClick={() => onSelectTab('leaveApprovals')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'leaveApprovals' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Moon className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Leaves</span>
     </button>

     <button
      onClick={() => onSelectTab('officeLocations')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'officeLocations' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <MapPin className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Offices</span>
     </button>

     <button
      onClick={() => onSelectTab('messages')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'messages' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <MessageSquare className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Chat</span>
     </button>

     <button
      onClick={() => onSelectTab('fieldOps')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'fieldOps' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <MapPin className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Field Ops</span>
     </button>

     <button
      onClick={() => onSelectTab('adminSettings')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'adminSettings' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Settings className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Settings</span>
     </button>
    </>
   ) : (
    /* --- EMPLOYEE MOBILE BUTTONS --- */
    <>
     <button
      onClick={() => onSelectTab('dashboard')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'dashboard' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Home className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Home</span>
     </button>

     <button
      onClick={() => onSelectTab('tasks')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'tasks' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <CheckSquare className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Work</span>
     </button>

     <button
      onClick={() => onSelectTab('fieldDuty')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'fieldDuty' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <MapPin className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Field Nav</span>
     </button>

     

     <button
      onClick={() => onSelectTab('attendance')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'attendance' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Calendar className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Attend</span>
     </button>

     <button
      onClick={() => onSelectTab('leave')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'leave' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Moon className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Leave</span>
     </button>

     <button
      onClick={() => onSelectTab('employeeMissedPunches')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'employeeMissedPunches' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <Clock className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Mispunch</span>
     </button>

     <button
      onClick={() => onSelectTab('messages')}
      className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all cursor-pointer ${
       activeTab === 'messages' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
     >
      <MessageSquare className="w-5 h-5"/>
      <span className="text-[8px] font-bold uppercase mt-1 leading-none">Chat</span>
     </button>
    </>
   )}
  </nav>
 );
};

export default AppMobileNav;
