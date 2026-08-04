"use client";

import React, { useState } from "react";
import { WarrantyRecord, updateWarranty, addWarrantyClaim, deleteWarranty } from "@/lib/api";

interface WarrantyDetailsDialogProps {
  warranty: WarrantyRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WarrantyDetailsDialog({
  warranty,
  isOpen,
  onClose,
  onUpdate,
}: WarrantyDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<"details" | "claims">("details");
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Claim fields
  const [claimDescription, setClaimDescription] = useState("");
  const [claimResolution, setClaimResolution] = useState("");
  const [claimStatus, setClaimStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !warranty) return null;

  const isExpired =
    warranty.status === "Expired" ||
    new Date(warranty.expiryDate).getTime() < new Date().getTime();

  const startEdit = () => {
    setItemName(warranty.itemName || "");
    setStatus(warranty.status || "Active");
    setNotes(warranty.notes || "");
    setIsEditing(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleUpdateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setError("Expired warranties are read-only and cannot be modified.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateWarranty(warranty.id, {
        itemName: itemName.trim() || undefined,
        status: status || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccessMsg("Warranty updated successfully.");
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to update warranty.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setError("Expired warranties are read-only and cannot be claimed.");
      return;
    }
    if (!claimDescription.trim()) {
      setError("Please enter a description for the claim.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addWarrantyClaim(warranty.id, {
        description: claimDescription.trim(),
        resolution: claimResolution.trim() || "Pending Investigation",
        status: claimStatus || "Active",
      });
      setClaimDescription("");
      setClaimResolution("");
      setSuccessMsg("Warranty claim logged successfully.");
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to record warranty claim.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarranty = async () => {
    if (isExpired) {
      setError("Expired warranties are read-only and cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to deactivate this warranty record?")) {
      return;
    }
    setLoading(true);
    try {
      await deleteWarranty(warranty.id);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete warranty.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (s: string) => {
    if (s === "Active" && !isExpired) {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
          Active Coverage
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                {warranty.warrantyNo || "Warranty Record"}
              </h3>
              {getStatusBadge(warranty.status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer:{" "}
              <span className="text-slate-200 font-medium">
                {warranty.customer?.name || warranty.customerId}
              </span>{" "}
              • Vehicle:{" "}
              <span className="text-amber-400 font-medium">{warranty.vehicleNo}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Read-Only Banner for Expired Warranties (§Warranty Rule 3) */}
        {isExpired && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-amber-300 text-xs">
            <span className="font-bold">NOTICE:</span>
            <span>
              This warranty has expired and is now read-only (§Warranty PRD Rule 3). All history remains permanently accessible.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 border-b border-slate-800 flex gap-6">
          <button
            onClick={() => {
              setActiveTab("details");
              setIsEditing(false);
            }}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-amber-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Warranty Coverage & Terms
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "claims"
                ? "border-amber-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Warranty Claims & History
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs">
              {warranty.claimsList?.length || 0}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {successMsg}
            </div>
          )}

          {activeTab === "details" && (
            <div>
              {!isEditing ? (
                <div className="space-y-6">
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="block text-xs text-slate-400">Covered Item / Service</span>
                      <span className="text-sm font-medium text-white">
                        {warranty.itemName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400">Duration</span>
                      <span className="text-sm font-medium text-amber-400">
                        {warranty.durationDays} Days
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400">Start Date</span>
                      <span className="text-sm font-medium text-white">
                        {new Date(warranty.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400">Expiry Date</span>
                      <span className="text-sm font-medium text-white">
                        {new Date(warranty.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Reference info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Reference & Linkage
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-800/60">
                      <div>
                        <span className="text-xs text-slate-400 block">Linked Invoice</span>
                        <span className="text-sm text-slate-200">
                          {warranty.invoiceId ? `#${warranty.invoiceId}` : "Manual Issue / N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Linked Job Card</span>
                        <span className="text-sm text-slate-200">
                          {warranty.jobId ? `#${warranty.jobId}` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Warranty Terms & Notes
                    </h4>
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">
                      {warranty.notes || "Standard workshop warranty coverage applies."}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isExpired && (
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={handleDeleteWarranty}
                        disabled={loading}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-xl transition-colors"
                      >
                        Deactivate Coverage
                      </button>
                      <button
                        onClick={startEdit}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors border border-slate-700"
                      >
                        Modify Warranty (§13 Billing Authorized)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleUpdateWarranty} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Covered Item / Service Name *
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Claimed">Claimed</option>
                      <option value="Void">Void (Cancelled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Terms / Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "claims" && (
            <div className="space-y-6">
              {/* Claims History */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Permanent Claim History (§Warranty PRD Rule 4)
                </h4>
                {(!warranty.claimsList || warranty.claimsList.length === 0) ? (
                  <div className="text-center py-6 bg-slate-800/20 border border-slate-800/60 rounded-xl text-slate-400 text-sm">
                    No warranty claims recorded for this item yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {warranty.claimsList.map((claim) => (
                      <div
                        key={claim.id}
                        className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-400">
                              {claim.id}
                            </span>
                            <span className="text-xs text-slate-400">
                              • {new Date(claim.claimDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">
                            {claim.description}
                          </p>
                          {claim.resolution && (
                            <p className="text-xs text-emerald-400">
                              Resolution: {claim.resolution}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 text-right">
                          Log by:{" "}
                          <span className="text-slate-300 font-medium">
                            {claim.claimedBy || "Authorized User"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Record new claim form */}
              {!isExpired ? (
                <form
                  onSubmit={handleAddClaim}
                  className="bg-slate-800/20 border border-slate-800 p-5 rounded-xl space-y-4"
                >
                  <h4 className="text-sm font-semibold text-white">
                    Log New Warranty Claim
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Claim Issue / Description *
                    </label>
                    <input
                      type="text"
                      value={claimDescription}
                      onChange={(e) => setClaimDescription(e.target.value)}
                      placeholder="e.g. Paint peeling on hood after ceramic coating"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Resolution / Action Taken
                      </label>
                      <input
                        type="text"
                        value={claimResolution}
                        onChange={(e) => setClaimResolution(e.target.value)}
                        placeholder="e.g. Panel re-coated under warranty at zero charge"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Update Coverage Status
                      </label>
                      <select
                        value={claimStatus}
                        onChange={(e) => setClaimStatus(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Active">Keep Active (More claims allowed)</option>
                        <option value="Claimed">Mark as Claimed (Coverage fulfilled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                    >
                      {loading ? "Recording..." : "Record Claim"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                  Warranty has expired. No new claims may be logged.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
