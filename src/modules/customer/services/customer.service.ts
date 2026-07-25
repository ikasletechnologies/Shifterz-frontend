import { apiCall } from "@/services/api.client";
import { Customer } from "@/modules/customer/types/customer.types";

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
