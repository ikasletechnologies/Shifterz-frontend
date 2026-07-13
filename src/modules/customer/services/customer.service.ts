import { apiCall } from "./api.client";
import { Customer } from "@/types/customer";

export async function getCustomers(): Promise<Customer[]> {
  return apiCall("/customers");
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  return apiCall("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return apiCall(`/customers/${id}`, { method: "DELETE" });
}
