"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { X, Printer } from "lucide-react";

interface PrintPassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pass?: {
    passId: string;
    vehicle: string;
    model: string;
    customer: string;
    phone: string;
    service: string;
    outTime: string;
    technician: string;
    security: string;
    remarks?: string;
    jobCardId?: string;
    invoiceId?: string;
    paymentStatus?: string;
    createdBy?: string;
  };
}

export default function PrintPassDialog({
  isOpen,
  onClose,
  pass,
}: PrintPassDialogProps) {
  if (!isOpen || !pass) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=800,width=800");
    if (printWindow) {
      const passHtml = document.getElementById("pass-preview")?.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Out Pass ${pass?.passId}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 0;
              }
              .pass-content {
                border: 4px solid #FACC15;
                border-radius: 8px;
                padding: 32px;
                background: linear-gradient(to bottom right, #FFFACD, #FFFFFF);
              }
              .text-center {
                text-align: center;
              }
              .mb-6 {
                margin-bottom: 24px;
              }
              .mb-2 {
                margin-bottom: 8px;
              }
              .mb-8 {
                margin-bottom: 32px;
              }
              .mt-4 {
                margin-top: 16px;
              }
              .text-5xl {
                font-size: 48px;
              }
              .text-2xl {
                font-size: 24px;
              }
              .text-sm {
                font-size: 14px;
              }
              .text-xs {
                font-size: 12px;
              }
              .font-bold {
                font-weight: bold;
              }
              .text-yellow-500 {
                color: #FACC15;
              }
              .text-gray-900 {
                color: #111827;
              }
              .text-gray-500 {
                color: #6B7280;
              }
              .text-gray-600 {
                color: #4B5563;
              }
              .text-gray-300 {
                color: #D1D5DB;
              }
              .uppercase {
                text-transform: uppercase;
              }
              .tracking-wide {
                letter-spacing: 0.05em;
              }
              .border-b {
                border-bottom: 1px solid #D1D5DB;
              }
              .pb-4 {
                padding-bottom: 16px;
              }
              .grid {
                display: grid;
                gap: 24px;
              }
              .grid-cols-2 {
                grid-template-columns: repeat(2, 1fr);
              }
              .gap-6 {
                gap: 24px;
              }
              .gap-8 {
                gap: 32px;
              }
              .mt-12 {
                margin-top: 48px;
              }
              .pt-8 {
                padding-top: 32px;
              }
              .border-t {
                border-top: 1px solid #D1D5DB;
              }
              .border-t-2 {
                border-top: 2px solid #111827;
              }
              .w-32 {
                width: 128px;
              }
              .mx-auto {
                margin-left: auto;
                margin-right: auto;
              }
              .last\\:border-0:last-child {
                border-bottom: none;
              }
            </style>
          </head>
          <body>
            <div class="pass-content">
              ${passHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Out Pass Preview</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Pass Preview */}
        <div
          id="pass-preview"
          className="border-4 border-yellow-400 rounded-lg p-8"
          style={{
            background: "linear-gradient(to bottom right, #FFFACD, #FFFFFF)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-yellow-500 mb-2">SHIFTERZ</h1>
            <p className="text-sm text-gray-500">
              42, RACE COURSE RD, COIMBATORE - 641018
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              VEHICLE OUT PASS
            </h2>
            <p className="text-sm text-gray-600 mt-1">Pass No: {pass.passId}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {/* Vehicle No. */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Vehicle No.
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.vehicle}</p>
            </div>

            {/* Car Model */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Car Model
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.model}</p>
            </div>

            {/* Customer */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Customer
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.customer}</p>
            </div>

            {/* Phone */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Phone
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.phone}</p>
            </div>

            {/* Service Done */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Service Done
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.service}</p>
            </div>

            {/* Out Date/Time */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Out Date/Time
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.outTime}</p>
            </div>

            {/* Technician */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Technician
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.technician}</p>
            </div>

            {/* Security */}
            <div className="border-b border-gray-300 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Security
              </p>
              <p className="text-lg font-bold text-gray-900">{pass.security}</p>
            </div>

            {/* Job Card No. */}
            {pass.jobCardId && (
              <div className="border-b border-gray-300 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Job Card No.</p>
                <p className="text-lg font-bold text-gray-900">{pass.jobCardId}</p>
              </div>
            )}

            {/* Invoice No. */}
            {pass.invoiceId && (
              <div className="border-b border-gray-300 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invoice No.</p>
                <p className="text-lg font-bold text-gray-900">{pass.invoiceId}</p>
              </div>
            )}

            {/* Payment Status */}
            {pass.paymentStatus && (
              <div className="border-b border-gray-300 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                <p className={`text-lg font-bold ${
                  pass.paymentStatus === "Paid" ? "text-emerald-600" :
                  pass.paymentStatus === "Approved Credit" ? "text-blue-600" :
                  "text-amber-600"
                }`}>{pass.paymentStatus}</p>
              </div>
            )}

            {/* Generated By */}
            {pass.createdBy && (
              <div className="border-b border-gray-300 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Generated By</p>
                <p className="text-lg font-bold text-gray-900">{pass.createdBy}</p>
              </div>
            )}
          </div>

          {/* Remarks */}
          {pass.remarks && (
            <div className="mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Remarks
              </p>
              <p className="text-gray-900">{pass.remarks}</p>
            </div>
          )}

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-300">
            <div className="text-center">
              <div className="border-t-2 border-gray-900 w-32 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Authorised By</p>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-gray-900 w-32 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Customer Signature</p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .fixed {
              position: static !important;
              background: white !important;
            }
            .fixed::before {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
