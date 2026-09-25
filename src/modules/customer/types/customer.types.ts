export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  model: string;
  carModel?: string;
  visits: number;
  totalSpend: number;
  lastVisit: string;
  gstNumber?: string | null;
  address?: string | null;
  state?: string | null;
}
