"use client";

import { useState, useEffect } from "react";
import { Customer } from "@/modules/customer/types/customer.types";
import { getCustomers, createCustomer, deleteCustomer } from "@/modules/customer/services/customer.service";
import toast from "react-hot-toast";

export function useCustomer() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
      setError("");
    } catch (err: any) {
      setError("Failed to load customers: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (newCustomer: Partial<Customer>) => {
    try {
      const created = await createCustomer(newCustomer);
      setCustomers([...customers, created]);
      toast.success("Customer created successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to create customer: " + err.message);
      console.error(err);
      return false;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success("Customer deleted successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to delete customer: " + err.message);
      console.error(err);
      return false;
    }
  };

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    handleAddCustomer,
    handleDeleteCustomer
  };
}
