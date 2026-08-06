"use client";

import { useState, useEffect } from "react";
import { 
  PackageSearch, Plus, Calendar, Clock, AlertTriangle, 
  CheckCircle, ArrowDownToLine, RefreshCw, AlertCircle, PlayCircle 
} from "lucide-react";
import { 
  getInventoryRequests, 
  createInventoryRequest, 
  receiveInventoryRequest, 
  getInventory 
} from "@/lib/api";
import { toast } from "react-hot-toast";

export default function InventoryRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [remarks, setRemarks] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, invData] = await Promise.all([
        getInventoryRequests(),
        getInventory()
      ]);
      setRequests(reqData || []);
      setInventoryItems(invData || []);
    } catch (err: any) {
      toast.error("Failed to load inventory requests: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error("Please select an item");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setSubmitting(true);
    try {
      await createInventoryRequest({
        itemId: selectedItemId,
        quantityRequested: Number(quantity),
        requiredDate: requiredDate || undefined,
        priority,
        remarks: remarks || undefined
      });
      toast.success("Inventory request submitted successfully!");
      setIsModalOpen(false);
      // Reset form
      setSelectedItemId("");
      setQuantity("");
      setRequiredDate("");
      setPriority("Medium");
      setRemarks("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to submit request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm("Confirm that you have received the dispatched stock? This will automatically update your local stock levels.")) {
      return;
    }
    try {
      await receiveInventoryRequest(id);
      toast.success("Stock received and inventory updated!");
      loadData();
    } catch (err: any) {
      toast.error("Failed to mark request as received: " + err.message);
    }
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

  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case "High":
        return "text-red-400 font-semibold";
      case "Medium":
        return "text-yellow-400 font-semibold";
      default:
        return "text-gray-400";
    }
  };

  const getItemName = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    return item ? item.name : `Item [${itemId}]`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-gray-200">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Requests</p>
            <h3 className="text-2xl font-bold text-white mt-1">{requests.length}</h3>
          </div>
          <div className="p-3 bg-gray-500/10 rounded-xl text-gray-400">
            <PackageSearch className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Pending Approval</p>
            <h3 className="text-2xl font-bold text-yellow-400 mt-1">
              {requests.filter(r => r.status === "Submitted" || r.status === "Pending").length}
            </h3>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Dispatched / En Route</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">
              {requests.filter(r => r.status === "Dispatched").length}
            </h3>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Received Successfully</p>
            <h3 className="text-2xl font-bold text-green-400 mt-1">
              {requests.filter(r => r.status === "Received").length}
            </h3>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Stock Requests log</h2>
            <p className="text-sm text-gray-400">Manage and track your branch's inventory request transactions</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-all shadow-lg shadow-yellow-400/10 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Request Stock</span>
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <PackageSearch className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p className="text-white font-medium">No stock requests found</p>
            <p className="text-sm">Initiate a request to Headquarters when stock levels are running low.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Requested</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Approved</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Required Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium text-sm">{getItemName(req.itemId)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {req.itemId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-200">
                      {req.quantityApproved !== null && req.quantityApproved !== undefined ? req.quantityApproved : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="px-6 py-4 text-xs">{getPriorityStyle(req.priority)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "Dispatched" ? (
                        <button
                          onClick={() => handleReceive(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-medium text-xs rounded-lg transition-colors shadow-lg shadow-green-500/10"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Confirm Receipt</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">No actions pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Stock Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Inventory Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                  required
                >
                  <option value="" disabled className="bg-[#0f172a]">-- Select Item --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#0f172a]">
                      {item.name} (Current Stock: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Quantity Requested</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Required By Date</label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Low", "Medium", "High"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        priority === p
                          ? "bg-yellow-400 text-gray-900 border-yellow-400"
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Remarks / Reason</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide any details about the request..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 h-24 focus:outline-none focus:border-yellow-400 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-colors shadow-lg shadow-yellow-400/10 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
