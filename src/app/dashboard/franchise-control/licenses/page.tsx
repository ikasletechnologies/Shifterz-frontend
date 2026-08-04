"use client";

import { useState, useEffect } from "react";
import { Key, Plus, AlertCircle, Calendar, CheckCircle2, ShieldAlert, Award, Hash, Zap, Send, Shield } from "lucide-react";
import { getLicenses, createLicense, activateLicense, getFranchises } from "@/lib/api";
import { toast } from "react-hot-toast";

interface License {
  id: string;
  organizationId: string;
  licenseKey: string;
  status: string;
  maxSuperAdmins: number;
  maxHQUsers: number;
  maxFranchiseAdmins: number;
  maxFranchiseUsers: number;
  activatedBy?: string | null;
  activatedAt?: string | null;
  expiryDate: string;
  features: string[];
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // License Generator State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    licenseKey: "",
    organizationId: "GLOBAL",
    maxSuperAdmins: 1,
    maxHQUsers: 6,
    maxFranchiseAdmins: 1,
    maxFranchiseUsers: 6,
    expiryDays: 365,
    features: "dashboard,carin,jobs,outpass,leads,customers,billing,payments,inventory,reports,employees,attendance",
  });

  // Activation State
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateForm, setActivateForm] = useState({
    licenseKey: "",
    franchiseId: "",
  });

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

    async function loadData() {
      try {
        const [lics, frans] = await Promise.all([
          getLicenses(),
          getFranchises().catch(() => []),
        ]);
        setLicenses(lics);
        setFranchises(frans);
      } catch (e: any) {
        toast.error("Failed to load licenses data: " + e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "STZ-";
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += "-";
    }
    setNewLicense({ ...newLicense, licenseKey: key });
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicense.licenseKey) {
      toast.error("Please generate or enter a license key");
      return;
    }
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(newLicense.expiryDays));

      const payload = {
        ...newLicense,
        expiryDate: expDate.toISOString(),
        features: newLicense.features.split(",").map(f => f.trim()),
      };

      const res = await createLicense(payload);
      setLicenses([res, ...licenses]);
      toast.success("License generated successfully");
      setShowAddForm(false);
      setNewLicense({
        licenseKey: "",
        organizationId: "GLOBAL",
        maxSuperAdmins: 1,
        maxHQUsers: 6,
        maxFranchiseAdmins: 1,
        maxFranchiseUsers: 6,
        expiryDays: 365,
        features: "dashboard,carin,jobs,outpass,leads,customers,billing,payments,inventory,reports,employees,attendance",
      });
    } catch (e: any) {
      toast.error("Failed to generate license: " + e.message);
    }
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateForm.licenseKey || !activateForm.franchiseId) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const res = await activateLicense(activateForm.licenseKey, activateForm.franchiseId);
      setLicenses(licenses.map(l => l.licenseKey === activateForm.licenseKey ? res : l));
      toast.success("License activated successfully");
      setShowActivateModal(false);
      setActivateForm({ licenseKey: "", franchiseId: "" });
    } catch (e: any) {
      toast.error("Activation failed: " + e.message);
    }
  };

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-gray-50 rounded-2xl">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          You do not have permission to view the global licensing controls. Only Headquarters administrators can manage licenses.
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
            <Key className="w-7 h-7 text-yellow-500" />
            License Monitoring & Control
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Generate licensing keys, allocate branch limits, and monitor organization user quotas.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowActivateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Activate Key
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) handleGenerateKey();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Generate License
          </button>
        </div>
      </div>

      {/* Generate Form */}
      {showAddForm && (
        <form onSubmit={handleCreateLicense} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-yellow-500" />
              Configure New License Key
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">License Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLicense.licenseKey}
                  onChange={e => setNewLicense({ ...newLicense, licenseKey: e.target.value })}
                  placeholder="STZ-XXXX-XXXX..."
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
                />
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="px-3 py-2 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Expiry Duration (Days)</label>
              <input
                type="number"
                value={newLicense.expiryDays}
                onChange={e => setNewLicense({ ...newLicense, expiryDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Initial Organization Target</label>
              <input
                type="text"
                value={newLicense.organizationId}
                onChange={e => setNewLicense({ ...newLicense, organizationId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max Super Admins</label>
              <input
                type="number"
                value={newLicense.maxSuperAdmins}
                onChange={e => setNewLicense({ ...newLicense, maxSuperAdmins: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max HQ Users</label>
              <input
                type="number"
                value={newLicense.maxHQUsers}
                onChange={e => setNewLicense({ ...newLicense, maxHQUsers: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max Franchise Admins</label>
              <input
                type="number"
                value={newLicense.maxFranchiseAdmins}
                onChange={e => setNewLicense({ ...newLicense, maxFranchiseAdmins: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max Franchise Users</label>
              <input
                type="number"
                value={newLicense.maxFranchiseUsers}
                onChange={e => setNewLicense({ ...newLicense, maxFranchiseUsers: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl shadow-sm transition-all"
            >
              Generate & Save Key
            </button>
          </div>
        </form>
      )}

      {/* Licenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Active License Keys Registry</h3>
          <span className="text-xs text-gray-400 font-semibold">{licenses.length} registered keys</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Loading licensing registry...</div>
        ) : licenses.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">No licenses registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">License Key</th>
                  <th className="p-4">Owner Branch</th>
                  <th className="p-4">Limits (SA/HQ/FA/FU)</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {licenses.map(lic => {
                  const isExpired = new Date(lic.expiryDate).getTime() < Date.now();
                  const targetFranchise = franchises.find(f => f.id === lic.organizationId);

                  return (
                    <tr key={lic.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-gray-900">{lic.licenseKey}</td>
                      <td className="p-4">
                        {lic.organizationId === "GLOBAL" ? (
                          <span className="text-gray-400 italic">Not Assigned / Global</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-gray-900">{targetFranchise?.name || lic.organizationId}</span>
                            <span className="text-[10px] text-gray-400">{targetFranchise?.city}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px]">SA: {lic.maxSuperAdmins}</span>
                          <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded text-[10px]">HQ: {lic.maxHQUsers}</span>
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">FA: {lic.maxFranchiseAdmins}</span>
                          <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px]">FU: {lic.maxFranchiseUsers}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(lic.expiryDate).toISOString().slice(0, 10)}
                        </div>
                      </td>
                      <td className="p-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            Expired
                          </span>
                        ) : lic.status === "Active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            Suspended
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleActivateSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                Activate License Key
              </h3>
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">License Key</label>
                <input
                  type="text"
                  required
                  value={activateForm.licenseKey}
                  onChange={e => setActivateForm({ ...activateForm, licenseKey: e.target.value.trim() })}
                  placeholder="STZ-XXXX-XXXX..."
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Franchise Branch Allocation</label>
                <select
                  required
                  value={activateForm.franchiseId}
                  onChange={e => setActivateForm({ ...activateForm, franchiseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                >
                  <option value="">Select Branch...</option>
                  {franchises.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.city})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl shadow-sm transition-all"
              >
                Link & Activate License
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
