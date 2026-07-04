"use client";

import { useState, useEffect } from "react";
import {
  Users, UserPlus, UserCheck, Calendar,
  Car, Wrench, CheckCircle, Search,
  DollarSign, CreditCard, Receipt, FileText,
  User, Clock, CheckSquare, Percent,
  Package, AlertTriangle, List
} from "lucide-react";
import { getDashboardData } from "@/lib/api";
import { StatCard } from "./StatCard";

export function FranchiseDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) { }
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await getDashboardData();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading franchise dashboard data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const { crm, workshop, financial, hr, inventory } = data || {};

  return (
    <div className="space-y-10">

      {/* 1. CRM Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Customer Relationship (CRM)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Today's Appointments" value={crm?.appointmentsToday || 0} icon={Calendar} color="blue" />
          <StatCard title="Leads Today" value={crm?.leadsToday || 0} icon={Users} color="blue" />
          <StatCard title="New Customers" value={crm?.newCustomers || 0} icon={UserPlus} color="green" />
          <StatCard title="Returning Customers" value={crm?.returningCustomers || 0} icon={UserCheck} color="purple" />
        </div>

        {/* Newly Registered Customers Table */}
        {crm?.newCustomersList && crm.newCustomersList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                Newly Registered Customers
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/30">
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">Vehicle No</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">Model</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase tracking-wider">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {crm.newCustomersList.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-yellow-600">{customer.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                      <td className="px-4 py-3 text-gray-600 uppercase font-medium">{customer.vehicle}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.model}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 2. Workshop Operations Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-orange-600" />
          Workshop Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Vehicles Received" value={workshop?.carsReceivedToday || 0} icon={Car} color="orange" />
          <StatCard title="Vehicles in Progress" value={workshop?.vehiclesInProgress || 0} icon={Wrench} color="orange" />
          <StatCard title="Pending QC" value={workshop?.pendingQC || 0} icon={Search} color="yellow" />
          <StatCard title="Ready for Delivery" value={workshop?.vehiclesReady || 0} icon={CheckCircle} color="green" />
        </div>
      </section>

      {/* 3. Financials Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Financials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Revenue Today" value={`₹${(financial?.revenueToday || 0).toLocaleString("en-IN")}`} icon={DollarSign} color="green" />
          <StatCard title="Revenue This Month" value={`₹${(financial?.revenueThisMonth || 0).toLocaleString("en-IN")}`} icon={Receipt} color="green" />
          <StatCard title="Outstanding Payments" value={`₹${(financial?.outstandingPayments || 0).toLocaleString("en-IN")}`} icon={CreditCard} color="red" />
          <StatCard title="Pending Invoices" value={financial?.pendingInvoicesCount || 0} icon={FileText} color="yellow" />
        </div>
      </section>

      {/* 4. HR & Employee Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Employees & Productivity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Present Today" value={hr?.presentToday || 0} icon={UserCheck} color="green" />
          <StatCard title="Absent Today" value={hr?.absentToday || 0} icon={Clock} color="red" />
          <StatCard title="Jobs Assigned" value={hr?.jobsAssigned || 0} icon={List} color="blue" />
          <StatCard title="Jobs Completed" value={hr?.jobsCompleted || 0} icon={CheckSquare} color="green" />
          <StatCard title="Productivity" value={`${hr?.productivity || 0}%`} icon={Percent} color="purple" />
        </div>
      </section>

      {/* 5. Inventory Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-700" />
          Inventory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Available Stock (Units)" value={inventory?.availableStock || 0} icon={Package} color="gray" />
          <StatCard title="Low Stock Items" value={inventory?.lowStockItems || 0} icon={AlertTriangle} color="red" />
          <StatCard title="Pending Stock Requests" value={inventory?.pendingStockRequests || 0} icon={Clock} color="orange" />
        </div>
      </section>
    </div>
  );
}
