"use client";

import { useState, useEffect } from "react";
import { X, Car, Clock, Calendar, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { getServices, fetchVehicleDetails, getEmployees } from "@/lib/api";
import { formatVehicleNumber, getVehicleType, normalizeVehicleNumber } from "@/utils/vehicleNumber";
import AddTechnicianDialog from "./AddTechnicianDialog";

interface CarCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
}

export default function CarCheckInDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CarCheckInDialogProps) {
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    carModel: "",
    customerName: "",
    phone: "",
    service: "PPF Full Body",
    technician: "Arjun",
    odometer: "",
    inTime: "",
    notes: "",
  });

  const [currentTime, setCurrentTime] = useState<string>("");
  const [displayTime, setDisplayTime] = useState<string>("");
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([
    "Arjun",
    "Sathish",
    "Kumar",
    "Rajesh",
  ]);

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
    const fieldTime = `${month}/${day}/${year} ${hours12}:${minutes} ${ampm}`;

    setCurrentTime(headerTime);
    setDisplayTime(fieldTime);
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
          technician: initialData.technician || initialData.technicianIn || "Arjun",
          odometer: initialData.odometer || "",
          inTime: initialData.inTime || "",
          notes: initialData.notes || "",
        });
      } else {
        setFormData({
          vehicleNumber: "",
          carModel: "",
          customerName: "",
          phone: "",
          service: "PPF Full Body",
          technician: "Arjun",
          odometer: "",
          inTime: "",
          notes: "",
        });
        updateCurrentTime();
        const timer = setInterval(updateCurrentTime, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data || []);
        // Set first service as default if available and no initialData
        if (data && data.length > 0 && !initialData) {
          setFormData(prev => ({ ...prev, service: data[0].name }));
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        // Fallback to default services if API fails
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

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const emps = await getEmployees();
        const techNames = emps
          .filter((emp: any) => emp.role === "TECHNICIAN" && emp.status === "Active")
          .map((emp: any) => emp.name);
        
        if (techNames.length > 0) {
          setTechnicians(techNames);
          // Set first active technician as default if not already initialized
          setFormData((prev) => {
            if (!prev.technician || !techNames.includes(prev.technician)) {
              return { ...prev, technician: techNames[0] };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to load technicians:", err);
      }
    };

    if (isOpen) {
      loadTechnicians();
    }
  }, [isOpen]);



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
    // We can also normalize the vehicle number before passing it to the API
    const normalized = normalizeVehicleNumber(formData.vehicleNumber);
    if (normalized.length > 4 && (!formData.customerName || !formData.phone)) {
      try {
        const details = await fetchVehicleDetails(normalized);
        if (details && details.name) {
          setFormData((prev) => ({
            ...prev,
            customerName: prev.customerName || details.name,
            phone: prev.phone || details.phone,
            carModel: prev.carModel || details.model,
          }));
          toast.success("Customer details auto-filled!");
        }
      } catch (error) {
        // Ignore if vehicle not found
      }
    }
  };

  const handleAddTechnician = (technicianData: {
    name: string;
    phone: string;
    experience: string;
    specialization: string;
  }) => {
    if (!technicians.includes(technicianData.name)) {
      setTechnicians((prev) => [...prev, technicianData.name]);
      setFormData((prev) => ({ ...prev, technician: technicianData.name }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate vehicle number format using the new utility
    const vehicleType = getVehicleType(formData.vehicleNumber);
    if (vehicleType === "INVALID") {
      toast.error("Invalid vehicle number format. Expected e.g. TN 04 AB 1234 or BH 12 AB 1234");
      return;
    }

    if (!formData.odometer || Number(formData.odometer) <= 0) {
      toast.error("Odometer must be greater than 0");
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
        technician: formData.technician,
        technicianIn: formData.technician,
        inTime: formData.inTime || new Date().toISOString(),
        status: initialData?.status || "Ongoing",
        notes: formData.notes,
        odometer: formData.odometer,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">{initialData ? "Edit Car Entry" : "Car Check-In"}</h2>
          </div>
         
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
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
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent uppercase"
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
                placeholder="Toyota Fortuner"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                onInvalid={(e) => {
                  e.preventDefault();
                  toast.error("Phone number must be exactly 10 digits");
                }}
              />
            </div>
          </div>

          {/* Row 3: Service & Technician */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
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
                Technician
              </label>
              <div className="flex gap-2">
                <select
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
                >
                  {technicians.map((tech) => (
                    <option key={tech}>{tech}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddTechnicianOpen(true)}
                  className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors flex items-center gap-2"
                  title="Add new technician"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: Odometer & In Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Odometer (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                placeholder="42500"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                In Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayTime}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-default"
                />
                <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes / Condition
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Pre-existing scratches, dents, special instructions..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ✓ Check-In Car
          </button>
        </form>
      </div>

      <AddTechnicianDialog
        isOpen={isAddTechnicianOpen}
        onClose={() => setIsAddTechnicianOpen(false)}
        onSubmit={handleAddTechnician}
      />
    </div>
  );
}
