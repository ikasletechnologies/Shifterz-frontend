"use client";

import { useState, useEffect } from "react";
import { UserCog, Check, X, ShieldAlert, Calendar, RefreshCw } from "lucide-react";
import { getMemberTransfers, approveMemberTransfer, rejectMemberTransfer } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function EmployeeApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | null;
    requestId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    type: null,
    requestId: null,
    employeeName: ""
  });

  async function fetchRequests() {
    try {
      setLoading(true);
      const data = await getMemberTransfers();
      setRequests(data);
    } catch (err: any) {
      toast.error("Failed to load requests: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const triggerApproveConfirm = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: "approve",
      requestId: id,
      employeeName: name
    });
  };

  const triggerRejectConfirm = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: "reject",
      requestId: id,
      employeeName: name
    });
  };

  const handleConfirmAction = async () => {
    const { type, requestId } = confirmModal;
    if (!requestId || !type) return;

    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setProcessingId(requestId);

    try {
      if (type === "approve") {
        await approveMemberTransfer(requestId);
        toast.success("Transfer request approved successfully!");
      } else {
        await rejectMemberTransfer(requestId);
        toast.success("Transfer request rejected.");
      }
      fetchRequests();
    } catch (err: any) {
      toast.error(`Failed to ${type} transfer: ` + err.message);
    } finally {
      setProcessingId(null);
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
  const completedRequests = requests.filter((r) => r.status !== "Pending");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-100">
            <UserCog className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Approval Queue</h1>
            <p className="text-sm text-gray-500">Approve or reject branch transfer requests for employees.</p>
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

      {/* Pending Transfers */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          Pending Approvals
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
            {pendingRequests.length}
          </span>
        </h2>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No pending transfer requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Requested</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Branch</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Branch</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-gray-500">{r.date}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">
                          {r.employeeName}
                        </div>
                        <div className="text-xs text-gray-400">{r.employeeRole.replace("_", " ")}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {r.panNumber ? (
                          <div className="space-y-1">
                            <span className="font-mono font-semibold">{r.panNumber}</span>
                            {r.panDocUrl && (
                              <a
                                href={`http://localhost:5000${r.panDocUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[10px] text-yellow-600 hover:text-yellow-700 font-bold underline"
                              >
                                View PAN
                              </a>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {r.aadharNumber ? (
                          <div className="space-y-1">
                            <span className="font-mono font-semibold">{r.aadharNumber}</span>
                            {r.aadharDocUrl && (
                              <a
                                href={`http://localhost:5000${r.aadharDocUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[10px] text-yellow-600 hover:text-yellow-700 font-bold underline"
                              >
                                View Aadhar
                              </a>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600 max-w-[160px] truncate" title={r.address}>
                        {r.address || "-"}
                      </td>
                      <td className="px-4 py-4 text-gray-600 font-semibold">HQ (Main Branch)</td>
                      <td className="px-4 py-4 text-yellow-600 font-bold">
                        {r.toFranchiseName} ({r.toFranchiseCity})
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">@{r.requestedBy}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
                          Pending Approval
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => triggerApproveConfirm(r.id, r.employeeName)}
                            disabled={processingId !== null}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-colors"
                            title="Approve & Transfer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => triggerRejectConfirm(r.id, r.employeeName)}
                            disabled={processingId !== null}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
                            title="Reject Request"
                          >
                            Reject
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
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${confirmModal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {confirmModal.type} Transfer Request
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to <span className="font-semibold text-gray-900">{confirmModal.type}</span> the recruitment/transfer request for <span className="font-semibold text-gray-900">{confirmModal.employeeName}</span>?
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors ${
                  confirmModal.type === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
