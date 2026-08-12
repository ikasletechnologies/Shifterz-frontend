"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  X,
  Save,
  User,
  Lock,
  Phone,
  Mail,
  Building2,
  Grid3x3,
  Car,
  Briefcase,
  Ticket,
  FileText,
  CreditCard,
  Package,
  PieChart,
  UserCheck,
  Clock,
  Settings,
  Search,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getFranchises } from "@/lib/api";
import { toast } from "react-hot-toast";

// ── Role config ───────────────────────────────────────────────────────────────
const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "#ef4444", bg: "bg-red-100 text-red-700" },
  { value: "HQ_USER", label: "HQ User", color: "#f59e0b", bg: "bg-amber-100 text-amber-700" },
  { value: "FRANCHISE_ADMIN", label: "Franchise Admin", color: "#3b82f6", bg: "bg-blue-100 text-blue-700" },
  { value: "BRANCH_MANAGER", label: "Branch Manager", color: "#8b5cf6", bg: "bg-violet-100 text-violet-700" },
  { value: "RECEPTION_EXECUTIVE", label: "Reception Executive", color: "#06b6d4", bg: "bg-cyan-100 text-cyan-700" },
  { value: "SERVICE_ADVISOR", label: "Service Advisor", color: "#3b82f6", bg: "bg-blue-100 text-blue-700" },
  { value: "TECHNICIAN", label: "Technician", color: "#10b981", bg: "bg-emerald-100 text-emerald-700" },
  { value: "QUALITY_INSPECTOR", label: "Quality Inspector", color: "#a855f7", bg: "bg-purple-100 text-purple-700" },
  { value: "BILLING_EXECUTIVE", label: "Billing Executive", color: "#f97316", bg: "bg-orange-100 text-orange-700" },
  { value: "INVENTORY_EXECUTIVE", label: "Inventory Executive", color: "#14b8a6", bg: "bg-teal-100 text-teal-700" },
];

// ── Module options for checkable list ──────────────────────────────────────────
const MODULE_OPTIONS = [
  { value: "dashboard", label: "Dashboard", icon: Grid3x3 },
  { value: "carin", label: "Car In", icon: Car },
  { value: "jobs", label: "Job Cards", icon: Briefcase },
  { value: "outpass", label: "Out Pass", icon: Ticket },
  { value: "leads", label: "Leads", icon: Users },
  { value: "customers", label: "Customers", icon: Users },
  { value: "billing", label: "Billing", icon: FileText },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "reports", label: "Reports", icon: PieChart },
  { value: "employees", label: "Employees", icon: UserCheck },
  { value: "attendance", label: "Attendance", icon: Clock },
];

