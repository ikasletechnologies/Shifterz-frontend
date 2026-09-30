"use client";

import React, { useMemo, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Car,
  Calendar,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Customer } from "../types/customer.types";

interface CustomerTabsProps {
  customers: Customer[];
  onOpenCheckIn: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerTabs({
  customers,
  onOpenCheckIn,
  onEdit,
  onDelete,
}: CustomerTabsProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Recent" | "Repeat">("All");

  const repeatCustomers = useMemo(
    () => customers.filter((c) => (c.visits || 0) > 1),
    [customers]
  );

  const recentCustomers = useMemo(
    () => customers.filter((c) => Boolean(c.lastVisit)),
    [customers]
  );

  const displayedCustomers = useMemo(() => {
    if (activeTab === "Repeat") return repeatCustomers;
    if (activeTab === "Recent") return recentCustomers;
    return customers;
  }, [activeTab, customers, repeatCustomers, recentCustomers]);

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No customers found</p>
        <p className="text-xs text-slate-400 mt-1">Customer profiles are created during vehicle check-in or when added manually.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("All")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Customers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{customers.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Recent")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Recent"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>With Visits</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{recentCustomers.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Repeat")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Repeat"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Repeat Customers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{repeatCustomers.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No customers in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedCustomers.map((customer) => {
            const vehicleNo = customer.vehicle || "—";
            const model = customer.model || customer.carModel || "";

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: ID + Visits Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {customer.id}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {customer.visits ? `${customer.visits} ${customer.visits === 1 ? "visit" : "visits"}` : "1 visit"}
                    </span>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <h4 className="font-bold text-base text-gray-900 truncate" title={customer.name}>
                      {customer.name || "Unnamed Customer"}
                    </h4>

                    {/* Contact Details */}
                    <div className="space-y-1 pt-1.5 text-xs">
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-gray-500 truncate" title={customer.email}>
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        {vehicleNo}
                      </span>
                      {model && (
                        <span className="text-xs text-gray-600 font-medium truncate" title={model}>
                          {model}
                        </span>
                      )}
                    </div>

                    {customer.address && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate pt-0.5" title={customer.address}>
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Service & Visit Stats */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      Last Visit:
                    </span>
                    <strong className="text-gray-700 font-medium">
                      {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </strong>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <button
                    type="button"
                    onClick={() => onOpenCheckIn(customer)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Convert to Car Check-In"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Check-In</span>
                  </button>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(customer)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Customer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(customer)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomerTabs;
