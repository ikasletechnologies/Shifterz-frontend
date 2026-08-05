"use client";

import React, { useState, useEffect } from "react";
import {
  getWarranties,
  generateWarrantyFromInvoice,
  WarrantyRecord,
} from "@/lib/api";
import CreateWarrantyDialog from "@/modules/warranty/components/CreateWarrantyDialog";
import WarrantyDetailsDialog from "@/modules/warranty/components/WarrantyDetailsDialog";
import { X } from "lucide-react";

export default function WarrantyManagementPage() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Invoice generate modal/prompt state
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceIdInput, setInvoiceIdInput] = useState("");
  const [invoiceGenError, setInvoiceGenError] = useState<string | null>(null);

  useEffect(() => {
    loadWarranties();
  }, [statusFilter]);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const data = await getWarranties({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setWarranties(data || []);
    } catch (err) {
      console.error("Failed to load warranties:", err);
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWarranties();
  };

  const handleGenerateFromInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceIdInput.trim()) {
      setInvoiceGenError("Please enter an Invoice Number or ID (e.g., STZ-25-26-0001).");
      return;
    }
    setIsGeneratingInvoice(true);
    setInvoiceGenError(null);
    try {
      const created = await generateWarrantyFromInvoice(invoiceIdInput.trim());
      setIsGeneratingInvoice(false);
      setInvoiceIdInput("");
      loadWarranties();
      if (!created || created.length === 0) {
        alert("No warranty items found on that Invoice.");
      } else {
        alert(`Successfully generated ${created.length} warranty record(s) from Invoice!`);
      }
    } catch (err: any) {
      setInvoiceGenError(err.message || "Failed to generate warranty from invoice.");
      setIsGeneratingInvoice(false);
    }
  };

  // KPI calculations
  const totalCount = warranties.length;
  const activeCount = warranties.filter(
    (w) =>
      w.status === "Active" &&
      new Date(w.expiryDate).getTime() >= new Date().getTime()
  ).length;
  const expiredCount = warranties.filter(
    (w) =>
      w.status === "Expired" ||
      new Date(w.expiryDate).getTime() < new Date().getTime()
  ).length;
  const claimedCount = warranties.filter((w) => w.status === "Claimed").length;

  const getStatusBadge = (s: string, expiryDate: string) => {
    const isExpired =
      s === "Expired" || new Date(expiryDate).getTime() < new Date().getTime();

    if (s === "Active" && !isExpired) {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
          Active
        </span>
      );
    }
    if (s === "Expired" || isExpired) {
      return (
        <span className="px-3 py-1 bg-slate-500/20 border border-slate-500/30 text-slate-400 text-xs font-semibold rounded-full">
          Expired (Read-Only)
        </span>
      );
    }
    if (s === "Claimed") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
          Claimed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-full">
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Warranty Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track warranties issued for services performed, validate coverage, monitor expiry dates, and manage customer claims (§Warranty Management).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <span>+ Issue New Warranty</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Total Warranties
          </span>
          <span className="text-2xl font-bold text-white mt-2 block">
            {totalCount}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider block">
            Active Coverage
          </span>
          <span className="text-2xl font-bold text-emerald-400 mt-2 block">
            {activeCount}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Expired (Read-Only)
          </span>
          <span className="text-2xl font-bold text-slate-300 mt-2 block">
            {expiredCount}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wider block">
            Claims Processed
          </span>
          <span className="text-2xl font-bold text-purple-400 mt-2 block">
            {claimedCount}
          </span>
        </div>
      </div>

      {/* Generate From Invoice Box (§Warranty PRD Rule 1) */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
            STZ
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Auto-Generate Warranty from Completed Invoice
            </h4>
            <p className="text-xs text-slate-400">
              PRD Rule 1: Extract covered services and standard durations directly from billing invoices.
            </p>
          </div>
        </div>
        <form onSubmit={handleGenerateFromInvoice} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={invoiceIdInput}
            onChange={(e) => setInvoiceIdInput(e.target.value)}
            placeholder="e.g. STZ-25-26-0001"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 uppercase w-full sm:w-48"
          />
          <button
            type="submit"
            disabled={isGeneratingInvoice}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-sm font-medium rounded-xl border border-slate-700 whitespace-nowrap transition-colors"
          >
            {isGeneratingInvoice ? "Generating..." : "Generate from Invoice"}
          </button>
        </form>
      </div>
      {invoiceGenError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {invoiceGenError}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", "Active", "Expired", "Claimed", "Void"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, vehicle, warranty no..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={async () => {
                  setSearchQuery("");
                  setLoading(true);
                  try {
                    const data = await getWarranties({
                      status: statusFilter === "ALL" ? undefined : statusFilter,
                      search: undefined,
                    });
                    setWarranties(data || []);
                  } catch (err) {
                    console.error("Failed to load warranties:", err);
                    setWarranties([]);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl border border-slate-700 transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading warranty records...
          </div>
        ) : warranties.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
              🛡️
            </div>
            <p className="text-white font-medium text-sm">No warranty records found</p>
            <p className="text-slate-400 text-xs">
              Issue a warranty manually or generate from a completed invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Warranty No</th>
                  <th className="py-4 px-6">Customer & Vehicle</th>
                  <th className="py-4 px-6">Covered Service</th>
                  <th className="py-4 px-6">Duration & Expiry</th>
                  <th className="py-4 px-6">Claims</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {warranties.map((w) => {
                  const isExpired =
                    w.status === "Expired" ||
                    new Date(w.expiryDate).getTime() < new Date().getTime();

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-4 px-6 font-semibold text-amber-400">
                        {w.warrantyNo || "WR-REF"}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-white">
                          {w.customer?.name || w.customerId}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{w.customer?.phone}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded font-semibold text-[10px]">
                            {w.vehicleNo}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-200 font-medium">
                        {w.itemName}
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-white text-xs font-medium">
                          Expires: {new Date(w.expiryDate).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {w.durationDays} Days Total
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold">
                          {w.claimsList?.length || 0} Claims
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {getStatusBadge(w.status, w.expiryDate)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedWarranty(w);
                            setIsDetailsOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                        >
                          View & Claims
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateWarrantyDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadWarranties}
      />

      {/* Details & Claims Modal */}
      <WarrantyDetailsDialog
        warranty={selectedWarranty}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedWarranty(null);
        }}
        onUpdate={loadWarranties}
      />
    </div>
  );
}
