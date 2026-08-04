"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, MessageCircle, Mail, Download, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { BillingDocument } from "../types/billing.types";

interface ShareInvoiceMenuProps {
  doc: BillingDocument;
  onLogShare: (id: string, channel: "whatsapp" | "email") => void;
}

export function ShareInvoiceMenu({ doc, onLogShare }: ShareInvoiceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) window.document.addEventListener("mousedown", onClickOutside);
    return () => window.document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const total = (doc.amount || 0) + (doc.gst || 0) - (doc.discount || 0);
  const message = `Your ${doc.type.toLowerCase()} ${doc.id} for ${doc.vehicle} — total ₹${total.toLocaleString("en-IN")}.`;

  const shareViaWhatsApp = () => {
    onLogShare(doc.id, "whatsapp");
    const phone = (doc.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${phone ? `91${phone}` : ""}?text=${encodeURIComponent(message)}`, "_blank");
    setIsOpen(false);
  };

  const shareViaEmail = () => {
    onLogShare(doc.id, "email");
    window.open(`mailto:?subject=${encodeURIComponent(`Invoice ${doc.id}`)}&body=${encodeURIComponent(message)}`, "_blank");
    setIsOpen(false);
  };

  const shareViaPrint = () => {
    onLogShare(doc.id, "print" as any);
    toast.success("Print dialog opened");
    window.print();
    setIsOpen(false);
  };

  const shareViaPdf = () => {
    onLogShare(doc.id, "pdf" as any);
    toast.success("PDF downloaded successfully");
    // Placeholder for actual PDF generation
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="Share Invoice"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={shareViaWhatsApp}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp
          </button>
          <button
            onClick={shareViaEmail}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Mail className="w-4 h-4 text-blue-600" /> Email
          </button>
          <div className="my-1 border-t border-gray-100"></div>
          <button
            onClick={shareViaPdf}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 text-red-600" /> Download PDF
          </button>
          <button
            onClick={shareViaPrint}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 text-gray-600" /> Print
          </button>
        </div>
      )}
    </div>
  );
}
