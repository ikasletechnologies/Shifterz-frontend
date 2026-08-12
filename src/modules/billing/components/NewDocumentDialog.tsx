"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect, useMemo } from "react";
import {
  X, FileText, Plus, Trash2, Loader2, Clock, Eye,
  MapPin, CheckCircle2, ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchVehicleDetails, getServices } from "@/lib/api";
import { getJobCards } from "@/modules/job-card/services/job-card.service";
import { JobCard } from "@/modules/job-card/types/job-card.types";

const BILLING_ELIGIBLE_JOB_STATUSES = ["Ready For Billing", "QC Passed", "Delivered", "Out"];

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (doc: any) => void;
  existingDocuments?: any[];
  initialData?: any;
}

function numberToWords(num: number): string {
  if (!num || num <= 0) return "Rupees Zero Only";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }
  
  const integerPart = Math.floor(num);
  return `Rupees ${inWords(integerPart)} Only`;
}

export default function NewDocumentDialog({
  isOpen,
  onClose,
  onSubmit,
  existingDocuments = [],
  initialData = null,
}: NewDocumentDialogProps) {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [activeTab, setActiveTab] = useState<"service" | "parts">("service");
  const [currentTime, setCurrentTime] = useState("");

  const [formData, setFormData] = useState({
    type: "Estimate",
    status: "Pending",
    client: "",
    phone: "",
    vehicle: "",
    model: "",
    chassisNo: "",
    engineNo: "",
    mileage: "",
    fuelType: "Petrol",
    billingAddress: "",
    discount: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    gstNumber: "",
    jobCardNo: "",
    serviceAdvisor: "",
    technician: "",
    serviceCategory: "General Service",
    customerComplaint: "",
    workDescription: "",
    advanceAmount: "0.00",
    bankDetails: "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
    paymentTerms: "Cash",
    deliveryTerms: "Delivery within 15 days after receipt of advance payment.",
    authorizedSignatory: "Authorized Signatory",
    warranty: "3 Months / 5,000 KM",
    discountReason: "",
  });

  const [items, setItems] = useState([
    { desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
  ]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [lineDiscountAmount, setLineDiscountAmount] = useState(0);
  const [isFetchingVehicle, setIsFetchingVehicle] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [eligibleJobs, setEligibleJobs] = useState<JobCard[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobId, setJobId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          type: initialData.type || "Estimate",
          status: initialData.status || "Pending",
          client: initialData.client || "",
          phone: initialData.phone || "",
          vehicle: initialData.vehicle || "",
          model: initialData.model || "",
          chassisNo: initialData.chassisNo || "",
          engineNo: initialData.engineNo || "",
          mileage: initialData.mileage || "",
          fuelType: initialData.fuelType || "Petrol",
          billingAddress: initialData.billingAddress || "",
          discount: (initialData.discount || 0).toString(),
          invoiceDate: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "",
          notes: initialData.notes || "",
          gstNumber: initialData.gstNumber || "",
          jobCardNo: initialData.jobCardNo || "",
          serviceAdvisor: initialData.serviceAdvisor || "",
          technician: initialData.technician || "",
          serviceCategory: initialData.serviceCategory || "General Service",
          customerComplaint: initialData.customerComplaint || "",
          workDescription: initialData.workDescription || "",
          advanceAmount: (initialData.advanceAmount || "0.00").toString(),
          bankDetails: initialData.bankDetails || "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
          paymentTerms: initialData.paymentTerms || "Cash",
          deliveryTerms: initialData.deliveryTerms || "Delivery within 15 days after receipt of advance payment.",
          authorizedSignatory: initialData.authorizedSignatory || "Authorized Signatory",
          warranty: initialData.warranty || "3 Months / 5,000 KM",
          discountReason: initialData.discountReason || "",
        });
        if (Array.isArray(initialData.items) && initialData.items.length > 0) {
          setItems(initialData.items);
        } else if (initialData.service || initialData.amount) {
          setItems([{
            desc: initialData.service || "Service Charge",
            qty: 1,
            price: initialData.amount || 0,
            amount: initialData.amount || 0,
            discountPercent: 0,
            gstPercent: 18,
            warranty: initialData.warranty || ""
          }]);
        }
      } else {
        setFormData({
          type: "Estimate",
          status: "Pending",
          client: "",
          phone: "",
          vehicle: "",
          model: "",
          chassisNo: "",
          engineNo: "",
          mileage: "",
          fuelType: "Petrol",
          billingAddress: "",
          discount: "",
          invoiceDate: new Date().toISOString().split("T")[0],
          dueDate: "",
          notes: "",
          gstNumber: "",
          jobCardNo: "",
          serviceAdvisor: "",
          technician: "",
          serviceCategory: "General Service",
          customerComplaint: "",
          workDescription: "",
          advanceAmount: "0.00",
          bankDetails: "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
          paymentTerms: "Cash",
          deliveryTerms: "Delivery within 15 days after receipt of advance payment.",
          authorizedSignatory: "Authorized Signatory",
          warranty: "3 Months / 5,000 KM",
          discountReason: "",
        });
        setItems([
          { desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }
        ]);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextDocNo = useMemo(() => {
    if (initialData && initialData.id) {
      return initialData.id;
    }
    const date = new Date(formData.invoiceDate || Date.now());
    const year = date.getFullYear();
    const month = date.getMonth();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    const fy = `${startYear.toString().slice(2)}-${endYear.toString().slice(2)}`;

    const docTypePrefix = {
      Invoice: `STZ-${fy}-`,
      Quotation: `STZ-QT-${fy}-`,
      Estimate: `STZ-EST-${fy}-`,
    }[formData.type] || `STZ-DOC-${fy}-`;

    let maxId = 0;
    const relevantDocs = existingDocuments.filter((doc) => doc.id?.startsWith(docTypePrefix));
    relevantDocs.forEach((doc) => {
      const numStr = doc.id.replace(docTypePrefix, "");
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });
    return `${docTypePrefix}${maxId + 1}`;
  }, [formData.type, formData.invoiceDate, existingDocuments, initialData]);

  const handleVehicleBlur = async () => {
    const vNo = formData.vehicle.trim().toUpperCase();
    if (!vNo) return;
    
    setIsFetchingVehicle(true);
    try {
      const data = await fetchVehicleDetails(vNo);
      if (data && data.name) {
        setFormData((prev) => ({
          ...prev,
          client: prev.client || data.name,
          phone: prev.phone || data.phone,
        }));
        toast.success("Vehicle details auto-filled!");
      }
    } catch {
      // Ignore
    } finally {
      setIsFetchingVehicle(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        type: "Estimate",
        status: "Pending",
        client: "",
        phone: "",
        vehicle: "",
        model: "",
        chassisNo: "",
        engineNo: "",
        mileage: "",
        fuelType: "Petrol",
        billingAddress: "",
        discount: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
        gstNumber: "",
        jobCardNo: "",
        serviceAdvisor: "",
        technician: "",
        serviceCategory: "General Service",
        customerComplaint: "",
        workDescription: "",
        advanceAmount: "0.00",
        bankDetails: "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
        paymentTerms: "Cash",
        deliveryTerms: "Delivery within 15 days after receipt of advance payment.",
        authorizedSignatory: "Authorized Signatory",
        warranty: "3 Months / 5,000 KM",
        discountReason: "",
      });
      setItems([{ desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }]);
      setJobId("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && formData.type === "Invoice") {
      setIsLoadingJobs(true);
      getJobCards()
        .then((jobs) => {
          setEligibleJobs((jobs || []).filter((j) => BILLING_ELIGIBLE_JOB_STATUSES.includes(j.status)));
        })
        .catch((err) => {
          console.error("Failed to load job cards:", err);
          setEligibleJobs([]);
        })
        .finally(() => setIsLoadingJobs(false));
    }
  }, [isOpen, formData.type]);

  const handleJobSelect = (selectedJobId: string) => {
    setJobId(selectedJobId);
    const job = eligibleJobs.find((j) => j.id === selectedJobId);
    if (job) {
      setFormData((prev) => ({
        ...prev,
        client: job.customer,
        phone: job.phone || job.customerPhone || prev.phone,
        vehicle: job.vehicle,
        jobCardNo: job.id,
        serviceAdvisor: (job as any).serviceAdvisor || prev.serviceAdvisor,
      }));

      const jobServiceName = (job.service || "").trim();
      if (jobServiceName && availableServices.length > 0) {
        const matched = availableServices.find(
          (s) => s.name.toLowerCase() === jobServiceName.toLowerCase()
        );
        const price = matched?.price || 0;
        const warranty = matched?.warranty || "";
        setItems([
          { desc: jobServiceName, qty: 1, price, amount: price, discountPercent: 0, gstPercent: 18, warranty },
        ]);
        if (warranty) {
          setFormData((prev) => ({ ...prev, warranty: prev.warranty || warranty }));
        }
      } else if (jobServiceName) {
        setItems([
          { desc: jobServiceName, qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
        ]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoadingServices(true);
      getServices()
        .then((data) => {
          setAvailableServices(Array.isArray(data) ? data : []);
          setIsLoadingServices(false);
        })
        .catch((err) => {
          console.error("Failed to load services:", err);
          setAvailableServices([]);
          setIsLoadingServices(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    let subtotal = 0;
    let lineDiscTotal = 0;
    let gstTotal = 0;
    items.forEach((item) => {
      const amt = (item.qty || 0) * (item.price || 0);
      const lineDiscPct = item.discountPercent || 0;
      const lineDiscAmt = (amt * lineDiscPct) / 100;
      const lineGstPct = item.gstPercent ?? 18;
      subtotal += amt;
      lineDiscTotal += lineDiscAmt;
      gstTotal += ((amt - lineDiscAmt) * lineGstPct) / 100;
    });
    setBaseAmount(subtotal);
    setLineDiscountAmount(lineDiscTotal);
    setGstAmount(gstTotal);
  }, [items]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };
    updatedItem.amount = (updatedItem.qty || 0) * (updatedItem.price || 0);
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const formatVehicleNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase();
    if (cleaned.length === 0) return "";

    let formatted = "";
    formatted += cleaned.substring(0, 2);
    if (cleaned.length > 2) formatted += " " + cleaned.substring(2, 4);
    if (cleaned.length > 4) formatted += " " + cleaned.substring(4, 6);
    if (cleaned.length > 6) formatted += " " + cleaned.substring(6, 10);

    return formatted;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicle") {
      setFormData((prev) => ({ ...prev, [name]: formatVehicleNumber(value) }));
    } else if (name === "gstNumber") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase().slice(0, 15) }));
    } else if (name === "discount") {
      const discountPercent = Math.min(100, Math.max(0, Number(value) || 0));
      setFormData((prev) => ({ ...prev, [name]: discountPercent.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.vehicle.trim()) {
      const vehicleRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,2}\s\d{1,4}$/;
      if (!vehicleRegex.test(formData.vehicle)) {
        toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
        return;
      }
    }

    if (onSubmit) {
      const overallDiscountPercent = parseFloat(formData.discount) || 0;
      const overallDiscountAmount = ((baseAmount - lineDiscountAmount) * overallDiscountPercent) / 100;
      const totalDiscount = lineDiscountAmount + overallDiscountAmount;

      const validItems = items.filter((i) => i.desc && i.desc.trim() !== "");
      let computedService = "";
      if (validItems.length > 0) {
        computedService = validItems.length > 1
          ? `${validItems[0].desc.trim()} (+${validItems.length - 1} more)`
          : validItems[0].desc.trim();
      } else if (items.length > 0 && items[0].desc && items[0].desc.trim() !== "") {
        computedService = items[0].desc.trim();
      } else if (formData.workDescription && formData.workDescription.trim() !== "") {
        computedService = formData.workDescription.trim();
      } else if (formData.serviceCategory && formData.serviceCategory.trim() !== "") {
        computedService = formData.serviceCategory.trim();
      } else if (initialData && initialData.service && initialData.service.trim() !== "" && initialData.service !== "—") {
        computedService = initialData.service.trim();
      } else {
        computedService = "General Service";
      }

      const newDoc = {
        id: initialData?.id || nextDocNo,
        type: formData.type,
        client: formData.client,
        phone: formData.phone,
        vehicle: formData.vehicle,
        model: formData.model || "",
        chassisNo: formData.chassisNo || "",
        engineNo: formData.engineNo || "",
        mileage: formData.mileage || "",
        fuelType: formData.fuelType || "Petrol",
        billingAddress: formData.billingAddress || "",
        service: computedService,
        serviceCategory: formData.serviceCategory || "General Service",
        customerComplaint: formData.customerComplaint || "",
        workDescription: formData.workDescription || "",
        advanceAmount: formData.advanceAmount || "0.00",
        serviceAdvisor: formData.serviceAdvisor || "",
        technician: formData.technician || "",
        jobCardNo: formData.jobCardNo || "",
        amount: baseAmount,
        gst: gstAmount,
        discount: totalDiscount,
        date: formData.invoiceDate,
        dueDate: formData.dueDate || formData.invoiceDate,
        status: formData.status,
        notes: formData.notes,
        gstNumber: formData.gstNumber || null,
        items: items,
        bankDetails: formData.bankDetails,
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        authorizedSignatory: formData.authorizedSignatory,
        warranty: formData.warranty || null,
        discountReason: totalDiscount > 0 ? (formData.discountReason || null) : null,
        jobId: formData.type === "Invoice" ? (jobId || null) : null,
      };
      onSubmit(newDoc);
    }
    onClose();
  };

  if (!isOpen) return null;

  const overallDiscountPercent = parseFloat(formData.discount) || 0;
  const overallDiscountAmount = ((baseAmount - lineDiscountAmount) * overallDiscountPercent) / 100;
  const totalDiscount = lineDiscountAmount + overallDiscountAmount;
  const taxableAmount = Math.max(0, baseAmount - totalDiscount);
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const grandTotal = taxableAmount + gstAmount;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-50/95 rounded-2xl w-full max-w-[1400px] shadow-2xl border border-slate-200/80 max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Row with Stepper Bar & Clock */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">{initialData ? "Edit Document" : "New Document"}</h2>
            <p className="text-xs text-slate-500 font-medium">{initialData ? "Edit Estimate, Quotation or Invoice" : "Create Estimate, Quotation or Invoice"}</p>
          </div>

          {/* Stepper Bar */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Document Type</p>
                <p className="text-[10px] text-slate-400">Select type</p>
              </div>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-200">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">Customer & Vehicle</p>
                <p className="text-[10px] text-slate-400">Enter details</p>
              </div>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-200">
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">Items & Summary</p>
                <p className="text-[10px] text-slate-400">Add items and finalize</p>
              </div>
            </div>
          </div>

          {/* Clock & Close Controls */}
          <div className="flex items-center gap-3">
            {currentTime && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {currentTime}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (Document Type & Customer & Vehicle) - 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Document Type Selection Cards */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Document Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: "Estimate", label: "Estimate", desc: "Prepare an estimate" },
                    { type: "Quotation", label: "Quotation", desc: "Convert estimate to quotation" },
                    { type: "Invoice", label: "Invoice", desc: "Convert quotation to invoice" },
                  ].map((item) => {
                    const isSelected = formData.type === item.type;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => setFormData((prev) => ({ ...prev, type: item.type }))}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                          isSelected
                            ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-blue-100 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer & Vehicle Details Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Customer & Vehicle</h3>
                
                {/* Customer Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          placeholder="Hari (8825972129)"
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          required
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> New
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                      <PhoneInput
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="8825972129"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">GSTIN (If applicable)</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="33ABCDE1234F1Z5"
                        maxLength={15}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Billing Address</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="billingAddress"
                          value={formData.billingAddress}
                          onChange={handleChange}
                          placeholder="12, Gandhi Street, Mettupalayam Road, Coimbatore"
                          className="w-full pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <MapPin className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vehicle Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Vehicle Number <span className="text-red-500">*</span></span>
                        {isFetchingVehicle && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      </label>
                      <input
                        type="text"
                        name="vehicle"
                        value={formData.vehicle}
                        onChange={handleChange}
                        onBlur={handleVehicleBlur}
                        placeholder="TN 09 XY 5678"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        placeholder="Maruti Baleno Zeta"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Job / Service Details */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job / Service Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Job Card No.</label>
                      {formData.type === "Invoice" && eligibleJobs.length > 0 ? (
                        <select
                          value={jobId}
                          onChange={(e) => handleJobSelect(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                        >
                          <option value="">Manual Entry</option>
                          {eligibleJobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.id} ({j.vehicle})</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="jobCardNo"
                          value={formData.jobCardNo}
                          onChange={handleChange}
                          placeholder="JC-26-27-1025"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Service Advisor</label>
                      <input
                        type="text"
                        name="serviceAdvisor"
                        value={formData.serviceAdvisor}
                        onChange={handleChange}
                        placeholder="Arun Kumar"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Technician</label>
                      <input
                        type="text"
                        name="technician"
                        value={formData.technician}
                        onChange={handleChange}
                        placeholder="Karthik"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Service Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="serviceCategory"
                        value={formData.serviceCategory}
                        onChange={handleChange}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option>General Service</option>
                        <option>Bodywork & Paint</option>
                        <option>PPF & Coating</option>
                        <option>Electrical & Diagnostics</option>
                        <option>AC Repair</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Complaint / Request</label>
                      <textarea
                        name="customerComplaint"
                        value={formData.customerComplaint}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Car not picking up, engine noise..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Work Description</label>
                      <textarea
                        name="workDescription"
                        value={formData.workDescription}
                        onChange={handleChange}
                        rows={2}
                        placeholder="General service, engine check, replace oil filter..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Warranty */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Terms & Warranty</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Terms</label>
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option>Cash</option>
                        <option>UPI / Online</option>
                        <option>Credit Card</option>
                        <option>50% Advance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Advance Amount</label>
                      <input
                        type="text"
                        name="advanceAmount"
                        value={formData.advanceAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Warranty</label>
                      <input
                        type="text"
                        name="warranty"
                        value={formData.warranty}
                        onChange={handleChange}
                        placeholder="3 Months / 5,000 KM"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Terms & Conditions (Optional)</label>
                      <input
                        type="text"
                        name="deliveryTerms"
                        value={formData.deliveryTerms}
                        onChange={handleChange}
                        placeholder="Thank you for choosing Shifterz Auto Care."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Document Info & Items & Summary) - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Document Info Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Document Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Document No.</label>
                    <input
                      type="text"
                      value={nextDocNo}
                      readOnly
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Document Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Valid Till (For Quotation)</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      min={formData.invoiceDate}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items & Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Items & Summary</h3>
                  
                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab("service")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "service" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      Service Items
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("parts")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "parts" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      Parts / Items
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-2 text-center w-8">#</th>
                        <th className="py-2.5 px-2">Item Description</th>
                        <th className="py-2.5 px-2 w-14 text-center">Qty.</th>
                        <th className="py-2.5 px-2 w-20 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-2 w-16 text-center">Disc. (%)</th>
                        <th className="py-2.5 px-2 w-14 text-center">GST (%)</th>
                        <th className="py-2.5 px-2 w-24 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-2 w-8 text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => {
                        const lineAmount = (item.qty || 0) * (item.price || 0);
                        return (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2 text-center font-bold text-slate-400 text-[11px]">{index + 1}</td>
                            <td className="py-2 px-2 relative">
                              <input
                                type="text"
                                value={item.desc}
                                onChange={(e) => handleItemChange(index, "desc", e.target.value)}
                                onFocus={() => setFocusedItemIndex(index)}
                                onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                placeholder="Item description"
                                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                              />
                              {focusedItemIndex === index && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto top-full left-0">
                                  {isLoadingServices ? (
                                    <div className="p-3 text-xs text-slate-400 text-center">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> Loading...
                                    </div>
                                  ) : availableServices.length === 0 ? (
                                    <div className="p-3 text-xs text-slate-400 text-center">No services found</div>
                                  ) : (
                                    availableServices
                                      .filter(s => !item.desc || s.name.toLowerCase().includes(item.desc.toLowerCase()))
                                      .map((service) => (
                                        <div
                                          key={service.id}
                                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs transition-colors border-b border-slate-50 last:border-0"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            const newItems = [...items];
                                            newItems[index].desc = service.name;
                                            newItems[index].price = service.price || 0;
                                            newItems[index].amount = newItems[index].qty * (service.price || 0);
                                            newItems[index].warranty = service.warranty || "";
                                            setItems(newItems);
                                            setFocusedItemIndex(null);
                                          }}
                                        >
                                          <p className="font-bold text-slate-900">{service.name}</p>
                                          <p className="text-[10px] text-slate-500">₹{service.price?.toLocaleString("en-IN")}</p>
                                        </div>
                                      ))
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleItemChange(index, "qty", parseFloat(e.target.value) || 0)}
                                min="1"
                                className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                                min="0"
                                className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-right font-bold"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.discountPercent}
                                onChange={(e) => handleItemChange(index, "discountPercent", parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.gstPercent}
                                onChange={(e) => handleItemChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              {lineAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                disabled={items.length === 1}
                                className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Button */}
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>

                {/* Calculation Summary */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Sub Total</span>
                    <span className="font-mono font-bold text-slate-900">₹{baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Discount</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-[11px]">
                        <span className="px-2 py-0.5 text-slate-500 font-bold border-r border-slate-200">₹</span>
                        <input
                          type="number"
                          name="discount"
                          value={formData.discount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-16 px-2 py-0.5 text-right font-mono bg-white focus:outline-none"
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900">₹{totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Taxable Amount</span>
                    <span className="font-mono font-bold text-slate-900">₹{taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">CGST (9%)</span>
                    <span className="font-mono text-slate-900">₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">SGST (9%)</span>
                    <span className="font-mono text-slate-900">₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Round Off</span>
                    <span className="font-mono text-slate-900">₹0.00</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-black text-base text-blue-600">
                    <span>Grand Total (₹)</span>
                    <span className="font-mono text-lg">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Amount in Words */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Amount in Words</p>
                    <p className="text-xs font-bold text-slate-800">{numberToWords(grandTotal)}</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </form>

        {/* Modal Sticky Footer Action Bar */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, status: "Draft" }));
                toast.success("Saved as Draft");
              }}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Save as Draft
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.success("Previewing document...")}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-500" /> Preview
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
            >
              Save & Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
