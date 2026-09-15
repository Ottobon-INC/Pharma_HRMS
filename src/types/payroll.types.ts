export interface Allowance {
  nameKey: string; // translation key or plain string
  amount: number;
}

export interface Deduction {
  nameKey: string; // translation key or plain string
  amount: number;
}

export interface Payslip {
  id: string;
  month: string; // YYYY-MM (e.g. 2026-06)
  basicPay: number;
  allowances: Allowance[];
  deductions: Deduction[];
  advanceMoneyTaken?: boolean;
  advanceMoneyAmount?: number;
  workingDays?: number;
  daysPresent?: number;
  leavesTaken?: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  senderName: string;
  senderDetails: string;
  clientName: string;
  clientDetails: string;
  items: InvoiceItem[];
  taxPercent: number;
}
