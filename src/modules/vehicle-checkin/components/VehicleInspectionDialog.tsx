"use client";

import { useState, useEffect, useRef } from "react";
import { X, Car, ShieldCheck, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { uploadFile } from "@/lib/api";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";

interface VehicleInspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarEntry | null;
  onSubmit: (carId: string, data: Partial<CarEntry>) => Promise<boolean>;
}

const SINGLE_PHOTO_SLOTS: { key: keyof CarEntry; label: string }[] = [
  { key: "photoFront", label: "Front" },
  { key: "photoRear", label: "Rear" },
  { key: "photoLeft", label: "Left Side" },
  { key: "photoRight", label: "Right Side" },
  { key: "photoDashboard", label: "Dashboard" },
  { key: "photoOdometer", label: "Odometer" },
];

const FUEL_LEVELS = ["Empty", "1/4", "1/2", "3/4", "Full"];

export default function VehicleInspectionDialog({ isOpen, onClose, car, onSubmit }: VehicleInspectionDialogProps) {
  const [form, setForm] = useState<Partial<CarEntry>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const damagesInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && car) {
      setForm({
        fuelLevel: car.fuelLevel || "",
        scratches: car.scratches || "",
        dents: car.dents || "",
        brokenParts: car.brokenParts || "",
        glassDamage: car.glassDamage || "",
        wheelDamage: car.wheelDamage || "",
        interiorCondition: car.interiorCondition || "",
        remarks: car.remarks || "",
        photoFront: car.photoFront || "",
        photoRear: car.photoRear || "",
        photoLeft: car.photoLeft || "",
        photoRight: car.photoRight || "",
        photoDashboard: car.photoDashboard || "",
        photoOdometer: car.photoOdometer || "",
        photoDamages: car.photoDamages || [],
      });
    }
  }, [isOpen, car]);

  if (!isOpen || !car) return null;

  const handleChange = (key: keyof CarEntry, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSinglePhotoUpload = async (key: keyof CarEntry, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(String(key));
    try {
      const data = await uploadFile(file);
      setForm((prev) => ({ ...prev, [key]: data.url }));
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingSlot(null);
      if (fileInputRefs.current[String(key)]) fileInputRefs.current[String(key)]!.value = "";
    }
  };

  const handleDamagePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingSlot("photoDamages");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const data = await uploadFile(file);
        uploaded.push(data.url);
      }
      setForm((prev) => ({ ...prev, photoDamages: [...(prev.photoDamages || []), ...uploaded] }));
    } catch {
      toast.error("Failed to upload damage photo(s)");
    } finally {
      setUploadingSlot(null);
      if (damagesInputRef.current) damagesInputRef.current.value = "";
    }
  };

  const removeDamagePhoto = (url: string) => {
    setForm((prev) => ({ ...prev, photoDamages: (prev.photoDamages || []).filter((p) => p !== url) }));
  };

  const isComplete = hasCompletedInspection(form);

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error("Enter at least one inspection detail and upload at least one vehicle photo.");
      return;
    }
    setSaving(true);
    try {
      const success = await onSubmit(car.id, form);
      if (success) {
        toast.success("Vehicle inspection saved");
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const uploadOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  const resolveUrl = (url: string) => (url.startsWith("http") ? url : `${uploadOrigin}${url}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vehicle Inspection</h2>
              <p className="text-sm text-gray-500 font-medium">
                {car.vehicleNo || car.vehicle || car.vehicleNumber} · {car.model}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-medium">
            Required before this vehicle's Job Card can start work or be sent to QC: at least one inspection
            detail below and at least one vehicle photo.
          </div>

          {/* Fuel level */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Fuel Level</label>
            <div className="flex flex-wrap gap-2">
              {FUEL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange("fuelLevel", level)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    form.fuelLevel === level
                      ? "bg-amber-400 text-gray-900 border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Condition fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["scratches", "Scratches"],
              ["dents", "Dents"],
              ["brokenParts", "Broken Parts"],
              ["glassDamage", "Glass Damage"],
              ["wheelDamage", "Wheel Damage"],
              ["interiorCondition", "Interior Condition"],
            ] as [keyof CarEntry, string][]).map(([key, label]) => (
              <div key={String(key)}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={(form[key] as string) || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="None"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks || ""}
              onChange={(e) => handleChange("remarks", e.target.value)}
              rows={2}
              placeholder="Any other pre-existing condition notes..."
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Single photo slots */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-500" /> Vehicle Photos
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SINGLE_PHOTO_SLOTS.map(({ key, label }) => {
                const url = form[key] as string | undefined;
                return (
                  <div key={String(key)} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[String(key)]?.click()}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 flex items-center justify-center overflow-hidden bg-gray-50 relative"
                    >
                      {uploadingSlot === String(key) ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveUrl(url)} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    <span className="text-[10px] font-semibold text-gray-500 text-center">{label}</span>
                    <input
                      ref={(el) => { fileInputRefs.current[String(key)] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSinglePhotoUpload(key, e)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Damage photos (multi) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Damage Photos</label>
            <div className="flex flex-wrap gap-3">
              {(form.photoDamages || []).map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveUrl(url)} alt="Damage" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeDamagePhoto(url)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => damagesInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 flex items-center justify-center bg-gray-50"
              >
                {uploadingSlot === "photoDamages" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <Camera className="w-4 h-4 text-gray-300" />
                )}
              </button>
              <input
                ref={damagesInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleDamagePhotosUpload}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
            <ShieldCheck className="w-4 h-4" />
            {isComplete ? "Inspection requirements met" : "Inspection incomplete"}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploadingSlot !== null}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-500 text-gray-900 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
