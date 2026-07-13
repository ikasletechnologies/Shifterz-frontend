"use client";

import { useState, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { getSettings } from "@/lib/api";

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: {
    id: string;
    invoiceRef: string;
    client: string;
    phone?: string;
    vehicle?: string;
    service?: string;
    amount: string;
    mode: string;
    date: string;
    reference: string;
    notes?: string;
  };
}

export default function PaymentReceiptDialog({
  isOpen,
  onClose,
  payment,
}: PaymentReceiptDialogProps) {
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      getSettings().then(data => {
        if (data?.companyInfo) setCompanyInfo(data.companyInfo);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("print-receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "", "height=900,width=900");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Receipt - ${payment.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body class="p-8 bg-white flex justify-center">
            <div style="width: 100%; max-width: 42rem;">
              ${printContent.outerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 1000);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div id="print-receipt-content" className="border-4 border-yellow-400 rounded-xl overflow-hidden bg-white max-w-sm mx-auto">
          {/* Header */}
          <div className="bg-yellow-400 text-gray-900 px-6 py-5 text-center">
            <h1 className="text-3xl font-black mb-2 tracking-wide">{companyInfo?.name || 'SHIFTERZ'}</h1>
            <h2 className="text-sm font-bold mb-1 tracking-widest">PAYMENT RECEIPT</h2>
            <p className="text-xs font-semibold text-red-600">{payment.id}</p>
          </div>

          {/* Content */}
          <div className="bg-white px-5 py-5">
            {/* Client Name */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-1">Client Name</p>
              <p className="text-lg font-black text-gray-900">{payment.client}</p>
            </div>

            {/* Invoice ID */}
            <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Invoice ID</span>
              <span className="font-bold text-red-600 text-sm">{payment.invoiceRef}</span>
            </div>

            {payment.vehicle && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Vehicle</span>
                <span className="font-semibold text-gray-900 text-xs">{payment.vehicle}</span>
              </div>
            )}

            {payment.service && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Service</span>
                <span className="font-semibold text-gray-900 text-xs">{payment.service}</span>
              </div>
            )}

            {/* Amount Paid - Highlighted */}
            <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-lg border border-green-200 my-4">
              <span className="text-xs text-gray-700 uppercase tracking-wider font-bold">Amount Paid</span>
              <span className="font-black text-green-600 text-2xl">{payment.amount}</span>
            </div>

            {/* Payment Mode */}
            <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Payment Mode</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs font-bold">
                {payment.mode}
              </span>
            </div>

            {/* Payment Date */}
            <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Payment Date</span>
              <span className="font-semibold text-gray-900 text-xs">{payment.date}</span>
            </div>

            {/* Reference */}
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Reference</span>
              <span className="font-semibold text-gray-900 text-xs">{payment.reference}</span>
            </div>

            {payment.notes && (
              <div className="py-2.5 border-t border-gray-200 mt-3">
                <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Notes</span>
                <p className="font-semibold text-gray-900 mt-1 text-xs">{payment.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200 mt-4">
              <p className="text-xs text-gray-900 font-bold mb-1">Thank you for your payment!</p>
              <p className="text-xs text-gray-600">For queries: 0422-123 4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
