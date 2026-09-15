import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as xlsx from 'xlsx';
import { Employee } from '../../types';
import * as fieldVisitService from '../../lib/services/field-visit-service';

interface BulkAssignModalProps {
 onClose: () => void;
 employees: Employee[];
 adminId: string;
}

interface ParsedRow {
 employeeId: string;
 name: string;
 doctorName: string;
 hospitalAddress: string;
 workDesc: string;
 date: string;
 timeSlot: string;
}

export default function BulkAssignModal({ onClose, employees, adminId }: BulkAssignModalProps) {
 const [file, setFile] = useState<File | null>(null);
 const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
 const [isUploading, setIsUploading] = useState(false);
 const [error, setError] = useState('');

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFile(file);
  const reader = new FileReader();
  reader.onload = (evt) => {
   try {
    const bstr = evt.target?.result;
    const wb = xlsx.read(bstr, { type: 'binary' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = xlsx.utils.sheet_to_json(ws) as any[];

    const formatExcelDate = (val: any): string => {
     if (!val) return new Date().toISOString().split('T')[0];
     // Handle numeric Excel date serial (e.g. 46271)
     if (typeof val === 'number') {
      const dateObj = xlsx.SSF.parse_date_code(val);
      if (dateObj) {
       const y = dateObj.y;
       const m = String(dateObj.m).padStart(2, '0');
       const d = String(dateObj.d).padStart(2, '0');
       return `${y}-${m}-${d}`;
      }
     }
     if (typeof val === 'string') {
      const trimmed = val.trim();
      // If already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      // If DD-MM-YYYY or DD/MM/YYYY
      const parts = trimmed.split(/[-/]/);
      if (parts.length === 3) {
       if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
       if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
       return parsed.toISOString().split('T')[0];
      }
     }
     return new Date().toISOString().split('T')[0];
    };

    const mappedData: ParsedRow[] = data.map(row => ({
     employeeId: String(row['employee id'] || row['Employee ID'] || row['employeeId'] || row['EmployeeId'] || '').trim(),
     name: String(row['name'] || row['Name'] || '').trim(),
     doctorName: String(row['doctor name'] || row['Doctor Name'] || row['doctorName'] || '').trim(),
     hospitalAddress: String(row['hospital address'] || row['Hospital Address'] || row['hospitalAddress'] || '').trim(),
     workDesc: String(row['work desc'] || row['Work Desc'] || row['Work Description'] || row['Description'] || '').trim(),
     date: formatExcelDate(row['date'] || row['Date']),
     timeSlot: String(row['time slot'] || row['Time Slot'] || '09:00').trim(),
    })).filter(r => r.employeeId && r.doctorName); // basic validation

    setParsedData(mappedData);
    setError('');
   } catch (err: any) {
    console.error(err);
    setError(`Failed to parse Excel file: ${err?.message || 'Invalid format'}`);
   }
  };
  reader.readAsBinaryString(file);
 };

 const handleConfirm = async () => {
  if (parsedData.length === 0) {
   setError('No valid rows found in the uploaded file.');
   return;
  }

  setIsUploading(true);
  try {
   await fieldVisitService.bulkCreateVisits(
    parsedData.map(row => ({
     employeeId: row.employeeId,
     assignedBy: adminId || 'admin',
     title: `Visit: ${row.doctorName}`,
     description: row.workDesc,
     assignedAddress: row.hospitalAddress,
     scheduledDate: row.date,
     scheduledStart: row.timeSlot
    }))
   );
   onClose();
  } catch (err: any) {
   console.error(err);
   setError(err?.message ? `Failed to assign visits: ${err.message}` : 'Failed to assign visits in bulk. Please check database permissions.');
  } finally {
   setIsUploading(false);
  }
 };

 const downloadTemplate = () => {
  const ws = xlsx.utils.json_to_sheet([{
   'Employee ID': 'EMP-001',
   'Name': 'John Doe',
   'Doctor Name': 'Dr. Smith',
   'Hospital Address': '123 Health St, City',
   'Work Desc': 'Monthly product detailing',
   'Date': '2026-09-10',
   'Time Slot': '10:30'
  }]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Template');
  xlsx.writeFile(wb, 'Bulk_Assign_Template.xlsx');
 };

 return (
  <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
   <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-md">
    <div className="flex items-center justify-between p-6 border-b border-slate-100">
     <div>
      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
       <FileSpreadsheet className="w-6 h-6 text-teal-600"/>
       Bulk Assign Visits (Excel)
      </h3>
      <p className="text-sm text-slate-500 font-medium mt-1">
       Upload an Excel file to assign multiple doctor visits at once
      </p>
     </div>
     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
      <X className="w-6 h-6 text-slate-400"/>
     </button>
    </div>

    <div className="p-6 overflow-y-auto flex-1">
     <div className="flex flex-col sm:flex-row gap-6 mb-6">
      <div className="flex-1">
       <label className="border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-teal-50 transition-colors">
        <Upload className="w-10 h-10 text-teal-600 mb-3"/>
        <span className="text-sm font-bold text-[#6a2baf]">
         {file ? file.name : 'Click to Upload Excel (.xlsx)'}
        </span>
        <span className="text-xs text-teal-600/70 mt-1 font-medium">
         {parsedData.length > 0 ? `${parsedData.length} valid rows found` : 'Columns: Employee ID, Name, Doctor Name, Hospital Address, Work Desc'}
        </span>
        <input
         type="file"
         accept=".xlsx, .xls, .csv"
         className="hidden"
         onChange={handleFileUpload}
        />
       </label>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center">
       <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-3"/>
       <p className="text-sm font-bold text-slate-700 mb-2">Need the format?</p>
       <button
        onClick={downloadTemplate}
        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-slate-300 transition-colors"
       >
        Download Template
       </button>
      </div>
     </div>

     {error && (
      <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-2 border border-red-100">
       <AlertCircle className="w-4 h-4 shrink-0"/>
       {error}
      </div>
     )}

     {parsedData.length > 0 && (
      <div>
       <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
        Preview Assignments
       </h4>
       <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
         <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
          <tr>
           <th className="px-4 py-3">Employee</th>
           <th className="px-4 py-3">Doctor</th>
           <th className="px-4 py-3">Address</th>
           <th className="px-4 py-3">Date/Time</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-slate-100">
          {parsedData.slice(0, 10).map((row, idx) => {
           const emp = employees.find(e => e.id === row.employeeId);
           return (
            <tr key={idx} className="bg-white">
             <td className="px-4 py-3">
              <span className="font-bold text-slate-800 block">{emp?.name || row.name || 'Unknown'}</span>
              <span className="text-[10px] text-slate-400 font-mono">{row.employeeId}</span>
             </td>
             <td className="px-4 py-3 font-medium text-slate-700">{row.doctorName}</td>
             <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate"title={row.hospitalAddress}>{row.hospitalAddress || '-'}</td>
             <td className="px-4 py-3 text-slate-500">
              {row.date} <span className="font-bold">{row.timeSlot}</span>
             </td>
            </tr>
           );
          })}
         </tbody>
        </table>
        {parsedData.length > 10 && (
         <div className="px-4 py-3 bg-slate-50 text-center text-xs font-bold text-slate-500 border-t border-slate-100">
          + {parsedData.length - 10} more rows
         </div>
        )}
       </div>
      </div>
     )}
    </div>

    <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
     <button
      onClick={onClose}
      className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
     >
      Cancel
     </button>
     <button
      onClick={handleConfirm}
      disabled={parsedData.length === 0 || isUploading}
      className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm shadow-teal-600/20 transition-all flex items-center gap-2"
     >
      {isUploading ? (
       <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
        Assigning...
       </>
      ) : (
       <>Confirm & Assign {parsedData.length} Visits</>
      )}
     </button>
    </div>
   </div>
  </div>
 );
}
