"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { Plus, FileText, Trash2, Search } from "lucide-react";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";
import { getCustomers, createCustomer, deleteCustomer } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  model: string;
  visits: number;
  totalSpend: number;
  lastVisit: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
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
    }
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (newCustomer: any) => {
    try {
      const created = await createCustomer(newCustomer);
      setCustomers([...customers, created]);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert("Failed to create customer: " + err.message);
      console.error(err);
    }
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const executeDelete = () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    deleteCustomer(customerToDelete.id)
      .then(() => {
        setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
        setCustomerToDelete(null);
      })
      .catch((err: any) => {
        alert("Failed to delete customer: " + err.message);
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const handleViewBilling = (customerId: string, customerName: string) => {
    router.push(`/dashboard/billing?customer=${customerId}&name=${customerName}`);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.vehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Loading customers...</div>;

  return (
    <div className="p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm"
          />
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-3" />
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">ID</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Car Model</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Visits</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Total Spend</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Last Visit</th>
                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-3 text-xs font-mono font-bold whitespace-nowrap" style={{ color: "#F0B100" }}>{customer.id}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {customer.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-semibold text-gray-900">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{customer.phone}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{customer.email}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs font-medium whitespace-nowrap">{customer.vehicle}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{customer.model}</td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">
                      {customer.visits}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-yellow-600 text-xs whitespace-nowrap">
                    ₹{customer.totalSpend.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{customer.lastVisit}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewBilling(customer.id, customer.name)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-colors shadow-sm"
                        title="View Billing"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(customer)}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-md border border-red-100 transition-colors shadow-sm"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <AddCustomerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddCustomer}
        existingCustomers={customers}
      />

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Customer</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{customerToDelete.name}</span> (ID: <span className="font-mono font-semibold text-yellow-600">{customerToDelete.id}</span>, Vehicle: <span className="font-semibold text-gray-700">{customerToDelete.vehicle || 'N/A'}</span>)? This action will remove them from the list.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCustomerToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
