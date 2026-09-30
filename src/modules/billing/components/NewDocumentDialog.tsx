"use client";

import { createPortal } from "react-dom";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  X, FileText, Plus, Trash2, Loader2, Clock, Eye,
  MapPin, CheckCircle2, ArrowRight, Wrench, Package, Layers,
  Search, ChevronDown, Check
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchVehicleDetails, getServices, getInventory } from "@/lib/api";
import DocumentPreviewDialog from "./DocumentPreviewDialog";

export interface LineItem {
  id?: string;
  type: "SERVICE" | "ITEM";
  serviceId?: string;
  itemId?: string;
  desc: string;
  category?: string;
  categoryId?: string;
  qty: number;
  price: number;
  discountPercent: number;
  gstPercent: number;
  amount: number;
  warranty?: string;
  unit?: string;
}
import { getJobCards } from "@/modules/job-card/services/job-card.service";
import { JobCard } from "@/modules/job-card/types/job-card.types";
import { getVehicleType, formatVehicleNumber } from "@/utils/vehicleNumber";
import AddCustomerDialog from "@/modules/customer/components/AddCustomerDialog";
import { createCustomer, getCustomers } from "@/modules/customer/services/customer.service";
import { Customer } from "@/modules/customer/types/customer.types";

const BILLING_ELIGIBLE_JOB_STATUSES = ["Ready For Billing", "QC Passed", "Delivered", "Out"];

// Fallback options for the Service Category dropdown when the catalog hasn't
// loaded any categories yet. Real category values are free text set per
// tenant (Settings → Categories / AddServiceDialog's `category` field — e.g.
// its own default is "PPF"), so these are never assumed to be the only valid
// values — see serviceCategoryOptions below, which is catalog-driven.
const SERVICE_CATEGORY_OPTIONS = ["General Service", "Bodywork & Paint", "PPF & Coating", "Electrical & Diagnostics", "AC Repair"];


interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

