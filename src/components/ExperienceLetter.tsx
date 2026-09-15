import React, { forwardRef } from 'react';
import { Employee, Language } from '../types';
import { OrcaLogo } from './OrcaLogo';

interface ExperienceLetterProps {
 employee: Employee;
 language: Language;
}

const ExperienceLetter = forwardRef<HTMLDivElement, ExperienceLetterProps>(({ employee, language }, ref) => {
 const issueDate = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
 });

 const joiningDateStr = new Date(employee.joiningDate).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
 });

 const durationInMs = new Date().getTime() - new Date(employee.joiningDate).getTime();
 const durationInYears = (durationInMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
 
 const companyName = "Orca Labs Pvt. Ltd.";
 const title = employee.gender === 'female' ? 'Ms.' : 'Mr.';

 return (
  <div ref={ref} className="bg-white p-12 max-w-4xl mx-auto min-h-[1056px] shadow-sm print:shadow-none print:p-0 relative font-serif text-slate-800">
   {/* Static Header (Letterhead Template Placeholder) */}
   <div className="border-b-4 border-teal-700 pb-6 mb-12 flex justify-between items-start">
    <div className="flex items-center gap-4">
     <OrcaLogo size="lg" variant="light" layout="horizontal" subtitle="Pharmaceuticals" />
    </div>
    <div className="text-right text-sm">
     <p className="font-bold text-teal-800">Registered Corporate Office</p>
     <p>Visakhapatnam, Andhra Pradesh</p>
     <p>Contact: +91 891 278 9900</p>
     <p>Email: hr@orcalabs.in</p>
    </div>
   </div>

   {/* Letter Body */}
   <div className="space-y-8 leading-relaxed">
    <div className="flex justify-between font-bold">
     <p>Ref: ORCA/HR/EXP/{new Date().getFullYear()}/{employee.id.slice(-4)}</p>
     <p>Date: {issueDate}</p>
    </div>

    <h1 className="text-2xl font-bold text-center underline uppercase tracking-widest my-10">
     To Whomsoever It May Concern
    </h1>

    <div className="space-y-6 text-justify">
     <p>
      This is to certify that <strong>{title} {employee.name}</strong> (Employee ID: {employee.id}) has been employed with <strong>{companyName}</strong> since <strong>{joiningDateStr}</strong>.
     </p>

     <p>
      During their tenure, they have successfully served in the capacity of <strong>{employee.designation}</strong>. They have completed approximately <strong>{durationInYears} years</strong> of service with our organization.
     </p>

     <p>
      We have found {employee.gender === 'female' ? 'her' : 'him'} to be a dedicated, hardworking, and reliable employee. {employee.gender === 'female' ? 'She' : 'He'} possesses good conduct and has maintained a professional attitude towards {employee.gender === 'female' ? 'her' : 'his'} responsibilities.
     </p>

     <p>
      We wish {employee.gender === 'female' ? 'her' : 'him'} success in all future endeavors.
     </p>
    </div>

    {/* Signature Block */}
    <div className="pt-24 space-y-2">
     <p>For <strong>{companyName}</strong></p>
     <div className="h-16">
      {/* Signature image placeholder could go here */}
     </div>
     <p className="font-bold">Authorized Signatory</p>
     <p>Human Resources Department</p>
    </div>
   </div>
   
   {/* Footer / Watermark */}
   <div className="absolute bottom-12 left-0 right-0 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4 px-12">
    This is a computer-generated document. No signature is required.
   </div>
  </div>
 );
});

export default ExperienceLetter;
