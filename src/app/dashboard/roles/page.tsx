"use client";

import { useState } from "react";
import { ShieldCheck, Shield, Users, Lock, Check, X } from "lucide-react";

// ── Role definitions ─────────────────────────────────────────────────────────
const ROLES = [
  { id: "SUPER_ADMIN",     label: "Super Admin",      color: "#ef4444", badge: "bg-red-100 text-red-700" },
  { id: "HQ_USER",         label: "HQ User",          color: "#f59e0b", badge: "bg-amber-100 text-amber-700" },
  { id: "FRANCHISE_ADMIN", label: "Franchise Admin",  color: "#3b82f6", badge: "bg-blue-100 text-blue-700" },
  { id: "BRANCH_MANAGER",  label: "Branch Manager",   color: "#8b5cf6", badge: "bg-violet-100 text-violet-700" },
  { id: "TECHNICIAN",      label: "Technician",       color: "#10b981", badge: "bg-emerald-100 text-emerald-700" },
  { id: "RECEPTIONIST",    label: "Receptionist",     color: "#06b6d4", badge: "bg-cyan-100 text-cyan-700" },
];

// ── Permission matrix ────────────────────────────────────────────────────────
const PERMISSIONS = [
  { module: "Dashboard",         key: "dashboard" },
  { module: "Car In / Out",      key: "carin" },
  { module: "Job Cards",         key: "jobs" },
  { module: "Out Pass",          key: "outpass" },
  { module: "Leads",             key: "leads" },
  { module: "Customers",         key: "customers" },
  { module: "Billing",           key: "billing" },
  { module: "Payments",          key: "payments" },
  { module: "Inventory",         key: "inventory" },
  { module: "Reports",           key: "reports" },
  { module: "Employees",         key: "employees" },
  { module: "Attendance",        key: "attendance" },
  { module: "Settings",          key: "settings" },
  { module: "Roles & Permissions", key: "roles" },
];

// Default matrix – true = has access
const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  SUPER_ADMIN:     Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
  HQ_USER:         Object.fromEntries(PERMISSIONS.map(p => [p.key, !["roles"].includes(p.key)])),
  FRANCHISE_ADMIN: Object.fromEntries(PERMISSIONS.map(p => [p.key, !["settings", "roles"].includes(p.key)])),
  BRANCH_MANAGER:  Object.fromEntries(PERMISSIONS.map(p => [p.key, !["settings", "roles", "employees"].includes(p.key)])),
  TECHNICIAN:      Object.fromEntries(PERMISSIONS.map(p => [p.key, ["dashboard", "jobs", "attendance"].includes(p.key)])),
  RECEPTIONIST:    Object.fromEntries(PERMISSIONS.map(p => [p.key, ["dashboard", "carin", "outpass", "customers", "leads"].includes(p.key)])),
};

export default function RolesPermissionsPage() {
  const [selected, setSelected] = useState("FRANCHISE_ADMIN");
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  const toggle = (roleId: string, permKey: string) => {
    setMatrix(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permKey]: !prev[roleId][permKey] },
    }));
  };

  const activeRole = ROLES.find(r => r.id === selected)!;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-yellow-100">
            <ShieldCheck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Control which modules each role can access.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Role List ── */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Select Role
          </p>
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`
                w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border
                transition-all duration-150 font-medium text-sm
                ${selected === role.id
                  ? "bg-white shadow-md border-gray-200 text-gray-900"
                  : "bg-gray-50 border-transparent text-gray-600 hover:bg-white hover:border-gray-200"
                }
              `}
            >
              <Shield className="w-4 h-4 shrink-0" style={{ color: role.color }} />
              <span>{role.label}</span>
              {selected === role.id && (
                <span
                  className="ml-auto w-2 h-2 rounded-full"
                  style={{ background: role.color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Permission Table ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${activeRole.badge}`}
              >
                <Shield className="w-3 h-3" />
                {activeRole.label}
              </span>
              <span className="text-sm text-gray-500">
                — {Object.values(matrix[selected]).filter(Boolean).length} / {PERMISSIONS.length} modules enabled
              </span>
            </div>

            {/* Permission rows */}
            <div className="divide-y divide-gray-50">
              {PERMISSIONS.map(perm => {
                const enabled = matrix[selected][perm.key];
                return (
                  <div
                    key={perm.key}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">{perm.module}</span>
                    <button
                      onClick={() => toggle(selected, perm.key)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                        ${enabled ? "bg-green-500" : "bg-gray-200"}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                          ${enabled ? "translate-x-6" : "translate-x-1"}
                        `}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer action */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setMatrix(prev => ({ ...prev, [selected]: Object.fromEntries(PERMISSIONS.map(p => [p.key, false])) }))}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Revoke All
              </button>
              <button
                onClick={() => setMatrix(prev => ({ ...prev, [selected]: Object.fromEntries(PERMISSIONS.map(p => [p.key, true])) }))}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)", color: "#1a1a1a" }}
              >
                Grant All
              </button>
            </div>
          </div>

          {/* Info note */}
          <p className="text-xs text-gray-400 mt-3 px-1">
            ⚠️ Changes here are UI-level previews. Connect to the backend to persist role permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
