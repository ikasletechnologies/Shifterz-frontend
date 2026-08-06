"use client";

import { useState, useEffect } from "react";
import { 
  BadgeCheck, Check, X, RefreshCw, Landmark, AlertTriangle, 
  CheckCircle2, AlertCircle, FileText 
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ServiceRequest {
  id: string;
  serviceId?: string;
  name: string;
  category: string;
  proposedPrice: number;
  duration: string;
  reason: string;
  priority: string;
  status: string;
  submittedBy: string;
  branchName: string;
  date: string;
}

export default function ServiceApprovalPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    setLoading(true);
    try {
      const localRequests = localStorage.getItem("service_requests");
      if (localRequests) {
        setRequests(JSON.parse(localRequests));
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      toast.error("Failed to load service requests: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    // Sync state if localStorage changes in other components
    const handleStorageChange = () => {
      const localRequests = localStorage.getItem("service_requests");
      if (localRequests) setRequests(JSON.parse(localRequests));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleApprove = (id: string) => {
    const updated = requests.map((req) => {
      if (req.id === id) {
        toast.success(`Request for "${req.name}" approved successfully!`);
        return { ...req, status: "Approved" };
      }
      return req;
    });
    localStorage.setItem("service_requests", JSON.stringify(updated));
    setRequests(updated);
    // Dispatch storage event to notify other windows/tabs
    window.dispatchEvent(new Event("storage"));
  };

  const handleReject = (id: string) => {
    const updated = requests.map((req) => {
      if (req.id === id) {
        toast.success(`Request for "${req.name}" rejected.`);
        return { ...req, status: "Rejected" };
      }
      return req;
    });
    localStorage.setItem("service_requests", JSON.stringify(updated));
    setRequests(updated);
    // Dispatch storage event
    window.dispatchEvent(new Event("storage"));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Approved":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const processedRequests = requests.filter((r) => r.status !== "Pending");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-gray-200">
      {/* Pending Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Custom Service Approvals</h2>
            <p className="text-sm text-gray-400">Review and authorize customized services or rate increases requested by branches</p>
          </div>
          <button
            onClick={loadRequests}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <BadgeCheck className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p className="text-white font-medium">No pending service approvals</p>
            <p className="text-sm">When branches request custom pricing or custom labor services, they will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested Branch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposed Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason / Rationale</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Landmark className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-medium text-sm">{req.branchName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium text-sm">{req.name}</p>
                      <p className="text-xs text-gray-500">
                        {req.serviceId ? `Modifies ID: ${req.serviceId}` : "Brand New Service"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-yellow-400 font-bold">₹{req.proposedPrice.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className={`px-6 py-4 text-xs ${req.priority === "High" ? "text-red-400 font-bold" : "text-gray-400"}`}>
                      {req.priority}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="p-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-lg transition-colors border border-green-500/20"
                          title="Approve Service"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20"
                          title="Reject Service"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Log Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Processed Service Approvals Log</h2>
          <p className="text-sm text-gray-400">History of approved and rejected custom service proposals</p>
        </div>

        {processedRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No service request approval history logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposed Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">{req.branchName}</td>
                    <td className="px-6 py-4 text-sm text-white">{req.name}</td>
                    <td className="px-6 py-4 text-sm text-yellow-400">₹{req.proposedPrice.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(req.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
