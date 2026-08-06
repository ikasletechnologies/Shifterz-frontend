/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`);
  if (isGet) {
    url.searchParams.append('_t', Date.now().toString());
  }

  let finalOptions = { ...options };

  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (finalOptions.method && ["POST", "PUT"].includes(finalOptions.method.toUpperCase()) && finalOptions.body) {
          const bodyObj = JSON.parse(finalOptions.body as string);
          if (finalOptions.method.toUpperCase() === "POST" && !bodyObj.createdBy && !endpoint.includes("/vendors")) {
            bodyObj.createdBy = user.name || user.username;
          }
          if (finalOptions.method.toUpperCase() === "PUT" && !bodyObj.modifiedBy && !endpoint.includes("/vendors")) {
            bodyObj.modifiedBy = user.name || user.username;
          }
          finalOptions.body = JSON.stringify(bodyObj);
        }
      } catch (e) {
        console.error("Error adding audit fields:", e);
      }
    }
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    ...finalOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...finalOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.error || `API Error: ${response.statusText}`;

    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "token=; path=/; max-age=0";
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════
export async function login(username: string, password: string) {
  const data = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  // Set cookie for middleware verification
  document.cookie = `token=${data.token}; path=/; max-age=86400`;
  return data;
}

export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.cookie = "token=; path=/; max-age=0";
}

export async function getCurrentUser() {
  try {
    return await apiCall("/auth/me");
  } catch {
    return null;
  }
}

export async function updateProfile(data: any) {
  return apiCall("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getRolePermissions() {
  return apiCall("/auth/roles/permissions");
}

export async function updateRolePermissions(role: string, permissions: string[]) {
  return apiCall(`/auth/roles/permissions/${role}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

// ═══════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════
export async function getLeads() {
  return apiCall("/leads");
}

export async function createLead(lead: any) {
  return apiCall("/leads", {
    method: "POST",
    body: JSON.stringify(lead),
  });
}

