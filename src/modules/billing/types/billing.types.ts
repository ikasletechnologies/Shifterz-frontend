export interface BillingDocument {
  id: string;
  type: string;
  client: string;
  phone: string;
  vehicle: string;
  service: string;
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
  items?: any;
  bankDetails?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  authorizedSignatory?: string;
}
