"use client";

import { X, Check, ClipboardList, Plus, Trash2, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiCall } from "@/services/api.client";
import { getServices } from "@/lib/api";
import { formatVehicleNumber } from "@/utils/vehicleNumber";
import { JobCardFormData, JobServiceLineItem } from "../types/job-card.types";
import { JOB_PRIORITIES, JOB_STATUSES } from "../constants/job-card.constants";

interface CatalogService {
  id: string;
  name: string;
  price: number;
  status?: string;
}

interface CreateJobCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: JobCardFormData) => void;
  initialData?: JobCardFormData | null;
}

// JobCardPage reads this on mount to restore the in-progress form after the
// "+ Add Technician" round trip to /dashboard/technicians and back.
export const JOB_CARD_DRAFT_STORAGE_KEY = "shifterz:jobCardDraft";

// Mirrors NewDocumentDialog.tsx's own computedService pattern — a short,
// human-readable label derived from the actual priced services, instead of
// a separately-picked free-text value that could say something unrelated to
// what's actually being billed.
function computeServiceLabel(services: JobServiceLineItem[]): string {
  if (services.length === 0) return "";
  if (services.length === 1) return services[0].name;
  return `${services[0].name} (+${services.length - 1} more)`;
}

const DEFAULT_FORM: JobCardFormData = {
  vehicle: "",
  customer: "",
  service: "",
  services: [],
  technician: "",
  technicianId: "",
  priority: "",
  status: "Pending",
  startDate: new Date().toISOString().split("T")[0],
  estCompletion: "",
  actualCompletion: "",
  notes: "",
  technicianInstructions: "",
  internalRemarks: "",
};

