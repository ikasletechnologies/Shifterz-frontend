"use client";

import { useState, useEffect } from "react";
import { X, Ban } from "lucide-react";
import { BillingDocument } from "../types/billing.types";

interface CancelInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document?: BillingDocument | null;
  onConfirm: (reason: string) => void;
}

export function CancelInvoiceDialog({ isOpen, onClose, document, onConfirm }: CancelInvoiceDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Cancel {document.type}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg mb-4 border border-red-200">
          <p className="font-medium mb-1">
            You are about to cancel {document.type} <span className="font-mono">{document.id}</span>
          </p>
          <ul className="list-disc ml-5 mb-2 text-red-600">
            <li><strong>Customer:</strong> {document.client}</li>
            <li><strong>Amount:</strong> ₹{document.total ? document.total.toLocaleString("en-IN") : document.amount?.toLocaleString("en-IN")}</li>
          </ul>
          <p className="text-xs">
            <strong>Audit Trail Notice:</strong> This document will not be permanently deleted. It will remain in the system marked as Cancelled for compliance purposes.
          </p>
        </div>

        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Cancellation Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Why is this invoice being cancelled?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 resize-none text-sm"
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
