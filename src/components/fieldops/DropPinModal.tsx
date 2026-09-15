import React, { useState } from 'react';
import { PinCategory } from '../../types';
import { MapPin, X, Check, Home, Building2, TestTube2, FlaskConical, Package, AlertTriangle, Tag } from 'lucide-react';

interface DropPinModalProps {
 currentLat: number;
 currentLng: number;
 onClose: () => void;
 onSavePin: (category: PinCategory | string, label?: string, note?: string) => Promise<boolean>;
 visitTitle?: string;
}

interface CategoryOption {
 id: PinCategory;
 name: string;
 icon: React.ComponentType<{ className?: string }>;
 color: string;
}

const CATEGORIES: CategoryOption[] = [
 { id: 'Patient Home', name: 'Patient Home', icon: Home, color: 'border-teal-200 bg-teal-50 text-teal-700' },
 { id: 'Clinic Entrance', name: 'Clinic Entrance', icon: Building2, color: 'border-blue-200 bg-blue-50 text-blue-700' },
 { id: 'Sample Collected', name: 'Sample Collected', icon: TestTube2, color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
 { id: 'Lab Drop-off', name: 'Lab Drop-off', icon: FlaskConical, color: 'border-amber-200 bg-amber-50 text-amber-700' },
 { id: 'Delivery Point', name: 'Delivery Point', icon: Package, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
 { id: 'Exception Site', name: 'Exception Site', icon: AlertTriangle, color: 'border-rose-200 bg-rose-50 text-rose-700' },
 { id: 'Other', name: 'Other', icon: Tag, color: 'border-slate-200 bg-slate-50 text-slate-700' }
];

export const DropPinModal: React.FC<DropPinModalProps> = ({
 currentLat,
 currentLng,
 onClose,
 onSavePin,
 visitTitle
}) => {
 const [selectedCategory, setSelectedCategory] = useState<PinCategory>('Sample Collected');
 const [customLabel, setCustomLabel] = useState('');
 const [note, setNote] = useState('');
 const [saving, setSaving] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  const labelToSave = selectedCategory === 'Other'
   ? (customLabel.trim() || 'Custom Location')
   : (customLabel.trim() || selectedCategory);

  const success = await onSavePin(selectedCategory, labelToSave, note);
  setSaving(false);
  if (success) {
   onClose();
  }
 };

 return (
  <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-4 z-[99999] animate-fade-in">
   <div className="bg-white rounded-t-[32px] sm:rounded-[28px] w-full max-w-lg overflow-hidden shadow-md border border-slate-100 flex flex-col max-h-[90vh]">
    {/* Header */}
    <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
     <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
       <MapPin className="w-5 h-5"/>
      </div>
      <div>
       <h3 className="text-lg font-black text-slate-800">Drop Location Pin</h3>
       <p className="text-xs text-slate-500 font-medium">{visitTitle || 'Mark this location on map'}</p>
      </div>
     </div>
     <button
      onClick={onClose}
      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
     >
      <X className="w-5 h-5"/>
     </button>
    </div>

    {/* Content */}
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
     {/* Coordinates Bar */}
     <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
      <div className="flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
       <span>GPS: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Current Position</span>
     </div>

     {/* Category Selector */}
     <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
       Select Pin Category
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
       {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;
        return (
         <button
          key={cat.id}
          type="button"
          onClick={() => setSelectedCategory(cat.id)}
          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer ${
           isSelected
            ? 'border-teal-600 bg-teal-50/80 text-teal-900 shadow-sm ring-2 ring-teal-500/20'
            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
          }`}
         >
          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
          <span className="truncate">{cat.name}</span>
         </button>
        );
       })}
      </div>
     </div>

     {/* Custom Label (Optional or if Other selected) */}
     <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
       {selectedCategory === 'Other' ? 'Custom Label *' : 'Pin Label (Optional)'}
      </label>
      <input
       type="text"
       value={customLabel}
       onChange={e => setCustomLabel(e.target.value)}
       placeholder={selectedCategory === 'Other' ? 'e.g. North Gate Sample Drop' : `Default: ${selectedCategory}`}
       required={selectedCategory === 'Other'}
       className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all font-medium"
      />
     </div>

     {/* Note */}
     <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
       Remarks / Landmark Notes (Optional)
      </label>
      <textarea
       value={note}
       onChange={e => setNote(e.target.value)}
       rows={2}
       placeholder="e.g. 2nd floor flat 204, sample stored in cool bag"
       className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all font-medium resize-none"
      />
     </div>

     {/* Action Buttons */}
     <div className="pt-2 flex gap-3">
      <button
       type="button"
       onClick={onClose}
       className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm cursor-pointer"
      >
       Cancel
      </button>
      <button
       type="submit"
       disabled={saving}
       className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm shadow-teal-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
      >
       {saving ? (
        'Saving Pin...'
       ) : (
        <>
         <Check className="w-4 h-4"/> Save & Drop Pin
        </>
       )}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
};
