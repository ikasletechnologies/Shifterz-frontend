"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, Car, Clock, Calendar, Plus, AlertTriangle, Trash2, Eye, Home } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCall } from "@/services/api.client";
import { formatVehicleNumber, getVehicleType, normalizeVehicleNumber } from "@/utils/vehicleNumber";

interface VehicleCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  onDeliver?: (data: any) => void;
  onDelete?: (data: any) => void;
  onViewExistingRecord?: (car: any) => void;
  initialData?: any;
  cars?: any[];
}

export default function VehicleCheckInDialog({
  isOpen,
  onClose,
  onSubmit,
  onDeliver,
  onDelete,
  onViewExistingRecord,
  initialData,
  cars,
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
  const [duplicateWarning, setDuplicateWarning] = useState<{
    vehicleNo: string;
    inTime: string;
    status: string;
    originalRecord?: any;
  } | null>(null);

  const formatCheckinDateTimeDisplay = (input?: string) => {
    if (!input) return "—";
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours24 = d.getHours();
      const hours12 = hours24 % 12 || 12;
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours24 >= 12 ? "pm" : "am";
      return `${day} ${month} ${year}, ${hours12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return input;
  };

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
    if (normalized.length >= 4) {
      // 1. Check if vehicle is currently active in workshop (Duplicate Check-In)
      if (!initialData) {
        try {
          let allCars: any[] = cars || [];
          if (!allCars || allCars.length === 0) {
            allCars = await apiCall("/carin");
          }
          const activeDuplicate = (allCars || []).find((c: any) => {
            const vNum = normalizeVehicleNumber(c.vehicleNo || c.vehicle || c.vehicleNumber || "");
            const isNotDelivered = c.status !== "Delivered" && c.status !== "Out";
            return vNum === normalized && isNotDelivered;
          });

          if (activeDuplicate) {
            const formattedInTime = formatCheckinDateTimeDisplay(activeDuplicate.inTime);
            setDuplicateWarning({
              vehicleNo: activeDuplicate.vehicleNo || activeDuplicate.vehicle || formData.vehicleNumber,
              inTime: formattedInTime,
              status: activeDuplicate.status === "Ongoing" ? "In Workshop" : (activeDuplicate.status || "In Workshop"),
              originalRecord: activeDuplicate,
            });
            return;
          }
        } catch {
          // Ignore fetch errors
        }
      }

      // 2. If not active duplicate, auto-fill details from previous visit quietly
      if (!formData.customerName || !formData.phone) {
        try {
          const details = await apiCall(`/vehicle/${normalized}`);
          if (details && (details.name || details.customer)) {
            setFormData((prev) => ({
              ...prev,
              customerName: prev.customerName || details.name || details.customer,
              phone: prev.phone || details.phone,
              carModel: prev.carModel || details.model,
            }));
          }
        } catch {
          // Ignore if vehicle not found
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Duplicate Check-In Validation FIRST (before required field checks or toasts)
    if (!initialData && formData.vehicleNumber) {
      try {
        let allCars: any[] = cars || [];
        if (!allCars || allCars.length === 0) {
          allCars = await apiCall("/carin");
        }
        const normalizedInput = normalizeVehicleNumber(formData.vehicleNumber);

        const activeDuplicate = (allCars || []).find((c: any) => {
          const vNum = normalizeVehicleNumber(c.vehicleNo || c.vehicle || c.vehicleNumber || "");
          const isNotDelivered = c.status !== "Delivered" && c.status !== "Out";
          return vNum === normalizedInput && isNotDelivered;
        });

        if (activeDuplicate) {
          const formattedInTime = formatCheckinDateTimeDisplay(activeDuplicate.inTime);
          setDuplicateWarning({
            vehicleNo: activeDuplicate.vehicleNo || activeDuplicate.vehicle || formData.vehicleNumber,
            inTime: formattedInTime,
            status: activeDuplicate.status === "Ongoing" ? "In Workshop" : (activeDuplicate.status || "In Workshop"),
            originalRecord: activeDuplicate,
          });
          return;
        }
      } catch (err) {
        // If fetch fails, API submission will handle errors
      }
    }

    if (!formData.vehicleNumber || !formData.carModel || !formData.customerName || !formData.phone || !formData.odometer) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    if (formData.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
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

          <div className="flex items-center gap-2">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(initialData);
                }}
                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 cursor-pointer"
              title="Close"
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
                Phone <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isDelivered}
                placeholder="XXXXX XXXXX"
                required
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

          {/* Check-In Date & Check-In Time Section */}
          {initialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-In Date</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {displayDate || (initialData.inTime ? parseDateTimeStr(initialData.inTime).dateStr : "—")}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-In Time</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {displayTime || (initialData.inTime ? parseDateTimeStr(initialData.inTime).timeStr : "—")}
                </p>
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
          ) : initialData ? (
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md text-base cursor-pointer"
            >
              ✓ Update
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

      {/* Vehicle Already Checked In Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Red Alert Icon Container */}
            <div className="flex justify-center mb-4">
              <div className="relative flex items-center justify-center">
                {/* Subtle top sparkles/dashes matching image design */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                  <span className="w-1 h-2 bg-red-300 rounded-full rotate-[-25deg]"></span>
                  <span className="w-1 h-2.5 bg-red-300 rounded-full"></span>
                  <span className="w-1 h-2 bg-red-300 rounded-full rotate-[25deg]"></span>
                </div>
                <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-8 h-8 text-red-600 stroke-[2.2]" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Vehicle Already Checked In
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-normal">
              This vehicle is already in the workshop.
              <br />
              Duplicate check-in is not allowed.
            </p>

            <div className="bg-[#f4f7fc] border border-slate-100 rounded-2xl p-4 sm:p-5 text-left mb-6 space-y-4">
              {/* Row 1: Registration No. */}
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-2.5 w-36 sm:w-40 text-slate-900 font-bold shrink-0">
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Registration No.</span>
                </div>
                <span className="text-slate-300 mx-2 sm:mx-3 font-light">|</span>
                <div className="flex-1 overflow-hidden">
                  <span className="bg-[#e0ebff] text-[#1d4ed8] font-bold text-sm px-3 py-1 rounded-lg font-mono tracking-wide inline-block">
                    {formatVehicleNumber(duplicateWarning.vehicleNo)}
                  </span>
                </div>
              </div>

              {/* Row 2: Check-In Time */}
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-2.5 w-36 sm:w-40 text-slate-900 font-bold shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Check-In Time</span>
                </div>
                <span className="text-slate-300 mx-2 sm:mx-3 font-light">|</span>
                <div className="flex-1 text-slate-800 font-semibold text-sm">
                  {duplicateWarning.inTime}
                </div>
              </div>

              {/* Row 3: Current Status */}
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-2.5 w-36 sm:w-40 text-slate-900 font-bold shrink-0">
                  <Home className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Current Status</span>
                </div>
                <span className="text-slate-300 mx-2 sm:mx-3 font-light">|</span>
                <div className="flex-1">
                  <span className="bg-emerald-100 text-emerald-600 font-semibold text-xs px-2.5 py-1 rounded-md inline-block">
                    {duplicateWarning.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 mb-6" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const recordToView = duplicateWarning.originalRecord;
                  setDuplicateWarning(null);
                  if (onViewExistingRecord && recordToView) {
                    onViewExistingRecord(recordToView);
                  }
                }}
                className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-sm py-3 px-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                <span>View Existing Record</span>
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl text-center transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
