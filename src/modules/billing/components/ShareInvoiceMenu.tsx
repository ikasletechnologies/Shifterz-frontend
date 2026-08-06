"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Share2, MessageCircle, Mail, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { BillingDocument } from "../types/billing.types";
import { getSettings } from "@/lib/api";

interface ShareInvoiceMenuProps {
  doc: BillingDocument;
  onLogShare: (id: string, channel: "whatsapp" | "email") => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export async function downloadInvoicePdf(doc: BillingDocument) {
  const loadingToast = toast.loading("Generating PDF…");
  try {
    const [{ default: jsPDF }, { default: autoTable }, settingsData] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      getSettings().catch(() => null),
    ]);
    const companyInfo = (settingsData as any)?.companyInfo || null;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    const total = (doc.amount || 0) + (doc.gst || 0) - (doc.discount || 0);

    // Header band
    pdf.setFillColor(250, 204, 21);
    pdf.rect(0, 0, pageWidth, 28, "F");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(companyInfo?.name || "SHIFTERZ", margin, 12);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(companyInfo?.address || "42, Race Course Rd, Coimbatore - 641018", margin, 18);
    if (companyInfo?.phone) pdf.text(companyInfo.phone, margin, 23);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(doc.type.toUpperCase(), pageWidth - margin, 12, { align: "right" });
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(doc.id, pageWidth - margin, 18, { align: "right" });
    if (doc.status) {
      const statusColorMap: Record<string, [number, number, number]> = { Paid: [22, 163, 74], Overdue: [220, 38, 38], Approved: [37, 99, 235] };
      const [r, g, b] = statusColorMap[doc.status] || [217, 119, 6];
      pdf.setTextColor(r, g, b);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text(doc.status.toUpperCase(), pageWidth - margin, 24, { align: "right" });
      pdf.setTextColor(17, 24, 39);
    }

