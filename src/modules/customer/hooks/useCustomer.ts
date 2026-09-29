"use client";

import { useState, useEffect, useCallback } from "react";
import { getScopedFranchiseId, scopeToFranchise } from "@/lib/franchise-scope";
import { Customer } from "@/modules/customer/types/customer.types";
import { getCustomers, createCustomer, deleteCustomer } from "@/modules/customer/services/customer.service";
import toast from "react-hot-toast";

export function useCustomer(selectedFranchiseId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const scopedId = getScopedFranchiseId();
      const franchiseId = scopedId || (selectedFranchiseId && selectedFranchiseId !== "All" ? selectedFranchiseId : undefined);
      const data = await getCustomers(franchiseId);
      setCustomers(scopeToFranchise(data || []));
      setError("");
    } catch (err: any) {
      setError("Failed to load customers: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFranchiseId]);

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
