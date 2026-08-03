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
          if (finalOptions.method.toUpperCase() === "POST" && !bodyObj.createdBy) {
            bodyObj.createdBy = user.name || user.username;
          }
          if (finalOptions.method.toUpperCase() === "PUT" && !bodyObj.modifiedBy) {
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
    throw new Error(error.error || `API Error: ${response.statusText}`);
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
  return apiCall("/hq/dashboard");
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
// REPORTS
// ═══════════════════════════════════════════════════════════════
export async function getReports() {
  return apiCall("/reports");
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

