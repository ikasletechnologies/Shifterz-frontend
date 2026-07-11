"use client";

import { useState, useEffect } from "react";
import { X, Printer, History } from "lucide-react";
import { getPayments, getSettings } from "@/lib/api";

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceData?: {
    id: string;
    client: string;
    amount: number;
    gst: number;
    discount: number;
  };
}

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  phone?: string;
  amount: number;
  mode: string;
  date: string;
  ref: string;
  notes?: string;
}

export default function PaymentHistoryDialog({
  isOpen,
  onClose,
  invoiceId,
  invoiceData,
}: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (invoiceId) {
        fetchPayments();
      }
      getSettings().then(data => {
        if (data?.companyInfo) setCompanyInfo(data.companyInfo);
      }).catch(console.error);
    }
  }, [isOpen, invoiceId]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const allPayments = await getPayments();
      const invoicePayments = allPayments.filter(
        (p: Payment) => p.invoiceId === invoiceId
      );
      setPayments(invoicePayments);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    const totalAmount =
      (invoiceData?.amount || 0) +
      (invoiceData?.gst || 0) -
      (invoiceData?.discount || 0);
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Receipt - ${payment.id}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                padding: 20px;
              }
              .receipt {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border: 3px solid #FACC15;
                border-radius: 6px;
                overflow: hidden;
              }
              .header {
                background: #FACC15;
                color: #1F2937;
                padding: 24px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0 0 10px 0;
                font-size: 32px;
                font-weight: 900;
                letter-spacing: 1px;
              }
              .header h2 {
                margin: 0 0 8px 0;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1px;
              }
              .header p {
                margin: 0;
                font-size: 12px;
                font-weight: 700;
                color: #DC2626;
              }
              .content {
                background: white;
                padding: 18px;
              }
              .row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 9px 0;
                border-bottom: 1px solid #E5E7EB;
              }
              .row:last-child {
                border-bottom: none;
              }
              .label {
                color: #6B7280;
                font-size: 10px;
                text-transform: uppercase;
                font-weight: 700;
                letter-spacing: 0.2px;
              }
              .value {
                font-weight: 700;
                font-size: 12px;
                color: #1F2937;
                text-align: right;
              }
              .highlight {
                background: #F0FDF4;
                border: 1px solid #DCFCE7;
                border-radius: 5px;
                padding: 11px 14px;
                margin: 12px 0;
              }
              .highlight-label {
                color: #6B7280;
                font-weight: 700;
                font-size: 8px;
                text-transform: uppercase;
              }
              .highlight-value {
                font-weight: 900;
                font-size: 22px;
                color: #16A34A;
              }
              .footer {
                text-align: center;
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid #E5E7EB;
              }
              .footer p {
                margin: 4px 0;
                font-size: 11px;
                color: #6B7280;
              }
              .footer p:first-child {
                font-weight: 700;
                color: #1F2937;
                font-size: 12px;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h1>${companyInfo?.name || 'SHIFTERZ'}</h1>
                <h2>PAYMENT RECEIPT</h2>
                <p>${payment.id}</p>
              </div>
              <div class="content">
                <div class="row">
                  <span class="label">Client Name</span>
                  <span class="value">${payment.client}</span>
                </div>
                <div class="row">
                  <span class="label">Invoice ID</span>
                  <span class="value">${invoiceId}</span>
                </div>
                <div class="highlight">
                  <div class="highlight-label">Amount Paid</div>
                  <div class="highlight-value">₹${Number(payment.amount).toLocaleString(
                    "en-IN"
                  )}</div>
                </div>
                <div class="row">
                  <span class="label">Payment Mode</span>
                  <span class="value">${payment.mode}</span>
                </div>
                <div class="row">
                  <span class="label">Payment Date</span>
                  <span class="value">${payment.date}</span>
                </div>
                <div class="row">
                  <span class="label">Reference</span>
                  <span class="value">${payment.ref}</span>
                </div>
                <div class="row">
                  <span class="label">Total Invoice Amount</span>
                  <span class="value">₹${totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span class="label">Total Paid So Far</span>
                  <span class="value">₹${paidAmount.toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span class="label">Pending Amount</span>
                  <span class="value" style="color: #DC2626;">₹${remainingAmount.toLocaleString(
                    "en-IN"
                  )}</span>
                </div>
                <div class="footer">
                  <p>Thank you for your payment!</p>
                  <p>For queries: 0422-123 4567</p>
                </div>
              </div>
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

  if (!isOpen) return null;

  const totalAmount =
    (invoiceData?.amount || 0) + (invoiceData?.gst || 0) - (invoiceData?.discount || 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-400 p-1.5 sm:p-2 rounded-lg">
              <History className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Payment History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="pb-2 sm:pb-0 sm:border-r border-blue-100 pr-3">
              <p className="text-xs text-gray-600 font-bold uppercase">Total Amount</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="pb-2 sm:pb-0 sm:pr-3 sm:border-r border-blue-100 md:pr-3">
              <p className="text-xs text-gray-600 font-bold uppercase">Total Paid</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="md:pl-3">
              <p className="text-xs text-gray-600 font-bold uppercase">Pending Amount</p>
              <p className={`text-base sm:text-lg md:text-xl font-bold ${pendingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{pendingAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Payments List */}
        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {payments.map((payment, index) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      Payment #{index + 1} - {payment.id}
                    </p>
                    <p className="text-xs text-gray-500">{payment.date}</p>
                  </div>
                  <button
                    onClick={() => handlePrintReceipt(payment)}
                    className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 shrink-0"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-bold text-green-600">₹{Number(payment.amount).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mode</p>
                    <p className="font-semibold text-gray-900">{payment.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reference</p>
                    <p className="font-semibold text-gray-900">{payment.ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">{payment.phone || "-"}</p>
                  </div>
                </div>
                {payment.notes && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-600">{payment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
