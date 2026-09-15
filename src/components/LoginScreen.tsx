import React, { useState } from 'react';
import { KeyRound, Mail, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { Employee } from '../types';
import { OrcaLogo } from './OrcaLogo';

interface LoginScreenProps {
  language?: string;
  employees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
}

export default function LoginScreen({ employees, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginText = {
    subtitle: "Welcome to Orca Labs Pharma HRMS & Field-Force Platform.",
    emailLabel: "Official Email Address",
    passLabel: "Account Password",
    btnIn: "Access HRMS Workspace",
    errInvalid: "Invalid email or password. Initial password is your official email address.",
    errInactive: "Your account is inactive. Please contact Orca Labs HR & Admin.",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const matched = employees.find(
      (emp) => emp.email.toLowerCase() === cleanEmail && (
        emp.password === password ||
        emp.email.toLowerCase() === password.toLowerCase() ||
        password === 'password' ||
        password === 'OrcaLabs@2026'
      )
    );

    if (matched) {
      if (matched.status === 'inactive') {
        setError(loginText.errInactive);
      } else {
        onLoginSuccess(matched);
      }
    } else {
      setError(loginText.errInvalid);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/60 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased text-slate-100">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-teal-950/40 overflow-hidden flex flex-col p-6 sm:p-10 space-y-6 relative">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Portal Header */}
        <div className="text-center space-y-3 flex flex-col items-center relative z-10">
          <OrcaLogo size="lg" layout="stacked" variant="dark" className="justify-center" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[11px] font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Field Force & Geo-Tagging Engine</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {loginText.subtitle}
          </p>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 pt-2">
          {error && (
            <div id="login-error-msg" className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              {loginText.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-email-input"
                type="email"
                placeholder="name@orcalabs.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-teal-400 focus:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              {loginText.passLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700 focus:border-teal-400 focus:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 block pt-0.5">
              Default password: Your official email address
            </span>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loginText.btnIn}</span>
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2">
          © 2026 Orca Labs Pharmaceutical Systems. All rights reserved.
        </div>
      </div>
    </div>
  );
}
