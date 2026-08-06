"use client";

import { useState, useEffect } from "react";
import { 
  Boxes, Navigation, Clock, RefreshCw, Landmark, ArrowRightLeft, 
  CheckCircle, PlusCircle, AlertCircle, History 
} from "lucide-react";
import { 
  getInventoryRequests, 
  dispatchInventoryRequest, 
  getInventoryMovements, 
  getInventory, 
  getFranchises 
} from "@/lib/api";
import { toast } from "react-hot-toast";

export default function StockAllocationPage() {
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, movData, invData, franData] = await Promise.all([
        getInventoryRequests(),
        getInventoryMovements(),
        getInventory(),
        getFranchises()
      ]);
      
      // Filter requests that are Approved but not yet dispatched
      const approved = (reqData || []).filter((r: any) => r.status === "Approved");
      setApprovedRequests(approved);
      setMovements(movData || []);
      setInventoryItems(invData || []);
      setFranchises(franData || []);
    } catch (err: any) {
      toast.error("Failed to load stock allocation data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async (id: string) => {
    if (!confirm("Dispatch this stock allocation request? This will mark the goods as en route to the branch.")) {
      return;
    }
    setProcessingId(id);
    try {
      await dispatchInventoryRequest(id);
      toast.success("Stock dispatched successfully!");
      loadData();
    } catch (err: any) {
      toast.error("Failed to dispatch stock: " + err.message);
    } finally {
      setProcessingId(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-gray-200">
      {/* Approved Requests Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Dispatch Orders</h2>
            <p className="text-sm text-gray-400">Allocate and dispatch stock for approved inventory requests</p>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {approvedRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Boxes className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p className="text-white font-medium">No approved requests pending dispatch</p>
            <p className="text-sm">Approve stock demands in the Inventory Approval portal to queue dispatches here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Destination Branch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty Approved</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Required Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {approvedRequests.map((req) => (
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
                    <td className="px-6 py-4 text-sm text-gray-200 font-bold">
                      {req.quantityApproved || req.quantityRequested}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDispatch(req.id)}
                        disabled={processingId === req.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-yellow-400/10 disabled:opacity-50"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{processingId === req.id ? "Dispatching..." : "Dispatch Stock"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movements Log Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Stock Movement Ledger</h2>
              <p className="text-sm text-gray-400">Ledger of all inventory transactions, dispatches, adjustments, and receipts</p>
            </div>
          </div>
        </div>

        {movements.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No stock movements logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Movement Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Post Stock Balance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ref Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">{getItemName(mov.itemId)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        mov.type === "RECEIVE" || mov.type === "ADD"
                          ? "bg-green-500/10 text-green-400"
                          : mov.type === "CONSUME"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${mov.quantity >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {mov.quantity >= 0 ? `+${mov.quantity}` : mov.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{mov.balance}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{mov.reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{mov.performedBy}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(mov.performedAt).toLocaleString()}
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
