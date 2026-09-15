import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Power, PowerOff, Save, Loader2, Navigation, X, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase-client';
import { OfficeLocation, Language } from '../types';
import { translations } from '../translations';

interface AdminOfficeLocationsProps {
 language: Language;
}

export default function AdminOfficeLocations({ language }: AdminOfficeLocationsProps) {
 const t = translations[language];
 const [locations, setLocations] = useState<OfficeLocation[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 
 // Form state
 const [showForm, setShowForm] = useState(false);
 const [name, setName] = useState('');
 const [latitude, setLatitude] = useState('');
 const [longitude, setLongitude] = useState('');
 const [radius, setRadius] = useState('50');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);

 const resetForm = () => {
  setName('');
  setLatitude('');
  setLongitude('');
  setRadius('50');
  setEditingId(null);
 };

 useEffect(() => {
  fetchLocations();
 }, []);

 const fetchLocations = async () => {
  setIsLoading(true);
  const { data, error } = await supabase
   .from('pharma_hrms_office_locations')
   .select('*')
   .order('created_at', { ascending: false });
   
  if (error) {
   console.error("Error fetching locations", error);
  } else {
   setLocations(data.map(d => ({
    id: d.id,
    name: d.name,
    latitude: parseFloat(d.latitude),
    longitude: parseFloat(d.longitude),
    radius_meters: d.radius_meters,
    is_active: d.is_active
   })));
  }
  setIsLoading(false);
 };

 const handleGetCurrentLocation = () => {
  if (navigator.geolocation) {
   navigator.geolocation.getCurrentPosition(
    (position) => {
     setLatitude(position.coords.latitude.toFixed(6));
     setLongitude(position.coords.longitude.toFixed(6));
    },
    (error) => {
     alert('Error getting location: ' + error.message);
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
   );
  } else {
   alert('Geolocation is not supported by this browser.');
  }
 };

 const handleEditClick = (loc: OfficeLocation) => {
  setEditingId(loc.id);
  setName(loc.name);
  setLatitude(loc.latitude.toString());
  setLongitude(loc.longitude.toString());
  setRadius(loc.radius_meters.toString());
  setShowForm(true);
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !latitude || !longitude || !radius) return;
  
  setIsSubmitting(true);
  
  if (editingId) {
   const { error } = await supabase
    .from('pharma_hrms_office_locations')
    .update({
     name,
     latitude: parseFloat(latitude),
     longitude: parseFloat(longitude),
     radius_meters: parseInt(radius)
    })
    .eq('id', editingId);
    
   setIsSubmitting(false);
   
   if (error) {
    alert('Error updating location: ' + error.message);
   } else {
    setShowForm(false);
    resetForm();
    fetchLocations();
   }
  } else {
   const { error } = await supabase.from('pharma_hrms_office_locations').insert([
    {
     name,
     latitude: parseFloat(latitude),
     longitude: parseFloat(longitude),
     radius_meters: parseInt(radius),
     is_active: true
    }
   ]);
   
   setIsSubmitting(false);
   
   if (error) {
    alert('Error creating location: ' + error.message);
   } else {
    setShowForm(false);
    resetForm();
    fetchLocations();
   }
  }
 };

 const toggleStatus = async (id: string, currentStatus: boolean) => {
  const { error } = await supabase
   .from('pharma_hrms_office_locations')
   .update({ is_active: !currentStatus })
   .eq('id', id);
   
  if (!error) {
   fetchLocations();
  }
 };

 const deleteLocation = async (id: string) => {
  if (!confirm('Are you sure you want to delete this location?')) return;
  
  const { error } = await supabase
   .from('pharma_hrms_office_locations')
   .delete()
   .eq('id', id);
   
  if (!error) {
   fetchLocations();
  }
 };

 const title = language === 'te' ? 'ఆఫీస్ స్థానాలు (జియో-ఫెన్స్)' : 'Office Locations (Geo-fence)';
 const subtitle = language === 'te' ? 'ఉద్యోగులు హాజరు వేసుకోవడానికి అనుమతించబడిన స్థానాలను నిర్వహించండి.' : 'Manage approved office locations where employees are allowed to check in from.';

 return (
  <div className="space-y-6 animate-fadeIn">
   {/* Header */}
   <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
    <div>
     <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
      <MapPin className="w-5 h-5 text-teal-600"/>
      {title}
     </h2>
     <p className="text-xs text-slate-400 mt-1">
      {subtitle}
     </p>
    </div>
    <button
     onClick={() => {
      if (showForm) {
       setShowForm(false);
       resetForm();
      } else {
       setShowForm(true);
      }
     }}
     className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
    >
     {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
     {showForm ? 'Cancel' : 'Add Location'}
    </button>
   </div>

   {/* Add Form */}
   {showForm && (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm animate-scaleUp">
     <h3 className="text-base font-bold text-slate-800 mb-5 border-b pb-3">
      {editingId ? 'Edit Office Location' : 'New Office Location'}
     </h3>
     <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        Location Name
       </label>
       <input
        type="text"
        required
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Main Office - Vizag"
        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
       />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
         <span>Latitude</span>
        </label>
        <input
         type="number"
         step="0.000001"
         required
         value={latitude}
         onChange={e => setLatitude(e.target.value)}
         placeholder="17.726400"
         className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-mono"
        />
       </div>
       <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
         Longitude
        </label>
        <input
         type="number"
         step="0.000001"
         required
         value={longitude}
         onChange={e => setLongitude(e.target.value)}
         placeholder="83.301200"
         className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-mono"
        />
       </div>
      </div>

      <div className="flex gap-2">
       <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
       >
        <Navigation className="w-3.5 h-3.5"/>
        Use My Current GPS Location
       </button>
      </div>

      <div>
       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        Allowed Radius (meters)
       </label>
       <input
        type="number"
        required
        value={radius}
        onChange={e => setRadius(e.target.value)}
        min="10"
        max="5000"
        className="w-full md:w-1/3 border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
       />
       <p className="text-[10px] text-slate-400 mt-1">Default is 50 meters.</p>
      </div>

      <div className="pt-4 border-t border-slate-50">
       <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
       >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
        {editingId ? 'Update Location' : 'Save Location'}
       </button>
      </div>
     </form>
    </div>
   )}

   {/* List */}
   <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
    {isLoading ? (
     <div className="py-12 flex justify-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin"/>
     </div>
    ) : locations.length === 0 ? (
     <div className="text-center py-12 text-slate-400 text-sm">
      No office locations configured yet.
     </div>
    ) : (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {locations.map(loc => (
       <div key={loc.id} className={`p-5 rounded-2xl border transition-all ${loc.is_active ? 'border-teal-100 bg-teal-50/10' : 'border-slate-200 bg-slate-50/50 grayscale'}`}>
        <div className="flex justify-between items-start mb-3">
         <div>
          <h4 className="font-bold text-slate-800">{loc.name}</h4>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${loc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
           {loc.is_active ? 'Active' : 'Inactive'}
          </span>
         </div>
         <div className="flex gap-2">
          <button
           onClick={() => handleEditClick(loc)}
           className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
           title="Edit"
          >
           <Edit2 className="w-4 h-4"/>
          </button>
          <button
           onClick={() => toggleStatus(loc.id, loc.is_active)}
           className={`p-1.5 rounded-lg transition-colors ${loc.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
           title={loc.is_active ? 'Deactivate' : 'Activate'}
          >
           {loc.is_active ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}
          </button>
          <button
           onClick={() => deleteLocation(loc.id)}
           className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
           title="Delete"
          >
           <Trash2 className="w-4 h-4"/>
          </button>
         </div>
        </div>
        
        <div className="space-y-1.5 text-xs text-slate-500 font-mono bg-white p-3 rounded-xl border border-slate-100">
         <div className="flex justify-between">
          <span className="text-slate-400">Lat:</span>
          <span className="font-semibold text-slate-700">{loc.latitude}</span>
         </div>
         <div className="flex justify-between">
          <span className="text-slate-400">Lng:</span>
          <span className="font-semibold text-slate-700">{loc.longitude}</span>
         </div>
         <div className="flex justify-between pt-1.5 border-t border-slate-50">
          <span className="text-slate-400 font-sans font-medium uppercase text-[10px]">Radius:</span>
          <span className="font-semibold text-slate-700">{loc.radius_meters}m</span>
         </div>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>
  </div>
 );
}