// ── Default dashboard modules per role ─────────────────────────────────────────
const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
  SUPER_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
  HQ_USER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
  FRANCHISE_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "employees", "attendance"],
  BRANCH_MANAGER: ["dashboard", "carin", "jobs", "outpass", "customers", "billing", "payments", "inventory"],
  RECEPTION_EXECUTIVE: ["dashboard", "carin", "outpass", "customers", "leads"],
  SERVICE_ADVISOR: ["dashboard", "carin", "jobs", "outpass", "customers", "leads"],
  TECHNICIAN: ["dashboard", "jobs", "attendance"],
  QUALITY_INSPECTOR: ["dashboard", "jobs", "carin"],
  BILLING_EXECUTIVE: ["dashboard", "billing", "payments", "reports"],
  INVENTORY_EXECUTIVE: ["dashboard", "inventory", "reports"],
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  permissions?: string[];
  status: string;
  franchiseId?: string | null;
  franchise?: { id: string; name: string };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: string;
  franchiseId: string;
  selectedModules: string[];
}

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  role: "TECHNICIAN",
  franchiseId: "",
  selectedModules: ["dashboard", "jobs", "attendance"],
};

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const baseRole = role.split("|")[0];
  const r = ROLES.find((x) => x.value === baseRole);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${r?.bg ?? "bg-gray-100 text-gray-600"}`}>
      <Shield className="w-3 h-3" />
      {r?.label ?? baseRole}
    </span>
  );
}

// ── Dashboard Checklist / Preview Card ─────────────────────────────────────────
function DashboardCustomizer({
  role,
  selectedModules,
  onChange,
  disabled = false,
}: {
  role: string;
  selectedModules: string[];
  onChange?: (modules: string[]) => void;
  disabled?: boolean;
}) {
  const r = ROLES.find((x) => x.value === role);

  const handleToggle = (val: string) => {
    if (disabled || !onChange) return;
    if (selectedModules.includes(val)) {
      onChange(selectedModules.filter((x) => x !== val));
    } else {
      onChange([...selectedModules, val]);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {disabled ? "Dashboard Access View" : "Dashboard Customization / Action Settings"}
        </p>
        {!disabled && (
          <span className="text-[10px] text-gray-400 font-medium">Click items to toggle access</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MODULE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedModules.includes(opt.value);
          return (
            <button
              type="button"
              key={opt.value}
              disabled={disabled}
              onClick={() => handleToggle(opt.value)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${isSelected
                ? "bg-white border-yellow-400 shadow-sm"
                : "bg-gray-50/50 border-gray-100 opacity-60 text-gray-400"
                }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: isSelected ? `${r?.color || "#eab308"}15` : "transparent",
                }}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{
                    color: isSelected ? (r?.color || "#eab308") : "#9ca3af",
                  }}
                />
              </div>
              <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-gray-900" : "text-gray-400"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Role guard
  const [authorized, setAuthorized] = useState<boolean | null>(null); // null = loading

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Password reset state (§17.8)
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Role guard + data load ──
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const allowed = u.role === "SUPER_ADMIN" || u.role === "HQ_USER";
        setAuthorized(allowed);
      } catch {
        setAuthorized(false);
      }
    } else {
      setAuthorized(false);
    }

    (async () => {
      try {
        const [empData, franData] = await Promise.allSettled([
          getEmployees(),
          getFranchises(),
        ]);
        if (empData.status === "fulfilled") setUsers(empData.value);
        if (franData.status === "fulfilled") setFranchises(franData.value);
      } catch (e: any) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Access denied guard ──
  if (authorized === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-5">
        <div
          style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
        >
          <Shield className="w-10 h-10 text-yellow-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-gray-500">
            This page is only available to <span className="font-semibold text-gray-700">Super Admin</span> and{" "}
            <span className="font-semibold text-gray-700">HQ Admin</span> roles.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }


  // ── Helpers ──
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      selectedModules: [...DEFAULT_ROLE_MODULES["TECHNICIAN"]],
    });
    setSelected(null);
    setModalMode("create");
  };

  const openEdit = (u: User) => {
    setSelected(u);
    let baseRole = u.role;
    let selectedModules = u.permissions || [];

    // Fallback: If permissions is empty/undefined, try splitting role
    if (!u.permissions || u.permissions.length === 0) {
      if (u.role.includes("|")) {
        const parts = u.role.split("|");
        baseRole = parts[0];
        selectedModules = parts[1].split(",").filter(Boolean);
      } else {
        selectedModules = DEFAULT_ROLE_MODULES[u.role] || [];
      }
    }

    setForm({
      name: u.name,
      email: u.email || "",
      phone: u.phone || "",
      username: u.username || "",
      password: "",
      role: baseRole,
      franchiseId: u.franchiseId ?? "",
      selectedModules,
    });
    setModalMode("edit");
  };

  const openView = (u: User) => { setSelected(u); setModalMode("view"); };
  const closeModal = () => { setModalMode(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.name || !form.role) {
      toast.error("Name and role are required.");
      return;
    }
    if (form.username && modalMode === "create" && !form.password) {
      toast.error("Password is required when a username is specified.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        username: form.username ? form.username.trim() : "",
        password: form.password,
        role: form.role,
        permissions: form.selectedModules,
        franchiseId: form.franchiseId || null,
      };

      if (modalMode === "create") {
        const created = await createEmployee(payload);
        setUsers((prev) => [created, ...prev]);
        toast.success("User created successfully!");
      } else if (modalMode === "edit" && selected) {
        const body: any = { ...payload };
        if (!body.password) delete body.password;
        const updated = await updateEmployee(selected.id, body);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        if (updated.transferPending) {
          toast.success("User updated. Branch transfer is pending approval.");
        } else {
          toast.success("User updated!");
        }
      }
      closeModal();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteEmployee(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter ──
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Render ──
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-100">
            <Users className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Create users with individual dashboard access based on their role.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <button
          onClick={() => setRoleFilter("ALL")}
          className={`p-3 rounded-xl border text-left transition-all ${roleFilter === "ALL" ? "border-yellow-400 shadow-md bg-white" : "border-gray-100 bg-white hover:border-gray-200"}`}
        >
          <p className="text-xl font-bold" style={{ color: "#374151" }}>{users.length}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-0.5 leading-tight">All Employees</p>
        </button>
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role.split("|")[0] === r.value).length;
          return (
            <button
              key={r.value}
              onClick={() => setRoleFilter(roleFilter === r.value ? "ALL" : r.value)}
              className={`p-3 rounded-xl border text-left transition-all ${roleFilter === r.value ? "border-yellow-400 shadow-md bg-white" : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              <p className="text-xl font-bold" style={{ color: r.color }}>{count}</p>
              <p className="text-[10px] font-semibold text-gray-500 mt-0.5 leading-tight">{r.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        >
          <option value="ALL">All Roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Franchise</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => {
                const r = ROLES.find((x) => x.value === u.role);
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ background: r?.color ?? "#6b7280" }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <p className="text-xs text-gray-600">{u.email || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <p className="text-xs text-gray-600">{u.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{u.franchise?.name ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={async () => {
                          const nextStatus = u.status === "Active" ? "Inactive" : "Active";
                          try {
                            const updated = await updateEmployee(u.id, { status: nextStatus });
                            setUsers((prev) => prev.map((item) => item.id === updated.id ? updated : item));
                            toast.success(`User status changed to ${nextStatus}`);
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${u.status === "Active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        title="Click to toggle account activation/deactivation (§17.8)"
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openView(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View dashboard preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setResetTarget(u); setNewPassword(""); }}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Reset Password (§17.8)"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors" title="Edit user">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {modalMode === "view" ? <Eye className="w-5 h-5 text-blue-500" /> : modalMode === "edit" ? <Pencil className="w-5 h-5 text-yellow-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === "view" ? `${selected?.name}'s Dashboard` : modalMode === "edit" ? "Edit User" : "Create New User"}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* VIEW MODE: dashboard preview only */}
              {modalMode === "view" && selected && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <RoleBadge role={selected.role} />
                    <span className="text-sm text-gray-500">{selected.username}</span>
                  </div>
                  <DashboardCustomizer
                    role={selected.role.split("|")[0]}
                    selectedModules={
                      selected.role.includes("|")
                        ? selected.role.split("|")[1].split(",").filter(Boolean)
                        : DEFAULT_ROLE_MODULES[selected.role] || []
                    }
                    disabled={true}
                  />
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    This user sees the above modules when they log in.
                  </p>
                </>
              )}

              {/* CREATE / EDIT FORM */}
              {(modalMode === "create" || modalMode === "edit") && (
                <div className="space-y-4">
                  {/* Name + Username */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="johndoe" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50" />
                      </div>
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                      <PhoneInput
                        name="phone"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Password {modalMode === "edit" && <span className="text-gray-400">(leave blank to keep)</span>}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50" />
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role * <span className="text-gray-400 font-normal">— determines default dashboard access</span></label>
                    <select
                      value={form.role}
                      onChange={(e) => {
                        const rVal = e.target.value;
                        setForm((p) => ({
                          ...p,
                          role: rVal,
                          selectedModules: [...(DEFAULT_ROLE_MODULES[rVal] || [])],
                        }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* Franchise (only for non-HQ roles) */}
                  {!["SUPER_ADMIN", "HQ_USER"].includes(form.role) && franchises.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign Franchise</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={form.franchiseId}
                          onChange={(e) => setForm((p) => ({ ...p, franchiseId: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                        >
                          <option value="">— No franchise —</option>
                          {franchises.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Preview / Checklist Customizer */}
                  <DashboardCustomizer
                    role={form.role}
                    selectedModules={form.selectedModules}
                    onChange={(mods) => setForm((p) => ({ ...p, selectedModules: mods }))}
                  />

                  {/* Submit */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving…" : modalMode === "create" ? "Create User" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal (§17.8) */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base">Reset User Password (§17.8)</h3>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 font-bold uppercase">Target Account</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">
                  {resetTarget.name} ({resetTarget.username || resetTarget.role})
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetting || !newPassword}
                  onClick={async () => {
                    setResetting(true);
                    try {
                      await updateEmployee(resetTarget.id, { password: newPassword });
                      toast.success("Password reset successfully!");
                      setResetTarget(null);
                    } catch (e: any) {
                      toast.error("Failed to reset password: " + e.message);
                    } finally {
                      setResetting(false);
                    }
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Save New Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
