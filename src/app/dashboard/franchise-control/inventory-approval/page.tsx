"use client";

import { useState, useEffect } from "react";
import { 
  PackageCheck, Check, X, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Eye, Landmark 
} from "lucide-react";
import { 
  getInventoryRequests, 
  approveInventoryRequest, 
  rejectInventoryRequest, 
  getInventory, 
  getFranchises 
} from "@/lib/api";
import { toast } from "react-hot-toast";

export default function InventoryApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [qtyApproved, setQtyApproved] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, invData, franData] = await Promise.all([
        getInventoryRequests(),
        getInventory(),
        getFranchises()
      ]);
      setRequests(reqData || []);
      setInventoryItems(invData || []);
      setFranchises(franData || []);
    } catch (err: any) {
      toast.error("Failed to load inventory data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveOpen = (req: any) => {
    setSelectedRequest(req);
    setQtyApproved(String(req.quantityRequested));
  };

  const handleApproveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!qtyApproved || Number(qtyApproved) <= 0) {
      toast.error("Please enter a valid approved quantity");
      return;
    }

    setSubmitting(true);
    try {
      await approveInventoryRequest(selectedRequest.id, {
        status: "Approved",
        quantityApproved: Number(qtyApproved)
      });
      toast.success("Request approved and quantity locked!");
      setSelectedRequest(null);
      loadData();
    } catch (err: any) {
      toast.error("Failed to approve request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this request?")) {
      return;
    }
    try {
      await rejectInventoryRequest(id);
      toast.success("Request rejected.");
      loadData();
    } catch (err: any) {
      toast.error("Failed to reject request: " + err.message);
    }
  };

  const getItemName = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    return item ? item.name : `Item [${itemId}]`;
  };

  const getFranchiseName = (franchiseId: string | null) => {
    if (!franchiseId) return "Headquarters";
    const fran = franchises.find((f) => f.id === franchiseId);
    return fran ? fran.name : `Branch [${franchiseId}]`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Submitted":
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Approved":
      case "Partially Approved":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Dispatched":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Received":
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

  const pendingRequests = requests.filter((r) => r.status === "Submitted" || r.status === "Pending");
  const processedRequests = requests.filter((r) => r.status !== "Submitted" && r.status !== "Pending");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-gray-200">
      {/* Pending Requests Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Branch Requests</h2>
            <p className="text-sm text-gray-400">Review and approve stock demands submitted by sub-branches</p>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <PackageCheck className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p className="text-white font-medium">No pending approval requests</p>
            <p className="text-sm">When branches submit new stock requests, they will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Franchise Branch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Requested</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Required Date</th>
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
                        <span className="text-white font-medium text-sm">{getFranchiseName(req.franchiseId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium text-sm">{getItemName(req.itemId)}</span>
                      <span className="block text-xs text-gray-500">ID: {req.itemId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200 font-bold">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="px-6 py-4 text-xs text-yellow-400 font-semibold">{req.priority}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveOpen(req)}
                          className="p-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-lg transition-colors border border-green-500/20"
                          title="Approve Request"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20"
                          title="Reject Request"
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
          <h2 className="text-lg font-bold text-white">Processed Requests Log</h2>
          <p className="text-sm text-gray-400">History of approved, dispatched, received, and rejected requests</p>
        </div>

        {processedRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No request history available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Requested</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Approved</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">{getFranchiseName(req.franchiseId)}</td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{getItemName(req.itemId)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-semibold">
                      {req.quantityApproved !== null && req.quantityApproved !== undefined ? req.quantityApproved : "-"}
                    </td>
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

      {/* Approve Quantity Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Approve Request</h3>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleApproveConfirm} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400">
                  You are approving the stock request from <strong className="text-white">{getFranchiseName(selectedRequest.franchiseId)}</strong>.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Item: <strong className="text-white">{getItemName(selectedRequest.itemId)}</strong>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Requested Qty: <strong className="text-white">{selectedRequest.quantityRequested}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Approved Quantity</label>
                <input
                  type="number"
                  value={qtyApproved}
                  onChange={(e) => setQtyApproved(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400 font-bold text-lg"
                  min="1"
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-500/10 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
