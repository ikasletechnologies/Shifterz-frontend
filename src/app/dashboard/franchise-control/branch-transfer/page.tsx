"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, User, Building, Calendar, ShieldAlert } from "lucide-react";
import { getEmployees, getFranchises, updateEmployee } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function BranchTransferPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empData, franData] = await Promise.all([
          getEmployees(),
          getFranchises()
        ]);
        // Filter employees belonging to main branch (franchiseId is null or undefined)
        const mainBranchEmployees = empData.filter(
          (emp: any) => !emp.franchiseId && emp.status === "Active"
        );
        setEmployees(mainBranchEmployees);
        setFranchises(franData);
      } catch (err: any) {
        toast.error("Failed to load data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast.error("Please select an employee");
      return;
    }
    if (!selectedFranchiseId) {
      toast.error("Please select a target branch");
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    setSubmitting(true);
    try {
      // Initiate transfer by editing employee's franchiseId
      const payload = {
        ...emp,
        franchiseId: selectedFranchiseId
      };
      const result = await updateEmployee(emp.id, payload);

      if (result.transferPending) {
        toast.success("Transfer request submitted successfully! Pending approval.");
      } else {
        toast.success("Transfer completed successfully.");
      }

      // Remove the employee from the local dropdown options since they now have a request pending or are transferred
      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmpId));
      setSelectedEmpId("");
      setSelectedFranchiseId("");
    } catch (err: any) {
      toast.error("Failed to initiate transfer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-yellow-100">
          <ArrowLeftRight className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Transfer</h1>
          <p className="text-sm text-gray-500">
            Request to transfer members/employees from the Main Branch (HQ) to a Sub-Branch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Select Employee (Main Branch / HQ) *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Select Destination Sub-Branch *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  value={selectedFranchiseId}
                  onChange={(e) => setSelectedFranchiseId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                >
                  <option value="">-- Choose Sub-Branch --</option>
                  {franchises.map((fran) => (
                    <option key={fran.id} value={fran.id}>
                      {fran.name} - {fran.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-gray-900 font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {submitting ? "Submitting Request..." : "Request Branch Transfer"}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-yellow-600" />
              Transfer Policy
            </div>
            <p className="text-xs text-yellow-900/80 leading-relaxed">
              Moving members out of the Main HQ requires dual verification. A transfer request will be posted to the approval queue.
            </p>
            <p className="text-xs text-yellow-900/80 leading-relaxed">
              The employee will remain in the Main Branch database until an administrator approves the request.
            </p>
          </div>
          <div className="mt-6 p-3 bg-white rounded-xl border border-yellow-100/50 text-[10px] text-gray-400 font-mono flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Initiated logs recorded automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
