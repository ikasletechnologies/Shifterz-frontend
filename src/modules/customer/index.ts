// Public API for customer module
export { CustomerPage } from "./page/CustomerPage";
export { useCustomer } from "./hooks/useCustomer";
export { getCustomers, createCustomer, deleteCustomer } from "./services/customer.service";
export type { Customer } from "./types/customer.types";
