import { Hospital } from './common.types';

export interface Team {
  id: string;
  name: string;
  hospital: Hospital;
  leadEmployeeId: string;
  memberIds?: string[];
}
