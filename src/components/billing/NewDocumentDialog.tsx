"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { X, FileText, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchVehicleDetails, getServices } from "@/lib/api";

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (doc: any) => void;
  existingDocuments?: any[];
}

const COMMON_SERVICES = [
  "PPF Full Body",
  "PPF Bonnet + Roof",
  "PPF Partial (Hood)",
  "C3 Pro Coating",
  "Ceramic Coating",
  "Graphene Coating",
  "Interior Detailing",
  "Paint Correction (1-step)",
  "Full Paint Correction",
  "Window Tinting"
];

export default function NewDocumentDialog({
  isOpen,
  onClose,
  onSubmit,
  existingDocuments = [],
}: NewDocumentDialogProps) {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [formData, setFormData] = useState({
    type: "Estimate",
    status: "Pending",
    client: "",
    phone: "",
    vehicle: "",
    discount: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    gstNumber: "",
    bankDetails: "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
    paymentTerms: "50% advance payment.\nBalance before shipment.",
    deliveryTerms: "Delivery within 15 days after receipt of advance payment.",
    authorizedSignatory: "Authorized Signatory",
  });

  const [items, setItems] = useState([{ desc: "Industrial Pump Model X100", qty: 1, price: 0, amount: 0 }]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [isFetchingVehicle, setIsFetchingVehicle] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

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
    } catch (err) {
      // Vehicle not found or error, do nothing silently
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
        discount: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
        gstNumber: "",
        bankDetails: "Bank: Example Bank\nAccount Name: ABC Trading Pvt. Ltd.\nAccount No.: XXXXXXXX",
        paymentTerms: "50% advance payment.\nBalance before shipment.",
        deliveryTerms: "Delivery within 15 days after receipt of advance payment.",
        authorizedSignatory: "Authorized Signatory",
      });
      setItems([{ desc: "", qty: 1, price: 0, amount: 0 }]);
    }
  }, [isOpen]);

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
    const updatedItems = items.map((item) => {
      const amt = (item.qty || 0) * (item.price || 0);
      subtotal += amt;
      return { ...item, amount: amt };
    });
    setBaseAmount(subtotal);
    setGstAmount((subtotal * 18) / 100);
  }, [items]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };
    updatedItem.amount = (updatedItem.qty || 0) * (updatedItem.price || 0);
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { desc: "", qty: 1, price: 0, amount: 0 }]);
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

    // Validate vehicle number format if provided: TN 04 AB 1234
    if (formData.vehicle.trim()) {
      const vehicleRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,2}\s\d{1,4}$/;
      if (!vehicleRegex.test(formData.vehicle)) {
        toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
        return;
      }
    }

    if (onSubmit) {
      const discountPercent = parseFloat(formData.discount) || 0;
      const discountAmount = (baseAmount * discountPercent) / 100;

      const docTypePrefix = {
        Invoice: "INV",
        Quotation: "QT",
        Estimate: "EST",
      }[formData.type] || "DOC";

      // Get the next sequential ID based on document type
      let maxId = 0;
      const relevantDocs = existingDocuments.filter((doc) => doc.id?.startsWith(docTypePrefix));
      relevantDocs.forEach((doc) => {
        const numStr = doc.id.replace(docTypePrefix, "");
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      });
      const docNo = `${docTypePrefix}${String(maxId + 1).padStart(3, "0")}`;

      const newDoc = {
        type: formData.type,
        client: formData.client,
        phone: formData.phone,
        vehicle: formData.vehicle,
        service: items.length > 0 ? items[0].desc : "Multiple Items", // fallback
        amount: baseAmount,
        gst: gstAmount,
        discount: discountAmount,
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
      };
      onSubmit(newDoc);
    }
    
    // Reset handled by useEffect when isOpen becomes false
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl shadow-xl max-h-[95vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white z-10 pb-3 sm:pb-4 border-b">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-500" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">New Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {/* Row 1: Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                required
              >
                <option>Estimate</option>
                <option>Quotation</option>
                <option>Invoice</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Overdue</option>
                <option>Approved</option>
              </select>
            </div>
          </div>

          {/* Row 2: Client & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
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

          {/* Row 3: Vehicle & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex justify-between">
                <span>Vehicle No.</span>
                {isFetchingVehicle && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                onBlur={handleVehicleBlur}
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={formData.invoiceDate}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50 uppercase"
              />
            </div>
          </div>

          <hr className="my-6" />

          {/* Line Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 sm:gap-3 lg:gap-4 items-start">
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      data-item-index={index}
                      value={item.desc}
                      onChange={(e) => handleItemChange(index, "desc", e.target.value)}
                      onFocus={() => setFocusedItemIndex(index)}
                      onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                      placeholder="Service Description"
                      className="w-full px-2 sm:px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-sm"
                      required
                      autoComplete="off"
                    />
                    {focusedItemIndex === index && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-yellow-400 rounded-lg shadow-2xl max-h-56 overflow-y-auto top-full left-0"
                      >
                        {isLoadingServices ? (
                          <div className="px-4 py-4 text-sm text-gray-600 text-center font-medium">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Loading services...
                          </div>
                        ) : availableServices.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-gray-500 text-center">
                            No services available
                          </div>
                        ) : (
                          <>
                            {/* Show database services only */}
                            {availableServices
                              .filter(s => !item.desc || s.name.toLowerCase().includes(item.desc.toLowerCase()))
                              .map((service) => (
                                <div
                                  key={service.id}
                                  className="px-4 py-3 hover:bg-yellow-100 cursor-pointer text-sm text-gray-800 font-semibold transition-colors border-b border-gray-100 last:border-0 bg-yellow-50/50"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevents input onBlur from closing the dropdown before selection is registered
                                    const newItems = [...items];
                                    newItems[index].desc = service.name;
                                    newItems[index].price = service.price || 0;
                                    newItems[index].amount = newItems[index].qty * (service.price || 0);
                                    setItems(newItems);
                                    setFocusedItemIndex(null);
                                  }}
                                >
                                  <div className="font-bold text-gray-900">{service.name}</div>
                                  <div className="text-xs text-gray-600">₹{service.price?.toLocaleString("en-IN") || 0}</div>
                                </div>
                              ))}

                            {/* Message when no matches */}
                            {item.desc && availableServices.filter(s => s.name.toLowerCase().includes(item.desc.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 font-medium border-t border-gray-100">
                                No services match "{item.desc}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="w-16 sm:w-20 lg:w-24 shrink-0">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", parseFloat(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm"
                      min="1"
                      required
                    />
                  </div>
                  <div className="w-20 sm:w-28 lg:w-32 shrink-0">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value))}
                      placeholder="Price"
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm"
                      min="0"
                      required
                    />
                  </div>
                  <div className="w-20 sm:w-28 lg:w-32 shrink-0">
                    <input
                      type="number"
                      value={item.amount}
                      readOnly
                      placeholder="Amount"
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="pt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-3 sm:mt-4 text-xs sm:text-sm overflow-x-auto">
              <div className="w-56 sm:w-64 md:w-72 space-y-2 shrink-0">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span>₹{baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">GST (18%):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">Discount (%):</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  ₹{((baseAmount * (parseFloat(formData.discount) || 0)) / 100).toFixed(2)} off
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-yellow-600">
                    ₹{(baseAmount + gstAmount - ((baseAmount * (parseFloat(formData.discount) || 0)) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4 sm:my-5 lg:my-6" />

          {/* Additional Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Payment Terms
              </label>
              <textarea
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Delivery Terms
              </label>
              <textarea
                name="deliveryTerms"
                value={formData.deliveryTerms}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Bank Details
              </label>
              <textarea
                name="bankDetails"
                value={formData.bankDetails}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                name="authorizedSignatory"
                value={formData.authorizedSignatory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm mb-4"
              />
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Client GSTIN (Optional)
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                maxLength={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm uppercase"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
          >
            ✓ Generate Document
          </button>
        </form>
      </div>
    </div>
  );
}
