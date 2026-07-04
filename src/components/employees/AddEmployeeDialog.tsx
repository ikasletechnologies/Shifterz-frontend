import { useState } from "react";
import { X } from "lucide-react";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: any) => void;
  franchises: any[];
}

export default function AddEmployeeDialog({ isOpen, onClose, onAdd, franchises }: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    role: "TECHNICIAN",
    franchiseId: "",
  });

  const roles = [
    "SUPER_ADMIN",
    "HQ_USER",
    "FRANCHISE_ADMIN",
    "RECEPTIONIST",
    "SERVICE_ADVISOR",
    "TECHNICIAN",
    "BILLING",
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      role: "TECHNICIAN",
      franchiseId: "",
    });
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
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  placeholder="+91..."
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                >
                  {roles.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>

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
