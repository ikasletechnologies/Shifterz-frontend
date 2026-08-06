"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Share2, MessageCircle, Mail, Download, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { BillingDocument } from "../types/billing.types";
import { getSettings } from "@/lib/api";

interface ShareInvoiceMenuProps {
  doc: BillingDocument;
  onLogShare: (id: string, channel: "whatsapp" | "email") => void;
}

export function ShareInvoiceMenu({ doc, onLogShare }: ShareInvoiceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

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

  const buildDocumentHtml = (companyInfo: any) => {
    const renderItemsHtml = () => {
      if (doc.items && doc.items.length > 0) {
        return doc.items.map(item => {
          const itemAmt = item.amount || (item.qty * item.price) || 0;
          const discAmt = item.discountPercent ? (itemAmt * item.discountPercent / 100) : 0;
          const gstAmt = ((itemAmt - discAmt) * (item.gstPercent ?? 18)) / 100;
          return `<tr>
            <td>${item.desc || '-'}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">&#8377;${Number(item.price || 0).toLocaleString("en-IN")}</td>
            <td style="text-align:center">${item.discountPercent ? `${item.discountPercent}%` : '-'}</td>
            <td style="text-align:right">&#8377;${Number(discAmt).toLocaleString("en-IN")}</td>
            <td style="text-align:center">${item.gstPercent ?? 18}%</td>
            <td style="text-align:right">&#8377;${Number(gstAmt).toLocaleString("en-IN")}</td>
            <td style="text-align:center">${item.warranty || '-'}</td>
            <td class="amount">&#8377;${Number(itemAmt).toLocaleString("en-IN")}</td>
          </tr>`;
        }).join("");
      }
      const gstAmt = (doc.amount || 0) * 0.18;
      return `<tr>
        <td>${doc.service || '-'}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">&#8377;${Number(doc.amount || 0).toLocaleString("en-IN")}</td>
        <td style="text-align:center">-</td>
        <td style="text-align:right">&#8377;0</td>
        <td style="text-align:center">18%</td>
        <td style="text-align:right">&#8377;${Number(gstAmt).toLocaleString("en-IN")}</td>
        <td style="text-align:center">-</td>
        <td class="amount">&#8377;${Number(doc.amount || 0).toLocaleString("en-IN")}</td>
      </tr>`;
    };
    const statusColor = doc.status === 'Paid' ? '#16a34a' : doc.status === 'Overdue' ? '#dc2626' : doc.status === 'Approved' ? '#2563eb' : '#d97706';
    const statusBg   = doc.status === 'Paid' ? '#dcfce7' : doc.status === 'Overdue' ? '#fee2e2' : doc.status === 'Approved' ? '#dbeafe' : '#fef3c7';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${doc.id}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      .document{max-width:800px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden}
      .header{background:#FACC15;color:black;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start}
      .header-left h1{margin:0 0 4px;font-size:28px;font-weight:bold}
      .header-left p{margin:2px 0;font-size:12px}
      .header-right{text-align:right}
      .header-right h2{margin:0 0 4px;font-size:24px;font-weight:bold;text-transform:uppercase}
      .header-right p{margin:2px 0;font-size:12px}
      .status-badge{display:inline-block;margin-top:8px;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${statusColor};background:${statusBg}}
      .content{padding:28px}
      .bill-to{display:flex;justify-content:space-between;margin-bottom:24px;gap:16px}
      .bill-to-left h3{margin:0 0 4px;font-size:16px;font-weight:bold}
      .bill-to-left p{margin:2px 0;font-size:13px;color:#555}
      .section-title{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:bold}
      .bill-to-right{text-align:right}
      .bill-to-right p{margin:2px 0;font-size:13px}
      table.desc{width:100%;border-collapse:collapse;margin:16px 0}
      table.desc th{background:#f5f5f5;padding:10px 8px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;border-bottom:1px solid #ddd}
      table.desc td{padding:12px 8px;border-bottom:1px solid #eee;font-size:13px}
      td.amount{text-align:right;font-weight:600}
      .gst-row td{background:#f9f9f9}
      .total-row td{background:#FFFACD;font-weight:bold;font-size:15px}
      .warranty-box{margin:16px 0;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:13px}
      .terms-section{display:flex;justify-content:space-between;margin-top:30px;font-size:12px;gap:20px}
      .terms-left{flex:2}
      .terms-block{margin-bottom:12px}
      .terms-block strong{display:block;margin-bottom:4px;color:#555}
      .sign-block{flex:1;text-align:right;display:flex;flex-direction:column;justify-content:flex-end}
      .sign-line{margin-top:60px;border-top:1px solid #000;padding-top:5px;display:inline-block;font-weight:bold;font-size:12px}
      .footer{margin-top:24px;padding-top:16px;border-top:1px solid #ddd;text-align:center}
      .footer p{margin:4px 0;font-size:12px;color:#666}
    </style></head><body>
    <div class="document">
      <div class="header">
        <div class="header-left">
          <h1>${companyInfo?.name || 'SHIFTERZ'}</h1>
          <p>${companyInfo?.address || '42, Race Course Rd, Coimbatore - 641018'}</p>
          ${companyInfo?.phone ? `<p>${companyInfo.phone}</p>` : ''}
        </div>
        <div class="header-right">
          <h2>${doc.type}</h2>
          <p><strong>${doc.id}</strong></p>
          ${doc.status ? `<span class="status-badge">${doc.status}</span>` : ''}
        </div>
      </div>
      <div class="content">
        <div class="bill-to">
          <div class="bill-to-left">
            <div class="section-title">Bill To</div>
            <h3>${doc.client}</h3>
            <p>${doc.phone}</p>
            <p>${doc.vehicle}</p>
          </div>
          <div class="bill-to-right">
            <div class="section-title">Details</div>
            <p><strong>Date:</strong> ${formatDate(doc.date)}</p>
            ${doc.dueDate ? `<p><strong>Due:</strong> ${formatDate(doc.dueDate)}</p>` : ''}
            ${doc.gstNumber ? `<p><strong>Client GSTIN:</strong> ${doc.gstNumber}</p>` : ''}
            <p><strong>Our GSTIN:</strong> ${companyInfo?.gstin || '33AAAAAO000A1Z5'}</p>
          </div>
        </div>
        <table class="desc">
          <thead><tr>
            <th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th>
            <th style="text-align:center">Disc%</th><th style="text-align:right">Disc Amt</th>
            <th style="text-align:center">GST%</th><th style="text-align:right">GST Amt</th>
            <th style="text-align:center">Warranty</th><th class="amount">Amount</th>
          </tr></thead>
          <tbody>
            ${renderItemsHtml()}
            <tr class="gst-row"><td colspan="8" style="text-align:right"><strong>Subtotal</strong></td><td class="amount"><strong>&#8377;${Number(doc.amount || 0).toLocaleString("en-IN")}</strong></td></tr>
            <tr class="gst-row"><td colspan="8" style="text-align:right">CGST</td><td class="amount">&#8377;${Number((doc.gst || 0) / 2).toLocaleString("en-IN")}</td></tr>
            <tr class="gst-row"><td colspan="8" style="text-align:right">SGST</td><td class="amount">&#8377;${Number((doc.gst || 0) / 2).toLocaleString("en-IN")}</td></tr>
            ${(doc.discount || 0) > 0 ? `<tr class="gst-row"><td colspan="8" style="text-align:right">Discount</td><td class="amount" style="color:#DC2626">-&#8377;${Number(doc.discount || 0).toLocaleString("en-IN")}</td></tr>` : ''}
            <tr class="total-row"><td colspan="8" style="text-align:right">TOTAL</td><td class="amount">&#8377;${total.toLocaleString("en-IN")}</td></tr>
          </tbody>
        </table>
        ${doc.warranty ? `<div class="warranty-box"><strong>Warranty:</strong> ${doc.warranty}</div>` : ''}
        <div class="terms-section">
          <div class="terms-left">
            ${doc.paymentTerms ? `<div class="terms-block"><strong>Payment Terms:</strong>${doc.paymentTerms.replace(/\n/g, '<br/>')}</div>` : ''}
            ${doc.deliveryTerms ? `<div class="terms-block"><strong>Delivery Terms:</strong>${doc.deliveryTerms.replace(/\n/g, '<br/>')}</div>` : ''}
            ${doc.bankDetails ? `<div class="terms-block"><strong>Bank Details:</strong>${doc.bankDetails.replace(/\n/g, '<br/>')}</div>` : ''}
          </div>
          <div class="sign-block"><span class="sign-line">${doc.authorizedSignatory || "Authorized Signatory"}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for choosing ${companyInfo?.name || 'Shifterz'}!</p>
          <p>${companyInfo?.phone || '0422-123 4567'}</p>
        </div>
      </div>
    </div>
    </body></html>`;
  };

  const shareViaPrint = async () => {
    setIsOpen(false);
    try {
      const settingsData = await getSettings().catch(() => null);
      const companyInfo = settingsData?.companyInfo || null;
      const html = buildDocumentHtml(companyInfo);
      const printWindow = window.open("", "", "height=900,width=900");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch {
      toast.error("Failed to open print dialog");
    }
  };

  const shareViaPdf = async () => {
    setIsOpen(false);
    setIsGenerating(true);
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
        const statusColorMap: Record<string, [number,number,number]> = { Paid:[22,163,74], Overdue:[220,38,38], Approved:[37,99,235] };
        const [r,g,b] = statusColorMap[doc.status] || [217,119,6];
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
      const tableHead = [["Description","Qty","Unit Price","Disc%","Disc Amt","GST%","GST Amt","Warranty","Amount"]];
      const tableBody: string[][] = [];
      if (doc.items && doc.items.length > 0) {
        for (const item of doc.items) {
          const itemAmt = item.amount || (item.qty * item.price) || 0;
          const discAmt = item.discountPercent ? (itemAmt * item.discountPercent / 100) : 0;
          const gstAmt = ((itemAmt - discAmt) * (item.gstPercent ?? 18)) / 100;
          tableBody.push([
            item.desc || "-", String(item.qty),
            `Rs.${Number(item.price||0).toLocaleString("en-IN")}`,
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
        tableBody.push([doc.service||"-","1",`Rs.${Number(doc.amount||0).toLocaleString("en-IN")}`,"-","Rs.0","18%",`Rs.${Number(gstAmt).toLocaleString("en-IN")}`,"-",`Rs.${Number(doc.amount||0).toLocaleString("en-IN")}`]);
      }
      const itemCount = tableBody.length;
      tableBody.push(["","","","","","","","Subtotal",`Rs.${Number(doc.amount||0).toLocaleString("en-IN")}`]);
      tableBody.push(["","","","","","","","CGST",`Rs.${Number((doc.gst||0)/2).toLocaleString("en-IN")}`]);
      tableBody.push(["","","","","","","","SGST",`Rs.${Number((doc.gst||0)/2).toLocaleString("en-IN")}`]);
      if ((doc.discount || 0) > 0) tableBody.push(["","","","","","","","Discount",`-Rs.${Number(doc.discount||0).toLocaleString("en-IN")}`]);
      tableBody.push(["","","","","","","","TOTAL",`Rs.${total.toLocaleString("en-IN")}`]);

      autoTable(pdf, {
        startY: y,
        head: tableHead,
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [250,204,21], textColor: [17,24,39], fontStyle: "bold", fontSize: 7 },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0:{cellWidth:40}, 1:{halign:"center",cellWidth:10}, 2:{halign:"right",cellWidth:22},
          3:{halign:"center",cellWidth:12}, 4:{halign:"right",cellWidth:18},
          5:{halign:"center",cellWidth:12}, 6:{halign:"right",cellWidth:18},
          7:{halign:"center",cellWidth:18}, 8:{halign:"right",cellWidth:20},
        },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.row.index >= itemCount) {
            const isTotal = data.row.index === tableBody.length - 1;
            data.cell.styles.fillColor = isTotal ? [255,250,205] : [249,249,249];
            data.cell.styles.fontStyle = isTotal ? "bold" : "normal";
            if (isTotal) data.cell.styles.fontSize = 9;
          }
        },
        margin: { left: margin, right: margin },
      });

      let finalY = (pdf as any).lastAutoTable.finalY + 6;

      // Warranty
      if (doc.warranty) {
        pdf.setFillColor(240,253,244); pdf.setDrawColor(187,247,208);
        pdf.roundedRect(margin, finalY, pageWidth - margin * 2, 10, 2, 2, "FD");
        pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(21,128,61);
        pdf.text("Warranty:", margin+3, finalY+6.5);
        pdf.setFont("helvetica","normal"); pdf.setTextColor(17,24,39);
        pdf.text(doc.warranty, margin+22, finalY+6.5);
        finalY += 14;
      }

      // Terms & Signatory
      const termsY = finalY;
      pdf.setFontSize(7.5); pdf.setFont("helvetica","normal"); pdf.setTextColor(80,80,80);
      let termsLineY = termsY;
      if (doc.paymentTerms) {
        pdf.setFont("helvetica","bold"); pdf.text("Payment Terms:", margin, termsLineY);
        pdf.setFont("helvetica","normal");
        const lines = pdf.splitTextToSize(doc.paymentTerms, 80);
        pdf.text(lines, margin, termsLineY+4);
        termsLineY += 4 + lines.length * 4;
      }
      if (doc.bankDetails) {
        pdf.setFont("helvetica","bold"); pdf.text("Bank Details:", margin, termsLineY+2);
        pdf.setFont("helvetica","normal");
        const lines = pdf.splitTextToSize(doc.bankDetails, 80);
        pdf.text(lines, margin, termsLineY+6);
      }
      const signX = pageWidth - margin;
      pdf.setDrawColor(17,24,39);
      pdf.line(signX-50, termsY+24, signX, termsY+24);
      pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(17,24,39);
      pdf.text(doc.authorizedSignatory || "Authorized Signatory", signX, termsY+28, { align:"right" });

      // Footer
      const footerY = pdf.internal.pageSize.getHeight() - 14;
      pdf.setDrawColor(200,200,200);
      pdf.line(margin, footerY-4, pageWidth-margin, footerY-4);
      pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(120,120,120);
      pdf.text(`Thank you for choosing ${companyInfo?.name || "Shifterz"}!  |  ${companyInfo?.phone || "0422-123 4567"}`, pageWidth/2, footerY, { align:"center" });

      pdf.save(`${doc.id}.pdf`);
      toast.dismiss(loadingToast);
      toast.success(`PDF downloaded: ${doc.id}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
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
          className="w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
        >
          <button onClick={shareViaWhatsApp} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp
          </button>
          <button onClick={shareViaEmail} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Mail className="w-4 h-4 text-blue-600" /> Email
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button onClick={shareViaPdf} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-red-600" /> Download PDF
          </button>
          <button onClick={shareViaPrint} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4 text-gray-600" /> Print
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
        disabled={isGenerating}
        className={`p-1 hover:bg-gray-200 rounded transition-colors ${isGenerating ? "opacity-50 cursor-wait" : ""}`}
        title="Share Invoice"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>
      {dropdownMenu}
    </div>
  );
}
