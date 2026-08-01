"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, Car, Clock, Calendar, Plus, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCall } from "@/services/api.client";
import { formatVehicleNumber, getVehicleType, normalizeVehicleNumber } from "@/utils/vehicleNumber";

interface VehicleCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  onDeliver?: (data: any) => void;
  initialData?: any;
}

export default function VehicleCheckInDialog({
  isOpen,
  onClose,
  onSubmit,
  onDeliver,
  initialData,
}: VehicleCheckInDialogProps) {
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    carModel: "",
    customerName: "",
    phone: "",
    service: "PPF Full Body",
    odometer: "",
    inTime: "",
    notes: "",
  });

  const [currentTime, setCurrentTime] = useState<string>("");
  const [displayDate, setDisplayDate] = useState<string>("");
  const [displayTime, setDisplayTime] = useState<string>("");
  const [services, setServices] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{ vehicleNo: string; inTime: string; status: string } | null>(null);

  const parseDateTimeStr = (input?: string) => {
    if (!input) return { dateStr: "", timeStr: "" };
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      const year = d.getFullYear();
      const hours24 = d.getHours();
      const hours12 = hours24 % 12 || 12;
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours24 >= 12 ? "PM" : "AM";
      return {
        dateStr: `${month}/${day}/${year}`,
        timeStr: `${hours12}:${minutes} ${ampm}`,
      };
    }
    const parts = input.trim().split(" ");
    if (parts.length >= 2) {
      return { dateStr: parts[0], timeStr: parts.slice(1).join(" ") };
    }
    return { dateStr: input, timeStr: "" };
  };

  const updateCurrentTime = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const year = now.getFullYear();

    // Convert to 12-hour format
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const ampm = hours24 >= 12 ? "PM" : "AM";

    const headerTime = `${hours12}:${minutes}:${seconds} ${ampm}`;
    const dateStr = `${month}/${day}/${year}`;
    const timeStr = `${hours12}:${minutes} ${ampm}`;
    const fieldTime = `${dateStr} ${timeStr}`;

    setCurrentTime(headerTime);
    setDisplayDate(dateStr);
    setDisplayTime(timeStr);
    setFormData((prev) => ({ ...prev, inTime: fieldTime }));
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          vehicleNumber: initialData.vehicleNo || initialData.vehicle || "",
          carModel: initialData.model || "",
          customerName: initialData.customer || "",
          phone: initialData.phone || "",
          service: initialData.service || "PPF Full Body",
          odometer: initialData.odometer || "",
          inTime: initialData.inTime || "",
          notes: initialData.notes || "",
        });
        const { dateStr, timeStr } = parseDateTimeStr(initialData.inTime);
        setDisplayDate(dateStr || new Date().toLocaleDateString("en-US"));
        setDisplayTime(timeStr || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setFormData({
          vehicleNumber: "",
          carModel: "",
          customerName: "",
          phone: "",
          service: "PPF Full Body",
          odometer: "",
          inTime: "",
          notes: "",
        });
        updateCurrentTime();
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiCall("/services");
        setServices(data || []);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setServices([
          { id: "1", name: "PPF Full Body" },
          { id: "2", name: "PPF Bonnet" },
          { id: "3", name: "C3 Coating" },
          { id: "4", name: "Graphene Coating" },
          { id: "5", name: "Interior Detailing" },
        ]);
      }
    };
    fetchServices();
  }, []);



  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleVehicleBlur = async () => {
    const normalized = normalizeVehicleNumber(formData.vehicleNumber);
    if (normalized.length > 4 && (!formData.customerName || !formData.phone)) {
      try {
        const details = await apiCall(`/vehicle/${normalized}`);
        if (details && details.name) {
          setFormData((prev) => ({
            ...prev,
            customerName: prev.customerName || details.name,
            phone: prev.phone || details.phone,
            carModel: prev.carModel || details.model,
          }));
          toast.success("Customer details auto-filled!");
        }
      } catch {
        // Ignore if vehicle not found
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleNumber || !formData.carModel || !formData.customerName || !formData.odometer) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    // 24-Hour Duplicate Check-In Validation
    if (!initialData) {
      try {
        const allCars: any[] = await apiCall("/carin");
        const normalizedInput = normalizeVehicleNumber(formData.vehicleNumber);
        const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
        const recentDuplicate = (allCars || []).find((c: any) => {
          const vNum = normalizeVehicleNumber(c.vehicleNo || c.vehicle || c.vehicleNumber || "");
          const checkinTime = new Date(c.inTime).getTime();
          return vNum === normalizedInput && !isNaN(checkinTime) && checkinTime >= cutoffTime;
        });

        if (recentDuplicate) {
          const formattedInTime = new Date(recentDuplicate.inTime).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          setDuplicateWarning({
            vehicleNo: formData.vehicleNumber,
            inTime: formattedInTime,
            status: recentDuplicate.status || "Ongoing",
          });
          return;
        }
      } catch (err) {
        // If fetch fails, API submission will enforce server-side validation
      }
    }

    if (onSubmit) {
      onSubmit({
        id: initialData?.id || Date.now().toString(),
        entryId: initialData?.entryId || `IN-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}`,
        vehicleNo: formData.vehicleNumber,
        vehicle: formData.vehicleNumber,
        model: formData.carModel,
        customer: formData.customerName,
        phone: formData.phone,
        service: formData.service,
        inTime: formData.inTime || new Date().toISOString(),
        status: initialData?.status || "Ongoing",
        notes: formData.notes,
        odometer: formData.odometer,
      });
    }
    onClose();
  };

  const handleDeliverAction = () => {
    const nowIso = new Date().toISOString();
    const deliverData = {
      id: initialData?.id || Date.now().toString(),
      entryId: initialData?.entryId || `IN-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}`,
      vehicleNo: formData.vehicleNumber,
      vehicle: formData.vehicleNumber,
      model: formData.carModel,
      customer: formData.customerName,
      phone: formData.phone,
      service: formData.service,
      inTime: formData.inTime || nowIso,
      outTime: nowIso,
      status: "Delivered",
      notes: formData.notes,
      odometer: formData.odometer,
    };

    if (onDeliver) {
      onDeliver(deliverData);
    } else if (onSubmit) {
      onSubmit(deliverData);
    }
    onClose();
  };

  const isDelivered = initialData?.status === "Delivered" || initialData?.status === "Out";
  const isInWorkshop = initialData && !isDelivered;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 shrink-0">
            <Car className="w-6 h-6 text-yellow-500 shrink-0" />
            <h2 className="text-xl sm:text-xl font-bold text-gray-900 whitespace-nowrap">
              {isDelivered ? "Car Delivered Details" : initialData ? "Vehicle Details & Update" : "Car Check-In"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Vehicle Number & Car Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                onBlur={handleVehicleBlur}
                disabled={isDelivered}
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent uppercase disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Car Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleChange}
                disabled={isDelivered}
                placeholder="Toyota Fortuner"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
                required
              />
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                disabled={isDelivered}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isDelivered}
                placeholder="XXXXX XXXXX"
              />
            </div>
          </div>

          {/* Row 3: Service & Odometer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                disabled={isDelivered}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
              >
                {services.length > 0 ? (
                  services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option>PPF Full Body</option>
                    <option>PPF Bonnet</option>
                    <option>C3 Coating</option>
                    <option>Graphene Coating</option>
                    <option>Interior Detailing</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Odometer (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                disabled={isDelivered}
                placeholder="42500"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
                required
                min="1"
              />
            </div>
          </div>

          {/* Check-In / Check-Out & Status Info Section */}
          {initialData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-In Date & Time</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {initialData.inTime ? new Date(initialData.inTime).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-Out Date & Time</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-600" />
                  {initialData.outTime ? new Date(initialData.outTime).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "Pending Delivery"}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isInWorkshop ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {isInWorkshop ? "In Workshop" : "Delivered"}
                </span>
              </div>
            </div>
          )}

          {/* Row 5: Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes / Condition
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isDelivered}
              placeholder="Pre-existing scratches, dents, special instructions..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-200"
            />
          </div>

          {/* Submit Button */}
          {isDelivered ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors border border-gray-300 flex items-center justify-center gap-2"
            >
              Close (Read Only)
            </button>
          ) : isInWorkshop ? (
            <button
              type="button"
              onClick={handleDeliverAction}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md text-base cursor-pointer"
            >
              ✓ Delivered
            </button>
          ) : (
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              ✓ Check-In Car
            </button>
          )}
        </form>
      </div>

      {/* 24-Hour Duplicate Warning Popup Screen */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vehicle Already Checked In
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Vehicle <strong className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">{duplicateWarning.vehicleNo}</strong> was already checked in.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 text-left mb-6 space-y-1.5">
              <p><strong>Previous Check-In Time:</strong> {duplicateWarning.inTime}</p>
              <p><strong>Current Status:</strong> {duplicateWarning.status}</p>
              <p className="text-[11px] text-amber-700 mt-2 pt-1 border-t border-amber-200/60 font-medium">
                ⚠️ Registering the same vehicle number twice is not allowed.
              </p>
            </div>
            <button
              onClick={() => setDuplicateWarning(null)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Dismiss & Check Registration Number
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
