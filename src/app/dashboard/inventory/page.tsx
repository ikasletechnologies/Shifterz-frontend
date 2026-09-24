"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Download, Trash2, Plus, Sliders,
  Search, X
} from "lucide-react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ListHeader } from "@/components/common/ListHeader";
import InventoryItemDialog from "@/components/inventory/InventoryItemDialog";
import AdjustStockDialog from "@/components/inventory/AdjustStockDialog";
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getSettings } from "@/lib/api";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  cost: number;
  reorder: number;
  supplier: string;
  location: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [dbCategories, setDbCategories] = useState<string[]>([]);


  useEffect(() => {
    async function fetchInventoryAndSettings() {
      try {
        setIsLoading(true);
        const [invData, settingsData] = await Promise.all([
          getInventory(),
          getSettings()
        ]);
        setItems(invData || []);
        if (settingsData?.categories) {
          setDbCategories(settingsData.categories);
        }
      } catch (err: any) {
        setError("Failed to load data: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventoryAndSettings();
  }, []);

  // Live Inventory Metrics & Calculations (derived directly from real inventory records)
  const lowStockItems = items.filter((item) => item.stock <= item.reorder);
  const totalSkus = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.stock * Number(item.cost || 0)), 0);
  const totalSuppliers = new Set(items.map((item) => item.supplier).filter(Boolean)).size;

  // Filtered Items Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCatSelect =
      filterCategory === "All Categories" || item.category === filterCategory;

    const matchesStock = !lowStockOnly || item.stock <= item.reorder;

    return matchesSearch && matchesCatSelect && matchesStock;
  });

  const handleAddItem = async (formData: any) => {
    try {
      // Map dialog field names to backend field names
      const payload = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        stock: formData.stock,
        cost: formData.costPerUnit,       // dialog uses costPerUnit → backend expects cost
        reorder: formData.reorderLevel,   // dialog uses reorderLevel → backend expects reorder
        supplier: formData.supplier,
        location: formData.location,
      };
      const created = await createInventoryItem(payload);
      setItems([...items, created]);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert("Failed to add item: " + err.message);
    }
  };

  const confirmDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteInventoryItem(itemToDelete.id);
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdjustStock = async (adjustment: any) => {
    if (selectedItem) {
      try {
        const quantityChange =
          adjustment.type === "Add Stock (Purchase)"
            ? parseInt(adjustment.quantity)
            : -parseInt(adjustment.quantity);
        const newStock = Math.max(0, selectedItem.stock + quantityChange);
        const updated = {
          ...selectedItem,
          stock: newStock,
        };
        await updateInventoryItem(selectedItem.id, updated);
        setItems(
          items.map((item) =>
            item.id === selectedItem.id ? updated : item
          )
        );
        setIsAdjustStockOpen(false);
        setSelectedItem(null);
      } catch (err: any) {
        alert("Failed to adjust stock: " + err.message);
      }
    }
  };


  const downloadPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Shifterz ERP – Inventory & Stock Movement Report", 14, 14);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 297 - 14, 14, { align: "right" });

      // Summary Bar
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Total SKUs: ${totalSkus}   |   Total Value: ₹${totalValue.toLocaleString("en-IN")}   |   Low Stock Items: ${lowStockItems.length}`,
        14, 29
      );

      const tableHead = [["Item Name", "Category", "Stock", "Unit", "Cost/Unit", "Total Value", "Reorder Level", "Supplier", "Location", "Status"]];
      const tableBody = filteredItems.map(item => [
        item.name,
        item.category,
        String(item.stock),
        item.unit,
        `Rs. ${Number(item.cost || 0).toLocaleString("en-IN")}`,
        `Rs. ${(item.stock * Number(item.cost || 0)).toLocaleString("en-IN")}`,
        String(item.reorder),
        item.supplier || "—",
        item.location || "—",
        item.stock <= item.reorder ? "LOW STOCK" : "Normal"
      ]);

      autoTable(doc, {
        startY: 34,
        head: tableHead,
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
        columnStyles: {
          4: { fontSize: 9, fontStyle: "bold", minCellWidth: 24, cellWidth: "auto" },
          5: { fontSize: 9, fontStyle: "bold", minCellWidth: 28, cellWidth: "auto" },
        },
      });

      doc.save(`inventory_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err: any) {
      alert("Failed to download PDF: " + err.message);
    }
  };

  const downloadSingleItemPDF = async (item: InventoryItem) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 26, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("SHIFTERZ AUTO - INVENTORY ITEM RECORD", 14, 16);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 210 - 14, 16, { align: "right" });

      // Item Header Card Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 32, 182, 18, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 32, 182, 18, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(item.name || "Inventory Item", 18, 43);

      doc.setFontSize(9);
      doc.setTextColor(109, 40, 217);
      doc.text(`Category: ${item.category || "General"}`, 210 - 18, 43, { align: "right" });

      const itemTotalVal = (item.stock || 0) * (item.cost || 0);
      const isLow = (item.stock || 0) <= (item.reorder || 0);

      const tableData = [
        ["Item Code / ID", item.id || "—"],
        ["Item Name", item.name || "—"],
        ["Category", item.category || "—"],
        ["Current Stock", `${item.stock || 0} ${item.unit || "Units"}`],
        ["Reorder Level", `${item.reorder || 0} ${item.unit || "Units"}`],
        ["Stock Status", isLow ? "LOW STOCK ALERT" : "Normal Stock"],
        ["Cost per Unit", `₹${(item.cost || 0).toLocaleString("en-IN")}`],
        ["Total Stock Value", `₹${itemTotalVal.toLocaleString("en-IN")}`],
        ["Supplier", item.supplier || "—"],
        ["Location / Rack", item.location || "—"],
      ];

      autoTable(doc, {
        startY: 56,
        head: [["Attribute", "Details"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9.5,
          textColor: 30,
        },
        columnStyles: {
          0: { cellWidth: 65, fontStyle: "bold", textColor: [71, 85, 105] },
          1: { cellWidth: 117, fontStyle: "normal" },
        },
        margin: { left: 14, right: 14 },
      });

      const safeName = (item.name || "item").toLowerCase().replace(/[^a-z0-9]/g, "_");
      doc.save(`${safeName}_${item.id || "record"}.pdf`);
    } catch (err: any) {
      alert("Failed to download item PDF: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium text-sm">
        Loading Inventory Data...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Summary — Low Stock doubles as a filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Items" value={totalSkus} active={!lowStockOnly} onClick={() => setLowStockOnly(false)} />
        <SummaryCard
          label="Low Stock Items"
          value={lowStockItems.length}
          tone="bad"
          note={lowStockItems.length > 0 ? "At or below reorder level" : undefined}
          active={lowStockOnly}
          onClick={() => setLowStockOnly(true)}
        />
        <SummaryCard label="Total Inventory Value" value={`₹${totalValue.toLocaleString("en-IN")}`} />
        <SummaryCard label="Suppliers" value={totalSuppliers} />
      </div>

      <div className="space-y-3">
        <ListHeader
          title="Inventory Items"
          filterLabel={lowStockOnly ? "Low Stock" : "All"}
          count={filteredItems.length}
          hint="Parts and materials in stock. An item turns low-stock when its quantity reaches its reorder level — restock it before jobs run short."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search item, category, supplier, location..."
        >
          <button
            onClick={downloadPDF}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF Report
          </button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-3.5 py-2 text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </ListHeader>

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ITEM NAME</th>
                  <th className="py-3.5 px-4">CATEGORY</th>
                  <th className="py-3.5 px-4">STOCK / UNIT</th>
                  <th className="py-3.5 px-4">COST / UNIT</th>
                  <th className="py-3.5 px-4">TOTAL VALUE</th>
                  <th className="py-3.5 px-4">SUPPLIER</th>
                  <th className="py-3.5 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      {searchQuery
                        ? `No items match "${searchQuery}".`
                        : lowStockOnly
                        ? "Nothing is low on stock."
                        : "No items in inventory yet. Use “Add Item” to add parts and materials."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Item Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span>{item.name}</span>
                        {item.location && (
                          <p className="text-[10px] text-slate-400 font-normal">Loc: {item.location}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock / Unit */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-bold ${item.stock <= item.reorder ? "text-rose-600" : "text-emerald-600"}`}>
                          {item.stock} {item.unit}
                        </span>
                        {item.stock <= item.reorder && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
                            Low Stock
                          </span>
                        )}
                      </td>

                      {/* Cost / Unit */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        ₹{Number(item.cost || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        ₹{(item.stock * Number(item.cost || 0)).toLocaleString("en-IN")}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {item.supplier || "—"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock In / Stock Out Adjust Button */}
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsAdjustStockOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors bg-white shadow-2xs flex items-center gap-1 text-[11px] font-bold px-2"
                            title="Stock In / Stock Out"
                          >
                            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                            Stock Adjust
                          </button>

                          {/* Download PDF Icon Button */}
                          <button
                            onClick={() => downloadSingleItemPDF(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors bg-white shadow-2xs"
                            title="Download Item PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item Button */}
                          <button
                            onClick={() => confirmDelete(item)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors shadow-2xs"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Item Dialog */}
      <InventoryItemDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddItem}
      />

      {/* Adjust Stock Dialog (Stock In / Stock Out) */}
      <AdjustStockDialog
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem ? { name: selectedItem.name, stock: selectedItem.stock } : undefined}
        onSubmit={handleAdjustStock}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{itemToDelete.name}</strong> from the inventory records?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
