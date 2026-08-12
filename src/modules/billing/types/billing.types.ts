export interface BillingLineItem {
  desc: string;
  qty: number;
  price: number;
  amount: number;
  discountPercent?: number;
  gstPercent?: number;
  warranty?: string;
}

export interface InvoiceShareRecord {
  channel: "whatsapp" | "email" | "print" | "pdf";
  date: string;
  sharedBy?: string;
}

export interface BillingDocument {
  id: string;
  type: string;
  client: string;
  phone: string;
  vehicle: string;
  service: string;
  serviceCategory?: string;
  customerComplaint?: string;
  workDescription?: string;
  advanceAmount?: string | number;
  model?: string;
  chassisNo?: string;
  engineNo?: string;
  mileage?: string;
  fuelType?: string;
  billingAddress?: string;
  serviceAdvisor?: string;
  technician?: string;
  amount: number;
  gst: number;
  discount: number;
  total: number;
  date: string;
  dueDate: string;
  status: string;
  notes: string;
  paidAmount?: number;
  gstNumber?: string;
  items?: BillingLineItem[];
  bankDetails?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  authorizedSignatory?: string;
  jobId?: string | null;
  franchiseId?: string | null;
  warranty?: string | null;
  discountReason?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  // §13.4 full invoice information
  jobCardNo?: string | null;
  checkInDate?: string | null;
  deliveryDate?: string | null;
  odometerReading?: string | null;
  makeModel?: string | null;
  // §13.10 share history
  sharedHistory?: InvoiceShareRecord[];
}

/** Row shape returned by billing report endpoints (§13.13) */
export interface BillingReportRow {
  id?: string;
  client?: string;
  vehicle?: string;
  service?: string;
  amount?: number;
  gst?: number;
  discount?: number;
  total?: number;
  date?: string;
  status?: string;
  franchiseId?: string;
  franchiseName?: string;
  [key: string]: unknown;
}
