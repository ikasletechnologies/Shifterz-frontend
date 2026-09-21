"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, User, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { getEmployees, getServices, getSettings } from "@/lib/api";
import { getVehicleType, formatVehicleNumber } from "@/utils/vehicleNumber";

interface EditLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, lead: any) => void;
  lead: any;
}

// Roles that can be assigned leads (see DEFAULT_ROLE_MODULES in AddEmployeeDialog)
const LEAD_ASSIGNEE_ROLES = ["RECEPTION_EXECUTIVE", "SERVICE_ADVISOR", "FRANCHISE_ADMIN", "BRANCH_MANAGER"];

export default function EditLeadDialog({
  isOpen,
  onClose,
  onSubmit,
  lead,
}: EditLeadDialogProps) {
  const router = useRouter();
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  // Real data instead of hardcoded lists — see AddLeadDialog.tsx for the
  // same fix and rationale (Service catalog / Setting.leadSources).
  const [serviceCatalog, setServiceCatalog] = useState<{ id: string; name: string }[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "",
    source: "",
    service: "",
    assigned: "",
    budget: "",
    notes: "",
    status: "New",
    lostReason: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    const loadAssignees = async () => {
      try {
        const emps = await getEmployees();
        const list = emps
          .filter((emp: any) => LEAD_ASSIGNEE_ROLES.includes(emp.role) && emp.status === "Active")
          .map((emp: any) => ({ id: emp.id, name: emp.name }));
        setAssignees(list);
      } catch (err) {
        console.error("Failed to load assignees:", err);
        toast.error("Failed to load assignee list");
      }
    };
    const loadServices = async () => {
      try {
        const list = await getServices();
        setServiceCatalog((list || []).filter((s: any) => (s.status || "Active") === "Active"));
      } catch (err) {
        console.error("Failed to load service catalog:", err);
      }
    };
    const loadLeadSources = async () => {
      try {
        const settings = await getSettings();
        setLeadSources(settings?.leadSources || []);
      } catch (err) {
        console.error("Failed to load lead sources:", err);
      }
    };
    loadAssignees();
    loadServices();
    loadLeadSources();
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        vehicle: lead.vehicle || "",
        source: lead.source || "",
        service: lead.service || "",
        assigned: lead.assignedTo || lead.assigned || "",
        budget: lead.budget ? lead.budget.replace(/[^0-9]/g, "") : "",
        notes: lead.notes || "",
        status: lead.status || "New",
        lostReason: lead.lostReason || "",
      });
    }
  }, [lead]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicle") {
      const formatted = formatVehicleNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate vehicle number format if provided: TN 04 AB 1234
    if (formData.vehicle.trim() && getVehicleType(formData.vehicle) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
      return;
    }

    // Backend rejects any update where status is "Lost" without a lostReason —
    // this dialog offers "Lost" as a status option but had no field to supply
    // it, so saving always failed with no way to fix it from here.
    if (formData.status === "Lost" && !formData.lostReason.trim()) {
      toast.error("A reason is required to mark this lead as Lost.");
      return;
    }

    if (onSubmit && lead) {
      const selectedAssignee = assignees.find((a) => a.name === formData.assigned);
      // `assignees` only lists Active employees, so a lead assigned to someone
      // who has since gone Inactive won't match here even though the field
      // wasn't touched — fall back to the lead's existing assignedToId in that
      // case instead of silently clearing a valid FK on an unrelated edit.
      const originalAssignedName = lead.assignedTo || lead.assigned || "";
      const assignedToId = selectedAssignee
        ? selectedAssignee.id
        : (formData.assigned && formData.assigned === originalAssignedName ? (lead.assignedToId ?? null) : null);
      const updatedLead = {
        ...lead,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle: formData.vehicle,
        source: formData.source,
        service: formData.service,
        assignedTo: formData.assigned,
        assignedToId,
        // Raw numeric value — the backend's high-value-lead alert does
        // parseFloat(budget), which a baked-in "₹" breaks (parseFloat("₹50000")
        // is NaN, so the alert can never fire).
        budget: formData.budget,
        status: formData.status,
        notes: formData.notes,
        ...(formData.status === "Lost" ? { lostReason: formData.lostReason } : {}),
      };
      onSubmit(lead.id, updatedLead);
    }
    onClose();
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Edit Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="XXXXX XXXXX"
                required
              />
            </div>
          </div>

          {/* Row 2: Email & Vehicle No. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Vehicle No.
              </label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900 uppercase"
              />
            </div>
          </div>

          {/* Row 3: Source & Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Source <span className="text-red-500">*</span>
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              >
                <option value="">Select source</option>
                {leadSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {formData.source && !leadSources.includes(formData.source) && (
                  <option value={formData.source}>{formData.source}</option>
                )}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Service Interested
                </label>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/services?returnTo=${encodeURIComponent("/dashboard/leads")}`)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Service
                </button>
              </div>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="">Select service</option>
                {serviceCatalog.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                {formData.service && !serviceCatalog.some((s) => s.name === formData.service) && (
                  <option value={formData.service}>{formData.service}</option>
                )}
              </select>
            </div>
          </div>

          {/* Row 4: Assign To & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Assign To
              </label>
              <select
                name="assigned"
                value={formData.assigned}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option value="">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
                {formData.assigned && !assignees.some((a) => a.name === formData.assigned) && (
                  <option value={formData.assigned}>{formData.assigned}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option>New</option>
                <option>Follow Up</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
          </div>

          {/* Lost Reason — required by the backend whenever status is "Lost" */}
          {formData.status === "Lost" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Reason for Losing Lead <span className="text-red-500">*</span>
              </label>
              <textarea
                name="lostReason"
                value={formData.lostReason}
                onChange={handleChange}
                placeholder="Why was this lead lost?"
                rows={2}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-red-50/50 resize-none text-gray-900"
              />
            </div>
          )}

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Expected Budget (₹)
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="00000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 resize-none text-gray-900"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ✓ Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
