"use client";
import { useState } from "react";
import { Plus, Trash2, Search, Download, X, Pencil, Car, User, Phone, Mail, Wrench, History, IndianRupee, Calendar } from "lucide-react";
import AddCustomerDialog from "../components/AddCustomerDialog";
import EditCustomerDialog from "../components/EditCustomerDialog";
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
      await updateCustomer(customerToEdit.id, data);
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
    const totalSpend  = filteredCustomers.reduce((s, c) => s + (c.totalSpend || 0), 0);
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
        c.model || "—",
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
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Period Filter Buttons */}
            <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
              {["All", "Today", "Yesterday", "Custom"].map((period) => {
                const isCustom = period === "Custom";
                return (
                  <div key={period} className="relative">
                    <button
                      onClick={() => setPeriodFilter(period)}
                      className={`text-sm px-3 py-1 rounded-md transition-colors ${periodFilter === period
                        ? 'bg-white text-gray-900 font-bold shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 font-medium'
                        }`}
                    >
                      {period}
                    </button>
                    {isCustom && periodFilter === "Custom" && (
                      <div className="absolute bottom-full right-0 mb-3 z-50 flex items-center gap-2 border border-gray-200 bg-white p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap min-w-[260px]">
                        <div className="flex flex-col gap-1.5 w-full">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">Date Range</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5">
                              <input
                                type="date"
                                value={customFromDate}
                                max={getTodayISO()}
                                onChange={handleCustomFromDateChange}
                                className="bg-transparent border-none text-[10px] text-gray-700 outline-none w-[90px]"
                              />
                              <button
                                type="button"
                                disabled={!customFromDate}
                                onClick={() => setCustomFromDate("")}
                                className={`p-0.5 rounded flex items-center justify-center shrink-0 ${
                                  customFromDate
                                    ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                    : "text-gray-200 cursor-not-allowed"
                                }`}
                                title="Clear From Date"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400">to</span>
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5">
                              <input
                                type="date"
                                value={customToDate}
                                max={getTodayISO()}
                                onChange={handleCustomToDateChange}
                                className="bg-transparent border-none text-[10px] text-gray-700 outline-none w-[90px]"
                              />
                              <button
                                type="button"
                                disabled={!customToDate}
                                onClick={() => setCustomToDate("")}
                                className={`p-0.5 rounded flex items-center justify-center shrink-0 ${
                                  customToDate
                                    ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                    : "text-gray-200 cursor-not-allowed"
                                }`}
                                title="Clear To Date"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-full right-6 -mt-1 w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Download Button */}
            <button
              onClick={downloadPDF}
              className="p-2.5 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 transition-colors shadow-sm bg-gray-50"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4 text-black" />
            </button>

            <button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-3" />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500">Try adjusting your search or date filters, or create a new customer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Customer ID (Left) & Plain Edit/Delete Icons (Right) */}
                <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 tracking-tight font-mono truncate" style={{ color: "#F0B100" }}>
                    {customer.id}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit Customer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDelete(customer)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid: Clean Two-Column Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  {/* Left Column */}
                  <div className="space-y-2.5">
                    {/* Vehicle */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Vehicle</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-slate-900 uppercase font-mono tracking-wider truncate ml-2">
                        {customer.vehicle || "—"}
                      </p>
                    </div>

                    {/* Name */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Name</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate ml-2">
                        {customer.name || "—"}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Phone</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-blue-600 font-mono tracking-wider truncate ml-2">
                        {customer.phone || "—"}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Email</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-medium text-slate-700 truncate ml-2">
                        {customer.email || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2.5">
                    {/* Car Model */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Car Model</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate ml-2">
                        {customer.model || "—"}
                      </p>
                    </div>

                    {/* Visits */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Visits</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <div className="ml-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">
                          {customer.visits ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Total Spend */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Total Spend</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-yellow-600 ml-2">
                        ₹{customer.totalSpend?.toLocaleString("en-IN") || 0}
                      </p>
                    </div>

                    {/* Last Visit */}
                    <div className="flex items-center text-xs min-h-[24px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium w-[95px] shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Last Visit</span>
                        <span className="ml-auto text-slate-400 font-normal">:</span>
                      </div>
                      <p className="font-bold text-slate-900 ml-2">
                        {customer.lastVisit
                          ? (() => {
                              const d = new Date(customer.lastVisit);
                              return isNaN(d.getTime()) ? customer.lastVisit : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                            })()
                          : "—"}
                      </p>
                    </div>
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
