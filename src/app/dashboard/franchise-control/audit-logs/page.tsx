"use client";

import { useState, useEffect } from "react";
import { ScrollText, Search, ShieldAlert, Calendar, Filter, Database, User, Terminal, HardDrive, RefreshCw, Download } from "lucide-react";
import { getAuditLogs, getFranchises } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AuditLog {
  id: string;
  module: string;
  recordId: string;
  action: string;
  userId: string;
  branchId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  device?: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        branchId: branchFilter || undefined,
      };
      const [logsData, frans] = await Promise.all([
        getAuditLogs(params),
        getFranchises().catch(() => []),
      ]);
      setLogs(logsData);
      setFranchises(frans);
    } catch (e: any) {
      toast.error("Failed to load audit logs: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setAuthorized(u.role === "SUPER_ADMIN" || u.role === "HQ_USER");
      } catch {
        setAuthorized(false);
      }
    } else {
      setAuthorized(false);
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    let csv = "ID,Date & Time,Module,Action,User,Branch,IP Address,Device\n";
    for (const log of logs) {
      const branchName = franchises.find(f => f.id === log.branchId)?.name || log.branchId || "HQ";
      csv += `"${log.id}","${new Date(log.createdAt).toISOString()}","${log.module}","${log.action}","${log.userId}","${branchName}","${log.ipAddress || 'N/A'}","${log.device || 'N/A'}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `audit_trail_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported to CSV");
  };

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-gray-50 rounded-2xl">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          You do not have permission to view the audit trails. Only Headquarters administrators can inspect system activities.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-yellow-500" />
            Audit & Traceability Trail
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Browse and inspect immutable state modifications, user activities, and data audits across all branches.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Trail
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Search Keywords</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, User, Action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Filter Module</label>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
          >
            <option value="">All Modules</option>
            <option value="LEAD">Leads</option>
            <option value="CUSTOMER">Customers</option>
            <option value="JOB">Job Cards</option>
            <option value="INVENTORY">Inventory</option>
            <option value="OUTPASS">Outpass</option>
            <option value="EMPLOYEE">Employees</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Filter Action</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="RESTORE">Restore</option>
            <option value="TRANSFER">Transfer</option>
            <option value="APPROVE_OUTPASS">Approve Outpass</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="w-full py-2 text-xs font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-1"
        >
          <Filter className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Audit Records Registry</h3>
          <span className="text-xs text-gray-400 font-semibold">{logs.length} logged entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">No audit logs matching selection.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor (User)</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Network Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {logs.map(log => {
                  const branchName = franchises.find(f => f.id === log.branchId)?.name || "HQ";

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === "CREATE" ? "bg-emerald-50 text-emerald-700" :
                          log.action === "DELETE" ? "bg-red-50 text-red-700" :
                          log.action === "UPDATE" ? "bg-blue-50 text-blue-700" :
                          "bg-yellow-50 text-yellow-700"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-900 font-bold">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {log.userId}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{branchName}</td>
                      <td className="p-4">
                        <div className="flex flex-col text-[10px] text-gray-400 font-mono">
                          <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                          <span className="truncate max-w-[200px]" title={log.device || ''}>
                            {log.device || 'System Agent'}
                          </span>
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
  );
}
