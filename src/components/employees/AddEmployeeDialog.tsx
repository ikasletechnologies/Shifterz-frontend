import { PhoneInput } from "@/components/common/PhoneInput";
import { useState } from "react";
import { X } from "lucide-react";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: any) => void;
  franchises: any[];
  defaultRole?: string;
  allowedRoles?: string[];
  lockFranchiseId?: string;
}

const MODULE_OPTIONS = [
  { value: "dashboard",  label: "Dashboard" },
  { value: "carin",      label: "Car In / Out" },
  { value: "jobs",       label: "Job Cards" },
  { value: "leads",      label: "Leads" },
  { value: "customers",  label: "Customers" },
  { value: "billing",    label: "Billing" },
  { value: "payments",   label: "Payments" },
  { value: "inventory",  label: "Inventory" },
  { value: "reports",    label: "Reports" },
  { value: "employees",  label: "Employees" },
  { value: "attendance", label: "Attendance" },
];

const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
  SUPER_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
  HQ_USER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
  FRANCHISE_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "employees", "attendance"],
  BRANCH_MANAGER: ["dashboard", "carin", "jobs", "outpass", "customers", "billing", "payments", "inventory"],
  RECEPTION_EXECUTIVE: ["dashboard", "carin", "outpass", "customers", "leads"],
  SERVICE_ADVISOR: ["dashboard", "carin", "jobs", "customers", "leads"],
  TECHNICIAN: ["dashboard", "jobs", "attendance"],
  QUALITY_INSPECTOR: ["dashboard", "jobs", "carin"],
  BILLING_EXECUTIVE: ["dashboard", "billing", "payments", "reports"],
  INVENTORY_EXECUTIVE: ["dashboard", "inventory", "reports"],
};

export default function AddEmployeeDialog({ isOpen, onClose, onAdd, franchises, defaultRole = "TECHNICIAN", allowedRoles, lockFranchiseId }: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    role: defaultRole,
    franchiseId: lockFranchiseId || "",
  });

  const [selectedModules, setSelectedModules] = useState<string[]>(
    DEFAULT_ROLE_MODULES[defaultRole] || DEFAULT_ROLE_MODULES["TECHNICIAN"]
  );

  const roles = allowedRoles || [
    "SUPER_ADMIN",
    "HQ_USER",
    "FRANCHISE_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTION_EXECUTIVE",
    "SERVICE_ADVISOR",
    "TECHNICIAN",
    "QUALITY_INSPECTOR",
    "BILLING_EXECUTIVE",
    "INVENTORY_EXECUTIVE",
  ];

  if (!isOpen) return null;

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setSelectedModules(DEFAULT_ROLE_MODULES[role] || []);
  };

  const handleToggleModule = (modValue: string) => {
    setSelectedModules(prev =>
      prev.includes(modValue) ? prev.filter(m => m !== modValue) : [...prev, modValue]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      permissions: selectedModules,
    });
    setFormData({
      name: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      role: defaultRole,
      franchiseId: lockFranchiseId || "",
    });
    setSelectedModules(DEFAULT_ROLE_MODULES[defaultRole] || DEFAULT_ROLE_MODULES["TECHNICIAN"]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
            <p className="text-sm text-gray-500 mt-1">Enter employee details below.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <PhoneInput
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="XXXXX XXXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  placeholder="johndoe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  placeholder="Leave empty if no login required"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                >
                  {roles.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>

              {!lockFranchiseId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Branch</label>
                  <select
                    value={formData.franchiseId}
                    onChange={(e) => setFormData({ ...formData, franchiseId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                  >
                    <option value="">Select Branch (HQ)</option>
                    {franchises.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.city})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permissions customizer */}
              <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Customize Dashboard Access
                </label>
                <p className="text-xs text-gray-400 mb-3">Toggled options overrides standard role permissions.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODULE_OPTIONS.map((opt) => {
                    const isChecked = selectedModules.includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => handleToggleModule(opt.value)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                          isChecked
                            ? "bg-blue-50/50 border-blue-300 text-blue-700 font-semibold"
                            : "bg-gray-50 border-gray-100 text-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 shrink-0"
                        />
                        <span className="text-[11px] leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-employee-form"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}
