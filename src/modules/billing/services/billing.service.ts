import { apiCall } from "@/services/api.client";
import { BillingDocument, BillingReportRow } from "@/modules/billing/types/billing.types";

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

export async function cancelInvoice(id: string, reason: string): Promise<BillingDocument> {
  return apiCall(`/invoices/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function shareInvoice(id: string, channel: "whatsapp" | "email"): Promise<{ success: boolean }> {
  return apiCall(`/invoices/${id}/share`, {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
}

// ═══════════════════════════════════════════════════════════════
// BILLING REPORTS (§13.13)
// ═══════════════════════════════════════════════════════════════

function buildDateParams(from?: string, to?: string): string {
  const params: string[] = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  return params.length > 0 ? `?${params.join("&")}` : "";
}

export async function getInvoiceRegister(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/register${buildDateParams(from, to)}`);
}

export async function getDailySales(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/daily-sales${buildDateParams(from, to)}`);
}

export async function getMonthlySales(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/monthly-sales${buildDateParams(from, to)}`);
}

export async function getCustomerWiseRevenue(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/customer-wise${buildDateParams(from, to)}`);
}

export async function getFranchiseWiseRevenue(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/franchise-wise${buildDateParams(from, to)}`);
}

export async function getGstSummary(from?: string, to?: string): Promise<BillingReportRow[]> {
  return apiCall(`/reports/billing/gst-summary${buildDateParams(from, to)}`);
}
