import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  BarChart3, 
  Compass, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { DistrictId, AnalyticalMetrics } from '../../types/analytics.types';
import { getAnalyticalMetrics } from '../../lib/services/analytics-service';
import { ExecutivePillarPie } from './ExecutivePillarPie';
import { TopPerformersLeaderboard } from './TopPerformersLeaderboard';

export const AnalyticsDashboardPage: React.FC = () => {
  // Independent state for Graph District and Leaderboard District as requested
  const [graphDistrict, setGraphDistrict] = useState<DistrictId>('all');
  const [leaderboardDistrict, setLeaderboardDistrict] = useState<DistrictId>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytical metrics for graph
  const [metrics, setMetrics] = useState<AnalyticalMetrics>(() => getAnalyticalMetrics(graphDistrict));

  useEffect(() => {
    setMetrics(getAnalyticalMetrics(graphDistrict));
  }, [graphDistrict]);

  // Fullscreen listener and toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed or was dismissed:', err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMetrics(getAnalyticalMetrics(graphDistrict));
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className={`w-full flex flex-col gap-6 font-sans transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-slate-50 p-6 md:p-8 overflow-y-auto' 
        : 'min-h-[85vh]'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GRAPH CONTEXT (TOP-LEFT SECTION)                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* TOP LEFT: Context of the Graph What is Presenting */}
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Compass className="w-3.5 h-3.5" />
                Active Region: {metrics.districtName}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Cognitive-Optimized Executive View
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {metrics.contextSummary.headline}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {metrics.contextSummary.narrative}
            </p>

            {metrics.contextSummary.anomalyAlert && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><strong>Territory Observation:</strong> {metrics.contextSummary.anomalyAlert}</span>
              </div>
            )}
          </div>

          {/* Top Right: Fullscreen and Refresh Buttons */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Fullscreen View</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER: 4-PILLAR PIE CHART WITH REGION DROPDOWN BESIDE IT              */}
      {/* ========================================================================= */}
      <div className="w-full">
        <ExecutivePillarPie
          metrics={metrics}
          selectedDistrict={graphDistrict}
          onSelectDistrict={(dist) => setGraphDistrict(dist)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM: TOP 5 EMPLOYEES LEADERBOARD WITH REGION DROPDOWN (NO REVENUE)   */}
      {/* ========================================================================= */}
      <div className="w-full">
        <TopPerformersLeaderboard
          selectedDistrict={leaderboardDistrict}
          onSelectDistrict={(dist) => setLeaderboardDistrict(dist)}
        />
      </div>

    </div>
  );
};

export default AnalyticsDashboardPage;
