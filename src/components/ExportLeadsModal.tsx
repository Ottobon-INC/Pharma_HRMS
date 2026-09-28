import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CircleDashed, 
  BarChart3, 
  Search, 
  FileSpreadsheet, 
  Filter, 
  Loader2,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Employee, Language, Task } from '../types';
import { 
  EmployeeLeadReportItem, 
  getWeeklyDateRange, 
  getMonthlyDateRange, 
  calculateEmployeeLeads, 
  downloadLeadsReport 
} from '../lib/services/leads-service';

interface ExportLeadsModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  allEmployees: Employee[];
  tasks?: Task[];
  currentUser: Employee;
  initialPeriod?: 'this_week' | 'last_week' | 'next_week' | 'this_month' | 'last_month' | 'custom';
}

export default function ExportLeadsModal({
  language,
  isOpen,
  onClose,
  employees,
  allEmployees,
  tasks = [],
  currentUser,
  initialPeriod = 'this_week'
}: ExportLeadsModalProps) {
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<'this_week' | 'last_week' | 'next_week' | 'this_month' | 'last_month' | 'custom'>(initialPeriod);
  const [customStartDate, setCustomStartDate] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'all' | 'AP' | 'TS' | 'Corporate'>('all');
  const [reportData, setReportData] = useState<EmployeeLeadReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Determine current active date range
  const getDateRangeForTab = () => {
    switch (selectedPeriodTab) {
      case 'this_week':
        return { ...getWeeklyDateRange(0), periodType: 'weekly' as const };
      case 'last_week':
        return { ...getWeeklyDateRange(-1), periodType: 'weekly' as const };
      case 'next_week':
        return { ...getWeeklyDateRange(1), periodType: 'weekly' as const };
      case 'this_month':
        return { ...getMonthlyDateRange(0), periodType: 'monthly' as const };
      case 'last_month':
        return { ...getMonthlyDateRange(-1), periodType: 'monthly' as const };
      case 'custom':
      default:
        return {
          startDate: customStartDate,
          endDate: customEndDate,
          label: `Custom Period (${customStartDate} to ${customEndDate})`,
          periodType: 'custom' as const
        };
    }
  };

  // Load report data whenever period changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate, label, periodType } = getDateRangeForTab();
        const data = await calculateEmployeeLeads(
          employees,
          allEmployees,
          tasks,
          startDate,
          endDate,
          periodType,
          label,
          currentUser
        );
        if (isMounted) {
          setReportData(data);
        }
      } catch (err) {
        console.error("Error generating leads report:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPeriodTab, customStartDate, customEndDate, employees, allEmployees, tasks]);

  if (!isOpen) return null;

  // Filter report items
  const filteredData = reportData.filter(item => {
    const matchesSearch = 
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = 
      zoneFilter === 'all' || 
      item.zone.toLowerCase() === zoneFilter.toLowerCase() ||
      item.branch.toLowerCase().includes(zoneFilter.toLowerCase());

    return matchesSearch && matchesZone;
  });

  // Calculate high-level summary KPIs
  const totalEmployees = filteredData.length;
  const totalLeads = filteredData.reduce((acc, r) => acc + r.totalLeads, 0);
  const totalCompleted = filteredData.reduce((acc, r) => acc + r.completedLeads, 0);
  const totalOngoing = filteredData.reduce((acc, r) => acc + r.ongoingLeads, 0);
  const totalYetToStart = filteredData.reduce((acc, r) => acc + r.yetToStartLeads, 0);
  const avgCompletionRate = totalLeads > 0 ? ((totalCompleted / totalLeads) * 100).toFixed(1) : '0.0';

  const handleDownloadCsv = () => {
    setIsExporting(true);
    try {
      const { label } = getDateRangeForTab();
      downloadLeadsReport(filteredData, label, currentUser);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  const isTelugu = language === 'te';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-[28px] sm:rounded-[36px] w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display tracking-tight text-white">
                  {isTelugu ? 'ఉద్యోగుల లీడ్స్ ఎగుమతి & విశ్లేషణ' : 'Employee Leads Export & Performance'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {currentUser.hierarchyLevel === 'rsm' ? 'RSM View' : 'Admin & RSM Access'}
                </span>
              </div>
              <p className="text-xs text-teal-100/70 mt-0.5">
                {isTelugu 
                  ? 'వారంవారీ మరియు నెలవారీ లీడ్స్ డేటా: పూర్తయినవి, కొనసాగుతున్నవి, ప్రారంభించాల్సినవి.'
                  : 'Weekly & Monthly leads breakdown: Completed, Ongoing, and Yet to Start.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleDownloadCsv}
              disabled={isExporting || isLoading || filteredData.length === 0}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isTelugu ? 'ఎక్సెల్ / CSV ఎగుమతి' : 'Download Excel/CSV'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Period Tabs */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
            {/* Period Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setSelectedPeriodTab('this_week')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'this_week' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'ఈ వారం (Weekly)' : 'This Week'}
              </button>
              <button
                onClick={() => setSelectedPeriodTab('last_week')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'last_week' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'గత వారం' : 'Last Week'}
              </button>
              <button
                onClick={() => setSelectedPeriodTab('next_week')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'next_week' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'వచ్చే వారం' : 'Next Week'}
              </button>
              <button
                onClick={() => setSelectedPeriodTab('this_month')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'this_month' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'ప్రతి నెల (Monthly)' : 'Every Month'}
              </button>
              <button
                onClick={() => setSelectedPeriodTab('last_month')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'last_month' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'గత నెల' : 'Previous Month'}
              </button>
              <button
                onClick={() => setSelectedPeriodTab('custom')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedPeriodTab === 'custom' 
                    ? 'bg-white text-teal-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTelugu ? 'కస్టమ్ తేదీలు' : 'Custom Dates'}
              </button>
            </div>

            {/* Custom Date Pickers */}
            {selectedPeriodTab === 'custom' && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 cursor-pointer"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 cursor-pointer"
                />
              </div>
            )}

            {/* Zone Filter & Search Input */}
            <div className="flex items-center gap-2 flex-1 md:justify-end">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={isTelugu ? 'ఉద్యోగి పేరు లేదా ID...' : 'Search employee name or ID...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
                />
              </div>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as any)}
                className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Zones</option>
                <option value="AP">AP Zone</option>
                <option value="TS">TS Zone</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Personnel</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{totalEmployees}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Leads</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{totalLeads}</p>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Completed</span>
              </div>
              <p className="text-lg font-black text-emerald-800 mt-0.5">{totalCompleted}</p>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 shadow-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Clock className="w-3 h-3 shrink-0" />
                <span>Ongoing</span>
              </div>
              <p className="text-lg font-black text-amber-800 mt-0.5">{totalOngoing}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <CircleDashed className="w-3 h-3 shrink-0" />
                <span>Yet to Start</span>
              </div>
              <p className="text-lg font-black text-slate-700 mt-0.5">{totalYetToStart}</p>
            </div>
            <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-100 shadow-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span>Completion</span>
              </div>
              <p className="text-lg font-black text-teal-800 mt-0.5">{avgCompletionRate}%</p>
            </div>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                {isTelugu ? 'డేటా లోడ్ అవుతోంది...' : 'Calculating Leads & Staff Status...'}
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center text-center p-6 space-y-2">
              <BarChart3 className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                {isTelugu ? 'డేటా అందుబాటులో లేదు' : 'No employee lead data found for this selection'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Try selecting a different date range or zone filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-slate-500 hidden sm:table-cell">Role & Zone</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Employee Status</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-emerald-700 text-center">Completed</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-amber-700 text-center">Ongoing</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">Yet to Start</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-slate-700 text-center">Total Leads</th>
                  <th className="p-3.5 sm:p-4 text-[10px] font-black uppercase tracking-wider text-teal-700 text-right pr-5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredData.map(item => {
                  return (
                    <tr key={item.employeeId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & ID */}
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-slate-800">{item.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.employeeId} • {item.designation}
                        </div>
                      </td>

                      {/* Role & Zone */}
                      <td className="p-3.5 sm:p-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.zone === 'AP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.zone === 'TS' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                            'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {item.zone} Zone
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.hierarchyLevel}
                          </span>
                        </div>
                        {item.reportingToName && item.reportingToName !== '-' && (
                          <div className="text-[9px] text-slate-400 mt-1">
                            ↳ Reports: {item.reportingToName}
                          </div>
                        )}
                      </td>

                      {/* Employee Status (Account Status) */}
                      <td className="p-3.5 sm:p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {/* Account Status */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            item.accountStatus === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.accountStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {item.accountStatus.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Completed */}
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.completedLeads}
                        </span>
                      </td>

                      {/* Ongoing */}
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                          {item.ongoingLeads}
                        </span>
                      </td>

                      {/* Yet to Start */}
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                          {item.yetToStartLeads}
                        </span>
                      </td>

                      {/* Total Leads */}
                      <td className="p-3.5 sm:p-4 text-center font-bold text-slate-800">
                        {item.totalLeads}
                      </td>

                      {/* Progress / Completion Rate */}
                      <td className="p-3.5 sm:p-4 text-right pr-5">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-black text-xs text-teal-800">
                            {item.completionRate}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-600 rounded-full" 
                              style={{ width: `${Math.min(100, item.completionRate)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{filteredData.length} Personnel Listed</span>
            <span>•</span>
            <span>{getDateRangeForTab().label}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors font-bold cursor-pointer"
            >
              {isTelugu ? 'మూసివేయి' : 'Close'}
            </button>
            <button
              onClick={handleDownloadCsv}
              disabled={isExporting || isLoading || filteredData.length === 0}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isTelugu ? 'ఎక్సెల్ నివేదిక డౌన్‌లోడ్' : 'Download Complete Leads Report (.CSV)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
