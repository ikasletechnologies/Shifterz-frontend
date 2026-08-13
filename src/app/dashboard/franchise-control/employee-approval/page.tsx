"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCog, ShieldAlert, RefreshCw, UserCheck, UserX, Building2, Phone, Mail, User, Clock, Layers } from "lucide-react";
import { getPendingEmployeeApprovals, approveEmployeeRegistration, rejectEmployeeRegistration } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function EmployeeApprovalPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"Pending" | "Approved" | "Rejected" | "All">("Pending");

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | null;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    type: null,
    employeeId: null,
    employeeName: "",
  });

  const fetchApprovals = useCallback(async (tabFilter = statusTab) => {
    try {
      setLoading(true);
      const data = await getPendingEmployeeApprovals(tabFilter);
      setEmployees(data || []);
    } catch (err: any) {
      toast.error("Failed to load approval queue: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchApprovals(statusTab);
  }, [statusTab, fetchApprovals]);

  const triggerApproveConfirm = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: "approve",
      employeeId: id,
      employeeName: name,
    });
  };

  const triggerRejectConfirm = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: "reject",
      employeeId: id,
      employeeName: name,
    });
  };

  const handleConfirmAction = async () => {
    const { type, employeeId, employeeName } = confirmModal;
    if (!employeeId || !type) return;

    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setProcessingId(employeeId);

    try {
      if (type === "approve") {
        await approveEmployeeRegistration(employeeId);
        toast.success(`Employee ${employeeName} approved and activated successfully!`);
      } else {
        await rejectEmployeeRegistration(employeeId);
        toast.success(`Employee ${employeeName} registration request rejected.`);
      }
      fetchApprovals(statusTab);
    } catch (err: any) {
      toast.error(`Failed to ${type} employee: ` + (err.message || "Error"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-100">
            <UserCog className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Employee Approval Queue</h1>
            <p className="text-sm text-gray-500">Review, approve, or reject new employee registration requests from franchises.</p>
          </div>
        </div>
        <button
          onClick={() => fetchApprovals(statusTab)}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { id: "Pending", label: "Pending Approvals", icon: Clock },
          { id: "Approved", label: "Approved Employees", icon: UserCheck },
          { id: "Rejected", label: "Rejected Employees", icon: UserX },
          { id: "All", label: "All Franchise Staff", icon: Layers },
        ].map((tab) => {
          const isActive = statusTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? tab.id === "Pending"
                    ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/20"
                    : tab.id === "Approved"
                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20"
                    : tab.id === "Rejected"
                    ? "bg-red-600 text-white shadow-xs ring-2 ring-red-600/20"
                    : "bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pending / Employee Requests Table */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading employee approvals...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
              <UserCheck className="w-8 h-8 text-gray-300" />
              <span>No employee records found under "{statusTab}" status.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Franchise Branch</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Status</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => {
                    const isPending = (emp.approvalStatus || "").toLowerCase() === "pending" || (!emp.approvalStatus && emp.status === "Inactive");
                    const isApproved = emp.approvalStatus === "Approved" || (emp.status === "Active" && !emp.approvalStatus);
                    const isRejected = emp.approvalStatus === "Rejected";

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-mono text-xs font-bold text-amber-600">{emp.id}</td>
                        <td className="px-4 py-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{emp.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-gray-700">@{emp.username || "unassigned"}</td>
                        <td className="px-4 py-4 text-xs">
                          <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700">
                            {(emp.role || "EMPLOYEE").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-yellow-700">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-yellow-600" />
                            <span>{emp.franchise?.name || "Head Office"}</span>
                            {emp.franchise?.city && <span className="text-gray-400 font-normal">({emp.franchise.city})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 space-y-0.5">
                          {emp.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{emp.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isPending && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              Pending Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Approved & Active
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              Rejected (Inactive)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => triggerApproveConfirm(emp.id, emp.name || emp.username || emp.id)}
                                  disabled={processingId !== null}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  title="Approve Employee Account"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => triggerRejectConfirm(emp.id, emp.name || emp.username || emp.id)}
                                  disabled={processingId !== null}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  title="Reject Employee Account"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : isApproved ? (
                              <button
                                onClick={() => triggerRejectConfirm(emp.id, emp.name || emp.username || emp.id)}
                                disabled={processingId !== null}
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs transition-colors cursor-pointer"
                                title="Revoke Approval"
                              >
                                Reject
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerApproveConfirm(emp.id, emp.name || emp.username || emp.id)}
                                disabled={processingId !== null}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs transition-colors cursor-pointer"
                                title="Approve Registration"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <div className={`p-3 rounded-full ${confirmModal.type === "approve" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {confirmModal.type} Employee Registration
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to <span className="font-semibold text-gray-900">{confirmModal.type}</span> the registration for employee <span className="font-semibold text-gray-900">{confirmModal.employeeName}</span>?
              {confirmModal.type === "approve"
                ? " This will activate the account and grant login access."
                : " This will keep the account inactive and block login access."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors cursor-pointer ${
                  confirmModal.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
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
