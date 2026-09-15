import { PinType } from './common.types';

export interface LocationPin {
  id: string;
  date: string;           // YYYY-MM-DD
  pinnedAt: string;       // HH:MM:SS
  label?: string;         // user-typed note
  latitude?: number;
  longitude?: number;
  locationName?: string;  // reverse geocoded
  photoUrl?: string;
  pinType: PinType;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export interface SpecialLocationEvent {
  id: string;
  name: string;
  eventType: 'medical_camp' | 'client_site' | 'training' | 'other';
  latitude: number;
  longitude: number;
  radius_meters: number;
  fromDate: string;
  toDate: string;
}
