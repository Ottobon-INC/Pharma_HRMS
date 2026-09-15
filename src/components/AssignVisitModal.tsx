import React, { useState, useEffect } from 'react';
import { FieldVisitType, Language, Employee, FieldVisit, PharmaCallCategory } from '../types';
import * as fieldVisitService from '../lib/services/field-visit-service';
import { EmployeeCheckInLocation } from '../lib/services/attendance-service';
import { fieldOpsConfig } from '../lib/fieldOpsConfig';
import { useNominatimSearch, searchNominatimDirect, NominatimPlace } from '../hooks/useNominatimSearch';
import { AddressSuggestionDropdown } from './fieldops/AddressSuggestionDropdown';
import { ModalPreviewMap } from './fieldops/ModalPreviewMap';
import { 
  MapPin, 
  User, 
  FileText, 
  Clock, 
  Search, 
  Navigation2, 
  X, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Building, 
  Stethoscope, 
  Pill, 
  Package, 
  CheckSquare, 
  PlusCircle, 
  MinusCircle,
  IndianRupee
} from 'lucide-react';

interface AssignVisitModalProps {
  language: Language;
  onClose: () => void;
  employees: Employee[];
  adminId: string;
  checkIns?: EmployeeCheckInLocation[];
  targetEmployeeId?: string;
  isSelfSchedule?: boolean;
  initialDate?: string;
  currentUser?: Employee;
  onVisitCreated?: (visit: FieldVisit) => void;
}

const ORCA_PRODUCTS = [
  { id: 'Orca-DSR', name: 'Orca-DSR (Rabeprazole + Domperidone)', category: 'Gastro' },
  { id: 'Orca-Cold', name: 'Orca-Cold Relief (PCM + Phenylephrine)', category: 'Anti-Cold' },
  { id: 'Orca-Cough', name: 'Orca-Cough DX Syrup', category: 'Respiratory' },
  { id: 'Orca-Cal D3', name: 'Orca-Cal D3 (Calcium + Vit D3)', category: 'Nutraceutical' },
  { id: 'Orca-Multi', name: 'Orca-Multi Daily Softgels', category: 'Wellness' },
  { id: 'Orcavit-9', name: 'Orcavit-9 Antioxidant Forte', category: 'Therapeutic' }
];

