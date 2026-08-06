"use client";
import { useState } from "react";
import { Plus, FileText, Trash2, Search, Download, X, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import AddCustomerDialog from "../components/AddCustomerDialog";
import EditCustomerDialog from "../components/EditCustomerDialog";
import { useCustomer } from "@/modules/customer/hooks/useCustomer";
import { Customer } from "@/modules/customer/types/customer.types";
import { updateCustomer } from "@/lib/api";
import { toast } from "react-hot-toast";

export function CustomerPage() {
  const router = useRouter();
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

  const handleViewBilling = (customerId: string, customerName: string) => {
    router.push(`/dashboard/billing?customer=${customerId}&name=${customerName}`);
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
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={customFromDate}
                              onChange={(e) => setCustomFromDate(e.target.value)}
                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 outline-none focus:border-yellow-400 w-[110px]"
                              placeholder="From"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                              type="date"
                              value={customToDate}
                              onChange={(e) => setCustomToDate(e.target.value)}
                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 outline-none focus:border-yellow-400 w-[110px]"
                              placeholder="To"
                            />
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
                    ₹{customer.totalSpend?.toLocaleString("en-IN") || 0}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {customer.lastVisit
                      ? (() => {
                          const d = new Date(customer.lastVisit);
                          return isNaN(d.getTime()) ? customer.lastVisit : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                        })()
                      : "—"}
                  </td>
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
                        onClick={() => handleEditCustomer(customer)}
                        className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-md border border-blue-100 transition-colors shadow-sm"
                        title="Edit Customer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
