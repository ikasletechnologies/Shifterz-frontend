"use client";

import { useState, useEffect } from "react";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, cancelInvoice, shareInvoice } from "@/modules/billing/services/billing.service";
import { createPayment } from "@/modules/payment/services/payment.service";
import { toast } from "react-hot-toast";

export function useBilling() {
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getInvoices();
      setDocuments(data);
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

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteInvoice(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Document deleted successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to delete document: " + err.message);
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
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      const startYear = month >= 3 ? year : year - 1;
      const endYear = startYear + 1;
      const fy = `${startYear.toString().slice(2)}-${endYear.toString().slice(2)}`;

      const docTypeMap: Record<string, string> = {
        Invoice: `STZ-${fy}-`,
        Quotation: `STZ-QT-${fy}-`,
        Estimate: `STZ-EST-${fy}-`,
      };
      const docTypePrefix = docTypeMap[convertedData.type] || `STZ-DOC-${fy}-`;

      let maxId = 0;
      const relevantDocs = documents.filter((doc) => doc.id?.startsWith(docTypePrefix));
      relevantDocs.forEach((doc) => {
        const numStr = doc.id.replace(docTypePrefix, "");
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      });
      const newDocId = `${docTypePrefix}${maxId + 1}`;

      const newDoc = {
        ...convertedData,
        id: newDocId,
        date: new Date().toISOString().split("T")[0],
      };

      await createInvoice(newDoc);

      const updatedOriginal = {
        ...documentToConvert,
        status: "Converted",
      };
      await updateInvoice(documentToConvert.id, updatedOriginal);

      setDocuments((prevDocs) => [
        ...prevDocs.map((doc) =>
          doc.id === documentToConvert.id ? updatedOriginal : doc
        ),
        newDoc as BillingDocument,
      ]);

      toast.success(`${documentToConvert.type} converted to ${convertedData.type} (${newDocId})`);
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
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...updated } : doc)));
      toast.success("Document updated successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to update document: " + err.message);
      return false;
    }
  };

  return {
    documents,
    isLoading,
    error,
    fetchInvoices,
    handleAddInvoice,
    handleEditInvoice,
    handleDeleteDocument,
    handleCancelDocument,
    handleShareDocument,
    handleConvertDocument,
    handleRecordPayment
  };
}