export default function AssignVisitModal({
  language,
  onClose,
  employees,
  adminId,
  checkIns = [],
  targetEmployeeId,
  isSelfSchedule = false,
  initialDate,
  currentUser,
  onVisitCreated
}: AssignVisitModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialEmpId = targetEmployeeId || (isSelfSchedule ? currentUser?.id : '') || '';
  const [employeeId, setEmployeeId] = useState(initialEmpId);
  const [scheduledDate, setScheduledDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  
  // Pharma Call Categories
  const [category, setCategory] = useState<PharmaCallCategory>('doctor');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [chemistShopName, setChemistShopName] = useState('');
  const [stockistName, setStockistName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [pobAmount, setPobAmount] = useState<number | ''>('');
  
  // Product Detailing & Samples
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['Orca-DSR', 'Orca-Cal D3']);
  const [sampleUnits, setSampleUnits] = useState<Record<string, number>>({
    'Orca-DSR': 2,
    'Orca-Cal D3': 2
  });

  const [address, setAddress] = useState('');
  const [scheduledStart, setScheduledStart] = useState('10:00');
  const [visitPurpose, setVisitPurpose] = useState('');

  // Selected Destination Coordinates from Autocomplete
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState<number>(-1);
  const [isDirectSearching, setIsDirectSearching] = useState(false);

  // Address Search Autocomplete
  const { suggestions, loading: searchingAddress, clearSuggestions } = useNominatimSearch(address);

  // Hierarchy calculations
  const level = currentUser?.hierarchyLevel || 'be';
  const isBE = level === 'be';
  const isRSM = level === 'rsm' || level === 'team_lead' || level === 'manager';
  const isLeadership = ['admin', 'executive', 'zsm', 'rsm'].includes(level) || currentUser?.role === 'admin';
  const isBESelfScheduling = isSelfSchedule && isBE;

  // Scoped employee list for Managers assigning tasks
  let selectableEmployees = employees.filter(e => e.status === 'active');
  if (isRSM && !isSelfSchedule) {
    selectableEmployees = employees.filter(e => e.reportingTo === currentUser?.id || e.id === currentUser?.id);
  }

  // Determine Origin Point (Agent's Check-in Location > Fallback to Regional Hub)
  const activeEmpId = isSelfSchedule ? (currentUser?.id || initialEmpId) : employeeId;
  const selectedEmployee = employees.find(e => e.id === activeEmpId);
  const empCheckIn = checkIns.find(c => c.employeeId === activeEmpId && c.latitude && c.longitude);

  const originLat = empCheckIn?.latitude ?? fieldOpsConfig.defaultCenter[0];
  const originLng = empCheckIn?.longitude ?? fieldOpsConfig.defaultCenter[1];
  const isOriginCheckIn = !!empCheckIn;
  const originLabel = empCheckIn
    ? `${selectedEmployee?.name || 'Rep'}'s Location (${empCheckIn.locationName ? empCheckIn.locationName.split(',')[0] : 'GPS Lock'})`
    : 'Regional HQ';

  useEffect(() => {
    setDropdownIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (isSelfSchedule && currentUser?.id) {
      setEmployeeId(currentUser.id);
    }
  }, [isSelfSchedule, currentUser]);

  const handleToggleProduct = (prodId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(prodId)) {
        const next = prev.filter(p => p !== prodId);
        const nextUnits = { ...sampleUnits };
        delete nextUnits[prodId];
        setSampleUnits(nextUnits);
        return next;
      } else {
        setSampleUnits(prevU => ({ ...prevU, [prodId]: 2 }));
        return [...prev, prodId];
      }
    });
  };

  const handleUpdateSampleUnit = (prodId: string, delta: number) => {
    setSampleUnits(prev => {
      const current = prev[prodId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [prodId]: updated };
    });
  };

  const handleSelectSuggestion = async (place: NominatimPlace) => {
    setAddress(place.displayName);
    setIsDropdownOpen(false);
    clearSuggestions();

    if (typeof place.lat === 'number' && typeof place.lng === 'number' && !isNaN(place.lat) && !isNaN(place.lng)) {
      setDestLat(place.lat);
      setDestLng(place.lng);
    }
  };

  const handleAddressKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsDropdownOpen(true);
        setDropdownIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsDropdownOpen(true);
        setDropdownIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (isDropdownOpen && dropdownIndex >= 0 && suggestions[dropdownIndex]) {
        handleSelectSuggestion(suggestions[dropdownIndex]);
        return;
      }

      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
        return;
      }

      if (address.trim().length >= 2) {
        setIsDirectSearching(true);
        setError(null);
        try {
          const directPlace = await searchNominatimDirect(address);
          if (directPlace) {
            handleSelectSuggestion(directPlace);
          } else {
            setError('Could not locate address on map. Please try typing a landmark or area name.');
          }
        } catch (err: any) {
          setError(err.message || 'Geocoding failed');
        } finally {
          setIsDirectSearching(false);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalEmpId = isSelfSchedule ? (currentUser?.id || targetEmployeeId || adminId) : employeeId;
    if (!finalEmpId) {
      setError('Please select a field representative.');
      setLoading(false);
      return;
    }

    // Approval Pipeline Rule:
    // BE self-scheduled calls require RSM approval ('pending')
    // RSM, ZSM, GM, Admin calls are auto-approved ('approved')
    const approvalStatus = isBESelfScheduling ? 'pending' : 'approved';
    const approvedBy = isBESelfScheduling ? undefined : (currentUser?.id || adminId);

    // Dynamic Title based on Pharma Call Category
    let targetEntityName = doctorName;
    if (category === 'chemist') targetEntityName = chemistShopName || 'Chemist Call';
    if (category === 'stockist') targetEntityName = stockistName || 'Stockist Call';
    if (category === 'hospital') targetEntityName = hospitalName || 'Hospital Call';

    const autoTitle = title.trim() || `${targetEntityName} (${category.toUpperCase()})`;

    const productsPayload = selectedProducts.map(p => ({
      product: p,
      feedback: 'Detailed'
    }));

    const samplesPayload = Object.entries(sampleUnits)
      .filter(([_, units]) => Number(units) > 0)
      .map(([sample, units]) => ({ sample, units: Number(units) }));

    try {
      const created = await fieldVisitService.createVisit({
        employeeId: finalEmpId,
        assignedBy: currentUser?.id || adminId,
        title: autoTitle,
        visitType: 'DOCTOR_VISIT',
        category,
        doctorName: category === 'doctor' ? doctorName : undefined,
        clinicName: category === 'doctor' ? clinicName : (category === 'chemist' ? chemistShopName : (category === 'stockist' ? stockistName : hospitalName)),
        chemistShopName: category === 'chemist' ? chemistShopName : undefined,
        stockistName: category === 'stockist' ? stockistName : undefined,
        hospitalName: category === 'hospital' ? hospitalName : undefined,
        visitPurpose: visitPurpose || `${category.toUpperCase()} Call Execution`,
        scheduledDate,
        scheduledStart: scheduledStart || undefined,
        priority: 'normal',
        status: 'ASSIGNED',
        approvalStatus,
        approvedBy,
        assignedAddress: address,
        assignedLatitude: destLat || undefined,
        assignedLongitude: destLng || undefined,
        productsDetailed: productsPayload,
        samplesGiven: samplesPayload,
        pobAmount: Number(pobAmount) || 0
      });

      if (onVisitCreated) {
        onVisitCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule pharma call');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] shadow-2xl shadow-black/20 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden border border-black/[0.06]">

        {/* ── Apple-Style Modal Header ── */}
        <div className="px-6 py-5 border-b border-[#E5E5EA] flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#F2F2F7] text-[#0A84FF] rounded-2xl flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-[#1C1C1E] tracking-tight leading-snug">
                {isSelfSchedule
                  ? (isBESelfScheduling ? 'Plan Field Call' : 'Schedule Pharma Call')
                  : (isRSM ? 'Assign Team Call' : 'Assign Field Call')}
              </h3>
              <p className="text-[12px] text-[#8E8E93] font-normal mt-0.5">
                Orca Labs Field Force — Medical Reps, Chemist POB &amp; Stockist Planning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">

          {/* Error */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-[#FF3B30] rounded-2xl text-[13px] font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>
          )}

          {/* RSM Approval Warning */}
          {isBESelfScheduling && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-2xl text-[13px] text-[#1C1C1E] flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5 shrink-0">📋</span>
              <span>Planned calls will be submitted to your <strong className="font-semibold">Regional Sales Manager (RSM)</strong> for approval prior to photo capture.</span>
            </div>
          )}

          {/* ── iOS Segmented Control — Call Category ── */}
          <div>
            <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2.5">Call Type Category</p>
            <div className="flex items-center bg-[#EFEFF4] p-1 rounded-[12px] gap-0.5">
              {[
                { id: 'doctor',   label: 'Doctor Detailing', icon: Stethoscope },
                { id: 'chemist',  label: 'Chemist / POB',    icon: Pill        },
                { id: 'stockist', label: 'Stockist Audit',   icon: Package     },
                { id: 'hospital', label: 'Hospital Call',    icon: Building    },
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as PharmaCallCategory)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] text-[12px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow text-[#0A84FF]'
                        : 'text-[#8E8E93] hover:text-[#3C3C43]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate hidden sm:block">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Form Grid ── */}
          <form id="assign-visit-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column */}
            <div className="space-y-4">

              {/* Representative row */}
              {!isSelfSchedule ? (
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">
                    Assign To Business Executive
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30 cursor-pointer"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  >
                    <option value="">— Choose Representative —</option>
                    {selectableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode || emp.id} — {emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-[#F2F2F7] rounded-xl">
                  <span className="text-[12px] text-[#8E8E93] font-medium">Logged In Representative</span>
                  <span className="text-[13px] font-semibold text-[#0A84FF]">
                    {currentUser?.name || 'Self'} ({currentUser?.designation || 'BE'})
                  </span>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Call Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                    <input
                      required type="date"
                      className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Expected Time</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                    <input
                      type="time"
                      className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                      value={scheduledStart}
                      onChange={(e) => setScheduledStart(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Doctor fields */}
              {category === 'doctor' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Doctor Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                      <input required type="text"
                        className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                        placeholder="e.g. Dr. K. Srinivas Rao"
                        value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Clinic / Chamber</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                      <input type="text"
                        className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                        placeholder="e.g. Apollo Clinic / Care"
                        value={clinicName} onChange={(e) => setClinicName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chemist fields */}
              {category === 'chemist' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Chemist / Medical Shop</label>
                    <div className="relative">
                      <Pill className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                      <input required type="text"
                        className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                        placeholder="e.g. Balaji Medicals"
                        value={chemistShopName} onChange={(e) => setChemistShopName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">P.O.B Estimate (₹)</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                      <input type="number" min="0" step="500"
                        className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                        placeholder="e.g. 15000"
                        value={pobAmount} onChange={(e) => setPobAmount(e.target.value ? parseFloat(e.target.value) : '')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stockist field */}
              {category === 'stockist' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Stockist / Agency Name</label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                    <input required type="text"
                      className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                      placeholder="e.g. Sri Rama Pharma Distributors"
                      value={stockistName} onChange={(e) => setStockistName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Hospital field */}
              {category === 'hospital' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Hospital / Institute Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3.5 pointer-events-none"/>
                    <input required type="text"
                      className="w-full pl-9 pr-3 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                      placeholder="e.g. Seven Hills Hospital"
                      value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Products Checklist ── */}
              <div className="bg-[#F2F2F7] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                    Orca Labs Products &amp; Samples
                  </span>
                  <span className="text-[11px] font-semibold text-[#0A84FF]">
                    {selectedProducts.length} Selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {ORCA_PRODUCTS.map(prod => {
                    const isChecked = selectedProducts.includes(prod.id);
                    const units = sampleUnits[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                          isChecked ? 'bg-white shadow-sm' : 'bg-white/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod.id)}
                          className="flex items-center gap-2 text-left truncate flex-1 cursor-pointer"
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${
                            isChecked ? 'bg-[#30D158] text-white' : 'border-2 border-[#C7C7CC]'
                          }`}>
                            {isChecked ? '✓' : ''}
                          </div>
                          <span className={`truncate text-[12px] font-medium ${isChecked ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>
                            {prod.id}
                          </span>
                        </button>
                        {isChecked && (
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <button type="button" onClick={() => handleUpdateSampleUnit(prod.id, -1)} className="text-[#8E8E93] hover:text-[#FF3B30] cursor-pointer transition-colors">
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-bold w-4 text-center text-[#0A84FF]">{units}</span>
                            <button type="button" onClick={() => handleUpdateSampleUnit(prod.id, 1)} className="text-[#8E8E93] hover:text-[#0A84FF] cursor-pointer transition-colors">
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Location Address ── */}
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                    Location Address / Landmark
                  </label>
                  {destLat && destLng ? (
                    <span className="text-[11px] text-[#30D158] font-semibold">✓ GPS Locked</span>
                  ) : (
                    <span className="text-[10px] text-[#8E8E93] font-medium">
                      Press <span className="font-mono font-bold text-[#1C1C1E]">Enter ↵</span> to route
                    </span>
                  )}
                </div>
                <div className="relative">
                  {isDirectSearching
                    ? <Loader2 className="w-4 h-4 text-[#0A84FF] animate-spin absolute left-3.5 top-3.5 pointer-events-none"/>
                    : <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3.5 pointer-events-none"/>
                  }
                  <input
                    required type="text"
                    className="w-full pl-10 pr-4 py-3 bg-[#F2F2F7] border-0 rounded-xl text-[13px] font-medium text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
                    placeholder="Type clinic, hospital or landmark and press Enter..."
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setIsDropdownOpen(true); setDestLat(null); setDestLng(null); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleAddressKeyDown}
                  />
                </div>
                <AddressSuggestionDropdown
                  suggestions={suggestions}
                  loading={searchingAddress}
                  isOpen={isDropdownOpen && address.length >= 3 && !destLat}
                  selectedIndex={dropdownIndex}
                  onSelect={handleSelectSuggestion}
                />
              </div>
            </div>

            {/* ── Right Column: Map Preview ── */}
            <div className="flex flex-col h-full min-h-[300px]">
              <label className="block text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">
                Route &amp; Geofence Preview
              </label>
              {destLat && destLng ? (
                <div className="flex-1 w-full h-full rounded-2xl overflow-hidden min-h-[300px] border border-[#E5E5EA]">
                  <ModalPreviewMap
                    originLat={originLat} originLng={originLng}
                    originLabel={originLabel} isOriginCheckIn={isOriginCheckIn}
                    destLat={destLat} destLng={destLng}
                    destLabel={address.split(',')[0]}
                  />
                </div>
              ) : (
                <div className="flex-1 w-full h-full min-h-[300px] rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm text-[#0A84FF] flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6"/>
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#1C1C1E] mb-1.5">No Destination Marked</h4>
                  <p className="text-[12px] text-[#8E8E93] max-w-[220px] leading-relaxed">
                    Type a clinic, chemist shop, or hospital and press{' '}
                    <span className="font-semibold text-[#0A84FF]">Enter ↵</span> to preview the route.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ── Apple-Style Footer ── */}
        <div className="px-6 py-4 border-t border-[#E5E5EA] bg-[#F9F9FB] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#EFEFF4] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-full text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assign-visit-form"
            disabled={loading || !address}
            className="px-6 py-2.5 bg-[#0A84FF] hover:bg-[#0070DB] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-[13px] font-semibold transition-all shadow-lg shadow-[#0A84FF]/25 flex items-center gap-2 cursor-pointer"
          >
            <Navigation2 className="w-4 h-4"/>
            {loading
              ? 'Scheduling…'
              : (isSelfSchedule
                  ? (isBESelfScheduling ? 'Submit for RSM Approval' : 'Schedule Call')
                  : (isRSM ? 'Assign Team Call' : 'Schedule Field Call'))}
          </button>
        </div>
      </div>
    </div>
  );
}
