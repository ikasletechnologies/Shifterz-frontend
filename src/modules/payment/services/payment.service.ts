import { apiCall } from "./api.client";

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
