import React, { useState } from 'react';
import { 
  Clock, 
  Hourglass, 
  Network, 
  Filter, 
  ChevronDown, 
  Info,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { DistrictId, AnalyticalMetrics, MetricPillarDetail, DistrictOption } from '../../types/analytics.types';
import { DISTRICT_OPTIONS } from '../../lib/services/analytics-service';

interface ExecutivePillarPieProps {
  metrics: AnalyticalMetrics;
  selectedDistrict: DistrictId;
  onSelectDistrict: (district: DistrictId) => void;
}

export const ExecutivePillarPie: React.FC<ExecutivePillarPieProps> = ({
  metrics,
  selectedDistrict,
  onSelectDistrict
}) => {
  const [activePillarId, setActivePillarId] = useState<'cost' | 'time' | 'resource' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pillarsList: MetricPillarDetail[] = [
    metrics.pillars.cost,
    metrics.pillars.time,
    metrics.pillars.resource
  ];

  // Active or highlighted pillar
  const selectedPillar = activePillarId ? metrics.pillars[activePillarId] : null;

  // SVG Geometry Calculation for 4 Slices
  const size = 340;
  const center = size / 2;
  const radius = 135;
  const innerRadius = 78; // Donut style to allow center metrics readout

  let cumulativeAngle = -90; // Start at 12 o'clock

  const slices = pillarsList.map((pillar) => {
    const sliceAngle = (pillar.normalizedPercentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Convert polar coordinates to Cartesian
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    // Midpoint for badge / label placement
    const midAngle = startAngle + sliceAngle / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = (radius + innerRadius) / 2;
    const labelX = center + labelRadius * Math.cos(midRad);
    const labelY = center + labelRadius * Math.sin(midRad);

    return {
      pillar,
      pathData,
      startAngle,
      endAngle,
      labelX,
      labelY,
      sliceAngle
    };
  });

  const getPillarIcon = (id: string, className = 'w-5 h-5') => {
    switch (id) {
      case 'cost':
        return <Hourglass className={className} />;
      case 'time':
        return <Clock className={className} />;
      case 'resource':
        return <Network className={className} />;
      default:
        return <TrendingUp className={className} />;
    }
  };

  const currentDistrictOption = DISTRICT_OPTIONS.find(d => d.id === selectedDistrict) || DISTRICT_OPTIONS[0];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
      
      {/* Top Controls Row beside/above the Graph */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              3-Pillar Operational & Relationship Balance
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Cognitive Reduced
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Interactive weight of Cost (Hours), Workflow Time & Resource Network
            </p>
          </div>
        </div>

        {/* District Selector Dropdown (BESIDE GRAPH) */}
        <div className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Graph Region Filter
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer min-w-[200px]"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                {currentDistrictOption.shortLabel}
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
                    Select Target District
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
                          ? 'bg-teal-50 text-teal-900 font-bold border-l-4 border-teal-600' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {selectedDistrict === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal line-clamp-1">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Center Chart + Interactive Pillar Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* SVG Donut / Pie Chart (Center) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative group">
            <svg 
              width={size} 
              height={size} 
              className="drop-shadow-sm transition-transform duration-300"
              viewBox={`0 0 ${size} ${size}`}
            >
              {slices.map((slice) => {
                const isHovered = activePillarId === slice.pillar.id;
                return (
                  <g 
                    key={slice.pillar.id}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setActivePillarId(slice.pillar.id)}
                    onMouseLeave={() => setActivePillarId(null)}
                    onClick={() => setActivePillarId(activePillarId === slice.pillar.id ? null : slice.pillar.id)}
                  >
                    <path
                      d={slice.pathData}
                      fill={slice.pillar.colorHex}
                      opacity={activePillarId && !isHovered ? 0.45 : 0.95}
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      className="transition-all duration-200 hover:opacity-100"
                      style={{
                        transformOrigin: `${center}px ${center}px`,
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transition: 'transform 0.2s ease, opacity 0.2s ease'
                      }}
                    />
                    {/* Slice percentage label on chart */}
                    <text
                      x={slice.labelX}
                      y={slice.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-sm select-none"
                    >
                      {slice.pillar.normalizedPercentage}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Center Readout inside the Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {selectedPillar ? (
                <div className="animate-in fade-in duration-200 flex flex-col items-center">
                  <div className={`p-2 rounded-full mb-1 ${selectedPillar.twBgClass}/15 ${selectedPillar.twTextClass}`}>
                    {getPillarIcon(selectedPillar.id, 'w-5 h-5')}
                  </div>
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedPillar.rawDisplayValue}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedPillar.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedPillar.normalizedPercentage}% share
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {metrics.contextSummary.primaryEfficiencyScore}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Operational Index
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold mt-0.5">
                    {metrics.totalLeadsEvaluated} Leads Analyzed
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Hover over or tap any slice to inspect localized metrics
          </p>
        </div>

        {/* 3 Interactive Metric Pillar Cards */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {pillarsList.map((pillar) => {
            const isSelected = activePillarId === pillar.id;
            return (
              <div
                key={pillar.id}
                onMouseEnter={() => setActivePillarId(pillar.id)}
                onMouseLeave={() => setActivePillarId(null)}
                onClick={() => setActivePillarId(isSelected ? null : pillar.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected 
                    ? `bg-white shadow-md ring-2 ring-offset-1 ${pillar.twBorderClass}` 
                    : 'bg-slate-50/70 hover:bg-white hover:shadow-sm border-slate-200/70'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${pillar.twBgClass}/10 ${pillar.twTextClass}`}>
                      {getPillarIcon(pillar.id, 'w-4 h-4')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 capitalize">
                        {pillar.id}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {pillar.unit}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${pillar.twBgClass}/10 ${pillar.twTextClass}`}>
                    {pillar.normalizedPercentage}%
                  </span>
                </div>

                <div className="text-base font-bold text-slate-900 mb-1">
                  {pillar.rawDisplayValue}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                  {pillar.tagline}
                </p>

                {/* Sub-metrics */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {pillar.details.map((det, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-500 bg-white/70 px-2 py-1 rounded">
                      <span className="truncate mr-1">{det.label}:</span>
                      <span className="font-semibold text-slate-700 shrink-0">{det.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Micro Info Strip */}
      <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Pillars Defined:</strong> 
            <span className="text-amber-600 ml-1 font-medium">Cost</span> = Hours spent per lead &bull; 
            <span className="text-sky-600 ml-1 font-medium">Time</span> = Turnaround speed &bull; 
            <span className="text-purple-600 ml-1 font-medium">Resource</span> = Doctor/Chemist connection network
          </span>
        </div>
      </div>

    </div>
  );
};
