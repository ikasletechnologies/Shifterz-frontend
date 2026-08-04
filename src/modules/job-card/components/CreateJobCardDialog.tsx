"use client";

import { X, Check, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { apiCall } from "@/services/api.client";
import { JobCardFormData } from "../types/job-card.types";
import { JOB_PRIORITIES, JOB_STATUSES, JOB_SERVICES } from "../constants/job-card.constants";

interface CreateJobCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: JobCardFormData) => void;
  initialData?: JobCardFormData | null;
}

const DEFAULT_FORM: JobCardFormData = {
  vehicle: "",
  customer: "",
  service: "PPF Full Body",
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

const VEHICLE_REGEX = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,2}\s\d{1,4}$/;

function formatVehicleNumber(value: string): string {
  const cleaned = value.replace(/\s/g, "").toUpperCase();
  if (!cleaned.length) return "";
  let formatted = cleaned.substring(0, 2);
  if (cleaned.length > 2) formatted += " " + cleaned.substring(2, 4);
  if (cleaned.length > 4) formatted += " " + cleaned.substring(4, 6);
  if (cleaned.length > 6) formatted += " " + cleaned.substring(6, 10);
  return formatted;
}

export function CreateJobCardDialog({ isOpen, onClose, onSave, initialData }: CreateJobCardDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<JobCardFormData>(DEFAULT_FORM);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!VEHICLE_REGEX.test(formData.vehicle)) {
      toast.error("Vehicle number format: TN 04 AB 1234");
      return;
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

            {/* Service */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white"
              >
                {JOB_SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Technician */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technician</label>
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
                {JOB_STATUSES.map((s) => (
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
