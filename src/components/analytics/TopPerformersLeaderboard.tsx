import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Star, 
  Network, 
  Clock, 
  Target, 
  MapPin, 
  ChevronDown, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { DistrictId, TopPerformer, DistrictOption } from '../../types/analytics.types';
import { DISTRICT_OPTIONS, getTopPerformers } from '../../lib/services/analytics-service';

interface TopPerformersLeaderboardProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (district: DistrictId) => void;
}

export const TopPerformersLeaderboard: React.FC<TopPerformersLeaderboardProps> = ({
  selectedDistrict,
  onSelectDistrict
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Retrieve top 5 employees based on selected district
  const topEmployees = getTopPerformers(selectedDistrict);

  const currentOption = DISTRICT_OPTIONS.find(d => d.id === selectedDistrict) || DISTRICT_OPTIONS[0];

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-extrabold text-sm shadow-md ring-2 ring-yellow-200">
            <Trophy className="w-4 h-4" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-white flex items-center justify-center font-extrabold text-sm shadow-md ring-2 ring-slate-200">
            <Medal className="w-4 h-4" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md ring-2 ring-amber-200">
            <Medal className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
            #{rank}
          </div>
        );
    }
  };

  const getDistrictBadgeColor = (dist: DistrictId) => {
    switch (dist) {
      case 'visakhapatnam':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'vizianagaram':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'srikakulam':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      
      {/* Leaderboard Header Row with Beside Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Top 5 Field Medical Representatives
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                Performance &amp; Efficiency
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ranked by relationship network strength, conversion rate, and workflow velocity
            </p>
          </div>
        </div>

        {/* District Selector Dropdown (BESIDE LEADERBOARD) */}
        <div className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Leaderboard District Filter
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer min-w-[220px]"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                {currentOption.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-100">
                    Filter Top 5 by Region
                  </div>
                  {DISTRICT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSelectDistrict(opt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        selectedDistrict === opt.id 
                          ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {selectedDistrict === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {opt.id === 'all' ? 'Top 5 across all territories' : `Top 5 active in ${opt.shortLabel}`}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Employee Cards Grid (REVENUE IS STRICTLY EXCLUDED) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {topEmployees.map((emp) => (
          <div
            key={emp.id}
            className={`rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between relative group hover:shadow-md hover:-translate-y-1 ${
              emp.rank === 1
                ? 'bg-gradient-to-b from-amber-50/50 to-white border-amber-200/90 shadow-sm'
                : 'bg-white border-slate-200/80'
            }`}
          >
            {/* Header: Rank + District */}
            <div>
              <div className="flex items-center justify-between mb-3">
                {getRankBadge(emp.rank)}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDistrictBadgeColor(emp.district)}`}>
                  {emp.districtLabel}
                </span>
              </div>

              {/* Employee Avatar & Identity */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 text-xs">
                  {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {emp.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {emp.role}
                  </p>
                </div>
              </div>

              {/* Rating stars & badge */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < emp.efficiencyRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                    />
                  ))}
                </div>
                {emp.badgeLabel && (
                  <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {emp.badgeLabel}
                  </span>
                )}
              </div>

              {/* Key Non-Revenue Metrics */}
              <div className="space-y-2 text-xs">
                
                {/* 1. Resource Connections (Doctor/Chemist) */}
                <div className="flex items-center justify-between text-slate-600 bg-slate-50/80 px-2 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-purple-700">
                    <Network className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">Connections:</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {emp.connectionsCount} nodes
                  </span>
                </div>

                {/* 2. Lead Conversion Rate */}
                <div className="flex items-center justify-between text-slate-600 bg-slate-50/80 px-2 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">Conversion:</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {emp.conversionRatePercent}%
                  </span>
                </div>

                {/* 3. Turnaround Time (TAT) */}
                <div className="flex items-center justify-between text-slate-600 bg-slate-50/80 px-2 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">Workflow TAT:</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {emp.avgTurnaroundDays} days
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom summary strip */}
            <div className="mt-3 pt-2 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Leads handled:</span>
              <span className="font-semibold text-slate-700">{emp.leadsHandled} leads</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