export async function updateLead(id: string, lead: any) {
  return apiCall(`/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(lead),
  });
}

export async function deleteLead(id: string) {
  return apiCall(`/leads/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════════
export async function getInvoices() {
  return apiCall("/invoices");
}

export async function createInvoice(invoice: any) {
  return apiCall("/invoices", {
    method: "POST",
    body: JSON.stringify(invoice),
  });
}

export async function updateInvoice(id: string, invoice: any) {
  return apiCall(`/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(invoice),
  });
}

export async function deleteInvoice(id: string) {
  return apiCall(`/invoices/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
export async function getPayments() {
  return apiCall("/payments");
}

export async function createPayment(payment: any) {
  return apiCall("/payments", {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export async function deletePayment(id: string) {
  return apiCall(`/payments/${id}`, { method: "DELETE" });
}

export async function createRefund(data: { originalPaymentId: string; amount: number; reason: string; approvedBy: string }) {
  return apiCall("/payments/refund", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPaymentsByCustomer(customerId: string) {
  return apiCall(`/payments/customer/${customerId}`);
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════
export async function getCustomers() {
  return apiCall("/customers");
}

export async function createCustomer(customer: any) {
  return apiCall("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id: string, customer: any) {
  return apiCall(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(id: string) {
  return apiCall(`/customers/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════
export async function getInventory() {
  return apiCall("/inventory");
}

export async function createInventoryItem(item: any) {
  return apiCall("/inventory", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateInventoryItem(id: string, item: any) {
  return apiCall(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export async function deleteInventoryItem(id: string) {
  return apiCall(`/inventory/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
export async function getDashboardData() {
  return apiCall("/dashboard");
}

export async function getDashboardStats() {
  return apiCall("/dashboard/stats");
}

export async function getTechnicianDashboardStats() {
  return apiCall("/technician/dashboard");
}

export async function getHQDashboardData() {
  return apiCall("/reports/hq-summary");
}

// ═══════════════════════════════════════════════════════════════
// CAR IN/OUT
// ═══════════════════════════════════════════════════════════════
export async function getCarInRecords() {
  return apiCall("/carin");
}

export async function createCarIn(carIn: any) {
  return apiCall("/carin", {
    method: "POST",
    body: JSON.stringify(carIn),
  });
}

export async function editCarIn(id: string, carIn: any) {
  return apiCall(`/carin/${id}`, {
    method: "PUT",
    body: JSON.stringify(carIn),
  });
}

export async function updateCarIn(id: string, carIn: any) {
  return apiCall(`/carin/${id}/checkout`, {
    method: "PUT",
    body: JSON.stringify(carIn),
  });
}

export async function deleteCarIn(id: string) {
  return apiCall(`/carin/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// OUT PASS
// ═══════════════════════════════════════════════════════════════
export async function getOutPasses() {
  return apiCall("/outpass");
}

export async function createOutPass(outPass: any) {
  return apiCall("/outpass", {
    method: "POST",
    body: JSON.stringify(outPass),
  });
}

export async function updateOutPass(id: string, outPass: any) {
  return apiCall(`/outpass/${id}`, {
    method: "PUT",
    body: JSON.stringify(outPass),
  });
}

// ═══════════════════════════════════════════════════════════════
// REPORTS (§16)
// ═══════════════════════════════════════════════════════════════
export async function getReports() {
  return apiCall("/reports");
}

export async function getHQSummaryReport() {
  return apiCall("/reports/hq-summary");
}

export async function getCrmReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return apiCall(`/reports/crm/${type}?${params.toString()}`);
}

export async function getCustomerReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return apiCall(`/reports/customer/${type}?${params.toString()}`);
}

export async function getEmployeeReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return apiCall(`/reports/employee/${type}?${params.toString()}`);
}

export async function getFinancialReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return apiCall(`/reports/financial/${type}?${params.toString()}`);
}

export async function getWorkshopReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const q = params.toString();
  return apiCall(`/reports/workshop/${type}${q ? `?${q}` : ""}`);
}

export async function getInventoryReport(type: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const q = params.toString();
  return apiCall(`/reports/inventory/${type}${q ? `?${q}` : ""}`);
}

export async function downloadReportCsv(category: string, type: string, from?: string, to?: string) {
  const params = new URLSearchParams({ type });
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const url = `${API_URL}/reports/${category}/export?${params.toString()}`;
  const res = await fetch(url, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Failed to export CSV");
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${category}_${type}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// ═══════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════
export async function getServices() {
  return apiCall("/services");
}

export async function createService(service: any) {
  return apiCall("/services", {
    method: "POST",
    body: JSON.stringify(service),
  });
}

export async function updateService(id: string, service: any) {
  return apiCall(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(service),
  });
}

export async function deleteService(id: string) {
  return apiCall(`/services/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
export async function getSettings() {
  return apiCall("/settings");
}

export async function updateSettings(settings: any) {
  return apiCall("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}



// ═══════════════════════════════════════════════════════════════
// JOBS
// ═══════════════════════════════════════════════════════════════
export async function getJobs() {
  return apiCall("/jobs");
}

export async function createJob(job: any) {
  return apiCall("/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}

export async function updateJob(id: string, job: any) {
  return apiCall(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
}

export async function deleteJob(id: string) {
  return apiCall(`/jobs/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// FRANCHISE
// ═══════════════════════════════════════════════════════════════
export async function getFranchises() {
  return apiCall("/hq/franchises");
}

export async function createFranchise(franchise: any) {
  return apiCall("/hq/franchises", {
    method: "POST",
    body: JSON.stringify(franchise),
  });
}

export async function updateFranchise(id: string, franchise: any) {
  return apiCall(`/hq/franchises/${id}`, {
    method: "PUT",
    body: JSON.stringify(franchise),
  });
}

export async function deleteFranchise(id: string) {
  return apiCall(`/hq/franchises/${id}`, { method: "DELETE" });
}



// ═══════════════════════════════════════════════════════════════
// VEHICLE LOOKUP
// ═══════════════════════════════════════════════════════════════
export async function fetchVehicleDetails(vehicleNo: string) {
  return apiCall(`/vehicle/${vehicleNo}`);
}

// ═══════════════════════════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════════════════════════
export async function getEmployees() {
  return apiCall("/employees");
}

export async function createEmployee(employee: any) {
  return apiCall("/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
}

export async function updateEmployee(id: string, employee: any) {
  return apiCall(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(employee),
  });
}

export async function deleteEmployee(id: string) {
  return apiCall(`/employees/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════
// TECHNICIAN / SERVICE ADVISOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export async function getTechnicianManagementStats(params?: Record<string, string | number>) {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
  return apiCall(`/technicians/management${query}`);
}

export async function getServiceAdvisorManagementStats(params?: Record<string, string | number>) {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
  return apiCall(`/service-advisors/management${query}`);
}

// ═══════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export async function getAttendance() {
  return apiCall("/attendance");
}

export async function checkIn(employeeId: string) {
  return apiCall("/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ employeeId }),
  });
}

export async function checkOut(employeeId: string) {
  return apiCall("/attendance/check-out", {
    method: "PUT",
    body: JSON.stringify({ employeeId }),
  });
}

export async function updateAttendance(id: string, data: any) {
  return apiCall(`/attendance/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// MEMBER / BRANCH TRANSFERS
// ═══════════════════════════════════════════════════════════════
export async function getMemberTransfers() {
  return apiCall("/member-transfers");
}

export async function approveMemberTransfer(id: string) {
  return apiCall(`/member-transfers/${id}/approve`, {
    method: "POST"
  });
}

export async function rejectMemberTransfer(id: string) {
  return apiCall(`/member-transfers/${id}/reject`, {
    method: "POST"
  });
}

export async function getHQEmployees() {
  return apiCall("/hq-employees");
}

export async function createMemberTransfer(data: any) {
  return apiCall("/member-transfers", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return response.json();
}

export async function updateMemberTransfer(id: string, data: any) {
  return apiCall(`/member-transfers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteMemberTransfer(id: string) {
  return apiCall(`/member-transfers/${id}`, {
    method: "DELETE"
  });
}

export async function getLicenses() {
  return apiCall("/hq/licenses");
}

export async function createLicense(data: any) {
  return apiCall("/hq/licenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function activateLicense(licenseKey: string, franchiseId: string) {
  return apiCall("/hq/licenses/activate", {
    method: "POST",
    body: JSON.stringify({ licenseKey, franchiseId }),
  });
}

export async function getAuditLogs(params?: { search?: string; module?: string; action?: string; branchId?: string }) {
  const query = new URLSearchParams();
  if (params) {
    if (params.search) query.append("search", params.search);
    if (params.module) query.append("module", params.module);
    if (params.action) query.append("action", params.action);
    if (params.branchId) query.append("branchId", params.branchId);
  }
  const queryString = query.toString();
  return apiCall(`/hq/audit-logs${queryString ? `?${queryString}` : ""}`);
}
export async function getFranchiseRequests() {
  return apiCall("/hq/franchise-requests");
}

export async function approveFranchiseRequest(id: string) {
  return apiCall(`/hq/franchise-requests/${id}/approve`, {
    method: "POST"
  });
}

export async function rejectFranchiseRequest(id: string) {
  return apiCall(`/hq/franchise-requests/${id}/reject`, {
    method: "POST"
  });
}

export async function getNotifications() {
  return apiCall("/hq/notifications");
}

export async function markNotificationRead(id: string) {
  return apiCall(`/hq/notifications/${id}/read`, {
    method: "POST"
  });
}

export async function markAllNotificationsRead() {
  return apiCall("/hq/notifications/read-all", {
    method: "POST"
  });
}

export async function broadcastNotification(data: { title: string; message: string; type?: string; link?: string }) {
  return apiCall("/hq/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ═══════════════════════════════════════════════════════════════
// VENDOR MASTER & PURCHASE MANAGEMENT (§Vendor & Purchase Management)
// ═══════════════════════════════════════════════════════════════
export async function getVendors() {
  return apiCall("/hq/vendors");
}

export async function createVendor(data: any) {
  return apiCall("/hq/vendors", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateVendor(id: string, data: any) {
  return apiCall(`/hq/vendors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteVendor(id: string) {
  return apiCall(`/hq/vendors/${id}`, {
    method: "DELETE"
  });
}

export async function getPurchases() {
  return apiCall("/hq/purchases");
}

export async function createPurchase(data: any) {
  return apiCall("/hq/purchases", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function receivePurchaseGoods(id: string) {
  return apiCall(`/hq/purchases/${id}/receive`, {
    method: "POST"
  });
}

export async function invoicePurchaseOrder(id: string, invoiceNumber: string) {
  return apiCall(`/hq/purchases/${id}/invoice`, {
    method: "POST",
    body: JSON.stringify({ invoiceNumber })
  });
}

export async function payPurchaseOrder(id: string, paidAmount: number) {
  return apiCall(`/hq/purchases/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ paidAmount })
  });
}

export async function deletePurchaseOrder(id: string) {
  return apiCall(`/hq/purchases/${id}`, {
    method: "DELETE"
  });
}

// --- WARRANTY MANAGEMENT (§WARRANTY) ---
export interface WarrantyClaimRecord {
  id: string;
  claimDate: string;
  description: string;
  resolution?: string;
  claimedBy?: string;
}

export interface WarrantyRecord {
  id: string;
  warrantyNo?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  vehicleNo: string;
  jobId?: string;
  invoiceId?: string;
  itemName: string;
  durationDays: number;
  startDate: string;
  expiryDate: string;
  status: string; // "Active", "Expired", "Claimed", "Void"
  notes?: string;
  claimsList?: WarrantyClaimRecord[];
  createdAt: string;
}

export async function getWarranties(params?: { customerId?: string; vehicleNo?: string; status?: string; search?: string }): Promise<WarrantyRecord[]> {
  const query = new URLSearchParams();
  if (params) {
    if (params.customerId) query.append("customerId", params.customerId);
    if (params.vehicleNo) query.append("vehicleNo", params.vehicleNo);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
  }
  const queryString = query.toString();
  return apiCall(`/warranties${queryString ? `?${queryString}` : ""}`);
}

export async function getWarrantyById(id: string): Promise<WarrantyRecord> {
  return apiCall(`/warranties/${id}`);
}

export async function createWarranty(data: {
  customerId: string;
  vehicleNo: string;
  jobId?: string;
  invoiceId?: string;
  itemName: string;
  durationDays: number;
  startDate?: string;
  expiryDate?: string;
  status?: string;
  notes?: string;
}): Promise<WarrantyRecord> {
  return apiCall("/warranties", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function generateWarrantyFromInvoice(invoiceId: string): Promise<WarrantyRecord[]> {
  return apiCall(`/warranties/generate-from-invoice/${invoiceId}`, {
    method: "POST",
  });
}

export async function updateWarranty(
  id: string,
  data: {
    itemName?: string;
    durationDays?: number;
    expiryDate?: string;
    status?: string;
    notes?: string;
  }
): Promise<WarrantyRecord> {
  return apiCall(`/warranties/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function addWarrantyClaim(
  id: string,
  data: {
    description: string;
    resolution?: string;
    claimedBy?: string;
    status?: string;
  }
): Promise<WarrantyRecord> {
  return apiCall(`/warranties/${id}/claim`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteWarranty(id: string): Promise<{ success: boolean }> {
  return apiCall(`/warranties/${id}`, {
    method: "DELETE",
  });
}


// ─── MASTERS & CONFIGURATION (§Masters) — HQ Only ────────────────────────────

export const MASTER_CATEGORIES = {
  // Customer Masters
  CUSTOMER_TYPE: { label: "Customer Types", section: "Customer Masters" },
  LEAD_SOURCE: { label: "Lead Sources", section: "Customer Masters" },
  REFERRAL_TYPE: { label: "Referral Types", section: "Customer Masters" },
  // Vehicle Masters
  VEHICLE_BRAND: { label: "Vehicle Brands", section: "Vehicle Masters" },
  VEHICLE_MODEL: { label: "Vehicle Models", section: "Vehicle Masters" },
  FUEL_TYPE: { label: "Fuel Types", section: "Vehicle Masters" },
  COLOUR: { label: "Colours", section: "Vehicle Masters" },
  // Employee Masters
  DEPARTMENT: { label: "Departments", section: "Employee Masters" },
  DESIGNATION: { label: "Designations", section: "Employee Masters" },
  ROLE: { label: "Roles", section: "Employee Masters" },
  // Inventory Masters
  PRODUCT_CATEGORY: { label: "Product Categories", section: "Inventory Masters" },
  UNIT_OF_MEASURE: { label: "Units of Measure", section: "Inventory Masters" },
  BRAND: { label: "Brands", section: "Inventory Masters" },
  // Finance Masters
  GST_RATE: { label: "GST Rates", section: "Finance Masters" },
  PAYMENT_MODE: { label: "Payment Modes", section: "Finance Masters" },
  DISCOUNT_TYPE: { label: "Discount Types", section: "Finance Masters" },
  // System Masters
  NOTIFICATION_TEMPLATE: { label: "Notification Templates", section: "System Masters" },
  NUMBER_SERIES: { label: "Number Series", section: "System Masters" },
  BUSINESS_HOURS: { label: "Business Hours", section: "System Masters" },
  HOLIDAY_CALENDAR: { label: "Holiday Calendar", section: "System Masters" },
} as const;

export type MasterCategory = keyof typeof MASTER_CATEGORIES;

export interface MasterRecord {
  id: string;
  category: string;
  code?: string | null;
  name: string;
  value?: string | null;
  parentId?: string | null;
  sortOrder: number;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMasters(params?: {
  category?: string;
  parentId?: string;
  status?: string;
}): Promise<MasterRecord[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.parentId) query.append("parentId", params.parentId);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString();
  return apiCall(`/hq/masters${qs ? `?${qs}` : ""}`);
}

export async function getMasterCategories(): Promise<string[]> {
  return apiCall("/hq/masters/categories");
}

export async function getMasterById(id: string): Promise<MasterRecord> {
  return apiCall(`/hq/masters/${id}`);
}

export async function createMaster(data: {
  category: string;
  name: string;
  code?: string;
  value?: string;
  parentId?: string;
  sortOrder?: number;
  status?: string;
}): Promise<MasterRecord> {
  return apiCall("/hq/masters", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMaster(
  id: string,
  data: {
    name?: string;
    code?: string;
    value?: string;
    parentId?: string;
    sortOrder?: number;
    status?: string;
  }
): Promise<MasterRecord> {
  return apiCall(`/hq/masters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMaster(id: string): Promise<{ success: boolean; id: string }> {
  return apiCall(`/hq/masters/${id}`, { method: "DELETE" });
}

export async function seedMasters(): Promise<{ success: boolean; created: number; skipped: number; total: number }> {
  return apiCall("/hq/masters/seed", { method: "POST" });
}

// --- INVENTORY REQUESTS & STOCK MOVEMENTS ---
export async function getInventoryRequests() {
  return apiCall("/inventory/requests");
}

export async function createInventoryRequest(data: {
  itemId: string;
  quantityRequested: number;
  requiredDate?: string;
  priority?: string;
  remarks?: string;
}) {
  return apiCall("/inventory/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveInventoryRequest(id: string, data: { status?: string; quantityApproved?: number }) {
  return apiCall(`/inventory/requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function rejectInventoryRequest(id: string) {
  return apiCall(`/inventory/requests/${id}/reject`, {
    method: "POST",
  });
}

export async function dispatchInventoryRequest(id: string) {
  return apiCall(`/inventory/requests/${id}/dispatch`, {
    method: "POST",
  });
}

export async function receiveInventoryRequest(id: string) {
  return apiCall(`/inventory/requests/${id}/receive`, {
    method: "POST",
  });
}

export async function getInventoryMovements(itemId?: string) {
  const query = itemId ? `?itemId=${itemId}` : "";
  return apiCall(`/inventory/movements${query}`);
}


