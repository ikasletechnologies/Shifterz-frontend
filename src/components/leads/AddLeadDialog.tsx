"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, User, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchVehicleDetails, getEmployees, getServices, getSettings } from "@/lib/api";
import { getVehicleType, formatVehicleNumber } from "@/utils/vehicleNumber";

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (lead: any) => void;
  // Restores whatever the user had typed before "+ Add Service" sent them to
  // /dashboard/services and back — without this, that round trip would
  // silently discard the in-progress lead.
  initialDraft?: Record<string, any> | null;
}

// Roles that can be assigned leads (see DEFAULT_ROLE_MODULES in AddEmployeeDialog)
const LEAD_ASSIGNEE_ROLES = ["RECEPTION_EXECUTIVE", "SERVICE_ADVISOR", "FRANCHISE_ADMIN", "BRANCH_MANAGER"];

// Same key LeadsPage reads on mount to restore the draft.
export const LEAD_DRAFT_STORAGE_KEY = "shifterz:newLeadDraft";

export default function AddLeadDialog({
  isOpen,
  onClose,
  onSubmit,
  initialDraft,
}: AddLeadDialogProps) {
  const router = useRouter();
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  // Real data instead of hardcoded lists — services mirror the Service
  // catalog (Dashboard → Services) already used elsewhere (CreateJobCardDialog);
  // lead sources come from the backend's own Setting.leadSources field
  // (seeded with real defaults server-side — see settings.repository.ts),
  // which this dialog previously never read at all.
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
        setFormData((prev) => ({ ...prev, assigned: prev.assigned || list[0]?.name || "" }));
      } catch (err) {
        console.error("Failed to load assignees:", err);
        toast.error("Failed to load assignee list");
      }
    };
    const loadServices = async () => {
      try {
        const list = await getServices();
        const active = (list || []).filter((s: any) => (s.status || "Active") === "Active");
        setServiceCatalog(active);
        setFormData((prev) => ({ ...prev, service: prev.service || active[0]?.name || "" }));
      } catch (err) {
        console.error("Failed to load service catalog:", err);
      }
    };
    const loadLeadSources = async () => {
      try {
        const settings = await getSettings();
        const sources: string[] = settings?.leadSources || [];
        setLeadSources(sources);
        setFormData((prev) => ({ ...prev, source: prev.source || sources[0] || "" }));
      } catch (err) {
        console.error("Failed to load lead sources:", err);
      }
    };
    loadAssignees();
    loadServices();
    loadLeadSources();
  }, [isOpen]);

  // Restores the draft after the round trip to /dashboard/services — placed
  // after the data-loading effect above so its plain `setFormData` merge
  // always wins; the catalog/sources effects' own `prev.x || fetched[0]`
  // fallback then leaves these restored, non-empty values alone once they
  // resolve.
  useEffect(() => {
    if (isOpen && initialDraft) {
      setFormData((prev) => ({ ...prev, ...initialDraft }));
    }
  }, [isOpen, initialDraft]);

  const handleAddServiceClick = () => {
    try {
      sessionStorage.setItem(LEAD_DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore — worst case the draft just isn't restored on return.
    }
    router.push(`/dashboard/services?returnTo=${encodeURIComponent("/dashboard/leads")}`);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicle") {
      setFormData((prev) => ({ ...prev, [name]: formatVehicleNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVehicleBlur = async () => {
    if (formData.vehicle.length > 4 && (!formData.name || !formData.phone)) {
      try {
        const details = await fetchVehicleDetails(formData.vehicle);
        if (details && details.name) {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || details.name,
            phone: prev.phone || details.phone,
            email: prev.email || details.email || prev.email,
          }));
          toast.success("Customer details auto-filled!");
        }
      } catch (error: any) {
        // The lookup endpoint returns { found: false } rather than a 404 for
        // a genuinely unknown vehicle (handled by the `details.name` check
        // above) — anything that actually throws here is a real failure
        // (network/auth/server error), not an expected "not found" case.
        console.error("Vehicle lookup failed:", error);
        toast.error(error.message || "Failed to look up vehicle details");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate vehicle number format if provided: TN 04 AB 1234
    if (formData.vehicle.trim() && getVehicleType(formData.vehicle) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
      return;
    }

    if (onSubmit) {
      // The backend's createLeadSchema only recognizes `assignedTo` (not
      // `assigned`) and `assignedToId` — without the id, notifications route
      // to "unassigned" and per-employee reports bucket everything as
      // unassigned even when a name was picked here. Budget is sent as a raw
      // number: the backend's high-value-lead alert does parseFloat(budget),
      // which a baked-in "₹" breaks (parseFloat("₹50000") is NaN).
      const selectedAssignee = assignees.find((a) => a.name === formData.assigned);
      const newLead = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle: formData.vehicle,
        source: formData.source,
        service: formData.service,
        assignedTo: formData.assigned,
        assignedToId: selectedAssignee?.id || null,
        budget: formData.budget,
        notes: formData.notes,
        status: "New",
        date: new Date().toISOString().split("T")[0],
      };
      onSubmit(newLead);
    }
    setFormData({
      name: "",
      email: "",
      phone: "",
      vehicle: "",
      source: leadSources[0] || "",
      service: serviceCatalog[0]?.name || "",
      assigned: assignees[0]?.name || "",
      budget: "",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">New Lead</h2>
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
                onBlur={handleVehicleBlur}
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
              </select>
              {leadSources.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No lead sources configured yet.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Service Interested
                </label>
                <button
                  type="button"
                  onClick={handleAddServiceClick}
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
              </select>
              {serviceCatalog.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No active services in the catalog — add one under Dashboard → Services.</p>
              )}
            </div>
          </div>

          {/* Row 4: Assign To & Budget */}
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
              </select>
            </div>
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
            ✓ Save Lead
          </button>
        </form>
      </div>
    </div>
  );
}
