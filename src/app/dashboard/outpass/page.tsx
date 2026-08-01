"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Printer,
  Edit2,
  Search,
  X,
  Car,
  Calendar,
  Clock,
  Phone,
  LayoutGrid,
  List,
  Download,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";
import PrintPassDialog from "@/components/outpass/PrintPassDialog";
import { getOutPasses, createOutPass, updateOutPass } from "@/lib/api";
import { toast } from "react-hot-toast";

interface OutPass {
  id: string;
  passId?: string;
  vehicle: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  outTime: string;
  technician?: string;
  technicianName?: string;
  security?: string;
  securityName?: string;
}

export default function OutPassPage() {
  const router = useRouter();
  const [outPasses, setOutPasses] = useState<OutPass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<OutPass | null>(null);
  const [editingPass, setEditingPass] = useState<OutPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const fetchOutPasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOutPasses();
      setOutPasses(data || []);
    } catch (err: any) {
      setError("Failed to load outpasses: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutPasses();
  }, [fetchOutPasses]);

  const handleSave = async (data: any) => {
    try {
      if (editingPass) {
        await updateOutPass(editingPass.id, data);
      } else {
        await createOutPass(data);
      }
      await fetchOutPasses();
      setIsDialogOpen(false);
      setEditingPass(null);
    } catch (err) {
      console.error("Failed to save out pass:", err);
      alert("Failed to save out pass.");
    }
  };

  const handlePrintClick = (pass: OutPass) => {
    setSelectedPass(pass);
    setIsPrintOpen(true);
  };

  const filteredOutPasses = outPasses.filter((pass) => {
    const searchMatch =
      !searchQuery ||
      (pass.passId || pass.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.vehicle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.customer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.phone || "").includes(searchQuery);

    let dateMatch = true;
    if (pass.outTime) {
      const passDate = new Date(pass.outTime);
      if (!isNaN(passDate.getTime())) {
        if (fromDate) {
          const start = new Date(fromDate + "T00:00:00");
          if (passDate < start) dateMatch = false;
        }
        if (toDate) {
          const end = new Date(toDate + "T23:59:59.999");
          if (passDate > end) dateMatch = false;
        }
      }
    }

    return searchMatch && dateMatch;
  });

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTimeStr = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading out passes...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Toolbar: Search -> From Date -> To Date -> Download -> Vehicle Check-In -> Vehicle Check-Out -> View Switcher */}
      <div className="mb-6 flex flex-nowrap items-center gap-2.5 border-b border-gray-200 pb-4 w-full">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search out passes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. From Date Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
          />
          {fromDate && (
            <button onClick={() => setFromDate("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. To Date Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
          />
          {toDate && (
            <button onClick={() => setToDate("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4. Download Button */}
        <button
          onClick={() => toast.success("Out Pass report ready for print/download")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm shrink-0 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download
        </button>

        {/* 5. Vehicle Check-In Button */}
        <button
          onClick={() => router.push("/dashboard/carin")}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Vehicle Check-In
        </button>

        {/* 6. Vehicle Check-Out Button (New Out Pass) */}
        <button
          onClick={() => { setEditingPass(null); setIsDialogOpen(true); }}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm shrink-0 whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          Vehicle Check-Out
        </button>
      </div>

      {/* Main Display Area (Cards / Table) */}
      {viewMode === "cards" ? (
        <div className="space-y-6">
          {filteredOutPasses.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm">
              No out passes registered.
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOutPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className="bg-red-50/20 border border-red-200 hover:border-red-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-gray-900 tracking-tight">
                              {pass.vehicle || "—"}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              {pass.model || "—"}
                            </p>
                          </div>
                        </div>
                        <span className="bg-red-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-2xs">
                          Delivered
                        </span>
                      </div>

                      <div className="border-t border-red-100/70 my-3" />

                      {/* Card Body Details (Matching Delivered Layout) */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Pass ID</p>
                          <p className="font-bold text-amber-500 font-mono mt-0.5">{pass.passId || pass.id}</p>
                          <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Customer</p>
                          <p className="font-bold text-gray-900 mt-0.5">{pass.customer || "—"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Service</p>
                          <p className="font-bold text-gray-900 mt-0.5">{pass.service || "—"}</p>
                          <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Mobile</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {pass.phone || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Check-Out Date</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDateStr(pass.outTime)}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Check-Out Time</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTimeStr(pass.outTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Out Pass Register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Pass ID</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Vehicle</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Model</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Service</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Out Time</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Technician</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Security</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOutPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>{pass.passId || pass.id}</td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{pass.vehicle}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.model}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="font-bold text-gray-900">{pass.customer}</div>
                      <div className="text-[10px] font-medium text-gray-700">{pass.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.service}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">
                      {pass.outTime ? new Date(pass.outTime).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.technicianName || pass.technician}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.securityName || pass.security}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintClick(pass)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-2 py-1 rounded text-[10px] transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                        <button
                          onClick={() => { setEditingPass(pass); setIsDialogOpen(true); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewOutPassDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPass(null);
        }}
        onSubmit={handleSave}
        initialData={editingPass}
      />
      <PrintPassDialog
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        pass={selectedPass ? {
          ...selectedPass,
          passId: selectedPass.passId || selectedPass.id,
          technician: selectedPass.technicianName || selectedPass.technician || "",
          security: selectedPass.securityName || selectedPass.security || "",
        } : undefined}
      />
    </div>
  );
}

