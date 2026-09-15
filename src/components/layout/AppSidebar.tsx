import React from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  Moon, 
  MapPin, 
  MessageSquare, 
  CheckSquare, 
  Settings, 
  Activity, 
  Power,
  Camera,
  Menu,
  GitBranch,
  Clock,
  UserCheck
} from 'lucide-react';
import { Employee, isExemptAdmin } from '../../types';

interface AppSidebarProps {
  currentUser: Employee;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  const level = currentUser.hierarchyLevel || 'be';
  const isCorporateAdmin = isExemptAdmin(currentUser);
  const isExecutive = level === 'executive' || isCorporateAdmin;
  const isZSM = level === 'zsm';
  const isRSM = level === 'rsm' || level === 'team_lead' || level === 'manager';
  const isManagerOrZSM = isZSM || isRSM;
  const isAdmin = isExecutive || isManagerOrZSM;

  // Common button class generator matching VizagIVF_HRMS exactly
  const getBtnClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    if (isActive) {
      return "w-full flex items-center px-6 py-2.5 bg-teal-50 text-teal-600 font-semibold transition-colors cursor-pointer group/btn relative before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-teal-600";
    }
    return "w-full flex items-center px-6 py-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer group/btn relative";
  };

  const getIconClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `shrink-0 w-6 flex justify-center ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover/btn:text-slate-600'}`;
  };

  return (
    <aside id="desktop-sidebar" className="hidden lg:flex flex-col bg-white border-r border-slate-100 h-full no-print w-[80px] hover:w-64 transition-all duration-300 overflow-hidden group z-50 shrink-0">
      
      {/* Top Toggle Area */}
      <div className="h-16 flex items-center px-6 shrink-0">
        <div className="w-6 flex justify-center">
          <Menu className="w-6 h-6 text-slate-800 shrink-0 cursor-pointer" />
        </div>
        <span className="ml-4 font-bold text-lg text-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Menu
        </span>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-2 flex flex-col gap-0.5 overflow-hidden">
        {isAdmin ? (
          <>
            {/* Punch In / Duty for non-exempt leadership (ZSM & RSM) */}
            {isManagerOrZSM && (
              <button onClick={() => onSelectTab('dashboard')} className={getBtnClass('dashboard')}>
                <div className={getIconClass('dashboard')}>
                  <Clock size={22} />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">
                  {currentUser.isCheckedIn ? 'My Duty (Active)' : 'Punch In / Duty'}
                </span>
              </button>
            )}

            {isExecutive && (
              <button onClick={() => onSelectTab('executiveOverview')} className={getBtnClass('executiveOverview')}>
                <div className={getIconClass('executiveOverview')}>
                  <Activity size={22} />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Executive Overview</span>
              </button>
            )}

            <button onClick={() => onSelectTab('adminDashboard')} className={getBtnClass('adminDashboard')}>
              <div className={getIconClass('adminDashboard')}>
                <Home size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Dashboard</span>
            </button>

            <button onClick={() => onSelectTab('orgChart')} className={getBtnClass('orgChart')}>
              <div className={getIconClass('orgChart')}>
                <GitBranch size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Team Hierarchy</span>
            </button>

            <button onClick={() => onSelectTab('teamHub')} className={getBtnClass('teamHub')}>
              <div className={getIconClass('teamHub')}>
                <UserCheck size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Team Hub</span>
            </button>

            <button onClick={() => onSelectTab('directory')} className={getBtnClass('directory')}>
              <div className={getIconClass('directory')}>
                <Users size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Directory</span>
            </button>

            <button onClick={() => onSelectTab('attendanceOverview')} className={getBtnClass('attendanceOverview')}>
              <div className={getIconClass('attendanceOverview')}>
                <Calendar size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Attendance</span>
            </button>

            <button onClick={() => onSelectTab('leaveApprovals')} className={getBtnClass('leaveApprovals')}>
              <div className={getIconClass('leaveApprovals')}>
                <Moon size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Leaves</span>
            </button>

            <button onClick={() => onSelectTab('doctorPlanner')} className={getBtnClass('doctorPlanner')}>
              <div className={getIconClass('doctorPlanner')}>
                <Calendar size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Doctor Plans</span>
            </button>

            {(isRSM || isZSM) && (
              <>
                <button onClick={() => onSelectTab('callCapture')} className={getBtnClass('callCapture')}>
                  <div className={getIconClass('callCapture')}>
                    <Camera size={22} />
                  </div>
                  <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Visit Log</span>
                </button>
                <button onClick={() => onSelectTab('fieldDuty')} className={getBtnClass('fieldDuty')}>
                  <div className={getIconClass('fieldDuty')}>
                    <MapPin size={22} />
                  </div>
                  <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Navigation</span>
                </button>
              </>
            )}

            {isExecutive && (
              <button onClick={() => onSelectTab('officeLocations')} className={getBtnClass('officeLocations')}>
                <div className={getIconClass('officeLocations')}>
                  <MapPin size={22} />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Locations</span>
              </button>
            )}

            <button onClick={() => onSelectTab('messages')} className={getBtnClass('messages')}>
              <div className={getIconClass('messages')}>
                <MessageSquare size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Messages</span>
            </button>

            {isExecutive && (
              <button onClick={() => onSelectTab('fieldOps')} className={getBtnClass('fieldOps')}>
                <div className={getIconClass('fieldOps')}>
                  <MapPin size={22} />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Field Register</span>
              </button>
            )}

            <button onClick={() => onSelectTab('adminTasks')} className={getBtnClass('adminTasks')}>
              <div className={getIconClass('adminTasks')}>
                <CheckSquare size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Assignments</span>
            </button>

            {isExecutive && (
              <button onClick={() => onSelectTab('adminSettings')} className={getBtnClass('adminSettings')}>
                <div className={getIconClass('adminSettings')}>
                  <Settings size={22} />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Settings</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => onSelectTab('dashboard')} className={getBtnClass('dashboard')}>
              <div className={getIconClass('dashboard')}>
                <Home size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Home</span>
            </button>

            <button onClick={() => onSelectTab('fieldDuty')} className={getBtnClass('fieldDuty')}>
              <div className={getIconClass('fieldDuty')}>
                <MapPin size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Navigation</span>
            </button>

            <button onClick={() => onSelectTab('callCapture')} className={getBtnClass('callCapture')}>
              <div className={getIconClass('callCapture')}>
                <Camera size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Visit Log</span>
            </button>

            <button onClick={() => onSelectTab('doctorPlanner')} className={getBtnClass('doctorPlanner')}>
              <div className={getIconClass('doctorPlanner')}>
                <Calendar size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Visit Planner</span>
            </button>

            <button onClick={() => onSelectTab('attendance')} className={getBtnClass('attendance')}>
              <div className={getIconClass('attendance')}>
                <Calendar size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">My Attendance</span>
            </button>

            <button onClick={() => onSelectTab('leave')} className={getBtnClass('leave')}>
              <div className={getIconClass('leave')}>
                <Moon size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Leave Requests</span>
            </button>

            <button onClick={() => onSelectTab('tasks')} className={getBtnClass('tasks')}>
              <div className={getIconClass('tasks')}>
                <CheckSquare size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Work Assignment</span>
            </button>

            <button onClick={() => onSelectTab('messages')} className={getBtnClass('messages')}>
              <div className={getIconClass('messages')}>
                <MessageSquare size={22} />
              </div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">Messages</span>
            </button>
          </>
        )}
      </div>

      {/* Footer / Power */}
      <div className="pb-4">
        <button onClick={onLogout} className="w-full flex items-center px-6 py-2.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer group/btn">
          <div className="w-6 flex justify-center shrink-0">
            <Power size={22} />
          </div>
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">Log out</span>
        </button>
      </div>

    </aside>
  );
};

export default AppSidebar;
