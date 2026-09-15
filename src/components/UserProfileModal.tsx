import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import type { Employee } from '../types';

interface UserProfileModalProps {
 currentUser: Employee;
 onClose: () => void;
 onUpdatePassword: (newPassword: string) => Promise<void>;
 language: 'en' | 'te';
}

export default function UserProfileModal({ currentUser, onClose, onUpdatePassword, language }: UserProfileModalProps) {
 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 const [showCurrent, setShowCurrent] = useState(false);
 const [showNew, setShowNew] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 const t = {
  title: language === 'te' ? 'నా ప్రొఫైల్' : 'My Profile',
  changePwd: language === 'te' ? 'పాస్‌వర్డ్ మార్చండి' : 'Change Password',
  currentPwd: language === 'te' ? 'ప్రస్తుత పాస్‌వర్డ్' : 'Current Password',
  newPwd: language === 'te' ? 'కొత్త పాస్‌వర్డ్' : 'New Password',
  confirmPwd: language === 'te' ? 'పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm New Password',
  saveBtn: language === 'te' ? 'పాస్‌వర్డ్ అప్‌డేట్ చేయండి' : 'Update Password',
  updatingBtn: language === 'te' ? 'నమోదవుతోంది...' : 'Updating...',
  cancel: language === 'te' ? 'రద్దు చేయండి' : 'Cancel',
  close: language === 'te' ? 'మూసివేయండి' : 'Close',
  errCurrent: language === 'te' ? 'ప్రస్తుత పాస్‌వర్డ్ తప్పు' : 'Current password is incorrect',
  errMismatch: language === 'te' ? 'కొత్త పాస్‌వర్డ్స్ సరిపోలడం లేదు' : 'New passwords do not match',
  errLength: language === 'te' ? 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి' : 'Password must be at least 8 characters long',
  errSame: language === 'te' ? 'కొత్త పాస్‌వర్డ్ ప్రస్తుత పాస్‌వర్డ్‌తో సమానంగా ఉండకూడదు' : 'New password must be different from current password',
  successMsg: language === 'te' ? 'పాస్‌వర్డ్ విజయవంతంగా మార్చబడింది!' : 'Password updated successfully! Your credentials have been secured.',
  strengthLabel: language === 'te' ? 'పాస్‌వర్డ్ బలం' : 'Password Strength',
  strengthWeak: language === 'te' ? 'బలహీనమైనది' : 'Weak',
  strengthFair: language === 'te' ? 'మధ్యస్థం' : 'Fair',
  strengthStrong: language === 'te' ? 'బలమైనది' : 'Strong',
  pwdHint: language === 'te' ? 'కనీసం 8 అక్షరాలు, అక్షరాలు మరియు సంఖ్యలు లేదా చిహ్నాలు చేర్చండి.' : 'Use 8+ characters with a mix of letters, numbers, or symbols.'
 };

 // Password strength calculation
 const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', barColor: 'bg-slate-200', textClass: 'text-slate-400' };
  if (pwd.length < 8) {
   return { score: 1, label: t.strengthWeak, barColor: 'bg-rose-500', textClass: 'text-rose-500' };
  }
  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  if (hasLetters && (hasNumbers || hasSpecial)) {
   return { score: 3, label: t.strengthStrong, barColor: 'bg-emerald-500', textClass: 'text-emerald-600' };
  }
  return { score: 2, label: t.strengthFair, barColor: 'bg-amber-500', textClass: 'text-amber-600' };
 };

 const strength = getPasswordStrength(newPassword);

 // Auto-close cleanup
 useEffect(() => {
  if (!success) return;
  const timer = setTimeout(() => {
   onClose();
  }, 4000);
  return () => clearTimeout(timer);
 }, [success, onClose]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();
  const trimmedConfirm = confirmPassword.trim();

  // Verify current password against saved record
  const expectedCurrent = currentUser.password || 'password';
  if (trimmedCurrent !== expectedCurrent) {
   setError(t.errCurrent);
   return;
  }

  // Disallow setting the exact same password
  if (trimmedNew === trimmedCurrent) {
   setError(t.errSame);
   return;
  }

  // Length check: minimum 8 characters
  if (trimmedNew.length < 8) {
   setError(t.errLength);
   return;
  }

  // Confirmation check
  if (trimmedNew !== trimmedConfirm) {
   setError(t.errMismatch);
   return;
  }

  setIsSubmitting(true);
  try {
   await onUpdatePassword(trimmedNew);
   setSuccess(t.successMsg);
   // Clear inputs
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  } catch (err: any) {
   setError(err?.message || 'Failed to update password. Please check your network connection.');
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
   <div className="bg-white rounded-[32px] w-full max-w-md shadow-md relative animate-scaleUp overflow-hidden flex flex-col max-h-[90vh]">
    
    {/* Close Button - Top Right */}
    <button 
     onClick={onClose}
     className="absolute top-5 right-5 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-50 cursor-pointer"
     title="Close profile"
     aria-label="Close"
    >
     <X className="w-4 h-4"/>
    </button>

    <div className="relative overflow-y-auto w-full scroll-smooth scrollbar-hide">
     {/* Header Banner */}
     <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 z-0"/>

     <div className="relative z-10 p-6 sm:p-8 pt-10">
      {/* User Avatar */}
      <div className="flex justify-center mb-5">
       <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md ring-4 ring-white/30">
        <div className="w-full h-full bg-gradient-to-br from-teal-600 to-emerald-700 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-inner">
         {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
       </div>
      </div>
      
      {/* User Name & Designation */}
      <div className="text-center mb-6">
       <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentUser.name}</h2>
       <p className="text-slate-500 text-xs font-semibold mt-1">{currentUser.designation}</p>
       <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
        {currentUser.id}
       </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'ఈమెయిల్' : 'Email'}</span>
        <span className="text-xs font-semibold text-slate-700 break-all">{currentUser.email}</span>
       </div>
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'ఫోన్' : 'Phone'}</span>
        <span className="text-xs font-semibold text-slate-700">{currentUser.phone || '-'}</span>
       </div>
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'లింగం' : 'Gender'}</span>
        <span className="text-xs font-semibold text-slate-700 capitalize">{currentUser.gender || '-'}</span>
       </div>
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'చేరిన తేదీ' : 'Joining Date'}</span>
        <span className="text-xs font-semibold text-slate-700">{new Date(currentUser.joiningDate).toLocaleDateString()}</span>
       </div>
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'పాత్ర' : 'Role'}</span>
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">{currentUser.role}</span>
       </div>
       <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'te' ? 'స్థితి' : 'Status'}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-0.5 ${currentUser.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'}`}>
         {currentUser.status}
        </span>
       </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 shadow-sm">
       <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
         <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <ShieldCheck className="w-4 h-4"/>
         </div>
         <div>
          <h3 className="font-bold text-sm text-slate-800 leading-tight">{t.changePwd}</h3>
          <p className="text-[10px] text-slate-400 font-medium">Secure your account credentials</p>
         </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100/60 text-teal-700 px-2 py-0.5 rounded-full">
         Security
        </span>
       </div>

       {/* Error Alert */}
       {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2 animate-shake">
         <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"/>
         <span>{error}</span>
        </div>
       )}
       
       {/* Success Alert */}
       {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl space-y-2">
         <div className="flex items-center gap-2 font-bold text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/>
          <span>{success}</span>
         </div>
         <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-emerald-600">Auto-closing shortly...</span>
          <button
           type="button"
           onClick={onClose}
           className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
          >
           {t.close}
          </button>
         </div>
        </div>
       )}

       {/* Password Form */}
       <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Current Password */}
        <div className="space-y-1.5">
         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          {t.currentPwd}
         </label>
         <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <input
           type={showCurrent ?"text":"password"}
           required
           placeholder="••••••••"
           value={currentPassword}
           onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (error) setError('');
           }}
           className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 font-mono placeholder:font-sans transition-all"
          />
          <button
           type="button"
           onClick={() => setShowCurrent(!showCurrent)}
           className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
           title={showCurrent ?"Hide password":"Show password"}
           tabIndex={-1}
          >
           {showCurrent ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
          </button>
         </div>
        </div>

        {/* 2. New Password */}
        <div className="space-y-1.5">
         <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
           {t.newPwd}
          </label>
          {newPassword && (
           <span className={`text-[10px] font-bold ${strength.textClass}`}>
            {strength.label}
           </span>
          )}
         </div>
         <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <input
           type={showNew ?"text":"password"}
           required
           placeholder="Minimum 8 characters"
           value={newPassword}
           onChange={(e) => {
            setNewPassword(e.target.value);
            if (error) setError('');
           }}
           className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 font-mono placeholder:font-sans transition-all"
          />
          <button
           type="button"
           onClick={() => setShowNew(!showNew)}
           className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
           title={showNew ?"Hide password":"Show password"}
           tabIndex={-1}
          >
           {showNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
          </button>
         </div>

         {/* Password Strength Visual Bar */}
         {newPassword && (
          <div className="pt-1 space-y-1">
           <div className="grid grid-cols-3 gap-1.5 h-1.5">
            <div className={`rounded-full transition-colors ${strength.score >= 1 ? strength.barColor : 'bg-slate-200'}`} />
            <div className={`rounded-full transition-colors ${strength.score >= 2 ? strength.barColor : 'bg-slate-200'}`} />
            <div className={`rounded-full transition-colors ${strength.score >= 3 ? strength.barColor : 'bg-slate-200'}`} />
           </div>
           <p className="text-[10px] text-slate-400 leading-tight">
            {t.pwdHint}
           </p>
          </div>
         )}
        </div>

        {/* 3. Confirm New Password */}
        <div className="space-y-1.5">
         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          {t.confirmPwd}
         </label>
         <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <input
           type={showConfirm ?"text":"password"}
           required
           placeholder="Re-type new password"
           value={confirmPassword}
           onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError('');
           }}
           className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 font-mono placeholder:font-sans transition-all"
          />
          <button
           type="button"
           onClick={() => setShowConfirm(!showConfirm)}
           className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
           title={showConfirm ?"Hide password":"Show password"}
           tabIndex={-1}
          >
           {showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
          </button>
         </div>
        </div>

        {/* Submit Action */}
        <button
         type="submit"
         disabled={isSubmitting}
         className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-teal-600/15 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
         {isSubmitting ? (
          <>
           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
           <span>{t.updatingBtn}</span>
          </>
         ) : (
          <>
           <Sparkles className="w-4 h-4"/>
           <span>{t.saveBtn}</span>
          </>
         )}
        </button>
       </form>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
