"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, Ticket, Plus, Check, Loader2, Car, Calendar, Edit3, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { getVehicleType, formatVehicleNumber, normalizeVehicleNumber } from "@/utils/vehicleNumber";
import { getServices, getEmployees, getSettings, updateSettings, fetchVehicleDetails, apiCall } from "@/lib/api";

interface NewOutPassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  isPrefillOnly?: boolean;
}

function getCurrentDatetimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function NewOutPassDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isPrefillOnly = false,
}: NewOutPassDialogProps) {
  const isEditingExisting = Boolean(initialData) && !isPrefillOnly;
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    carModel: "",
    customerName: "",
    phone: "",
    service: "",
    technician: "",
    outTime: "",
    security: "",
    customerConfirmation: false,
  });

  const [serviceCatalog, setServiceCatalog] = useState<{ id: string; name: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [securityGuards, setSecurityGuards] = useState<string[]>([]);

  // Car model auto-fetching state
  const [isFetchingModel, setIsFetchingModel] = useState(false);

  // Security guard inline creation state
  const [isAddingGuard, setIsAddingGuard] = useState(false);
  const [newGuardName, setNewGuardName] = useState("");
  const [isSavingGuard, setIsSavingGuard] = useState(false);

  // Read-only override toggle for vehicle details
  const [isEditingVehicleDetails, setIsEditingVehicleDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getServices()
      .then((list) => setServiceCatalog((list || []).filter((s: any) => (s.status || "Active") === "Active")))
      .catch((err) => console.error("Failed to load service catalog:", err));
    getEmployees()
      .then((emps) =>
        setTechnicians(
          (emps || [])
            .filter((emp: any) => emp.role === "TECHNICIAN" && emp.status === "Active")
            .map((emp: any) => ({ id: emp.id, name: emp.name }))
        )
      )
      .catch((err) => console.error("Failed to load technicians:", err));
    getSettings()
      .then((data) => setSecurityGuards(data?.securityGuards || []))
      .catch((err) => console.error("Failed to load security guards:", err));
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        vehicleNumber: initialData.vehicle || initialData.vehicleNumber || "",
        carModel: initialData.model || initialData.carModel || initialData.vehicleModel || "",
        customerName: initialData.customer || initialData.customerName || initialData.client || "",
        phone: initialData.phone || initialData.customerPhone || "",
        service: initialData.service || "",
        technician: initialData.technicianName || initialData.technician || "",
        outTime: initialData.outTime
          ? new Date(initialData.outTime).toISOString().slice(0, 16)
          : getCurrentDatetimeLocal(),
        security: initialData.securityName || initialData.security || "",
        customerConfirmation: !isPrefillOnly,
      });
      setIsEditingVehicleDetails(false);
    } else if (!isOpen) {
      setFormData({
        vehicleNumber: "",
        carModel: "",
        customerName: "",
        phone: "",
        service: "",
        technician: "",
        outTime: "",
        security: "",
        customerConfirmation: false,
      });
      setIsAddingGuard(false);
      setNewGuardName("");
      setIsEditingVehicleDetails(false);
    } else {
      // New out pass without initialData
      setFormData((prev) => ({
        ...prev,
        outTime: prev.outTime || getCurrentDatetimeLocal(),
      }));
    }
  }, [initialData, isOpen, isPrefillOnly]);

  // Auto-fetch car model and customer info if vehicle number exists but model is blank
  useEffect(() => {
    if (!isOpen || !formData.vehicleNumber) return;
    if (formData.carModel && formData.carModel.trim() !== "") return;

    const normalizedNo = normalizeVehicleNumber(formData.vehicleNumber);
    if (normalizedNo.length < 4) return;

    let cancelled = false;
    setIsFetchingModel(true);

    fetchVehicleDetails(normalizedNo)
      .then((veh: any) => {
        if (cancelled) return;
        if (veh && (veh.model || veh.carModel)) {
          setFormData((prev) => ({
            ...prev,
            carModel: veh.model || veh.carModel || prev.carModel,
            customerName: prev.customerName || veh.customerName || veh.ownerName || "",
            phone: prev.phone || veh.phone || veh.mobile || "",
          }));
        } else {
          // Fallback to /carin list
          apiCall("/carin")
            .then((carIns: any) => {
              if (cancelled) return;
              const match = (carIns || []).find(
                (c: any) =>
                  normalizeVehicleNumber(c.vehicleNo || c.vehicle || c.vehicleNumber || "") === normalizedNo
              );
              if (match && match.model) {
                setFormData((prev) => ({
                  ...prev,
                  carModel: match.model || prev.carModel,
                  customerName: prev.customerName || match.ownerName || match.customer || "",
                  phone: prev.phone || match.phone || match.mobile || "",
                }));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (cancelled) return;
        apiCall("/carin")
          .then((carIns: any) => {
            if (cancelled) return;
            const match = (carIns || []).find(
              (c: any) =>
                normalizeVehicleNumber(c.vehicleNo || c.vehicle || c.vehicleNumber || "") === normalizedNo
            );
            if (match && match.model) {
              setFormData((prev) => ({
                ...prev,
                carModel: match.model || prev.carModel,
                customerName: prev.customerName || match.ownerName || match.customer || "",
                phone: prev.phone || match.phone || match.mobile || "",
              }));
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        if (!cancelled) setIsFetchingModel(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.vehicleNumber, formData.carModel]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicleNumber") {
      setFormData((prev) => ({ ...prev, [name]: formatVehicleNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSecurityGuard = async () => {
    const trimmed = newGuardName.trim();
    if (!trimmed) {
      toast.error("Please enter a security guard name");
      return;
    }

    if (securityGuards.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Security guard already exists");
      setFormData((prev) => ({ ...prev, security: trimmed }));
      setIsAddingGuard(false);
      setNewGuardName("");
      return;
    }

    setIsSavingGuard(true);
    try {
      const updatedGuards = [...securityGuards, trimmed];
      await updateSettings({ securityGuards: updatedGuards });
      setSecurityGuards(updatedGuards);
      setFormData((prev) => ({ ...prev, security: trimmed }));
      toast.success(`Added "${trimmed}" to security guards`);
      setIsAddingGuard(false);
      setNewGuardName("");
    } catch (err: any) {
      toast.error("Failed to add security guard: " + (err.message || "Error"));
    } finally {
      setIsSavingGuard(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (getVehicleType(formData.vehicleNumber) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
      return;
    }

    if (!formData.customerConfirmation) {
      toast.error("Customer confirmation is required before generating an Outpass.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        vehicle: formData.vehicleNumber,
        model: formData.carModel,
        customer: formData.customerName,
        phone: formData.phone,
        service: formData.service,
        outTime: formData.outTime || new Date().toISOString(),
        securityName: formData.security,
        technicianName: formData.technician,
        customerConfirmation: true,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-7 py-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                {isEditingExisting ? "Edit Out Pass" : "New Out Pass"}
              </h2>
              <p className="text-sm text-slate-500">Vehicle exit authorization pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 md:px-7 py-6 space-y-7">
          {/* SECTION 1: VEHICLE & JOB SUMMARY (Read-Only Context Card) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                <Car className="w-4 h-4 text-slate-400" />
                Vehicle & Job Information
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <Lock className="w-3 h-3" /> from job card
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingVehicleDetails(!isEditingVehicleDetails)}
                className="text-xs text-slate-500 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                {isEditingVehicleDetails ? "Done editing" : "Edit"}
              </button>
            </div>

            {!isEditingVehicleDetails ? (
              /* READ-ONLY DISPLAY GRID */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Vehicle No</span>
                  <span className="font-mono font-semibold text-slate-900 text-sm">{formData.vehicleNumber || "—"}</span>
                </div>

                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Car Model</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-slate-900 text-sm truncate">
                      {formData.carModel || (isFetchingModel ? "Fetching…" : "—")}
                    </span>
                    {isFetchingModel && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />}
                  </div>
                </div>

                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Customer Name</span>
                  <span className="font-medium text-slate-800 text-sm truncate block">{formData.customerName || "—"}</span>
                </div>

                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Phone</span>
                  <span className="font-medium text-slate-700 text-sm block truncate">
                    {formData.phone ? `+91 ${formData.phone}` : "—"}
                  </span>
                </div>

                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Service</span>
                  <span className="font-medium text-slate-800 text-sm block truncate">{formData.service || "—"}</span>
                </div>

                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Technician</span>
                  <span className="font-medium text-slate-800 text-sm block truncate">{formData.technician || "—"}</span>
                </div>
              </div>
            ) : (
              /* EDITABLE OVERRIDE INPUTS */
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder="KL 01 CD 5678"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase bg-white focus:ring-2 focus:ring-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Car Model *</label>
                    <input
                      type="text"
                      name="carModel"
                      value={formData.carModel}
                      onChange={handleChange}
                      placeholder="Honda City"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <PhoneInput name="phone" value={formData.phone} onChange={handleChange} placeholder="XXXXX XXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service *</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400"
                      required
                    >
                      <option value="">Select service</option>
                      {serviceCatalog.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Technician *</label>
                    <select
                      name="technician"
                      value={formData.technician}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400"
                      required
                    >
                      <option value="">Select technician</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: REQUIRED OUT PASS INPUTS */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Exit Authorization
            </h3>

            {/* Row 1: Out Time & Security Guard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Out time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="outTime"
                  value={formData.outTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-slate-800 text-sm transition-shadow"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Security guard <span className="text-red-500">*</span>
                  </label>
                  {!isAddingGuard && (
                    <button
                      type="button"
                      onClick={() => setIsAddingGuard(true)}
                      className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add new
                    </button>
                  )}
                </div>

                {isAddingGuard ? (
                  /* INLINE NEW GUARD INPUT FORM */
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGuardName}
                      onChange={(e) => setNewGuardName(e.target.value)}
                      placeholder="Guard full name"
                      className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddSecurityGuard}
                      disabled={isSavingGuard}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 rounded-lg text-sm transition-colors flex items-center gap-1 shrink-0 disabled:opacity-60"
                    >
                      {isSavingGuard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingGuard(false);
                        setNewGuardName("");
                      }}
                      className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 rounded-lg text-sm transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      name="security"
                      value={formData.security}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 bg-white text-slate-800 text-sm transition-shadow"
                      required
                    >
                      <option value="">Select security guard</option>
                      {securityGuards.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    {securityGuards.length === 0 && (
                      <div className="mt-1.5 text-xs text-slate-500">
                        No guards configured yet —{" "}
                        <button
                          type="button"
                          onClick={() => setIsAddingGuard(true)}
                          className="font-medium text-amber-700 hover:underline"
                        >
                          add one now
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Customer Confirmation Card */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customerConfirmation}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerConfirmation: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400/40 shrink-0 cursor-pointer"
              />
              <span className="text-sm text-amber-900 leading-snug">
                I confirm that the customer has been notified and has agreed to this vehicle leaving the premises.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 -mx-6 md:-mx-7 -mb-6 mt-2 px-6 md:px-7 py-5 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {isEditingExisting ? "Update Out Pass" : "Generate Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

