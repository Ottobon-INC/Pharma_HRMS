import React from 'react';
import { Settings, KeyRound, ShieldCheck, Database, Building2, Server, Smartphone, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface AdminSettingsProps {
  language: Language;
  onOpenProfile?: () => void;
}

export default function AdminSettings({ language, onOpenProfile }: AdminSettingsProps) {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-600" />
            {language === 'te' ? 'సిస్టమ్ సెట్టింగ్‌లు' : 'System Settings'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'te'
              ? 'అడ్మినిస్ట్రేటర్ ఖాతా క్రెడెన్షియల్స్, భద్రత మరియు ప్రాధాన్యతలను నిర్వహించండి.'
              : 'Manage administrator account credentials, security, and preferences.'}
          </p>
        </div>
      </div>

      {/* Admin Profile & Password Quick Access */}
      <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-teal-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-teal-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0f766e] to-[#a855f7] text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'te' ? 'అడ్మిన్ ప్రొఫైల్ & పాస్‌వర్డ్ సెట్టింగ్‌లు' : 'Admin Profile & Security Settings'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'te'
                ? 'మీ ఖాతా పాస్‌వర్డ్ మరియు ప్రొఫైల్ సమాచారాన్ని నవీకరించండి.'
                : 'Manage your administrator password and account credentials.'}
            </p>
          </div>
        </div>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="shrink-0 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/15 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span>{language === 'te' ? 'పాస్‌వర్డ్ మార్చండి' : 'Change Password'}</span>
          </button>
        )}
      </div>

      {/* Organization & System Status Overview */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            {language === 'te' ? 'సిస్టమ్ & నెట్‌వర్క్ స్థితి' : 'System & Organization Overview'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Organization Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'te' ? 'సంస్థ' : 'Organization'}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                Orca Labs (Pharma Division)
              </h4>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Pharma HRMS Platform Active
              </span>
            </div>
          </div>

          {/* Database Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'te' ? 'డేటాబేస్ ఇంజిన్' : 'Database Engine'}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                Supabase PostgreSQL (Cloud)
              </h4>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Connected & Synchronized
              </span>
            </div>
          </div>

          {/* Security & Access */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'te' ? 'భద్రత & యాక్సెస్ కంట్రోల్' : 'Access Control & Security'}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                Role-Based Access Control (RBAC)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Admin, Team Lead & Field Staff permissions enforced.
              </p>
            </div>
          </div>

          {/* Mobile & Offline App Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'te' ? 'PWA & ఆఫ్‌లైన్ ఇంజిన్' : 'PWA & Offline Engine'}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                Progressive Web App v1.3.0
              </h4>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Offline Caching & Geo-Tracking Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
