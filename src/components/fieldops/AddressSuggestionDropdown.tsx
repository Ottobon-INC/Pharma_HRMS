import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { NominatimPlace } from '../../hooks/useNominatimSearch';

interface AddressSuggestionDropdownProps {
 suggestions: NominatimPlace[];
 loading: boolean;
 onSelect: (place: NominatimPlace) => void;
 isOpen: boolean;
 selectedIndex?: number;
}

export const AddressSuggestionDropdown: React.FC<AddressSuggestionDropdownProps> = ({
 suggestions,
 loading,
 onSelect,
 isOpen,
 selectedIndex = -1
}) => {
 if (!isOpen) return null;

 if (loading) {
  return (
   <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-md border border-slate-100 p-3 z-50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 animate-fadeIn">
    <Loader2 className="w-4 h-4 animate-spin text-teal-600"/>
    <span>Searching matching locations...</span>
   </div>
  );
 }

 if (suggestions.length === 0) {
  return null;
 }

 return (
  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-md border border-slate-100/80 overflow-hidden z-50 animate-scaleUp divide-y divide-slate-50 max-h-56 overflow-y-auto">
   {suggestions.map((place, idx) => {
    const isHighlighted = idx === selectedIndex;
    return (
     <button
      key={place.placeId}
      type="button"
      onMouseDown={(e) => {
       e.preventDefault(); // Prevent input blur before onClick fires
       onSelect(place);
      }}
      className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 group cursor-pointer ${
       isHighlighted
        ? 'bg-teal-50 text-teal-900 border-l-4 border-teal-600'
        : 'hover:bg-teal-50/60'
      }`}
     >
      <div
       className={`p-1.5 rounded-xl transition-colors mt-0.5 shrink-0 ${
        isHighlighted
         ? 'bg-teal-200/80 text-[#6a2baf]'
         : 'bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700'
       }`}
      >
       <MapPin className="w-4 h-4"/>
      </div>
      <div className="flex-1 min-w-0">
       <p
        className={`text-xs font-bold truncate ${
         isHighlighted ? 'text-teal-950' : 'text-slate-800 group-hover:text-teal-900'
        }`}
       >
        {place.name}
       </p>
       <p
        className={`text-[10px] line-clamp-1 mt-0.5 ${
         isHighlighted ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
        }`}
       >
        {place.displayName}
       </p>
      </div>
     </button>
    );
   })}
  </div>
 );
};
