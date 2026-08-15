"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Layers, Key, Calendar, Copy } from "lucide-react";
import { getFranchiseRequests } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function FranchiseActivationsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRequests() {
    try {
      setLoading(true);
      const data = await getFranchiseRequests();
      setRequests(data);
    } catch (err: any) {
      toast.error("Failed to load franchise requests: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("License key copied!"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const completedRequests = requests.filter((r) => r.status !== "Pending");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-100">
            <Layers className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchise Activation Requests</h1>
            <p className="text-sm text-gray-500">Review pending franchise and license details.</p>
          </div>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Activations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          Pending Activations
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
            {pendingRequests.length}
          </span>
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center text-gray-400 text-sm">
            No pending franchise onboarding requests found.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((r) => {
              const licenseKey = r.payload?.licenseKey;
              const licenseExpiry = r.payload?.licenseExpiry;
              const licenseFeatures: string[] = r.payload?.licenseFeatures || [];

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{r.payload?.name}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {r.payload?.city}{r.payload?.state ? `, ${r.payload.state}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Franchise Details */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Franchise Details</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Owner</span>
                          <span className="font-semibold text-gray-800">{r.payload?.owner || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Phone</span>
                          <span className="font-mono text-gray-700">{r.payload?.phone || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Email</span>
                          <span className="text-gray-700">{r.payload?.email || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">GST Number</span>
                          <span className="font-mono text-gray-700">{r.payload?.gstNumber || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Business Name</span>
                          <span className="text-gray-700">{r.payload?.businessName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Address</span>
                          <span className="text-gray-700 text-right max-w-[200px]">{r.payload?.address || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Royalty</span>
                          <span className="font-semibold text-gray-800">{r.payload?.royaltyPct || 10}%</span>
                        </div>
                      </div>
                    </div>

                    {/* License Details */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" /> Auto-Generated License
                      </p>

                      {licenseKey ? (
                        <div className="space-y-3">
                          {/* License Key Badge */}
                          <div className="flex items-center gap-2 bg-slate-900 text-green-400 rounded-xl px-4 py-3 font-mono text-sm font-bold tracking-widest">
                            <span className="flex-1">{licenseKey}</span>
                            <button
                              onClick={() => copyToClipboard(licenseKey)}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Copy License Key"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Expires
                              </span>
                              <span className="font-semibold text-gray-800">
                                {licenseExpiry
                                  ? new Date(licenseExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                  : "365 days from approval"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-500 font-medium">Status</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            </div>
                          </div>

                          {licenseFeatures.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Included Features</p>
                              <div className="flex flex-wrap gap-1.5">
                                {licenseFeatures.map((f) => (
                                  <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-semibold capitalize">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">License details not available for legacy requests.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Decisions (read-only, Approval-table records only) */}
      {completedRequests.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-gray-900">Historical Decisions</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Franchise</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approver</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completedRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-gray-500">{new Date(r.updatedAt || r.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-bold text-gray-900">{r.payload?.name}</td>
                      <td className="px-4 py-4 text-gray-700">{r.payload?.owner}</td>
                      <td className="px-4 py-4 text-gray-600">{r.approverName || "System"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
