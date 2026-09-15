import React from 'react';
import { Home, Users, Moon, Menu, MapPin, LogOut } from 'lucide-react';
import { Employee } from '../../types';

interface MobileBottomNavProps {
  currentUser: Employee;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu: () => void;
  onLogout: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenMenu,
  onLogout
}) => {
  const isExecutive = currentUser.hierarchyLevel === 'executive';
  const isManager = currentUser.hierarchyLevel === 'manager';
  const isAdmin = currentUser.role === 'admin' || isExecutive || isManager;

  const getNavClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
      isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
    }`;
  };

  const getIndicatorClass = (tabId: string) => {
    return `absolute top-0 w-8 h-1 rounded-b-full transition-all duration-300 ${
      activeTab === tabId ? 'bg-teal-600' : 'bg-transparent'
    }`;
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-40 flex items-center justify-around px-2 pb-safe">
      {isAdmin ? (
        <>
          <button onClick={() => onSelectTab(isExecutive ? 'executiveOverview' : 'adminDashboard')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass(isExecutive ? 'executiveOverview' : 'adminDashboard')}></div>
            <div className={getNavClass(isExecutive ? 'executiveOverview' : 'adminDashboard')}>
              <Home size={20} strokeWidth={activeTab === (isExecutive ? 'executiveOverview' : 'adminDashboard') ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Home</span>
            </div>
          </button>
          
          <button onClick={() => onSelectTab('directory')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass('directory')}></div>
            <div className={getNavClass('directory')}>
              <Users size={20} strokeWidth={activeTab === 'directory' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Directory</span>
            </div>
          </button>

          <button onClick={() => onSelectTab('leaveApprovals')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass('leaveApprovals')}></div>
            <div className={getNavClass('leaveApprovals')}>
              <Moon size={20} strokeWidth={activeTab === 'leaveApprovals' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Leaves</span>
            </div>
          </button>
        </>
      ) : (
        <>
          <button onClick={() => onSelectTab('dashboard')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass('dashboard')}></div>
            <div className={getNavClass('dashboard')}>
              <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Home</span>
            </div>
          </button>

          <button onClick={() => onSelectTab('fieldDuty')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass('fieldDuty')}></div>
            <div className={getNavClass('fieldDuty')}>
              <MapPin size={20} strokeWidth={activeTab === 'fieldDuty' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Duty</span>
            </div>
          </button>

          <button onClick={() => onSelectTab('leave')} className="relative w-1/5 h-full flex flex-col items-center justify-center">
            <div className={getIndicatorClass('leave')}></div>
            <div className={getNavClass('leave')}>
              <Moon size={20} strokeWidth={activeTab === 'leave' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Leaves</span>
            </div>
          </button>
        </>
      )}

      {/* Menu Drawer Toggle */}
      <button onClick={onOpenMenu} className="relative w-1/5 h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Menu size={20} />
          <span className="text-[10px] font-medium">Menu</span>
        </div>
      </button>

      {/* Logout */}
      <button onClick={onLogout} className="relative w-1/5 h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-rose-500 transition-colors">
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </div>
      </button>
    </div>
  );
};
