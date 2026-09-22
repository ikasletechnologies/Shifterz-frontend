"use client";
import { useState } from "react";
import { Plus, Trash2, Search, Download, X, Pencil, Car, User, Phone, Mail, Wrench } from "lucide-react";
import AddCustomerDialog from "../components/AddCustomerDialog";
import EditCustomerDialog from "../components/EditCustomerDialog";
import VehicleCheckInDialog from "@/modules/vehicle-checkin/components/VehicleCheckInDialog";
import { createVehicleCheckIn } from "@/modules/vehicle-checkin/services/vehicle-checkin.service";
import { useCustomer } from "@/modules/customer/hooks/useCustomer";
import { Customer } from "@/modules/customer/types/customer.types";
import { updateCustomer } from "@/lib/api";
import { toast } from "react-hot-toast";

export function CustomerPage() {
  const { customers, isLoading, error, handleAddCustomer, handleDeleteCustomer, fetchCustomers } = useCustomer();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("All");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [customerToCheckIn, setCustomerToCheckIn] = useState<Customer | null>(null);

  const handleOpenCheckIn = (customer: Customer) => {
    setCustomerToCheckIn(customer);
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = async (carData: any) => {
    try {
      await createVehicleCheckIn(carData);
      toast.success("Car checked in successfully!");
      setIsCheckInOpen(false);
      setCustomerToCheckIn(null);
    } catch (err: any) {
      toast.error("Failed to check in car: " + (err.message || "Unknown error"));
    }
  };

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleCustomFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomFromDate(today);
      return;
    }
    setCustomFromDate(selected);
  };

  const handleCustomToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomToDate(today);
      return;
    }
    setCustomToDate(selected);
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const executeDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    await handleDeleteCustomer(customerToDelete.id);
    setCustomerToDelete(null);
    setIsDeleting(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsEditOpen(true);
  };

  const handleUpdateCustomer = async (data: any) => {
    if (!customerToEdit) return;
    try {
      const payload: Record<string, any> = {
        name: data.name,
        phone: data.phone,
        vehicle: data.vehicle,
        model: data.model || data.carModel,
      };
      if (data.email) {
        payload.email = data.email;
      }
      await updateCustomer(customerToEdit.id, payload);
      toast.success("Customer updated successfully");
      fetchCustomers();
      setIsEditOpen(false);
      setCustomerToEdit(null);
    } catch (err: any) {
      toast.error("Failed to update customer: " + err.message);
    }
  };

  const filterByPeriod = (customerDateStr: string, period: string) => {
    if (period === "All") return true;
    if (!customerDateStr) return false;

    const customerDate = new Date(customerDateStr);
    if (isNaN(customerDate.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(customerDate.getFullYear(), customerDate.getMonth(), customerDate.getDate());

    switch (period) {
      case "Today":
        return checkDate.getTime() === today.getTime();
      case "Yesterday":
        return checkDate.getTime() === yesterday.getTime();
      case "Custom": {
        if (!customFromDate && !customToDate) return true;

        let start = null;
        if (customFromDate) {
          const fromParts = customFromDate.split("-");
          if (fromParts.length === 3) {
            start = new Date(parseInt(fromParts[0], 10), parseInt(fromParts[1], 10) - 1, parseInt(fromParts[2], 10));
          }
        }

        let end = null;
        if (customToDate) {
          const toParts = customToDate.split("-");
          if (toParts.length === 3) {
            end = new Date(parseInt(toParts[0], 10), parseInt(toParts[1], 10) - 1, parseInt(toParts[2], 10));
          }
        }

        if (start && end) {
          return checkDate >= start && checkDate <= end;
        } else if (start) {
          return checkDate >= start;
        } else if (end) {
          return checkDate <= end;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      (customer.vehicle && customer.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPeriod = filterByPeriod(customer.lastVisit, periodFilter);
    return matchesSearch && matchesPeriod;
  }).sort((a, b) => {
    const dateA = new Date(a.lastVisit).getTime();
    const dateB = new Date(b.lastVisit).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return b.id.localeCompare(a.id);
  });

  const downloadPDF = async () => {
    try {
      await downloadPDFInner();
    } catch (err: any) {
      console.error("Failed to generate customer report PDF:", err);
      toast.error("Failed to generate PDF: " + (err.message || "Unknown error"));
    }
  };

  const downloadPDFInner = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.setFillColor(240, 177, 0); // Shifterz yellow
    doc.rect(0, 0, 297, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("Shifterz – Customer Report", 14, 14);

    // Generated date (right-aligned)
    const generated = `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(generated, 297 - 14, 14, { align: "right" });

    // Filter label
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const filterLabel = periodFilter === "Custom"
      ? `Period: ${customFromDate || "—"} to ${customToDate || "—"}`
      : `Period: ${periodFilter}`;
    doc.text(filterLabel, 14, 29);

    // Summary stats
    const totalVisits = filteredCustomers.reduce((s, c) => s + (c.visits || 0), 0);
    const totalSpend = filteredCustomers.reduce((s, c) => s + (c.totalSpend || 0), 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `Total Customers: ${filteredCustomers.length}   |   Total Visits: ${totalVisits}   |   Total Revenue: ₹${totalSpend.toLocaleString("en-IN")}`,
      14, 35
    );

    // ── Table ────────────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: 40,
      head: [["ID", "Name", "Phone", "Email", "Vehicle", "Car Model", "Visits", "Total Spend", "Last Visit"]],
      body: filteredCustomers.map((c) => [
        c.id,
        c.name,
        c.phone,
        c.email || "—",
        c.vehicle || "—",
        c.model || c.carModel || "—",
        c.visits ?? 0,
        `₹${(c.totalSpend || 0).toLocaleString("en-IN")}`,
        c.lastVisit || "—",
      ]),
      headStyles: {
        fillColor: [240, 177, 0],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 28 },
        6: { halign: "center" },
        7: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: "linebreak", cellPadding: 2.5 },
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 297 - 14, 207, { align: "right" });
      doc.text("Shifterz ERP – Confidential", 14, 207);
    }

    doc.save(`customers_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) return <div className="p-8">Loading customers...</div>;

  return (
    <div className="p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills + Download + Add */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pill tabs */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {["All", "Today", "Yesterday", "Custom"].map((period) => (
              <div key={period} className="relative">
                <button
                  onClick={() => setPeriodFilter(period)}
                  className={`text-sm px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${periodFilter === period
                      ? "bg-white text-gray-900 font-semibold shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  {period}
                </button>

                {/* Custom date dropdown */}
                {period === "Custom" && periodFilter === "Custom" && (
                  <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-800">Custom Date Range</span>
                      {(customFromDate || customToDate) && (
                        <button
                          type="button"
                          onClick={() => { setCustomFromDate(""); setCustomToDate(""); }}
                          className="text-[11px] font-semibold text-yellow-600 hover:text-yellow-700 hover:underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-yellow-400">
                          <input
                            type="date"
                            value={customFromDate}
                            max={getTodayISO()}
                            onChange={handleCustomFromDateChange}
                            className="bg-transparent border-none text-xs text-gray-800 outline-none w-full"
                          />
                          {customFromDate && (
                            <button type="button" onClick={() => setCustomFromDate("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-yellow-400">
                          <input
                            type="date"
                            value={customToDate}
                            max={getTodayISO()}
                            onChange={handleCustomToDateChange}
                            className="bg-transparent border-none text-xs text-gray-800 outline-none w-full"
                          />
                          {customToDate && (
                            <button type="button" onClick={() => setCustomToDate("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Download icon */}
          <button
            onClick={downloadPDF}
            className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white transition-colors shadow-sm"
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-gray-700" />
          </button>

          {/* Add Customer */}
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No customers found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between"
            >
              <div>
                {/* Header: Customer ID & Actions */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200/80">
                    {customer.id}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenCheckIn(customer)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-md transition-all cursor-pointer shadow-sm mr-1"
                      title="Convert to Car Check-In"
                    >
                      <Car className="w-3 h-3 text-slate-500" />
                      <span>Convert to Check-In</span>
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Customer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(customer)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {customer.name?.slice(0, 2).toUpperCase() || "CU"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {customer.name || "—"}
                      </h4>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{customer.model || customer.carModel || "—"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Vehicle & Contact details */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                        {customer.vehicle || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-semibold text-slate-800">{customer.phone || "—"}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddCustomerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={async (newCustomer) => {
          const success = await handleAddCustomer(newCustomer);
          if (success) setIsDialogOpen(false);
        }}
        existingCustomers={customers}
      />

      <EditCustomerDialog
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setCustomerToEdit(null); }}
        onSubmit={handleUpdateCustomer}
        customer={customerToEdit}
        existingCustomers={customers}
      />

      <VehicleCheckInDialog
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCustomerToCheckIn(null);
        }}
        onSubmit={handleCheckInSubmit}
        initialData={customerToCheckIn}
        isPrefillOnly
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