export function CreateJobCardDialog({ isOpen, onClose, onSave, initialData }: CreateJobCardDialogProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<JobCardFormData>(DEFAULT_FORM);
  const [serviceCatalog, setServiceCatalog] = useState<CatalogService[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [catalogQty, setCatalogQty] = useState(1);

  const isEditing = !!initialData?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const emps = await apiCall("/employees");
        const techList = emps
          .filter((emp: any) => emp.role === "TECHNICIAN" && emp.status === "Active")
          .map((emp: any) => ({ id: emp.id, name: emp.name }));
        if (techList.length > 0) {
          setTechnicians(techList);
        }
      } catch (err) {
        console.error("Failed to load technicians:", err);
      }
    };
    if (isOpen) loadTechnicians();
  }, [isOpen]);

  // Billing's GST calculation reads this job's `services` line items and
  // matches each `name` against the Service catalog by exact string (see
  // gstInvoiceResolver.service.ts) — the catalog is the only safe source of
  // names to offer here.
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const list = await getServices();
        setServiceCatalog((list || []).filter((s: CatalogService) => (s.status || "Active") === "Active"));
      } catch (err) {
        console.error("Failed to load service catalog:", err);
      }
    };
    if (isOpen) loadCatalog();
  }, [isOpen]);

  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "");
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      let initialForm = initialData
        ? { ...initialData }
        : { ...DEFAULT_FORM, startDate: new Date().toISOString().split("T")[0] };

      setFormData(initialForm);
    }
  }, [isOpen, initialData]);

  const handleAddService = () => {
    if (!selectedCatalogId) {
      toast.error("Select a service first");
      return;
    }
    const catalogItem = serviceCatalog.find((s) => s.id === selectedCatalogId);
    if (!catalogItem || catalogQty < 1) return;

    const existing = formData.services || [];
    const idx = existing.findIndex((s) => s.name === catalogItem.name);
    const next: JobServiceLineItem[] =
      idx >= 0
        ? existing.map((s, i) => (i === idx ? { ...s, qty: s.qty + catalogQty } : s))
        : [...existing, { name: catalogItem.name, price: catalogItem.price, qty: catalogQty }];

    setFormData({ ...formData, services: next, service: computeServiceLabel(next) });
    setSelectedCatalogId("");
    setCatalogQty(1);
  };

  const handleRemoveService = (index: number) => {
    const next = (formData.services || []).filter((_, i) => i !== index);
    setFormData({ ...formData, services: next, service: computeServiceLabel(next) });
  };

  const serviceLineTotal = (formData.services || []).reduce((sum, s) => sum + s.price * s.qty, 0);

  const handleAddTechnicianClick = () => {
    try {
      sessionStorage.setItem(JOB_CARD_DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore — worst case the draft just isn't restored on return.
    }
    router.push(`/dashboard/technicians?returnTo=${encodeURIComponent("/dashboard/jobs")}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Picking a service from the dropdown doesn't add it by itself — the "+"
    // button does. Saving with nothing added is a common silent no-op (looks
    // like it worked, but Billing still has nothing to invoice), so flag it
    // instead of letting it pass quietly.
    if ((formData.services || []).length === 0) {
      toast(
        selectedCatalogId
          ? "Click the + button to add the selected service before saving — it wasn't added yet."
          : "Saved without any priced services — Billing won't be able to generate an invoice until you add at least one.",
        { icon: "⚠️" }
      );
    }
    onSave({ ...formData, ...(isEditing && { id: formData.id }) });
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-yellow-500" />
            {isEditing ? `Edit Job Card — ${formData.vehicle}` : "New Job Card"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Vehicle No */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vehicle No. *</label>
              <input
                required
                type="text"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: formatVehicleNumber(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white uppercase"
                placeholder="TN 04 XX 0000"
              />
            </div>

            {/* Customer */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
                placeholder="Full name"
              />
            </div>

            {/* Service(s) — single source of truth. This used to be two
                unrelated pickers: a free-text "Service" dropdown (a hardcoded
                label list, display-only) plus this catalog-driven "Billing
                Services" picker (what GST/invoice generation actually reads
                from job.services). Now there's just this one — the display
                label above is derived automatically from what's added here. */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Service(s)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
                >
                  <option value="">Select a service...</option>
                  {serviceCatalog.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — ₹{s.price.toLocaleString("en-IN")}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={catalogQty}
                  onChange={(e) => setCatalogQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 px-2 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg shrink-0 cursor-pointer"
                  title="Add service"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {serviceCatalog.length === 0 && (
                <p className="text-xs text-gray-400">No active services in the catalog — add one under Dashboard → Services.</p>
              )}

              {serviceCatalog.length > 0 && (formData.services || []).length === 0 && (
                <p className="text-xs text-amber-600">Select a service, then click + to add it — an invoice can&apos;t be generated until at least one is added here.</p>
              )}

              {(formData.services || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {(formData.services || []).map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm text-gray-800 truncate">{s.name} × {s.qty}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-gray-900">₹{(s.price * s.qty).toLocaleString("en-IN")}</span>
                        <button type="button" onClick={() => handleRemoveService(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end text-sm font-bold text-gray-900 pt-1">
                    Total: ₹{serviceLineTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            {/* Technician */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technician</label>
                <button
                  type="button"
                  onClick={handleAddTechnicianClick}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Technician
                </button>
              </div>
              <select
                value={formData.technician}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const selected = technicians.find((t) => t.name === selectedName);
                  const nextStatus =
                    selectedName && selectedName !== "Unassigned" && formData.status === "Pending"
                      ? "Assigned"
                      : formData.status;
                  setFormData({
                    ...formData,
                    technician: selectedName,
                    technicianId: selected?.id || "",
                    status: nextStatus,
                  });
                }}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              >
                <option value="">Select Technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.name}>{tech.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              >
                <option value="">Select Priority</option>
                {JOB_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              >
                {/* "QC Passed"/"Ready For Billing" are QC-decision outputs — the backend
                    rejects an update that resubmits either as a plain status edit, so they
                    may only be recorded via the QC Inspection module's Pass/Fail flow. */}
                {JOB_STATUSES.filter((s) => s !== "QC Passed" && s !== "Ready For Billing").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              />
            </div>

            {/* Est. Completion */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Est. Completion</label>
              <input
                type="date"
                value={formData.estCompletion}
                onChange={(e) => setFormData({ ...formData, estCompletion: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white min-h-[80px]"
                placeholder="Work stages, observations..."
              />
            </div>

            {/* Technician Instructions */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Technician Instructions</label>
              <textarea
                value={formData.technicianInstructions || ""}
                onChange={(e) => setFormData({ ...formData, technicianInstructions: e.target.value })}
                className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white min-h-[70px]"
                placeholder="Step-by-step instructions for the technician..."
              />
            </div>

            {/* Internal Remarks — management only */}
            {['SUPER_ADMIN','HQ_USER','FRANCHISE_ADMIN','BRANCH_MANAGER'].includes((userRole || "").toUpperCase().replace(/[\s_]+/g, "_")) && (
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Internal Remarks <span className="text-[10px] font-normal text-slate-400 normal-case">(Staff Only — not on customer copy)</span></label>
                <textarea
                  value={formData.internalRemarks || ""}
                  onChange={(e) => setFormData({ ...formData, internalRemarks: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white min-h-[70px]"
                  placeholder="Internal notes, pricing notes, special instructions..."
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Check className="w-5 h-5" />
            {isEditing ? "Update Job Card" : "Create Job Card"}
          </button>
        </form>
      </div>
    </div>
  );
}
