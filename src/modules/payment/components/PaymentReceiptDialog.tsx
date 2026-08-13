"use client";

import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { getSettings } from "@/lib/api";
import { formatDate } from "@/lib/timeUtils";

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: {
    id: string;
    receiptNumber?: string;
    invoiceRef?: string;
    client: string;
    phone?: string;
    vehicle?: string;
    service?: string;
    amount: string;
    mode: string;
    multipleModes?: Array<{ mode: string; amount: number }>;
    type?: string;
    outstandingBalance?: number;
    date: string;
    reference: string;
    notes?: string;
    collectedBy?: string;
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
            <title>Payment Receipt - ${payment.receiptNumber || payment.id}</title>
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header — back arrow left, Print right */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          {/* Back / Close button — top left */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <h2 className="text-base sm:text-lg font-bold text-gray-900">Payment Receipt</h2>

          {/* Print button — top right */}
          <button
            type="button"
            onClick={handlePrint}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Print</span>
          </button>
        </div>

        {/* Scrollable receipt body */}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-5">
          {/* Receipt Preview */}
          <div id="print-receipt-content" className="border-4 border-yellow-400 rounded-xl overflow-hidden bg-white max-w-sm mx-auto">
            {/* Header */}
            <div className="bg-yellow-400 text-gray-900 px-6 py-5 text-center">
              <h1 className="text-3xl font-black mb-2 tracking-wide">{companyInfo?.name || 'SHIFTERZ'}</h1>
              <h2 className="text-sm font-bold mb-1 tracking-widest">
                {(payment.type || 'PAYMENT RECEIPT').toUpperCase()}
              </h2>
              <p className="text-xs font-semibold text-red-600">{payment.receiptNumber || payment.id}</p>
            </div>

            {/* Content */}
            <div className="bg-white px-5 py-5">
              {/* Client Name */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-1">Client Name</p>
                <p className="text-lg font-black text-gray-900">{payment.client}</p>
              </div>

              {/* Invoice ID */}
              {payment.invoiceRef && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Invoice ID</span>
                  <span className="font-bold text-red-600 text-sm">{payment.invoiceRef}</span>
                </div>
              )}

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

              {/* Payment Mode (Split or Single) */}
              <div className="py-2.5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Payment Mode</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs font-bold">
                    {payment.mode}
                  </span>
                </div>
                {payment.multipleModes && payment.multipleModes.length > 0 && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-400 space-y-1">
                    {payment.multipleModes.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-700">
                        <span>{m.mode}:</span>
                        <span className="font-bold">₹{m.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outstanding Balance */}
              {typeof payment.outstandingBalance === 'number' && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Outstanding Balance</span>
                  <span className={`font-bold text-xs ${payment.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{payment.outstandingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Payment Date */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Payment Date</span>
                <span className="font-semibold text-gray-900 text-xs">{formatDate(payment.date)}</span>
              </div>

              {/* Reference */}
              {payment.reference && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Reference</span>
                  <span className="font-semibold text-gray-900 text-xs">{payment.reference}</span>
                </div>
              )}

              {payment.notes && (
                <div className="py-2.5 border-b border-gray-200 mt-2">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Notes</span>
                  <p className="font-semibold text-gray-900 mt-1 text-xs">{payment.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-4 mt-4">
                <p className="text-xs text-gray-900 font-bold mb-1">Thank you for your payment!</p>
                {payment.collectedBy && (
                  <p className="text-[10px] text-gray-500 mb-1">Collected by: {payment.collectedBy}</p>
                )}
                <p className="text-xs text-gray-600">For queries: {companyInfo?.phone || '0422-123 4567'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

