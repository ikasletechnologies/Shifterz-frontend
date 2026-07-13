"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

interface ConvertDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (convertedData: any) => void;
  document?: any;
}

const CONVERSION_FLOW: Record<string, string | null> = {
  "Estimate": "Quotation",
  "Quotation": "Invoice",
  "Invoice": null,
};

export default function ConvertDocumentDialog({
  isOpen,
  onClose,
  onSubmit,
  document,
}: ConvertDocumentDialogProps) {
  const [formData, setFormData] = useState({
    amount: "",
    gst: "",
    discount: "",
  });

  const targetType = document ? CONVERSION_FLOW[document.type] : null;
  const canConvert = !!targetType;

  useEffect(() => {
    if (document && isOpen) {
      // Convert discount amount back to percentage for display
      const discountPercent = document.discount && document.amount
        ? ((document.discount / document.amount) * 100).toFixed(2)
        : "";

      setFormData({
        amount: document.amount || "",
        gst: document.gst || "",
        discount: discountPercent,
      });
    }
  }, [isOpen, document]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "discount") {
      const discountPercent = Math.min(100, Math.max(0, Number(value) || 0));
      setFormData((prev) => ({ ...prev, [name]: discountPercent.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const amount = Number(formData.amount);
    const gst = Number(formData.gst) || 0;
    const discountPercent = Number(formData.discount) || 0;

    if (discountPercent > 100) {
      toast.error("Discount percentage cannot exceed 100%");
      return;
    }

    const discountAmount = (amount * discountPercent) / 100;
    const total = amount + gst - discountAmount;

    if (total <= 0) {
      toast.error("Total amount cannot be zero or negative. Reduce discount percentage.");
      return;
    }

    if (onSubmit && document) {
      onSubmit({
        ...document,
        type: targetType,
        amount: amount,
        gst: gst,
        discount: discountAmount,
        convertedFrom: document.id,
        previousType: document.type,
        conversionDate: new Date().toISOString().split("T")[0],
      });
    }
    onClose();
  };

  if (!isOpen || !document || !canConvert) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-400 p-1.5 sm:p-2 rounded-lg">
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Convert Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Conversion Info */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-2 sm:px-3 py-1 bg-blue-100 rounded-lg text-xs sm:text-sm font-bold text-blue-700">
              {document.type}
            </div>
            <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
            <div className="px-2 sm:px-3 py-1 bg-green-100 rounded-lg text-xs sm:text-sm font-bold text-green-700">
              {targetType}
            </div>
          </div>
          <p className="text-xs text-blue-600 text-center mt-2 sm:mt-3">
            {document.type} #{document.id} will be converted to {targetType}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Amount - Read Only */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Amount (₹) <span className="text-gray-400">(Fixed)</span>
            </label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-bold text-sm sm:text-base">
              ₹{Number(formData.amount || 0).toLocaleString("en-IN")}
            </div>
          </div>

          {/* GST - Read Only */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              GST Amount (₹) <span className="text-gray-400">(Fixed)</span>
            </label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-bold text-sm sm:text-base">
              ₹{Number(formData.gst || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max allowed: ₹{((Number(formData.amount || 0) * 18) / 100).toFixed(2)} (18% of amount)
            </p>
          </div>

          {/* Discount Percentage - Editable */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Discount (%) - From Original Document
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  placeholder="0"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-gray-900 font-bold text-sm sm:text-base"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="text-sm font-bold text-gray-600">%</span>
              </div>
              <p className="text-xs text-green-600 font-semibold">
                ✓ Amount off: ₹{(
                  (Number(formData.amount || 0) * Number(formData.discount || 0)) / 100
                ).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 italic">
                Discount percentage carried from original document
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-green-50 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4 border border-green-200">
            <p className="text-xs text-gray-600 mb-1">Total Amount:</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">
              ₹{(
                Number(formData.amount || 0) +
                Number(formData.gst || 0) -
                ((Number(formData.amount || 0) * Number(formData.discount || 0)) / 100)
              ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 sm:mt-6 text-sm sm:text-base"
          >
            <ArrowRight className="w-5 h-5" />
            Convert to {targetType}
          </button>
        </form>
      </div>
    </div>
  );
}
