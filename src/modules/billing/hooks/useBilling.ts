"use client";

import { useState, useEffect } from "react";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import { getInvoices, createInvoice, updateInvoice, cancelInvoice, shareInvoice, convertInvoice } from "@/modules/billing/services/billing.service";
import { createPayment } from "@/modules/payment/services/payment.service";
import { getOutPasses } from "@/lib/api";
import { toast } from "react-hot-toast";

export function useBilling() {
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [outPasses, setOutPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const [data, outPassData] = await Promise.all([
        getInvoices(),
        getOutPasses().catch(() => []),
      ]);
      setDocuments(data || []);
      setOutPasses(outPassData || []);
      setError("");
    } catch (err: any) {
      setError("Failed to load invoices: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const hasOutPass = (item: any): boolean => {
    if (!item) return false;
    const norm = (v?: string) => (v || "").replace(/[^A-Z0-9]/g, "").toUpperCase();
    const itemVeh = norm(item.vehicle || item.vehicleNo || item.vehicleNumber);

    return outPasses.some((op) => {
      if ((op.status || "").toLowerCase() === "rejected") return false;
      if (op.invoiceId && item.id && op.invoiceId === item.id) return true;
      if (op.jobCardId && item.id && op.jobCardId === item.id) return true;
      if (op.jobCardId && item.jobCardId && op.jobCardId === item.jobCardId) return true;
      if (itemVeh && op.vehicle && norm(op.vehicle) === itemVeh) return true;
      return false;
    });
  };

  const handleAddInvoice = async (newDoc: Partial<BillingDocument>) => {
    try {
      const created = await createInvoice(newDoc);
      setDocuments((prev) => [...prev, created]);
      toast.success("Document created successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to create document: " + err.message);
      return false;
    }
  };

  const handleCancelDocument = async (id: string, reason: string) => {
    try {
      const cancelled = await cancelInvoice(id, reason);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...cancelled } : doc)));
      toast.success("Invoice cancelled");
      return true;
    } catch (err: any) {
      toast.error("Failed to cancel invoice: " + err.message);
      return false;
    }
  };

  const handleShareDocument = async (id: string, channel: "whatsapp" | "email") => {
    try {
      await shareInvoice(id, channel);
      return true;
    } catch (err: any) {
      toast.error("Failed to log invoice share: " + err.message);
      return false;
    }
  };

  const handleConvertDocument = async (documentToConvert: BillingDocument, convertedData: any) => {
    try {
      // Call the backend endpoint which updates the record in-place and allocates a new ID
      const createdDoc = await convertInvoice(documentToConvert.id, {
        type: convertedData.type,
        amount: convertedData.amount,
        gst: convertedData.gst,
        discount: convertedData.discount
      });

      // Update the UI state by replacing the old document with the converted one
      setDocuments((prevDocs) => [
        ...prevDocs.filter((doc) => doc.id !== documentToConvert.id),
        createdDoc as BillingDocument,
      ]);

      await fetchInvoices();

      toast.success(`${documentToConvert.type} converted to ${convertedData.type} (${createdDoc.id})`);
      return true;
    } catch (err: any) {
      toast.error("Failed to convert document: " + err.message);
      console.error(err);
      return false;
    }
  };

  const handleRecordPayment = async (documentToMarkPaid: BillingDocument, paymentData: any) => {
    try {
      const invoiceId = documentToMarkPaid.id;
      const totalAmount = (documentToMarkPaid.amount || 0) + (documentToMarkPaid.gst || 0) - (documentToMarkPaid.discount || 0);
      const currentPaidAmount = documentToMarkPaid.paidAmount || 0;
      const paymentAmount = Number(paymentData.amount) || 0;
      const newPaidAmount = currentPaidAmount + paymentAmount;
      const isFullyPaid = newPaidAmount >= totalAmount;

      // Optimistically update UI immediately so user sees instant feedback
      const optimisticStatus = isFullyPaid ? "Paid" : "Partially Paid";
      setDocuments(prev =>
        prev.map(d =>
          d.id === invoiceId
            ? { ...d, status: optimisticStatus, paidAmount: newPaidAmount }
            : d
        )
      );

      const paymentRecord = {
        invoiceId,
        client: documentToMarkPaid.client,
        phone: documentToMarkPaid.phone,
        vehicle: documentToMarkPaid.vehicle,
        service: documentToMarkPaid.service,
        amount: paymentAmount || totalAmount,
        mode: paymentData.mode || "Cash",
        date: paymentData.date || new Date().toISOString().split("T")[0],
        ref: paymentData.reference || invoiceId,
        notes: paymentData.notes || "",
        multipleModes: paymentData.multipleModes,
      };

      // Create the payment record (backend auto-updates invoice status too)
      await createPayment(paymentRecord);

      // Re-fetch all invoices from backend so paidAmount is computed
      // from actual payment records — always accurate after reload
      await fetchInvoices();

      toast.success(`Payment recorded! Status: ${optimisticStatus}`);
      return true;
    } catch (err: any) {
      // Revert optimistic update on failure by re-fetching
      await fetchInvoices();
      toast.error("Failed to record payment: " + err.message);
      return false;
    }
  };


  const handleEditInvoice = async (id: string, updatedDoc: Partial<BillingDocument>) => {
    try {
      const updated = await updateInvoice(id, updatedDoc);
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updatedDoc, ...updated } : doc))
      );
      toast.success("Document updated successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to update document: " + err.message);
      return false;
    }
  };

  return {
    documents,
    outPasses,
    setOutPasses,
    hasOutPass,
    isLoading,
    error,
    fetchInvoices,
    handleAddInvoice,
    handleEditInvoice,
    handleCancelDocument,
    handleShareDocument,
    handleConvertDocument,
    handleRecordPayment
  };
}
