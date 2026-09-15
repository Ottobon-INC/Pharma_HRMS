import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Employee } from '../../types';
import { OrcaLogo } from '../OrcaLogo';

interface AppHeaderProps {
  currentUser: Employee;
  onOpenProfile: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
  onOpenMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onOpenProfile,
  onLogoClick,
  onOpenMenu
}) => {
  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const level = currentUser.hierarchyLevel || 'be';
  let roleText = 'Business Executive';
  if (level === 'admin' || currentUser.role === 'admin') roleText = 'Corporate Admin';
  if (level === 'executive') roleText = 'General Manager';
  if (level === 'zsm') roleText = `ZSM (${currentUser.zone || 'Zone'})`;
  if (level === 'rsm') roleText = `RSM (${currentUser.zone || 'Region'})`;
  if (level === 'be') roleText = 'Field Executive (BE)';

  return (
    <header id="global-portal-header" className="sticky top-0 z-40 no-print pt-6 pb-2">
      <div className="w-full max-w-[1600px] mx-auto px-6 flex items-center justify-between">

        {/* Brand / Logo Area */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-2 text-slate-700 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all cursor-pointer border border-transparent flex items-center justify-center shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Orca Logo */}
          <div
            className="flex items-center cursor-pointer select-none"
            onClick={onLogoClick}
          >
            <OrcaLogo size="md" variant="light" layout="horizontal" />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative cursor-pointer">
            <Bell size={18} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-100"></div>
          </button>

          <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer hidden sm:flex">
            <Search size={18} />
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 py-1.5 pl-1.5 pr-4 rounded-full transition-colors cursor-pointer ml-2"
          >
            <div className="bg-slate-700 text-white w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {getAvatarInitials(currentUser.name)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[13px] font-bold text-slate-800 block leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">{roleText}</span>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};

export default AppHeader;