    // Bill To & Details
    let y = 36;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(150, 150, 150);
    pdf.text("BILL TO", margin, y);
    pdf.text("DETAILS", pageWidth / 2 + 10, y);
    y += 5;
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(doc.client || "—", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    y += 5; pdf.text(doc.phone || "—", margin, y);
    y += 4; pdf.text(doc.vehicle || "—", margin, y);

    const detailX = pageWidth / 2 + 10;
    let detailY = 41;
    const detailRows: [string, string][] = [
      ["Date", formatDate(doc.date)],
      ["Due", formatDate(doc.dueDate)],
    ];
    if (doc.gstNumber) detailRows.push(["Client GSTIN", doc.gstNumber]);
    detailRows.push(["Our GSTIN", companyInfo?.gstin || "33AAAAAO000A1Z5"]);
    pdf.setFontSize(8);
    for (const [label, value] of detailRows) {
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(80, 80, 80);
      pdf.text(`${label}:`, detailX, detailY);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(17, 24, 39);
      pdf.text(value, detailX + 28, detailY);
      detailY += 5;
    }
    y = Math.max(y + 8, detailY + 4);

    // Items table
    const tableHead = [["Description", "Qty", "Unit Price", "Disc%", "Disc Amt", "GST%", "GST Amt", "Warranty", "Amount"]];
    const tableBody: string[][] = [];
    if (doc.items && doc.items.length > 0) {
      for (const item of doc.items) {
        const itemAmt = item.amount || (item.qty * item.price) || 0;
        const discAmt = item.discountPercent ? (itemAmt * item.discountPercent / 100) : 0;
        const gstAmt = ((itemAmt - discAmt) * (item.gstPercent ?? 18)) / 100;
        tableBody.push([
          item.desc || "-", String(item.qty),
          `Rs.${Number(item.price || 0).toLocaleString("en-IN")}`,
          item.discountPercent ? `${item.discountPercent}%` : "-",
          `Rs.${Number(discAmt).toLocaleString("en-IN")}`,
          `${item.gstPercent ?? 18}%`,
          `Rs.${Number(gstAmt).toLocaleString("en-IN")}`,
          item.warranty || "-",
          `Rs.${Number(itemAmt).toLocaleString("en-IN")}`,
        ]);
      }
    } else {
      const gstAmt = (doc.amount || 0) * 0.18;
      tableBody.push([doc.service || "-", "1", `Rs.${Number(doc.amount || 0).toLocaleString("en-IN")}`, "-", "Rs.0", "18%", `Rs.${Number(gstAmt).toLocaleString("en-IN")}`, "-", `Rs.${Number(doc.amount || 0).toLocaleString("en-IN")}`]);
    }
    const itemCount = tableBody.length;
    tableBody.push(["", "", "", "", "", "", "", "Subtotal", `Rs.${Number(doc.amount || 0).toLocaleString("en-IN")}`]);
    tableBody.push(["", "", "", "", "", "", "", "CGST", `Rs.${Number((doc.gst || 0) / 2).toLocaleString("en-IN")}`]);
    tableBody.push(["", "", "", "", "", "", "", "SGST", `Rs.${Number((doc.gst || 0) / 2).toLocaleString("en-IN")}`]);
    if ((doc.discount || 0) > 0) tableBody.push(["", "", "", "", "", "", "", "Discount", `-Rs.${Number(doc.discount || 0).toLocaleString("en-IN")}`]);
    tableBody.push(["", "", "", "", "", "", "", "TOTAL", `Rs.${total.toLocaleString("en-IN")}`]);

    autoTable(pdf, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [250, 204, 21], textColor: [17, 24, 39], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 40 }, 1: { halign: "center", cellWidth: 10 }, 2: { halign: "right", cellWidth: 22 },
        3: { halign: "center", cellWidth: 12 }, 4: { halign: "right", cellWidth: 18 },
        5: { halign: "center", cellWidth: 12 }, 6: { halign: "right", cellWidth: 18 },
        7: { halign: "center", cellWidth: 18 }, 8: { halign: "right", cellWidth: 20 },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index >= itemCount) {
          const isTotal = data.row.index === tableBody.length - 1;
          data.cell.styles.fillColor = isTotal ? [255, 250, 205] : [249, 249, 249];
          data.cell.styles.fontStyle = isTotal ? "bold" : "normal";
          if (isTotal) data.cell.styles.fontSize = 9;
        }
      },
      margin: { left: margin, right: margin },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 6;

    // Warranty
    if (doc.warranty) {
      pdf.setFillColor(240, 253, 244); pdf.setDrawColor(187, 247, 208);
      pdf.roundedRect(margin, finalY, pageWidth - margin * 2, 10, 2, 2, "FD");
      pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(21, 128, 61);
      pdf.text("Warranty:", margin + 3, finalY + 6.5);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(17, 24, 39);
      pdf.text(doc.warranty, margin + 22, finalY + 6.5);
      finalY += 14;
    }

    // Terms & Signatory
    const termsY = finalY;
    pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal"); pdf.setTextColor(80, 80, 80);
    let termsLineY = termsY;
    if (doc.paymentTerms) {
      pdf.setFont("helvetica", "bold"); pdf.text("Payment Terms:", margin, termsLineY);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(doc.paymentTerms, 80);
      pdf.text(lines, margin, termsLineY + 4);
      termsLineY += 4 + lines.length * 4;
    }
    if (doc.bankDetails) {
      pdf.setFont("helvetica", "bold"); pdf.text("Bank Details:", margin, termsLineY + 2);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(doc.bankDetails, 80);
      pdf.text(lines, margin, termsLineY + 6);
    }
    const signX = pageWidth - margin;
    pdf.setDrawColor(17, 24, 39);
    pdf.line(signX - 50, termsY + 24, signX, termsY + 24);
    pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(17, 24, 39);
    pdf.text(doc.authorizedSignatory || "Authorized Signatory", signX, termsY + 28, { align: "right" });

    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 14;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(120, 120, 120);
    pdf.text(`Thank you for choosing ${companyInfo?.name || "Shifterz"}!  |  ${companyInfo?.phone || "0422-123 4567"}`, pageWidth / 2, footerY, { align: "center" });

    pdf.save(`${doc.id}.pdf`);
    toast.dismiss(loadingToast);
    toast.success(`PDF downloaded: ${doc.id}.pdf`);
  } catch (err) {
    console.error("PDF generation error:", err);
    toast.dismiss(loadingToast);
    toast.error("Failed to generate PDF");
  }
}

export function DownloadPdfButton({ doc }: { doc: BillingDocument }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    await downloadInvoicePdf(doc);
    setIsGenerating(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5 transition-colors shadow-2xs ${
        isGenerating ? "opacity-50 cursor-wait" : ""
      }`}
      title="Download PDF"
    >
      <Download className="w-3.5 h-3.5 text-gray-500" /> Download
    </button>
  );
}

export function ShareInvoiceMenu({ doc, onLogShare }: ShareInvoiceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen((v) => !v);
  }, [isOpen]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const onScroll = () => setIsOpen(false);
    if (isOpen) {
      window.document.addEventListener("mousedown", onClickOutside);
      window.document.addEventListener("scroll", onScroll, true);
    }
    return () => {
      window.document.removeEventListener("mousedown", onClickOutside);
      window.document.removeEventListener("scroll", onScroll, true);
    };
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
    window.open(`mailto:?subject=${encodeURIComponent(`${doc.type} ${doc.id}`)}&body=${encodeURIComponent(message)}`, "_blank");
    setIsOpen(false);
  };

  const dropdownMenu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 9999,
          }}
          className="w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 animate-in fade-in duration-150"
        >
          <button
            onClick={shareViaWhatsApp}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
          </button>
          <button
            onClick={shareViaEmail}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-600" /> Email
          </button>
        </div>,
        window.document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors shadow-2xs flex items-center gap-1.5"
        title="Share Document"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>
      {dropdownMenu}
    </div>
  );
}
