import React, { useState } from 'react';
import { FieldVisit, FieldVisitStatus, FieldVisitType, Language } from '../types';

interface RequestVisitModalProps {
 language: Language;
 onClose: () => void;
 onSubmit: (visit: Partial<FieldVisit>) => Promise<{ success: boolean; error?: string }>;
}

export default function RequestVisitModal({ language, onClose, onSubmit }: RequestVisitModalProps) {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 
 const [title, setTitle] = useState('');
 const [visitType, setVisitType] = useState<FieldVisitType>('PATIENT_VISIT');
 const [patientName, setPatientName] = useState('');
 const [scheduledStart, setScheduledStart] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  // In a real app we'd get a location too, but let's keep it simple
  // Employees can just specify who they are visiting.

  const today = new Date().toISOString().split('T')[0];

  const result = await onSubmit({
   title,
   visitType,
   patientName,
   scheduledDate: today,
   scheduledStart: scheduledStart || undefined,
   priority: 'normal',
   status: 'ASSIGNED'
  });

  setLoading(false);
  if (result.success) {
   onClose();
  } else {
   setError(result.error || 'Failed to request visit');
  }
 };

 return (
  <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
   <div className="bg-white rounded-2xl shadow-md w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
     <h3 className="font-bold text-lg text-slate-800">
      {language === 'te' ? 'సందర్శనను అభ్యర్థించండి' : 'Request Field Visit'}
     </h3>
     <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
      ✕
     </button>
    </div>

    <form onSubmit={handleSubmit} className="p-6 space-y-4">
     {error && (
      <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">
       {error}
      </div>
     )}

     <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">Visit Title</label>
      <input 
       required
       type="text"
       className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
       placeholder="e.g. Follow-up with patient"
       value={title}
       onChange={(e) => setTitle(e.target.value)}
      />
     </div>

     <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">Visit Type</label>
      <select 
       className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
       value={visitType}
       onChange={(e) => setVisitType(e.target.value as FieldVisitType)}
      >
       <option value="PATIENT_VISIT">Patient Visit</option>
       <option value="MEDICAL_CAMP">Medical Camp</option>
       <option value="DELIVERY">Delivery</option>
       <option value="OTHER">Other</option>
      </select>
     </div>

     {(visitType === 'PATIENT_VISIT' || visitType === 'DELIVERY') && (
      <div>
       <label className="block text-xs font-bold text-slate-500 mb-1">Patient/Client Name</label>
       <input 
        type="text"
        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
       />
      </div>
     )}

     <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">Time (Optional)</label>
      <input 
       type="time"
       className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
       value={scheduledStart}
       onChange={(e) => setScheduledStart(e.target.value)}
      />
     </div>

     <div className="pt-4 flex gap-3">
      <button
       type="button"
       onClick={onClose}
       className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
      >
       Cancel
      </button>
      <button
       type="submit"
       disabled={loading}
       className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
      >
       {loading ? 'Submitting...' : 'Request'}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}
