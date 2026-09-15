export type FieldVisitStatus =
  | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED'
  | 'CANCELLED' | 'FAILED' | 'RESCHEDULE_REQUESTED';

export type FieldVisitType =
  | 'PATIENT_VISIT' | 'MEDICAL_CAMP' | 'PHARMACY_VISIT'
  | 'DIAGNOSTIC_VISIT' | 'CLIENT_VISIT' | 'SAMPLE_COLLECTION'
  | 'DELIVERY' | 'CORPORATE_VISIT' | 'INSURANCE_VISIT'
  | 'DOCTOR_VISIT' | 'CHEMIST_VISIT' | 'STOCKIST_VISIT' | 'HOSPITAL_VISIT' | 'OTHER';

export type PharmaCallCategory = 'doctor' | 'chemist' | 'stockist' | 'hospital';

export interface ProductDetailItem {
  product: string;
  feedback?: string;
  keyFocus?: string;
}

export interface SampleItem {
  sample: string;
  units: number;
}

export type FieldEventType =
  | 'FIELD_DUTY_STARTED' | 'FIELD_DUTY_ENDED'
  | 'VISIT_EN_ROUTE' | 'VISIT_ARRIVED'
  | 'VISIT_IN_PROGRESS' | 'VISIT_COMPLETED'
  | 'VISIT_CANCELLED' | 'VISIT_MISSED'
  | 'PROOF_CAPTURED' | 'LOCATION_EXCEPTION';

export type FieldSessionStatus = 'active' | 'completed' | 'cancelled';

export interface FieldSession {
  id: string;
  employeeId: string;
  sessionDate: string; // YYYY-MM-DD
  status: FieldSessionStatus;
  startedAt: string; // ISO timestamp
  endedAt?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  notes?: string;
}

export interface FieldVisit {
  id: string;
  sessionId?: string;
  employeeId: string;
  assignedBy?: string;
  visitType: FieldVisitType;
  category?: PharmaCallCategory;
  title: string;
  description?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStart?: string; // HH:MM
  scheduledEnd?: string;
  assignedLatitude?: number;
  assignedLongitude?: number;
  assignedAddress?: string;
  allowedRadiusMeters: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: FieldVisitStatus;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  actualLatitude?: number;
  actualLongitude?: number;
  actualAddress?: string;
  arrivalDistanceM?: number;
  durationMinutes?: number;
  startPhotoUrl?: string;
  proofPhotoUrl?: string;
  completionNotes?: string;
  patientName?: string;
  clientReference?: string;
  locationException: boolean;
  rescheduleReason?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
  doctorName?: string;
  clinicName?: string;
  chemistShopName?: string;
  stockistName?: string;
  hospitalName?: string;
  area?: string;
  timeSlot?: string;
  visitPurpose?: string;
  productsDetailed?: ProductDetailItem[];
  samplesGiven?: SampleItem[];
  pobAmount?: number;
}

export interface FieldVisitEvent {
  id: string;
  visitId?: string;
  sessionId?: string;
  employeeId: string;
  eventType: FieldEventType;
  occurredAt: string;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
  address?: string;
  metadata?: Record<string, any>;
  synced: boolean;
}

export type PinCategory =
  | 'Doctor Clinic'
  | 'Retail Chemist'
  | 'Stockist Warehouse'
  | 'Hospital Entrance'
  | 'Patient Home'
  | 'Clinic Entrance'
  | 'Sample Collected'
  | 'Lab Drop-off'
  | 'Delivery Point'
  | 'Exception Site'
  | 'Other';

export interface FieldVisitPin {
  id: string;
  visitId: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  category: PinCategory | string;
  label?: string;
  note?: string;
  photoUrl?: string;
  pinnedAt: string;
}

export interface FieldVisitPosition {
  id: string;
  visitId: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  accuracyM?: number;
  recordedAt: string;
}
