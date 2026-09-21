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

  // Checkout fields — backend's checkoutSchema (PUT /carin/:id/checkout)
  securityName?: string;
  customerAcknowledgement?: string | null;
  deliveredById?: string | null;
  deliveredByName?: string | null;

  // Initial Inspection fields — mandatory before Start Work / Send to QC
  // (JobCardService.validateInspectionAndEstimate on the backend).
  fuelLevel?: string | null;
  scratches?: string | null;
  dents?: string | null;
  brokenParts?: string | null;
  glassDamage?: string | null;
  wheelDamage?: string | null;
  interiorCondition?: string | null;
  accessoriesReceived?: string | null;

  // Vehicle Photographs
  photoFront?: string | null;
  photoRear?: string | null;
  photoLeft?: string | null;
  photoRight?: string | null;
  photoDashboard?: string | null;
  photoOdometer?: string | null;
  photoDamages?: string[];
}

// Mirrors JobCardService.validateInspectionAndEstimate's hasInspectionDetails
// + hasPhoto check exactly, so the UI's "inspection complete" state never
// drifts from what the backend will actually accept.
export function hasCompletedInspection(car: Partial<CarEntry>): boolean {
  const hasInspectionDetails = Boolean(
    car.scratches || car.dents || car.interiorCondition || car.brokenParts ||
    car.glassDamage || car.wheelDamage || car.remarks || car.fuelLevel
  );
  const hasPhoto = Boolean(
    car.photoFront || car.photoRear || car.photoLeft || car.photoRight ||
    car.photoDashboard || car.photoOdometer || (car.photoDamages && car.photoDamages.length > 0)
  );
  return hasInspectionDetails && hasPhoto;
}
