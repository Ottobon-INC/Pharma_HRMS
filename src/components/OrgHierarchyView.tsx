import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Users, 
  ChevronDown, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw
} from 'lucide-react';
import { Employee, Language } from '../types';

interface OrgHierarchyViewProps {
  language: Language;
  employees: Employee[];
  currentUser: Employee;
}

// Avatar Component matching VizagIVF_HRMS
const Avatar = ({ employee, size = 'md' }: { employee?: Employee; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const name = employee?.name || 'Unknown';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OL';
  const isOnline = employee?.isCheckedIn;

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base'
  };

  return (
    <div className="relative inline-block shrink-0">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold overflow-hidden bg-slate-100 text-slate-700 shadow-sm ring-2 ring-white`}>
        {(employee as any)?.photo ? (
          <img src={(employee as any).photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <span 
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
        title={isOnline ? 'Checked In Today' : 'Offline'}
      />
    </div>
  );
};

export const OrgHierarchyView: React.FC<OrgHierarchyViewProps> = ({
  employees,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<'all' | 'AP' | 'TS'>('all');
  
  // Interactive Viewport Scaling & Pan
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Use the verified database-driven employees list directly
  const allEmployees = employees;

  const findEmp = useCallback((id: string) => {
    return allEmployees.find(e => e.id === id || e.employeeCode === id);
  }, [allEmployees]);

  // Structured Hierarchy Definition for Orca Labs Pharma
  const hierarchyData = useMemo(() => {
    // 1. Corporate Leadership
    const divya = findEmp('OL009') || { id: 'OL009', name: 'N V DIVYA SIRISHA', designation: 'HR & FIN' } as Employee;
    const aswani = findEmp('OL026') || { id: 'OL026', name: 'P ASWANI', designation: 'GM' } as Employee;
    const suneel = findEmp('OL001') || { id: 'OL001', name: 'Suneel Kumar Kovuri', designation: 'Executive GM' } as Employee;

    // 2. AP Zone
    const janardhan = findEmp('OL004') || { id: 'OL004', name: 'B V JANARDHAN', designation: 'ZSM(AP)' } as Employee;
    const apBranches = [
      {
        id: 'rsm-naidu',
        title: 'G. A. Naidu Team',
        manager: findEmp('OL002') || { id: 'OL002', name: 'G.A.Naidu', designation: 'RSM' } as Employee,
        bes: [
          findEmp('OL013') || { id: 'OL013', name: 'J POLIRAJU', designation: 'BE' } as Employee,
          findEmp('OL043') || { id: 'OL043', name: 'P. SHIVA', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'rsm-nageswara',
        title: 'K. Nageswara Rao Team',
        manager: findEmp('OL023') || { id: 'OL023', name: 'K NAGESWARA RAO', designation: 'RSM' } as Employee,
        bes: [
          findEmp('OL010') || { id: 'OL010', name: 'E S SURYA PRAKASH YADAV', designation: 'BE' } as Employee,
          findEmp('OL029') || { id: 'OL029', name: 'L NAVEEN', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'rsm-satyanarayana',
        title: 'B. V. Satyanarayana Team',
        manager: findEmp('OL015') || { id: 'OL015', name: 'B V SATYANARAYANA', designation: 'RSM' } as Employee,
        bes: [
          findEmp('OL024') || { id: 'OL024', name: 'R.VENKATA SAITEJA', designation: 'BE' } as Employee,
          findEmp('OL007') || { id: 'OL007', name: 'K.Karthiek', designation: 'BE' } as Employee,
          findEmp('OL025') || { id: 'OL025', name: 'PATHAN INJUMAM KHAN', designation: 'BE' } as Employee,
          findEmp('OL035') || { id: 'OL035', name: 'BURRI TIRUPATHI RAO', designation: 'BE' } as Employee,
          findEmp('OL036') || { id: 'OL036', name: 'EKKIRALA SURENDRA', designation: 'BE' } as Employee,
          findEmp('OL034') || { id: 'OL034', name: 'Syed Hayath Basha', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'rsm-ravi',
        title: 'Byrisetty Ravi Team',
        manager: findEmp('OL019') || { id: 'OL019', name: 'Byrisetty Ravi', designation: 'RSM' } as Employee,
        bes: [
          findEmp('OL028') || { id: 'OL028', name: 'V MAHESH', designation: 'BE' } as Employee,
          findEmp('OL041') || { id: 'OL041', name: 'V SUDHAKAR', designation: 'BE' } as Employee,
          findEmp('OL044') || { id: 'OL044', name: 'P NAGARAJU', designation: 'BE' } as Employee,
          findEmp('OL018') || { id: 'OL018', name: 'D Nagaraj', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'rsm-venkat-rao',
        title: 'LDV Venkat Rao Team',
        manager: findEmp('OL005') || { id: 'OL005', name: 'Lanka Dhana Veera Venkata Rao', designation: 'RSM' } as Employee,
        bes: [
          findEmp('OL037') || { id: 'OL037', name: 'GALI SANTHOSH BABU', designation: 'BE' } as Employee,
          findEmp('OL038') || { id: 'OL038', name: 'P SANTHOSH KUMAR', designation: 'BE' } as Employee,
          findEmp('OL040') || { id: 'OL040', name: 'P VEERESH', designation: 'BE' } as Employee
        ]
      }
    ];

    // 3. TS Zone
    const ramendra = findEmp('OL003') || { id: 'OL003', name: 'Ramendra Kumar', designation: 'ZSM(TS)' } as Employee;
    const tsBranches = [
      {
        id: 'rsm-ravinder',
        title: 'P. Ravinder Reddy Team',
        manager: findEmp('OL011') || { id: 'OL011', name: 'P Ravinder Reddy', designation: 'RSM' } as Employee,
        isDirect: false,
        bes: [
          findEmp('OL045') || { id: 'OL045', name: 'M. KIRAN', designation: 'BE' } as Employee,
          findEmp('OL033') || { id: 'OL033', name: 'N Lakshmi Reddy', designation: 'BE' } as Employee,
          findEmp('OL021') || { id: 'OL021', name: 'R Veerabhadram', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'direct-zsm-team',
        title: 'Direct ZSM Team',
        manager: ramendra,
        isDirect: true,
        bes: [
          findEmp('OL006') || { id: 'OL006', name: 'Thirupathi Aedla', designation: 'BE' } as Employee,
          findEmp('OL008') || { id: 'OL008', name: 'N . Venkat', designation: 'BE' } as Employee
        ]
      },
      {
        id: 'rsm-laxminarayana',
        title: 'T. Laxminarayana Team',
        manager: findEmp('OL032') || { id: 'OL032', name: 'Tadapnuri Laxminarayana', designation: 'RSM' } as Employee,
        isDirect: false,
        bes: [
          findEmp('OL020') || { id: 'OL020', name: 'Rupavath Dathu', designation: 'BE' } as Employee,
          findEmp('OL030') || { id: 'OL030', name: 'S Prashanth', designation: 'BE' } as Employee
        ]
      }
    ];

    return {
      leadership: { suneel, divya, aswani },
      ap: { zsm: janardhan, branches: apBranches },
      ts: { zsm: ramendra, branches: tsBranches }
    };
  }, [allEmployees, findEmp]);

  // Search match helper
  const isMatch = useCallback((emp?: Employee) => {
    if (!searchQuery.trim() || !emp) return false;
    const q = searchQuery.toLowerCase();
    return (emp.name || '').toLowerCase().includes(q) ||
           (emp.designation || '').toLowerCase().includes(q) ||
           (emp.id || '').toLowerCase().includes(q);
  }, [searchQuery]);

  // Intelligent Auto-Fit Calculation matching VizagIVF_HRMS
  const handleFitToScreen = useCallback(() => {
    if (!viewportRef.current || !contentRef.current) return;
    const vp = viewportRef.current.getBoundingClientRect();
    
    // Measure natural unscaled content size
    const contentW = contentRef.current.scrollWidth || contentRef.current.offsetWidth;
    const contentH = contentRef.current.scrollHeight || contentRef.current.offsetHeight;
    
    if (contentW <= 0 || contentH <= 0 || vp.width <= 0 || vp.height <= 0) return;
    
    const paddingX = 40;
    const paddingY = 32;
    const availableW = vp.width - paddingX;
    const availableH = vp.height - paddingY;
    
    const scaleX = availableW / contentW;
    const scaleY = availableH / contentH;
    
    const fitScale = Math.min(scaleX, scaleY);
    const clampedScale = Math.max(0.35, Math.min(1.0, parseFloat(fitScale.toFixed(2))));
    
    setScale(clampedScale);
    setPan({ x: 0, y: 0 });
  }, []);

  // Recalculate auto-fit when zone changes or window resizes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 120);

    const onResize = () => handleFitToScreen();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [selectedZone, handleFitToScreen, employees]);

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setScale(s => Math.max(0.35, Math.min(1.4, parseFloat((s + delta).toFixed(2)))));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-100px)] bg-slate-50/50 p-2 sm:p-3 animate-fadeIn overflow-hidden rounded-2xl relative select-none">
      
      {/* Top Compact Control Bar - exact match of VizagIVF_HRMS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2 relative z-20 shrink-0 px-2 pt-1">
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 tracking-tight">Organization Hierarchy</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search employee, lead, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl py-1.5 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-xs placeholder:text-slate-400 transition-all"
            />
          </div>
          
          <div className="relative shrink-0 w-48">
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-xs appearance-none cursor-pointer pr-7 font-semibold"
            >
              <option value="all">All Zones (AP & TS)</option>
              <option value="AP">AP Zone (Andhra Pradesh)</option>
              <option value="TS">TS Zone (Telangana)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Tree Canvas - Desktop with Auto-Fit & Drag-to-Pan (Light Theme) */}
      <div 
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`hidden lg:flex flex-1 items-center justify-center overflow-hidden relative rounded-xl bg-gradient-to-b from-slate-50/70 to-slate-100/40 border border-slate-200/50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div 
          ref={contentRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="w-max mx-auto pt-2 pb-8 flex flex-col items-center"
        >
          {/* ========================================================= */}
          {/* LEVEL 1: CORPORATE ADMINS (ASWANI, DIVYA)                */}
          {/* ========================================================= */}
          <div className="flex justify-center mb-0 relative z-10">
            <div className={`bg-white border border-slate-200/90 rounded-2xl w-72 shadow-sm overflow-hidden flex flex-col z-10 transition-all hover:shadow-md ${
              isMatch(hierarchyData.leadership.divya) || isMatch(hierarchyData.leadership.aswani)
                ? 'ring-2 ring-teal-500'
                : ''
            }`}>
              <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-pink-500"></div>
              
              <div className="p-3 flex justify-between items-center border-b border-slate-100">
                <div>
                  <h3 className="text-slate-800 font-bold text-sm leading-snug">Admins</h3>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Corporate Administration</p>
                </div>
                <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-around gap-4">
                {/* P. Aswani */}
                <div className="flex flex-col items-center text-center">
                  <Avatar employee={hierarchyData.leadership.aswani} size="lg" />
                  <span className="text-xs font-bold text-slate-800 mt-1 max-w-[100px] truncate" title={hierarchyData.leadership.aswani.name}>
                    {hierarchyData.leadership.aswani.name}
                  </span>
                  <span className="text-[9px] font-black text-teal-600 tracking-wider uppercase">GM</span>
                </div>

                <div className="w-px h-10 bg-slate-200"></div>

                {/* Divya Sirisha */}
                <div className="flex flex-col items-center text-center">
                  <Avatar employee={hierarchyData.leadership.divya} size="lg" />
                  <span className="text-xs font-bold text-slate-800 mt-1 max-w-[100px] truncate" title={hierarchyData.leadership.divya.name}>
                    {hierarchyData.leadership.divya.name}
                  </span>
                  <span className="text-[9px] font-black text-teal-600 tracking-wider uppercase">HR & FIN</span>
                </div>
              </div>

              <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                <span className="text-[10px] text-slate-500 font-medium">35 Total Personnel • 2 Zonal Wings</span>
                <span className="text-[10px] font-bold text-teal-600">Corporate HQ</span>
              </div>
            </div>
          </div>

          {/* Main Connector from CEO to ZSMs */}
          <div className="w-px h-6 bg-slate-300 relative z-0"></div>

          {/* ========================================================= */}
          {/* LEVEL 2 & 3 & 4: ZONAL WINGS (AP & TS)                     */}
          {/* ========================================================= */}
          <div className="relative w-full flex justify-center">
            {/* Horizontal Rail connecting the 2 ZSM wings when viewing 'all' */}
            {selectedZone === 'all' && (
              <div 
                className="absolute top-0 h-px bg-slate-300"
                style={{
                  left: '25%',
                  right: '25%'
                }}
              ></div>
            )}

            <div className={`flex justify-center ${selectedZone === 'all' ? 'gap-12' : 'gap-0'} pt-3.5`}>
              
              {/* ----------------------------------------------------- */}
              {/* WING A: ANDHRA PRADESH ZONE (B V JANARDHAN)           */}
              {/* ----------------------------------------------------- */}
              {(selectedZone === 'all' || selectedZone === 'AP') && (
                <div className="flex flex-col items-center relative">
                  {/* Vertical drop from top rail */}
                  {selectedZone === 'all' && (
                    <div className="absolute -top-3.5 w-px h-3.5 bg-slate-300"></div>
                  )}

                  {/* ZSM Card: B V JANARDHAN */}
                  <div className={`bg-white border border-slate-200/90 rounded-xl w-60 shadow-sm overflow-hidden flex flex-col z-10 hover:shadow-md transition-all ${
                    isMatch(hierarchyData.ap.zsm) ? 'ring-2 ring-emerald-500' : ''
                  }`}>
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    
                    <div className="p-3 flex justify-between items-start border-b border-slate-100">
                      <div>
                        <h3 className="text-slate-800 font-bold text-sm leading-snug">Andhra Pradesh Zone</h3>
                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">ZONAL SALES DIVISION</p>
                      </div>
                      <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-3 flex items-center gap-2.5">
                      <Avatar employee={hierarchyData.ap.zsm} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black text-emerald-600 tracking-widest uppercase">Zonal Sales Manager</span>
                        <span className="text-xs font-semibold text-slate-800 truncate">{hierarchyData.ap.zsm.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{hierarchyData.ap.zsm.id} • ZSM(AP)</span>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                      <span className="text-[10px] text-slate-500 font-medium">5 RSMs • 17 BE Reps</span>
                      <span className="text-[10px] text-emerald-600 font-bold">AP Territory</span>
                    </div>
                  </div>

                  {/* Vertical drop from AP ZSM */}
                  <div className="w-px h-5 bg-slate-300"></div>

                  {/* Horizontal rail across 5 AP RSM branches */}
                  <div 
                    className="h-px bg-slate-300 relative"
                    style={{
                      width: `calc(100% - ${100 / hierarchyData.ap.branches.length}%)`
                    }}
                  ></div>

                  {/* 5 AP RSM Branches side-by-side */}
                  <div className="flex justify-center gap-3 pt-2.5 relative">
                    {hierarchyData.ap.branches.map((branch) => {
                      const beCount = branch.bes.length;

                      return (
                        <div key={branch.id} className="flex flex-col items-center relative">
                          {/* Vertical stem from AP rail to RSM card */}
                          <div className="absolute -top-2.5 w-px h-2.5 bg-slate-300"></div>

                          {/* RSM / Team Lead Card */}
                          <div className={`bg-white border border-slate-200/90 rounded-xl w-48 shadow-sm overflow-hidden flex flex-col z-10 hover:shadow-md transition-all ${
                            isMatch(branch.manager) ? 'ring-2 ring-emerald-500' : ''
                          }`}>
                            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                            
                            <div className="p-2.5 flex justify-between items-start border-b border-slate-100">
                              <div>
                                <h3 className="text-slate-800 font-bold text-xs leading-snug truncate max-w-[125px]" title={branch.title}>
                                  {branch.title}
                                </h3>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">REGIONAL SALES</p>
                              </div>
                              <div className="w-5 h-5 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Users className="w-3 h-3" />
                              </div>
                            </div>

                            <div className="p-2.5 flex items-center gap-2">
                              <Avatar employee={branch.manager} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black text-emerald-600 tracking-widest uppercase">Team Lead (RSM)</span>
                                <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]" title={branch.manager.name}>
                                  {branch.manager.name}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">{branch.manager.id}</span>
                              </div>
                            </div>

                            <div className="px-2.5 py-1 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                              <span className="text-[9px] text-slate-500 font-medium">{beCount} Field Reps</span>
                            </div>
                          </div>

                          {/* Connector from RSM down to BE Cards */}
                          {beCount > 0 && (
                            <div className="flex flex-col items-center mt-0 w-full relative">
                              <div className="w-px h-4 bg-slate-300"></div>

                              {beCount > 1 && (
                                <div 
                                  className="h-px bg-slate-300 relative"
                                  style={{ width: `calc(100% - ${100 / beCount}%)` }}
                                ></div>
                              )}

                              {/* BE Cards in row */}
                              <div className="flex justify-center gap-2 pt-2 relative w-max">
                                {branch.bes.map((be) => (
                                  <div key={be.id} className="flex flex-col items-center relative">
                                    {beCount > 1 && (
                                      <div className="absolute -top-2 w-px h-2 bg-slate-300"></div>
                                    )}

                                    <div className={`bg-white border border-slate-200/90 rounded-lg p-2 flex flex-col items-center w-24 sm:w-26 shadow-xs hover:shadow-md hover:border-teal-600/40 transition-all cursor-pointer group ${
                                      isMatch(be) ? 'ring-2 ring-teal-500 bg-teal-50/50' : ''
                                    }`}>
                                      <Avatar employee={be} size="md" />
                                      <h4 className="mt-1.5 text-[11px] font-bold text-slate-800 text-center group-hover:text-teal-600 transition-colors line-clamp-1 w-full" title={be.name}>
                                        {be.name}
                                      </h4>
                                      <p className="text-[8px] text-slate-500 font-medium text-center uppercase tracking-wide truncate w-full" title={be.designation}>
                                        {be.designation}
                                      </p>
                                      <span className="text-[8px] text-slate-400 font-mono mt-0.5">{be.id}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------- */}
              {/* WING B: TELANGANA ZONE (RAMENDRA KUMAR)               */}
              {/* ----------------------------------------------------- */}
              {(selectedZone === 'all' || selectedZone === 'TS') && (
                <div className="flex flex-col items-center relative">
                  {/* Vertical drop from top rail */}
                  {selectedZone === 'all' && (
                    <div className="absolute -top-3.5 w-px h-3.5 bg-slate-300"></div>
                  )}

                  {/* ZSM Card: RAMENDRA KUMAR */}
                  <div className={`bg-white border border-slate-200/90 rounded-xl w-60 shadow-sm overflow-hidden flex flex-col z-10 hover:shadow-md transition-all ${
                    isMatch(hierarchyData.ts.zsm) ? 'ring-2 ring-blue-500' : ''
                  }`}>
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    
                    <div className="p-3 flex justify-between items-start border-b border-slate-100">
                      <div>
                        <h3 className="text-slate-800 font-bold text-sm leading-snug">Telangana Zone</h3>
                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">ZONAL SALES DIVISION</p>
                      </div>
                      <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-3 flex items-center gap-2.5">
                      <Avatar employee={hierarchyData.ts.zsm} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black text-blue-600 tracking-widest uppercase">Zonal Sales Manager</span>
                        <span className="text-xs font-semibold text-slate-800 truncate">{hierarchyData.ts.zsm.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{hierarchyData.ts.zsm.id} • ZSM(TS)</span>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                      <span className="text-[10px] text-slate-500 font-medium">2 RSMs + Direct • 7 BE Reps</span>
                      <span className="text-[10px] text-blue-600 font-bold">TS Territory</span>
                    </div>
                  </div>

                  {/* Vertical drop from TS ZSM */}
                  <div className="w-px h-5 bg-slate-300"></div>

                  {/* Horizontal rail across 3 TS branches */}
                  <div 
                    className="h-px bg-slate-300 relative"
                    style={{
                      width: `calc(100% - ${100 / hierarchyData.ts.branches.length}%)`
                    }}
                  ></div>

                  {/* 3 TS Branches side-by-side */}
                  <div className="flex justify-center gap-3 pt-2.5 relative">
                    {hierarchyData.ts.branches.map((branch) => {
                      const beCount = branch.bes.length;

                      return (
                        <div key={branch.id} className="flex flex-col items-center relative">
                          {/* Vertical stem from TS rail to branch card */}
                          <div className="absolute -top-2.5 w-px h-2.5 bg-slate-300"></div>

                          {/* Branch / Team Lead Card */}
                          <div className={`bg-white border border-slate-200/90 rounded-xl w-48 shadow-sm overflow-hidden flex flex-col z-10 hover:shadow-md transition-all ${
                            isMatch(branch.manager) ? 'ring-2 ring-blue-500' : ''
                          }`}>
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                            
                            <div className="p-2.5 flex justify-between items-start border-b border-slate-100">
                              <div>
                                <h3 className="text-slate-800 font-bold text-xs leading-snug truncate max-w-[125px]" title={branch.title}>
                                  {branch.title}
                                </h3>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">
                                  {branch.isDirect ? 'DIRECT ZSM TEAM' : 'REGIONAL SALES'}
                                </p>
                              </div>
                              <div className="w-5 h-5 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Users className="w-3 h-3" />
                              </div>
                            </div>

                            <div className="p-2.5 flex items-center gap-2">
                              <Avatar employee={branch.manager} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black text-blue-600 tracking-widest uppercase">
                                  {branch.isDirect ? 'Team Lead (ZSM)' : 'Team Lead (RSM)'}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]" title={branch.manager.name}>
                                  {branch.manager.name}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">{branch.manager.id}</span>
                              </div>
                            </div>

                            <div className="px-2.5 py-1 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                              <span className="text-[9px] text-slate-500 font-medium">{beCount} Field Reps</span>
                            </div>
                          </div>

                          {/* Connector from Branch down to BE Cards */}
                          {beCount > 0 && (
                            <div className="flex flex-col items-center mt-0 w-full relative">
                              <div className="w-px h-4 bg-slate-300"></div>

                              {beCount > 1 && (
                                <div 
                                  className="h-px bg-slate-300 relative"
                                  style={{ width: `calc(100% - ${100 / beCount}%)` }}
                                ></div>
                              )}

                              {/* BE Cards in row */}
                              <div className="flex justify-center gap-2 pt-2 relative w-max">
                                {branch.bes.map((be) => (
                                  <div key={be.id} className="flex flex-col items-center relative">
                                    {beCount > 1 && (
                                      <div className="absolute -top-2 w-px h-2 bg-slate-300"></div>
                                    )}

                                    <div className={`bg-white border border-slate-200/90 rounded-lg p-2 flex flex-col items-center w-24 sm:w-26 shadow-xs hover:shadow-md hover:border-teal-600/40 transition-all cursor-pointer group ${
                                      isMatch(be) ? 'ring-2 ring-teal-500 bg-teal-50/50' : ''
                                    }`}>
                                      <Avatar employee={be} size="md" />
                                      <h4 className="mt-1.5 text-[11px] font-bold text-slate-800 text-center group-hover:text-teal-600 transition-colors line-clamp-1 w-full" title={be.name}>
                                        {be.name}
                                      </h4>
                                      <p className="text-[8px] text-slate-500 font-medium text-center uppercase tracking-wide truncate w-full" title={be.designation}>
                                        {be.designation}
                                      </p>
                                      <span className="text-[8px] text-slate-400 font-mono mt-0.5">{be.id}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Floating Glassmorphic Zoom Controls - Exact match of VizagIVF_HRMS */}
        <div className="flex items-center gap-1 absolute bottom-3 right-4 z-30 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md px-2 py-1 rounded-full text-slate-700 text-xs font-medium">
          <button 
            onClick={() => setScale(s => Math.max(0.35, parseFloat((s - 0.08).toFixed(2))))}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="px-1.5 py-0.5 rounded hover:bg-slate-100 text-slate-700 font-bold text-[10px] min-w-[36px] text-center"
            title="Reset to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            onClick={() => setScale(s => Math.min(1.4, parseFloat((s + 0.08).toFixed(2))))}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>

          <button 
            onClick={handleFitToScreen}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-600/10 hover:bg-teal-600/20 text-teal-600 font-bold text-[10px] transition-colors"
            title="Fit Entire Chart to Screen"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit Screen</span>
          </button>

          <button 
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title="Reset Position"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile Tree Canvas - Exact card styling and vertical tree of VizagIVF_HRMS */}
      <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar relative pb-20 pt-1">
        <div className="w-full flex flex-col gap-4 px-1 pb-16 max-w-md mx-auto">
          {/* Top Leadership Mobile */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-pink-500"></div>
            <div className="p-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800">Admins</span>
                <span className="text-[9px] font-black text-teal-600 uppercase">Corporate HQ</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="flex flex-col items-center">
                  <Avatar employee={hierarchyData.leadership.aswani} size="md" />
                  <span className="text-[11px] font-bold text-slate-800 mt-1 truncate w-full">{hierarchyData.leadership.aswani.name}</span>
                  <span className="text-[8px] text-teal-600 font-bold">GM</span>
                </div>
                <div className="flex flex-col items-center">
                  <Avatar employee={hierarchyData.leadership.divya} size="md" />
                  <span className="text-[11px] font-bold text-slate-800 mt-1 truncate w-full">{hierarchyData.leadership.divya.name}</span>
                  <span className="text-[8px] text-teal-600 font-bold">HR & FIN</span>
                </div>
              </div>
            </div>
          </div>

          {/* AP Branches Mobile */}
          {(selectedZone === 'all' || selectedZone === 'AP') && (
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl shadow-xs border border-emerald-200 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar employee={hierarchyData.ap.zsm} size="sm" />
                    <div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase">ZSM (AP ZONE)</span>
                      <h4 className="font-bold text-slate-800 text-xs">{hierarchyData.ap.zsm.name}</h4>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">5 RSMs • 17 BEs</span>
                </div>
              </div>

              {hierarchyData.ap.branches.map(branch => (
                <div key={branch.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden ml-2">
                  <div className="h-1 w-full bg-emerald-500"></div>
                  <div className="p-2.5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar employee={branch.manager} size="sm" />
                      <div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase">RSM Lead</span>
                        <h5 className="font-bold text-slate-800 text-xs">{branch.manager.name}</h5>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400">{branch.bes.length} Reps</span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5">
                    <div className="flex flex-col gap-2 relative">
                      <div className="absolute left-3 top-2 bottom-4 w-px bg-slate-300"></div>
                      {branch.bes.map(be => (
                        <div key={be.id} className="flex items-center gap-2.5 relative pl-6">
                          <div className="absolute left-3 top-1/2 w-2.5 h-px bg-slate-300"></div>
                          <Avatar employee={be} size="sm" />
                          <div className="flex flex-col overflow-hidden w-full">
                            <span className="text-xs font-semibold text-slate-800 leading-tight truncate">{be.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{be.id} • {be.designation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TS Branches Mobile */}
          {(selectedZone === 'all' || selectedZone === 'TS') && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="bg-white rounded-xl shadow-xs border border-blue-200 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar employee={hierarchyData.ts.zsm} size="sm" />
                    <div>
                      <span className="text-[9px] font-black text-blue-600 uppercase">ZSM (TS ZONE)</span>
                      <h4 className="font-bold text-slate-800 text-xs">{hierarchyData.ts.zsm.name}</h4>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">2 RSMs + Direct • 7 BEs</span>
                </div>
              </div>

              {hierarchyData.ts.branches.map(branch => (
                <div key={branch.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden ml-2">
                  <div className="h-1 w-full bg-blue-500"></div>
                  <div className="p-2.5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar employee={branch.manager} size="sm" />
                      <div>
                        <span className="text-[8px] font-black text-blue-600 uppercase">
                          {branch.isDirect ? 'Direct to ZSM' : 'RSM Lead'}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs">{branch.manager.name}</h5>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400">{branch.bes.length} Reps</span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5">
                    <div className="flex flex-col gap-2 relative">
                      <div className="absolute left-3 top-2 bottom-4 w-px bg-slate-300"></div>
                      {branch.bes.map(be => (
                        <div key={be.id} className="flex items-center gap-2.5 relative pl-6">
                          <div className="absolute left-3 top-1/2 w-2.5 h-px bg-slate-300"></div>
                          <Avatar employee={be} size="sm" />
                          <div className="flex flex-col overflow-hidden w-full">
                            <span className="text-xs font-semibold text-slate-800 leading-tight truncate">{be.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{be.id} • {be.designation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OrgHierarchyView;
