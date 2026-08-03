export interface CarEntry {
  id: string;
  entryId: string;
  vehicleNo?: string;
  vehicle?: string;
  vehicleNumber?: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  technician?: string;
  inTime: string;
  outTime: string | null;
  duration?: string | null;
  status: string;
  odometer?: string;
  notes?: string;
  security?: string;
  remarks?: string;
}
