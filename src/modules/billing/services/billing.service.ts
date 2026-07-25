import { apiCall } from "@/services/api.client";
import { BillingDocument } from "@/modules/billing/types/billing.types";

export async function getInvoices(): Promise<BillingDocument[]> {
  return apiCall("/invoices");
}

export async function createInvoice(invoice: Partial<BillingDocument>): Promise<BillingDocument> {
  return apiCall("/invoices", {
    method: "POST",
    body: JSON.stringify(invoice),
  });
}

export async function updateInvoice(id: string, invoice: Partial<BillingDocument>): Promise<BillingDocument> {
  return apiCall(`/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(invoice),
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  return apiCall(`/invoices/${id}`, { method: "DELETE" });
}
