"use client";

import { useState, useEffect } from "react";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from "@/modules/billing/services/billing.service";
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
      const newPaidAmount = currentPaidAmount + (paymentData.amount || 0);
      const isFullyPaid = newPaidAmount >= totalAmount;

      const paymentRecord = {
        invoiceId,
        client: documentToMarkPaid.client,
        phone: documentToMarkPaid.phone,
        vehicle: documentToMarkPaid.vehicle,
        service: documentToMarkPaid.service,
        amount: paymentData.amount || totalAmount,
        mode: paymentData.mode || "Cash",
        date: paymentData.date || new Date().toISOString().split("T")[0],
        ref: paymentData.reference || invoiceId,
        notes: paymentData.notes || "",
      };

      await createPayment(paymentRecord);

      const updatedStatus = isFullyPaid ? "Paid" : "Partially Paid";
      await updateInvoice(invoiceId, {
        ...documentToMarkPaid,
        status: updatedStatus,
        paidAmount: newPaidAmount
      });

      setDocuments(
        documents.map((d) =>
          d.id === invoiceId ? {
            ...d,
            status: updatedStatus,
            paidAmount: newPaidAmount
          } : d
        )
      );

      toast.success(`Payment recorded! Status: ${updatedStatus}`);
      return true;
    } catch (err: any) {
      toast.error("Failed to record payment: " + err.message);
      return false;
    }
  };

  return {
    documents,
    isLoading,
    error,
    fetchInvoices,
    handleAddInvoice,
    handleDeleteDocument,
    handleConvertDocument,
    handleRecordPayment
  };
}