const calculateDropdownPosition = (inputEl: HTMLElement): DropdownPosition => {
  const rect = inputEl.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const spaceBelow = viewportHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;

  // Open upward if not enough space below (< 220px) and more space above
  const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
  const desiredHeight = 280;

  const maxHeight = openUpward
    ? Math.min(desiredHeight, Math.max(140, spaceAbove - 10))
    : Math.min(desiredHeight, Math.max(140, spaceBelow - 10));

  // Minimum width 360px or input width, clamped to viewport
  const targetWidth = Math.max(rect.width, 360);
  const width = Math.min(targetWidth, viewportWidth - 24);

  let left = rect.left;
  if (left + width > viewportWidth - 12) {
    left = Math.max(12, viewportWidth - width - 12);
  }
  if (left < 12) {
    left = 12;
  }

  if (openUpward) {
    return {
      bottom: viewportHeight - rect.top + 4,
      left,
      width,
      maxHeight,
      openUpward: true,
    };
  } else {
    return {
      top: rect.bottom + 4,
      left,
      width,
      maxHeight,
      openUpward: false,
    };
  }
};

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
  const [activeItemTab, setActiveItemTab] = useState<"services" | "items" | "all">("services");
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
    customerState: "",
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

  const [serviceLines, setServiceLines] = useState<LineItem[]>([
    { type: "SERVICE", desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
  ]);
  const [itemLines, setItemLines] = useState<LineItem[]>([]);

  const [serviceBaseAmount, setServiceBaseAmount] = useState(0);
  const [itemBaseAmount, setItemBaseAmount] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [lineDiscountAmount, setLineDiscountAmount] = useState(0);
  const [isFetchingVehicle, setIsFetchingVehicle] = useState(false);

  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [focusedServiceIndex, setFocusedServiceIndex] = useState<number | null>(null);
  const [serviceSearchText, setServiceSearchText] = useState<{ [key: number]: string }>({});
  const [highlightedServiceIndex, setHighlightedServiceIndex] = useState<number | null>(null);
  const serviceInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [serviceDropdownPos, setServiceDropdownPos] = useState<DropdownPosition | null>(null);
  const serviceDropdownPortalRef = useRef<HTMLDivElement | null>(null);

  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [focusedInventoryIndex, setFocusedInventoryIndex] = useState<number | null>(null);
  const [inventorySearchText, setInventorySearchText] = useState<{ [key: number]: string }>({});
  const [highlightedInventoryIndex, setHighlightedInventoryIndex] = useState<number | null>(null);
  const inventoryInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [inventoryDropdownPos, setInventoryDropdownPos] = useState<DropdownPosition | null>(null);
  const inventoryDropdownPortalRef = useRef<HTMLDivElement | null>(null);

  const activeServices = useMemo(() => {
    return availableServices.filter((s) => !s.isDeleted && s.status !== "Inactive");
  }, [availableServices]);

  // Dynamic position tracking for Service Dropdown Portal
  useEffect(() => {
    if (focusedServiceIndex !== null && serviceInputRefs.current[focusedServiceIndex]) {
      const el = serviceInputRefs.current[focusedServiceIndex]!;
      setServiceDropdownPos(calculateDropdownPosition(el));

      const handleUpdate = () => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setFocusedServiceIndex(null);
          setHighlightedServiceIndex(null);
        } else {
          setServiceDropdownPos(calculateDropdownPosition(el));
        }
      };

      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);
      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    } else {
      setServiceDropdownPos(null);
    }
  }, [focusedServiceIndex]);

  // Dynamic position tracking for Inventory Dropdown Portal
  useEffect(() => {
    if (focusedInventoryIndex !== null && inventoryInputRefs.current[focusedInventoryIndex]) {
      const el = inventoryInputRefs.current[focusedInventoryIndex]!;
      setInventoryDropdownPos(calculateDropdownPosition(el));

      const handleUpdate = () => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setFocusedInventoryIndex(null);
          setHighlightedInventoryIndex(null);
        } else {
          setInventoryDropdownPos(calculateDropdownPosition(el));
        }
      };

      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);
      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    } else {
      setInventoryDropdownPos(null);
    }
  }, [focusedInventoryIndex]);

  // Global Outside Click Listener for Portals
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;

      // Handle Service Dropdown outside click
      if (focusedServiceIndex !== null) {
        const inputEl = serviceInputRefs.current[focusedServiceIndex];
        const portalEl = serviceDropdownPortalRef.current;
        const isInsideInput = inputEl && inputEl.contains(target);
        const isInsidePortal = portalEl && portalEl.contains(target);

        if (!isInsideInput && !isInsidePortal) {
          const typed = (serviceSearchText[focusedServiceIndex] ?? "").trim();
          if (typed) {
            const exact = activeServices.find(
              (s) => s.name.toLowerCase() === typed.toLowerCase() || (s.code && s.code.toLowerCase() === typed.toLowerCase())
            );
            if (exact) {
              selectService(focusedServiceIndex, exact);
            } else if (!serviceLines[focusedServiceIndex]?.serviceId) {
              handleServiceChange(focusedServiceIndex, "desc", "");
            }
          } else if (!serviceLines[focusedServiceIndex]?.serviceId) {
            handleServiceChange(focusedServiceIndex, "desc", "");
          }
          setServiceSearchText((prev) => {
            const next = { ...prev };
            delete next[focusedServiceIndex];
            return next;
          });
          setFocusedServiceIndex(null);
          setHighlightedServiceIndex(null);
        }
      }

      // Handle Inventory Dropdown outside click
      if (focusedInventoryIndex !== null) {
        const inputEl = inventoryInputRefs.current[focusedInventoryIndex];
        const portalEl = inventoryDropdownPortalRef.current;
        const isInsideInput = inputEl && inputEl.contains(target);
        const isInsidePortal = portalEl && portalEl.contains(target);

        if (!isInsideInput && !isInsidePortal) {
          const typed = (inventorySearchText[focusedInventoryIndex] ?? "").trim();
          if (typed) {
            const exact = availableInventory.find(
              (p) => p.name.toLowerCase() === typed.toLowerCase() || (p.id && p.id.toLowerCase() === typed.toLowerCase())
            );
            if (exact) {
              selectInventoryItem(focusedInventoryIndex, exact);
            } else if (!itemLines[focusedInventoryIndex]?.itemId) {
              handleItemLineChange(focusedInventoryIndex, "desc", "");
            }
          } else if (!itemLines[focusedInventoryIndex]?.itemId) {
            handleItemLineChange(focusedInventoryIndex, "desc", "");
          }
          setInventorySearchText((prev) => {
            const next = { ...prev };
            delete next[focusedInventoryIndex];
            return next;
          });
          setFocusedInventoryIndex(null);
          setHighlightedInventoryIndex(null);
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [focusedServiceIndex, focusedInventoryIndex, activeServices, availableInventory, serviceLines, itemLines, serviceSearchText, inventorySearchText]);


  const selectService = (index: number, service: any) => {
    const updated = [...serviceLines];
    const existingQty = Number(updated[index]?.qty);
    const qty = existingQty > 0 ? existingQty : 1;
    const price = Number(service.price || 0);
    const gstPercent = Number(service.gst ?? 18);
    const category = (service.category || "").trim() || updated[index]?.category || "";
    updated[index] = {
      ...updated[index],
      type: "SERVICE",
      serviceId: service.id,
      desc: service.name,
      category,
      categoryId: service.id || service.category,
      qty,
      price,
      gstPercent,
      warranty: service.warranty || "",
      amount: qty * price,
    };
    setServiceLines(updated);
    setServiceSearchText((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setFocusedServiceIndex(null);
    setHighlightedServiceIndex(null);
    setServiceDropdownPos(null);
  };

  const selectInventoryItem = (index: number, product: any) => {
    const updated = [...itemLines];
    const qty = Number(updated[index]?.qty) || 1;
    const price = Number(product.cost ?? product.price ?? 0);
    updated[index] = {
      ...updated[index],
      itemId: product.id,
      desc: product.name,
      price,
      unit: product.unit || "Piece",
      gstPercent: 18,
      discountPercent: Number(updated[index]?.discountPercent) || 0,
      amount: qty * price,
    };
    setItemLines(updated);
    setInventorySearchText((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setFocusedInventoryIndex(null);
    setHighlightedInventoryIndex(null);
    setInventoryDropdownPos(null);
  };

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [eligibleJobs, setEligibleJobs] = useState<JobCard[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobId, setJobId] = useState<string>("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getCustomers()
      .then((list) => setCustomers(Array.isArray(list) ? list : []))
      .catch(() => setCustomers([]));
  }, [isOpen]);

  // Saved customers matching what's typed in Customer (name, phone or vehicle).
  const customerMatches = useMemo(() => {
    const q = formData.client.trim().toLowerCase();
    const qDigits = q.replace(/D/g, "");
    const qVehicle = q.replace(/[^a-z0-9]/g, "");
    return customers
      .filter((c) => {
        if (!q) return true;
        return (
          (c.name || "").toLowerCase().includes(q) ||
          (qDigits.length >= 3 && (c.phone || "").includes(qDigits)) ||
          (qVehicle.length >= 3 && (c.vehicle || "").toLowerCase().replace(/[^a-z0-9]/g, "").includes(qVehicle))
        );
      })
      .slice(0, 8);
  }, [customers, formData.client]);

  // Fill the customer, vehicle and GST fields from a saved customer record.
  const applyCustomer = (c: Partial<Customer> & { carModel?: string }) => {
    setFormData((prev) => ({
      ...prev,
      client: c.name || prev.client,
      phone: c.phone || prev.phone,
      vehicle: c.vehicle ? formatVehicleNumber(c.vehicle) : prev.vehicle,
      model: c.model || c.carModel || prev.model,
      gstNumber: c.gstNumber || "",
      billingAddress: c.address || "",
      customerState: c.state || "",
    }));
    setShowCustomerList(false);
  };

  // "+ New" customer: saves the customer, then fills this document with them.
  const handleAddCustomer = async (customer: any) => {
    try {
      const created = await createCustomer(customer);
      setCustomers((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      // The API returns the existing record when the phone is already on
      // file, so fall back to what was typed for anything it lacks.
      applyCustomer({ ...customer, ...created, gstNumber: created.gstNumber || customer.gstNumber, address: created.address || customer.address, state: created.state || customer.state });
      toast.success(`Customer ${created.name || customer.name} added`);
    } catch (err: any) {
      toast.error("Failed to add customer: " + (err.message || "Error"));
    }
  };
  const customerStateInputRef = useRef<HTMLInputElement | null>(null);

  // GET /vehicle/:vehicleNo also returns `model` (from the matched Customer's
  // saved vehicle, or the latest Car-In record) — it was being fetched and
  // then silently dropped in the old handleVehicleBlur, which is why Model
  // never auto-filled. Declared before the effects/handlers below that call it.
  const applyVehicleLookup = async (vNo: string) => {
    if (!vNo) return;
    setIsFetchingVehicle(true);
    try {
      const data = await fetchVehicleDetails(vNo);
      if (data && (data.name || data.model)) {
        setFormData((prev) => ({
          ...prev,
          client: prev.client || data.name || prev.client,
          phone: prev.phone || data.phone || prev.phone,
          model: prev.model || data.model || prev.model,
        }));
      }
      return data;
    } catch {
      return null;
    } finally {
      setIsFetchingVehicle(false);
    }
  };

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
          customerState: initialData.buyerState || "",
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
          const sLines: LineItem[] = [];
          const iLines: LineItem[] = [];
          initialData.items.forEach((it: any) => {
            const isItem = it.type === "ITEM" || (Boolean(it.itemId) && it.type !== "SERVICE");
            const matchedService = !isItem
              ? availableServices.find(
                  (s) => (it.serviceId && s.id === it.serviceId) ||
                         (it.desc && s.name.toLowerCase() === it.desc.trim().toLowerCase())
                )
              : null;
            const itemCategory = it.category || it.serviceCategory || matchedService?.category || initialData.serviceCategory || "";

            const parsedLine: LineItem = {
              type: isItem ? "ITEM" : "SERVICE",
              serviceId: it.serviceId,
              itemId: it.itemId,
              desc: it.desc || it.name || "",
              category: itemCategory,
              categoryId: it.categoryId || matchedService?.id || it.serviceId,
              qty: Number(it.qty) || 1,
              price: Number(it.price ?? it.rate ?? 0),
              discountPercent: Number(it.discountPercent || 0),
              gstPercent: Number(it.gstPercent ?? 18),
              amount: (Number(it.qty) || 1) * Number(it.price ?? it.rate ?? 0),
              warranty: it.warranty || "",
              unit: it.unit || "",
            };
            if (isItem) {
              iLines.push(parsedLine);
            } else {
              sLines.push(parsedLine);
            }
          });
          setServiceLines(sLines.length > 0 ? sLines : [{ type: "SERVICE", desc: "", category: "", qty: 1, price: 0, discountPercent: 0, gstPercent: 18, amount: 0, warranty: "" }]);
          setItemLines(iLines);
        } else if (Array.isArray(initialData.services) && initialData.services.length > 0) {
          setServiceLines(
            initialData.services.map((s: { name: string; price: number; qty: number; category?: string }) => {
              const matchedService = availableServices.find(
                (cs) => cs.name.toLowerCase() === s.name.trim().toLowerCase()
              );
              return {
                type: "SERVICE",
                desc: s.name,
                category: s.category || matchedService?.category || initialData.serviceCategory || "",
                categoryId: matchedService?.id,
                qty: s.qty || 1,
                price: s.price || 0,
                amount: (s.qty || 1) * (s.price || 0),
                discountPercent: 0,
                gstPercent: 18,
                warranty: "",
              };
            })
          );
          setItemLines([]);
        } else if (initialData.service || initialData.amount) {
          const matchedService = availableServices.find(
            (cs) => cs.name.toLowerCase() === (initialData.service || "").trim().toLowerCase()
          );
          setServiceLines([{
            type: "SERVICE",
            desc: initialData.service || "Service Charge",
            category: matchedService?.category || initialData.serviceCategory || "",
            categoryId: matchedService?.id,
            qty: 1,
            price: Number(initialData.amount || 0),
            amount: Number(initialData.amount || 0),
            discountPercent: 0,
            gstPercent: 18,
            warranty: initialData.warranty || ""
          }]);
          setItemLines([]);
        }
        if (initialData.jobId) {
          setJobId(initialData.jobId);
        } else if (initialData.jobCardNo) {
          setJobId(initialData.jobCardNo);
        }
        // "Generate Invoice" from the Billing queue only ever passes the raw
        // Job Card fields, never a resolved Model — fetch it the same way
        // picking a job in-dialog does.
        if (!initialData.model && initialData.vehicle) {
          applyVehicleLookup(String(initialData.vehicle).trim().toUpperCase());
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
          customerState: "",
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
        setServiceLines([
          { type: "SERVICE", desc: "", category: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }
        ]);
        setItemLines([]);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && initialData && initialData.service && serviceLines.length === 1 && serviceLines[0].price === 0 && availableServices.length > 0) {
      const jobServiceName = (initialData.service || "").trim();
      const matched = availableServices.find(
        (s) => s.name.toLowerCase() === jobServiceName.toLowerCase()
      );
      if (matched) {
        const price = matched.price || 0;
        const warranty = matched.warranty || "";
        setServiceLines([
          { type: "SERVICE", serviceId: matched.id, desc: jobServiceName, qty: 1, price, amount: price, discountPercent: 0, gstPercent: matched.gst ?? 18, warranty },
        ]);
        if (warranty) {
          setFormData((prev) => ({ ...prev, warranty: prev.warranty || warranty }));
        }
      }
    }
  }, [availableServices, initialData, isOpen, serviceLines]);

  // Derive Service Category per service line once availableServices is loaded
  useEffect(() => {
    if (isOpen && availableServices.length > 0) {
      setServiceLines((prev) => {
        let hasChanges = false;
        const next = prev.map((s) => {
          if (s.category && s.category.trim()) return s;
          const matched = availableServices.find(
            (c) => (s.serviceId && c.id === s.serviceId) || (s.desc && c.name?.toLowerCase() === s.desc.trim().toLowerCase())
          );
          if (matched?.category) {
            hasChanges = true;
            return { ...s, category: matched.category.trim(), categoryId: matched.id };
          }
          return s;
        });
        return hasChanges ? next : prev;
      });
    }
  }, [availableServices, isOpen]);

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
    const data = await applyVehicleLookup(vNo);
    if (data && data.name) {
      toast.success("Vehicle details auto-filled!");
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
        customerState: "",
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
      setServiceLines([{ type: "SERVICE", desc: "", category: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }]);
      setItemLines([]);
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

      // formData.vehicle is set programmatically above, so the input's onBlur
      // (which normally drives this lookup) never fires — Model would
      // otherwise stay empty for every job-linked invoice.
      if (job.vehicle) {
        applyVehicleLookup(job.vehicle.trim().toUpperCase());
      }

      const jobServices = (job as any).services as { name: string; price: number; qty: number }[] | undefined;
      if (Array.isArray(jobServices) && jobServices.length > 0) {
        // Same priced line items the Job Card's Billing Services section records
        // and the backend's GST resolver reads — authoritative, no re-guessing.
        setServiceLines(
          jobServices.map((s) => ({
            type: "SERVICE",
            desc: s.name,
            qty: s.qty || 1,
            price: s.price || 0,
            amount: (s.qty || 1) * (s.price || 0),
            discountPercent: 0,
            gstPercent: 18,
            warranty: "",
          }))
        );

        const matchedCatalog = jobServices
          .map((s) => availableServices.find((c) => c.name?.toLowerCase() === s.name.toLowerCase()))
          .find((c) => c?.category);
        const category = matchedCatalog?.category?.trim();
        if (category) {
          setFormData((prev) => ({ ...prev, serviceCategory: category }));
        }
        return;
      }

      const jobServiceName = (job.service || "").trim();
      if (jobServiceName && availableServices.length > 0) {
        const matched = availableServices.find(
          (s) => s.name.toLowerCase() === jobServiceName.toLowerCase()
        );
        const price = matched?.price || 0;
        const warranty = matched?.warranty || "";
        setServiceLines([
          { type: "SERVICE", serviceId: matched?.id, desc: jobServiceName, qty: 1, price, amount: price, discountPercent: 0, gstPercent: matched?.gst ?? 18, warranty },
        ]);
        if (warranty) {
          setFormData((prev) => ({ ...prev, warranty: prev.warranty || warranty }));
        }
      } else if (jobServiceName) {
        setServiceLines([
          { type: "SERVICE", desc: jobServiceName, qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
        ]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoadingServices(true);
      getServices({ status: "Active" })
        .then((data) => {
          setAvailableServices(Array.isArray(data) ? data : []);
          setIsLoadingServices(false);
        })
        .catch((err) => {
          console.error("Failed to load services:", err);
          setAvailableServices([]);
          setIsLoadingServices(false);
        });

      setIsLoadingInventory(true);
      getInventory()
        .then((data) => {
          setAvailableInventory(Array.isArray(data) ? data : []);
          setIsLoadingInventory(false);
        })
        .catch((err) => {
          console.error("Failed to load inventory:", err);
          setAvailableInventory([]);
          setIsLoadingInventory(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    let sSubtotal = 0;
    let sDiscTotal = 0;
    let sGstTotal = 0;
    serviceLines.forEach((item) => {
      const amt = (Number(item.qty) || 0) * (Number(item.price) || 0);
      const lineDiscPct = Number(item.discountPercent) || 0;
      const lineDiscAmt = (amt * lineDiscPct) / 100;
      const lineGstPct = item.gstPercent ?? 18;
      sSubtotal += amt;
      sDiscTotal += lineDiscAmt;
      sGstTotal += ((amt - lineDiscAmt) * lineGstPct) / 100;
    });

    let iSubtotal = 0;
    let iDiscTotal = 0;
    let iGstTotal = 0;
    itemLines.forEach((item) => {
      const amt = (Number(item.qty) || 0) * (Number(item.price) || 0);
      const lineDiscPct = Number(item.discountPercent) || 0;
      const lineDiscAmt = (amt * lineDiscPct) / 100;
      const lineGstPct = item.gstPercent ?? 18;
      iSubtotal += amt;
      iDiscTotal += lineDiscAmt;
      iGstTotal += ((amt - lineDiscAmt) * lineGstPct) / 100;
    });

    setServiceBaseAmount(sSubtotal);
    setItemBaseAmount(iSubtotal);
    setBaseAmount(sSubtotal + iSubtotal);
    setLineDiscountAmount(sDiscTotal + iDiscTotal);
    setGstAmount(sGstTotal + iGstTotal);
  }, [serviceLines, itemLines]);

  const handleServiceChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...serviceLines];
    const item = { ...updated[index], [field]: value };
    item.amount = (Number(item.qty) || 0) * (Number(item.price) || 0);
    updated[index] = item;
    setServiceLines(updated);
  };

  const addServiceLine = () => {
    const newIndex = serviceLines.length;
    setServiceLines([
      ...serviceLines,
      { type: "SERVICE", desc: "", category: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
    ]);
    setActiveItemTab("services");
    setFocusedServiceIndex(newIndex);
    setHighlightedServiceIndex(0);
    setTimeout(() => {
      serviceInputRefs.current[newIndex]?.focus();
    }, 60);
  };

  const removeServiceLine = (index: number) => {
    setServiceSearchText((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    if (serviceLines.length === 1 && itemLines.length === 0) {
      setServiceLines([{ type: "SERVICE", desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" }]);
    } else {
      setServiceLines(serviceLines.filter((_, i) => i !== index));
    }
  };

  const handleItemLineChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...itemLines];
    const item = { ...updated[index], [field]: value };
    item.amount = (Number(item.qty) || 0) * (Number(item.price) || 0);
    updated[index] = item;
    setItemLines(updated);
  };

  const addItemLine = () => {
    const newIndex = itemLines.length;
    setItemLines([
      ...itemLines,
      { type: "ITEM", desc: "", qty: 1, price: 0, amount: 0, discountPercent: 0, gstPercent: 18, warranty: "" },
    ]);
    setActiveItemTab("items");
    setFocusedInventoryIndex(newIndex);
    setHighlightedInventoryIndex(0);
    setTimeout(() => {
      inventoryInputRefs.current[newIndex]?.focus();
    }, 60);
  };

  const removeItemLine = (index: number) => {
    setInventorySearchText((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setItemLines(itemLines.filter((_, i) => i !== index));
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

  // Real category values are whatever the tenant has set up in Settings →
  // Categories (see AddServiceDialog) — free text, not the fixed
  // SERVICE_CATEGORY_OPTIONS list. Options here are derived from the actual
  // Service catalog so an auto-filled value like "PPF" renders correctly
  // instead of silently mismatching every hardcoded <option>.
  const serviceCategoryOptions = useMemo(() => {
    const fromCatalog = Array.from(
      new Set(availableServices.map((s) => (s.category || "").trim()).filter(Boolean))
    );
    const base = fromCatalog.length > 0 ? fromCatalog : SERVICE_CATEGORY_OPTIONS;
    const fromLines = serviceLines.map((s) => (s.category || "").trim()).filter(Boolean);
    const fromInit = initialData?.serviceCategory ? [initialData.serviceCategory.trim()] : [];
    return Array.from(new Set([...base, ...fromLines, ...fromInit]));
  }, [availableServices, serviceLines, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.vehicle.trim() && getVehicleType(formData.vehicle) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
      return;
    }

    // Only an Invoice actually runs GST calculation server-side (Estimates/
    // Quotations don't) — the "Customer State" input's `required` attribute
    // can't enforce this itself since this handler is wired to a footer
    // button outside the <form>, so native HTML validation never fires.
    if (formData.type === "Invoice" && !formData.customerState.trim()) {
      toast.error("Customer State is required to generate an Invoice — GST calculation needs it to determine CGST+SGST vs IGST.");
      // The form is one long scrollable page (the numbered 1/2/3 stepper up
      // top is a visual guide only, not real per-step navigation), so on a
      // small viewport the field this error refers to is easily off-screen
      // below wherever the user happened to be scrolled to.
      customerStateInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      customerStateInputRef.current?.focus();
      return;
    }

    if (!formData.client.trim()) {
      toast.error("Please enter or select a customer name");
      return;
    }

    for (let i = 0; i < serviceLines.length; i++) {
      const s = serviceLines[i];
      if (!s.desc.trim()) {
        if (serviceLines.length > 1 || itemLines.length > 0) {
          toast.error(`Service line #${i + 1} has no service selected. Please select a service or remove the row.`);
          return;
        }
      } else {
        const matchingService = activeServices.find(
          (cs) => (s.serviceId && cs.id === s.serviceId) || cs.name.toLowerCase() === s.desc.trim().toLowerCase()
        );
        if (!matchingService) {
          toast.error(`Service line #${i + 1} ("${s.desc}") is not a valid service from the Services master. Please select a valid service.`);
          return;
        }
        if (!s.serviceId) {
          s.serviceId = matchingService.id;
        }
      }
    }
    for (let i = 0; i < itemLines.length; i++) {
      const it = itemLines[i];
      if (!it.desc.trim()) {
        toast.error(`Item line #${i + 1} has no item selected. Please select an item or remove the row.`);
        return;
      } else {
        const matchingItem = availableInventory.find(
          (ci) => (it.itemId && ci.id === it.itemId) || ci.name.toLowerCase() === it.desc.trim().toLowerCase()
        );
        if (!matchingItem) {
          toast.error(`Item line #${i + 1} ("${it.desc}") is not a valid item from the Items master. Please select a valid item.`);
          return;
        }
        if (!it.itemId) {
          it.itemId = matchingItem.id;
        }
      }
    }

    const validServices = serviceLines.filter((s) => s.desc && s.desc.trim() !== "");
    const validItems = itemLines.filter((i) => i.desc && i.desc.trim() !== "");

    if (validServices.length === 0 && validItems.length === 0) {
      toast.error("Please add at least one Service or Item to the document");
      return;
    }

    for (const s of validServices) {
      if (!s.qty || s.qty <= 0) {
        toast.error(`Service "${s.desc}": Quantity must be greater than 0`);
        return;
      }
      if (s.price < 0 || isNaN(s.price)) {
        toast.error(`Service "${s.desc}": Rate cannot be negative`);
        return;
      }
    }
    for (const it of validItems) {
      if (!it.qty || it.qty <= 0) {
        toast.error(`Item "${it.desc}": Quantity must be greater than 0`);
        return;
      }
      if (it.price < 0 || isNaN(it.price)) {
        toast.error(`Item "${it.desc}": Rate cannot be negative`);
        return;
      }
    }

    if (onSubmit) {
      const overallDiscountPercent = parseFloat(formData.discount) || 0;
      const overallDiscountAmount = ((baseAmount - lineDiscountAmount) * overallDiscountPercent) / 100;
      const totalDiscount = lineDiscountAmount + overallDiscountAmount;

      const allDocItems = [...validServices, ...validItems];

      let computedService = "";
      if (validServices.length > 0) {
        computedService = validServices.length > 1
          ? `${validServices[0].desc.trim()} (+${validServices.length - 1} more)`
          : validServices[0].desc.trim();
        if (validItems.length > 0) {
          computedService += ` · ${validItems.length} item(s)`;
        }
      } else if (validItems.length > 0) {
        computedService = validItems.length > 1
          ? `${validItems[0].desc.trim()} (+${validItems.length - 1} more)`
          : validItems[0].desc.trim();
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
        buyerState: formData.customerState || null,
        service: computedService,
        serviceCategory: (() => {
          const uniqueCats = Array.from(new Set(validServices.map((s) => s.category?.trim()).filter(Boolean)));
          return uniqueCats.length > 0 ? uniqueCats.join(", ") : "General Service";
        })(),
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
        items: allDocItems,
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
            <p className="text-xs text-slate-500 font-medium">{initialData ? "Edit Estimate or Invoice" : "Create Estimate or Invoice"}</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pb-8 space-y-6">
          {/* Top Row: Document Type & Document Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Document Type Selection Cards */}
            <div className="min-w-0 h-full flex flex-col">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 h-full flex-1 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900">Document Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {[
                    { type: "Estimate", label: "Estimate", desc: "Prepare an estimate" },
                    { type: "Invoice", label: "Invoice", desc: "Generate final invoice" },
                  ].map((item) => {
                    const isSelected = formData.type === item.type;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => setFormData((prev) => ({ ...prev, type: item.type }))}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between min-h-24 h-full ${isSelected
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
            </div>

            {/* Document Info Card */}
            <div className="min-w-0 h-full flex flex-col">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 h-full flex-1 flex flex-col justify-between">
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
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {formData.type === "Estimate" ? "Valid Till" : "Due Date"}
                    </label>
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
            </div>
          </div>

          {/* Main Row: Customer & Vehicle & Items & Summary (Equal Height) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Left Column (Customer & Vehicle) */}
            <div className="min-w-0 h-full flex flex-col">

              {/* Customer & Vehicle Details Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-6 h-full flex-1 flex flex-col">
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
                        <div className="relative flex-1">
                          <input
                            type="text"
                            name="client"
                            value={formData.client}
                            onChange={(e) => { handleChange(e); setShowCustomerList(true); }}
                            onFocus={() => setShowCustomerList(true)}
                            onBlur={() => setShowCustomerList(false)}
                            placeholder="Search name, phone or vehicle"
                            autoComplete="off"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            required
                          />
                          {showCustomerList && customerMatches.length > 0 && (
                            <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto py-1">
                              {customerMatches.map((c) => (
                                <li key={c.id}>
                                  <button
                                    type="button"
                                    // mouseDown fires before the input's blur closes the list
                                    onMouseDown={(e) => { e.preventDefault(); applyCustomer(c); }}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                                  >
                                    <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                                    <p className="text-[11px] text-slate-500">
                                      {[c.phone, c.vehicle, c.model].filter(Boolean).join(" · ") || "No phone or vehicle on file"}
                                    </p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddCustomerOpen(true)}
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

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Customer State <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={customerStateInputRef}
                        type="text"
                        name="customerState"
                        value={formData.customerState}
                        onChange={handleChange}
                        placeholder="Type the customer's state — e.g. Karnataka"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Determines CGST+SGST vs IGST — required to generate the invoice.
                      </p>
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
                        {serviceCategoryOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
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

            {/* Right Column (Items & Summary) */}
            <div className="min-w-0 h-full flex flex-col">

              {/* Items & Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs h-full flex-1 flex flex-col space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Items & Summary</h3>

                  </div>

                  {/* Two Clear Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveItemTab("services")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeItemTab === "services" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Services ({serviceLines.filter(s => s.desc.trim()).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItemTab("items")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeItemTab === "items" ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Items ({itemLines.filter(i => i.desc.trim()).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItemTab("all")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeItemTab === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      All ({serviceLines.filter(s => s.desc.trim()).length + itemLines.filter(i => i.desc.trim()).length})
                    </button>
                  </div>
                </div>

                {/* 1. SERVICES SECTION */}
                {activeItemTab === "services" && (
                  <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                        <Wrench className="w-4 h-4" />
                        <span>Services ({serviceLines.filter(s => s.desc.trim()).length})</span>
                      </div>
                      {serviceBaseAmount > 0 && (
                        <span className="text-xs font-semibold text-slate-500">
                          Subtotal: <strong className="text-slate-900 font-mono">₹{serviceBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[340px] border border-slate-200/80 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/80">
                          <tr>
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-2">Service</th>
                            <th className="py-2.5 px-2 w-36">Category</th>
                            <th className="py-2.5 px-2 w-14 text-center">Qty</th>
                            <th className="py-2.5 px-2 w-20 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-2 w-14 text-center">GST (%)</th>
                            <th className="py-2.5 px-2 w-24 text-right">Amount (₹)</th>
                            <th className="py-2.5 px-2 w-8 text-center" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {serviceLines.map((sLine, index) => {
                            const lineSubtotal = (Number(sLine.qty) || 0) * (Number(sLine.price) || 0);
                            const lineTaxable = lineSubtotal;
                            const lineGst = (lineTaxable * (sLine.gstPercent ?? 18)) / 100;
                            const lineTotalWithTax = lineTaxable + lineGst;

                            return (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="py-2 px-2 text-center font-bold text-slate-400 text-[11px]">{index + 1}</td>
                                <td className="py-2 px-2 min-w-[220px]">
                                  <div className="relative flex items-center">
                                    <Wrench className={`w-3.5 h-3.5 absolute left-2.5 transition-colors pointer-events-none ${focusedServiceIndex === index ? "text-blue-600" : "text-slate-400"
                                      }`} />
                                    <input
                                      ref={(el) => { serviceInputRefs.current[index] = el; }}
                                      type="text"
                                      value={serviceSearchText[index] !== undefined ? serviceSearchText[index] : sLine.desc}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setServiceSearchText((prev) => ({ ...prev, [index]: val }));
                                        if (focusedServiceIndex !== index) {
                                          setFocusedServiceIndex(index);
                                        }
                                        setHighlightedServiceIndex(0);
                                      }}
                                      onFocus={(e) => {
                                        setFocusedServiceIndex(index);
                                        setHighlightedServiceIndex(0);
                                        e.target.select();
                                      }}
                                      onKeyDown={(e) => {
                                        const query = (serviceSearchText[index] !== undefined ? serviceSearchText[index] : "").toLowerCase().trim();
                                        const filtered = activeServices.filter((s) => {
                                          if (!query) return true;
                                          return (
                                            (s.name || "").toLowerCase().includes(query) ||
                                            (s.code || s.id || "").toLowerCase().includes(query) ||
                                            (s.category || "").toLowerCase().includes(query)
                                          );
                                        });

                                        if (focusedServiceIndex !== index) {
                                          if (e.key === "ArrowDown" || e.key === "Enter") {
                                            setFocusedServiceIndex(index);
                                            setHighlightedServiceIndex(0);
                                          }
                                          return;
                                        }

                                        if (e.key === "ArrowDown") {
                                          e.preventDefault();
                                          if (filtered.length > 0) {
                                            setHighlightedServiceIndex((prev) => (prev === null || prev >= filtered.length - 1 ? 0 : prev + 1));
                                          }
                                        } else if (e.key === "ArrowUp") {
                                          e.preventDefault();
                                          if (filtered.length > 0) {
                                            setHighlightedServiceIndex((prev) => (prev === null || prev <= 0 ? filtered.length - 1 : prev - 1));
                                          }
                                        } else if (e.key === "Enter") {
                                          e.preventDefault();
                                          if (highlightedServiceIndex !== null && filtered[highlightedServiceIndex]) {
                                            selectService(index, filtered[highlightedServiceIndex]);
                                          } else if (filtered.length === 1) {
                                            selectService(index, filtered[0]);
                                          }
                                        } else if (e.key === "Escape") {
                                          e.preventDefault();
                                          setFocusedServiceIndex(null);
                                          setHighlightedServiceIndex(null);
                                        } else if (e.key === "Tab") {
                                          const typed = (serviceSearchText[index] ?? "").trim();
                                          if (typed) {
                                            const exact = activeServices.find(
                                              (s) => s.name.toLowerCase() === typed.toLowerCase() || (s.code && s.code.toLowerCase() === typed.toLowerCase())
                                            );
                                            if (exact) {
                                              selectService(index, exact);
                                            } else if (!sLine.serviceId) {
                                              handleServiceChange(index, "desc", "");
                                            }
                                          } else if (!sLine.serviceId) {
                                            handleServiceChange(index, "desc", "");
                                          }
                                          setFocusedServiceIndex(null);
                                          setHighlightedServiceIndex(null);
                                        }
                                      }}
                                      placeholder="Select or search service..."
                                      className="w-full pl-8 pr-12 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <div className="absolute right-1.5 flex items-center gap-0.5">
                                      {(sLine.desc || serviceSearchText[index]) && (
                                        <button
                                          type="button"
                                          tabIndex={-1}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleServiceChange(index, "desc", "");
                                            handleServiceChange(index, "serviceId", undefined);
                                            handleServiceChange(index, "price", 0);
                                            handleServiceChange(index, "amount", 0);
                                            setServiceSearchText((prev) => ({ ...prev, [index]: "" }));
                                            setFocusedServiceIndex(index);
                                            setHighlightedServiceIndex(0);
                                            serviceInputRefs.current[index]?.focus();
                                          }}
                                          className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                                          title="Clear service"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        tabIndex={-1}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          if (focusedServiceIndex === index) {
                                            setFocusedServiceIndex(null);
                                          } else {
                                            setFocusedServiceIndex(index);
                                            setHighlightedServiceIndex(0);
                                            serviceInputRefs.current[index]?.focus();
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                      >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${focusedServiceIndex === index ? "rotate-180 text-blue-600" : ""
                                          }`} />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-2 w-36 min-w-[130px]">
                                  <select
                                    value={sLine.category || ""}
                                    onChange={(e) => handleServiceChange(index, "category", e.target.value)}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  >
                                    <option value="">Select Category</option>
                                    {serviceCategoryOptions.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={sLine.qty}
                                    onChange={(e) => handleServiceChange(index, "qty", parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    min="1"
                                    className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={sLine.price}
                                    onChange={(e) => handleServiceChange(index, "price", parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    min="0"
                                    className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-right font-bold font-mono"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={sLine.gstPercent}
                                    onChange={(e) => handleServiceChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    min="0"
                                    max="100"
                                    className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-medium"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                  ₹{lineTotalWithTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeServiceLine(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Remove Service"
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

                    <button
                      type="button"
                      onClick={addServiceLine}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Service
                    </button>
                  </div>
                )}

                {/* 2. ITEMS / PRODUCTS SECTION */}
                {activeItemTab === "items" && (
                  <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        <Package className="w-4 h-4" />
                        <span>Items / Products ({itemLines.filter(i => i.desc.trim()).length})</span>
                      </div>
                      {itemBaseAmount > 0 && (
                        <span className="text-xs font-semibold text-slate-500">
                          Subtotal: <strong className="text-slate-900 font-mono">₹{itemBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[340px] border border-slate-200/80 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-emerald-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/80">
                          <tr>
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-2">Item / Product</th>
                            <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                            <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-2 w-16 text-center">Disc. (%)</th>
                            <th className="py-2.5 px-2 w-16 text-center">GST (%)</th>
                            <th className="py-2.5 px-2 w-28 text-right">Amount (₹)</th>
                            <th className="py-2.5 px-2 w-8 text-center" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itemLines.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                                No items added yet. Click &ldquo;+ Add Item&rdquo; below to select parts or products from inventory.
                              </td>
                            </tr>
                          ) : (
                            itemLines.map((itLine, index) => {
                              const lineSubtotal = (Number(itLine.qty) || 0) * (Number(itLine.price) || 0);
                              const lineDisc = (lineSubtotal * (Number(itLine.discountPercent) || 0)) / 100;
                              const lineTaxable = lineSubtotal - lineDisc;
                              const lineGst = (lineTaxable * (itLine.gstPercent ?? 18)) / 100;
                              const lineTotalWithTax = lineTaxable + lineGst;

                              return (
                                <tr key={index} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-2 text-center font-bold text-slate-400 text-[11px]">{index + 1}</td>
                                  <td className="py-2 px-2 min-w-[220px]">
                                    <div className="relative flex items-center">
                                      <Package className={`w-3.5 h-3.5 absolute left-2.5 transition-colors pointer-events-none ${focusedInventoryIndex === index ? "text-emerald-600" : "text-slate-400"
                                        }`} />
                                      <input
                                        ref={(el) => { inventoryInputRefs.current[index] = el; }}
                                        type="text"
                                        value={inventorySearchText[index] !== undefined ? inventorySearchText[index] : itLine.desc}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setInventorySearchText((prev) => ({ ...prev, [index]: val }));
                                          if (focusedInventoryIndex !== index) {
                                            setFocusedInventoryIndex(index);
                                          }
                                          setHighlightedInventoryIndex(0);
                                        }}
                                        onFocus={(e) => {
                                          setFocusedInventoryIndex(index);
                                          setHighlightedInventoryIndex(0);
                                          e.target.select();
                                        }}
                                        onKeyDown={(e) => {
                                          const query = (inventorySearchText[index] !== undefined ? inventorySearchText[index] : "").toLowerCase().trim();
                                          const filtered = availableInventory.filter((p) => {
                                            if (!query) return true;
                                            return (
                                              (p.name || "").toLowerCase().includes(query) ||
                                              (p.id || "").toLowerCase().includes(query) ||
                                              (p.category || "").toLowerCase().includes(query)
                                            );
                                          });

                                          if (focusedInventoryIndex !== index) {
                                            if (e.key === "ArrowDown" || e.key === "Enter") {
                                              setFocusedInventoryIndex(index);
                                              setHighlightedInventoryIndex(0);
                                            }
                                            return;
                                          }

                                          if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            if (filtered.length > 0) {
                                              setHighlightedInventoryIndex((prev) => (prev === null || prev >= filtered.length - 1 ? 0 : prev + 1));
                                            }
                                          } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            if (filtered.length > 0) {
                                              setHighlightedInventoryIndex((prev) => (prev === null || prev <= 0 ? filtered.length - 1 : prev - 1));
                                            }
                                          } else if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (highlightedInventoryIndex !== null && filtered[highlightedInventoryIndex]) {
                                              selectInventoryItem(index, filtered[highlightedInventoryIndex]);
                                            } else if (filtered.length === 1) {
                                              selectInventoryItem(index, filtered[0]);
                                            }
                                          } else if (e.key === "Escape") {
                                            e.preventDefault();
                                            setFocusedInventoryIndex(null);
                                            setHighlightedInventoryIndex(null);
                                          } else if (e.key === "Tab") {
                                            const typed = (inventorySearchText[index] ?? "").trim();
                                            if (typed) {
                                              const exact = availableInventory.find(
                                                (p) => p.name.toLowerCase() === typed.toLowerCase() || (p.id && p.id.toLowerCase() === typed.toLowerCase())
                                              );
                                              if (exact) {
                                                selectInventoryItem(index, exact);
                                              } else if (!itLine.itemId) {
                                                handleItemLineChange(index, "desc", "");
                                              }
                                            } else if (!itLine.itemId) {
                                              handleItemLineChange(index, "desc", "");
                                            }
                                            setFocusedInventoryIndex(null);
                                            setHighlightedInventoryIndex(null);
                                          }
                                        }}
                                        placeholder="Select or search item..."
                                        className="w-full pl-8 pr-12 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
                                      />
                                      <div className="absolute right-1.5 flex items-center gap-0.5">
                                        {(itLine.desc || inventorySearchText[index]) && (
                                          <button
                                            type="button"
                                            tabIndex={-1}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleItemLineChange(index, "desc", "");
                                              handleItemLineChange(index, "itemId", undefined);
                                              handleItemLineChange(index, "price", 0);
                                              handleItemLineChange(index, "amount", 0);
                                              setInventorySearchText((prev) => ({ ...prev, [index]: "" }));
                                              setFocusedInventoryIndex(index);
                                              setHighlightedInventoryIndex(0);
                                              inventoryInputRefs.current[index]?.focus();
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                                            title="Clear item"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          tabIndex={-1}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            if (focusedInventoryIndex === index) {
                                              setFocusedInventoryIndex(null);
                                            } else {
                                              setFocusedInventoryIndex(index);
                                              setHighlightedInventoryIndex(0);
                                              inventoryInputRefs.current[index]?.focus();
                                            }
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                        >
                                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${focusedInventoryIndex === index ? "rotate-180 text-emerald-600" : ""
                                            }`} />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="number"
                                      value={itLine.qty}
                                      onChange={(e) => handleItemLineChange(index, "qty", parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                      min="1"
                                      className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="number"
                                      value={itLine.price}
                                      onChange={(e) => handleItemLineChange(index, "price", parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                      min="0"
                                      className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-right font-bold font-mono"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="number"
                                      value={itLine.discountPercent}
                                      onChange={(e) => handleItemLineChange(index, "discountPercent", parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                      min="0"
                                      max="100"
                                      className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="number"
                                      value={itLine.gstPercent}
                                      onChange={(e) => handleItemLineChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                      min="0"
                                      max="100"
                                      className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-medium"
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                    ₹{lineTotalWithTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeItemLine(index)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remove Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={addItemLine}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>
                )}

                {/* 3. ALL TAB (Unified View with Clear Type Identification) */}
                {activeItemTab === "all" && (
                  <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>All Items & Services ({serviceLines.filter(s => s.desc.trim()).length + itemLines.filter(i => i.desc.trim()).length})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                        {serviceBaseAmount > 0 && (
                          <span>Services: <strong className="text-blue-600 font-mono">₹{serviceBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                        )}
                        {itemBaseAmount > 0 && (
                          <span>Items: <strong className="text-emerald-600 font-mono">₹{itemBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                        )}
                        <span className="text-slate-900">Total: <strong className="font-mono">₹{baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[340px] border border-slate-200/80 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200/80">
                          <tr>
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-2">Item / Service</th>
                            <th className="py-2.5 px-2 w-20 text-center">Type</th>
                            <th className="py-2.5 px-2 w-14 text-center">Qty</th>
                            <th className="py-2.5 px-2 w-20 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-2 w-14 text-center">GST (%)</th>
                            <th className="py-2.5 px-2 w-24 text-right">Amount (₹)</th>
                            <th className="py-2.5 px-2 w-8 text-center" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {serviceLines.filter(s => s.desc.trim()).length === 0 && itemLines.filter(i => i.desc.trim()).length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                                No services or items added yet. Click &ldquo;+ Add Service&rdquo; or &ldquo;+ Add Item&rdquo; below.
                              </td>
                            </tr>
                          ) : (
                            <>
                              {/* 1. Services in All view */}
                              {serviceLines.map((sLine, index) => {
                                const lineSubtotal = (Number(sLine.qty) || 0) * (Number(sLine.price) || 0);
                                const lineTaxable = lineSubtotal;
                                const lineGst = (lineTaxable * (sLine.gstPercent ?? 18)) / 100;
                                const lineTotalWithTax = lineTaxable + lineGst;

                                return (
                                  <tr key={`all-srv-${index}`} className="hover:bg-blue-50/20">
                                    <td className="py-2 px-2 text-center font-bold text-slate-400 text-[11px]">{index + 1}</td>
                                    <td className="py-2 px-2 font-semibold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span>{sLine.desc || <span className="text-slate-400 italic font-normal">Select service...</span>}</span>
                                        {sLine.category && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                            {sLine.category}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        Service
                                      </span>
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={sLine.qty}
                                        onChange={(e) => handleServiceChange(index, "qty", parseFloat(e.target.value) || 0)}
                                        min="1"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={sLine.price}
                                        onChange={(e) => handleServiceChange(index, "price", parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-right font-bold font-mono"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={sLine.gstPercent}
                                        onChange={(e) => handleServiceChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center"
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                      ₹{lineTotalWithTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeServiceLine(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove Service"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* 2. Items in All view */}
                              {itemLines.map((itLine, index) => {
                                const lineSubtotal = (Number(itLine.qty) || 0) * (Number(itLine.price) || 0);
                                const lineDisc = (lineSubtotal * (Number(itLine.discountPercent) || 0)) / 100;
                                const lineTaxable = lineSubtotal - lineDisc;
                                const lineGst = (lineTaxable * (itLine.gstPercent ?? 18)) / 100;
                                const lineTotalWithTax = lineTaxable + lineGst;

                                return (
                                  <tr key={`all-itm-${index}`} className="hover:bg-emerald-50/20">
                                    <td className="py-2 px-2 text-center font-bold text-slate-400 text-[11px]">{serviceLines.length + index + 1}</td>
                                    <td className="py-2 px-2 font-semibold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>{itLine.desc || <span className="text-slate-400 italic font-normal">Select item...</span>}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Item
                                      </span>
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={itLine.qty}
                                        onChange={(e) => handleItemLineChange(index, "qty", parseFloat(e.target.value) || 0)}
                                        min="1"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={itLine.price}
                                        onChange={(e) => handleItemLineChange(index, "price", parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-right font-bold font-mono"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        value={itLine.gstPercent}
                                        onChange={(e) => handleItemLineChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                        className="w-full px-1 py-1 border border-slate-200 rounded-lg text-xs text-center"
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                      ₹{lineTotalWithTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeItemLine(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove Item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addServiceLine}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Service
                      </button>
                      <button
                        type="button"
                        onClick={addItemLine}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </button>
                    </div>
                  </div>
                )}

                {/* Calculation Summary */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2.5 text-xs bg-slate-50/50 p-4 rounded-xl mt-auto shrink-0">
                  {serviceBaseAmount > 0 && itemBaseAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>Services Subtotal ({serviceLines.filter(s => s.desc.trim()).length})</span>
                        <span className="font-mono font-semibold text-slate-700">₹{serviceBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>Items / Products Subtotal ({itemLines.filter(i => i.desc.trim()).length})</span>
                        <span className="font-mono font-semibold text-slate-700">₹{itemBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="border-b border-slate-200/50 my-1" />
                    </>
                  )}

                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span className="font-semibold">Subtotal</span>
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
              onClick={() => setIsPreviewModalOpen(true)}
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

      {/* Outside the document <form> — a nested form would submit the document. */}
      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSubmit={handleAddCustomer}
      />

      <DocumentPreviewDialog
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        document={{
          docNo: initialData?.id || nextDocNo,
          type: formData.type,
          status: formData.status,
          client: formData.client || "Customer",
          phone: formData.phone || "—",
          vehicle: formData.vehicle || "—",
          model: formData.model || "",
          billingAddress: formData.billingAddress || "",
          buyerState: formData.customerState || null,
          service: serviceLines.filter(s => s.desc.trim()).map(s => s.desc).join(", ") || (itemLines.length > 0 ? itemLines[0].desc : "General Service"),
          base: baseAmount.toString(),
          gst: gstAmount.toString(),
          discount: totalDiscount > 0 ? `₹${totalDiscount.toLocaleString("en-IN")}` : undefined,
          total: grandTotal.toString(),
          date: formData.invoiceDate,
          due: formData.dueDate || formData.invoiceDate,
          gstNumber: formData.gstNumber,
          items: [...serviceLines.filter(s => s.desc.trim()), ...itemLines.filter(i => i.desc.trim())],
          bankDetails: formData.bankDetails,
          paymentTerms: formData.paymentTerms,
          deliveryTerms: formData.deliveryTerms,
          authorizedSignatory: formData.authorizedSignatory,
          warranty: formData.warranty,
        }}
      />

      {/* ─── FLOATING SERVICE DROPDOWN PORTAL ─── */}
      {typeof document !== "undefined" && focusedServiceIndex !== null && serviceDropdownPos && createPortal(
        <div
          ref={serviceDropdownPortalRef}
          style={{
            position: "fixed",
            top: serviceDropdownPos.top !== undefined ? `${serviceDropdownPos.top}px` : undefined,
            bottom: serviceDropdownPos.bottom !== undefined ? `${serviceDropdownPos.bottom}px` : undefined,
            left: `${serviceDropdownPos.left}px`,
            width: `${serviceDropdownPos.width}px`,
            maxHeight: `${serviceDropdownPos.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-50/80 to-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Select Service</span>
            </div>
            <span className="text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full font-bold">
              Services Master
            </span>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoadingServices ? (
              <div className="p-6 text-xs text-slate-400 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading services from master...</span>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="p-6 text-xs text-slate-400 text-center font-medium">
                No active services found in master
              </div>
            ) : (
              (() => {
                const query = (serviceSearchText[focusedServiceIndex] !== undefined ? serviceSearchText[focusedServiceIndex] : "").toLowerCase().trim();
                const filtered = activeServices.filter((s) => {
                  if (!query) return true;
                  return (
                    (s.name || "").toLowerCase().includes(query) ||
                    (s.code || s.id || "").toLowerCase().includes(query) ||
                    (s.category || "").toLowerCase().includes(query)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-6 text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-700">No matching service found</p>
                      <p className="text-[11px] text-slate-400">
                        {query ? `No active service matches "${query}".` : "Please create services in the Service Master."}
                      </p>
                    </div>
                  );
                }

                const currentLine = serviceLines[focusedServiceIndex];

                return filtered.map((service, sIdx) => {
                  const isHighlighted = highlightedServiceIndex === sIdx;
                  const isSelected = currentLine?.serviceId === service.id || (currentLine?.desc && currentLine.desc.toLowerCase() === service.name.toLowerCase());

                  return (
                    <div
                      key={service.id}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          el.scrollIntoView({ block: "nearest" });
                        }
                      }}
                      className={`p-3 cursor-pointer text-xs transition-colors flex items-center justify-between gap-3 ${isSelected
                        ? "bg-blue-50/90 font-medium"
                        : isHighlighted
                          ? "bg-blue-50/50"
                          : "hover:bg-slate-50"
                        }`}
                      onMouseEnter={() => setHighlightedServiceIndex(sIdx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectService(focusedServiceIndex, service);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                          }`}>
                          {isSelected ? <Check className="w-4 h-4" /> : <Wrench className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold truncate text-xs ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                            {service.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {service.category && (
                              <span className="text-[10px] text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded font-semibold">
                                {service.category}
                              </span>
                            )}
                            {service.code && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {service.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-slate-900 text-xs">
                          ₹{Number(service.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          GST: {service.gst ?? 18}%
                        </p>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Footer Hints */}

        </div>,
        document.body
      )}

      {/* ─── FLOATING INVENTORY DROPDOWN PORTAL ─── */}
      {typeof document !== "undefined" && focusedInventoryIndex !== null && inventoryDropdownPos && createPortal(
        <div
          ref={inventoryDropdownPortalRef}
          style={{
            position: "fixed",
            top: inventoryDropdownPos.top !== undefined ? `${inventoryDropdownPos.top}px` : undefined,
            bottom: inventoryDropdownPos.bottom !== undefined ? `${inventoryDropdownPos.bottom}px` : undefined,
            left: `${inventoryDropdownPos.left}px`,
            width: `${inventoryDropdownPos.width}px`,
            maxHeight: `${inventoryDropdownPos.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-50/80 to-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Select Item</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-bold">
              Inventory Master
            </span>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoadingInventory ? (
              <div className="p-6 text-xs text-slate-400 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading inventory from master...</span>
              </div>
            ) : availableInventory.length === 0 ? (
              <div className="p-6 text-xs text-slate-400 text-center font-medium">
                No inventory items found in master
              </div>
            ) : (
              (() => {
                const query = (inventorySearchText[focusedInventoryIndex] !== undefined ? inventorySearchText[focusedInventoryIndex] : "").toLowerCase().trim();
                const filtered = availableInventory.filter((p) => {
                  if (!query) return true;
                  return (
                    (p.name || "").toLowerCase().includes(query) ||
                    (p.id || "").toLowerCase().includes(query) ||
                    (p.category || "").toLowerCase().includes(query)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-6 text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-700">No matching item found</p>
                      <p className="text-[11px] text-slate-400">
                        {query ? `No inventory item matches "${query}".` : "Please create items in the Inventory section."}
                      </p>
                    </div>
                  );
                }

                const currentLine = itemLines[focusedInventoryIndex];

                return filtered.map((product, pIdx) => {
                  const isHighlighted = highlightedInventoryIndex === pIdx;
                  const isSelected = currentLine?.itemId === product.id || (currentLine?.desc && currentLine.desc.toLowerCase() === product.name.toLowerCase());
                  const stock = Number(product.stock ?? 0);

                  return (
                    <div
                      key={product.id}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          el.scrollIntoView({ block: "nearest" });
                        }
                      }}
                      className={`p-3 cursor-pointer text-xs transition-colors flex items-center justify-between gap-3 ${isSelected
                        ? "bg-emerald-50/90 font-medium"
                        : isHighlighted
                          ? "bg-emerald-50/50"
                          : "hover:bg-slate-50"
                        }`}
                      onMouseEnter={() => setHighlightedInventoryIndex(pIdx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectInventoryItem(focusedInventoryIndex, product);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
                          }`}>
                          {isSelected ? <Check className="w-4 h-4" /> : <Package className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold truncate text-xs ${isSelected ? "text-emerald-900" : "text-slate-900"}`}>
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.category && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded font-semibold">
                                {product.category}
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${stock > 5 ? "bg-emerald-50 text-emerald-700" : stock > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                              }`}>
                              {stock > 0 ? `Stock: ${stock} ${product.unit || 'units'}` : "Out of stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-slate-900 text-xs">
                          ₹{Number(product.cost ?? product.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Rate
                        </p>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Footer Hints */}

        </div>,
        document.body
      )}

    </div>
  );
}
