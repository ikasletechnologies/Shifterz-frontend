"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Package, IndianRupee, Store, Download, Trash2, Plus, Sliders, AlertTriangle,
  Search, X
} from "lucide-react";
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
  const [filterReportType, setFilterReportType] = useState("All Reports");
  const [filterFranchise, setFilterFranchise] = useState("All Franchises");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [compareWith, setCompareWith] = useState("Previous Period");

  const [dbCategories, setDbCategories] = useState<string[]>([]);

  const getTodayISO = () => new Date().toISOString().split("T")[0];

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && getTodayISO() && val > getTodayISO()) return;
    setFromDate(val);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && getTodayISO() && val > getTodayISO()) return;
    setToDate(val);
  };

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

    return matchesSearch && matchesCatSelect;
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
    <div className="p-8 space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Top KPI Summary Cards Grid — all figures derived directly from inventory records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{totalSkus}</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Inventory Value */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Inventory Value</p>
            <p className="text-2xl font-bold text-slate-900">₹{totalValue.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Items</p>
            <p className="text-2xl font-bold text-slate-900">{lowStockItems.length}</p>
          </div>
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Suppliers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suppliers</p>
            <p className="text-2xl font-bold text-slate-900">{totalSuppliers}</p>
          </div>
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shrink-0">
            <Store className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Low Stock Banner Alert if low stock items exist */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">Low Stock Alert ({lowStockItems.length} items):</span>
            <span className="truncate">{lowStockItems.map((item) => `${item.name} (${item.stock} ${item.unit})`).join(" · ")}</span>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-500 font-bold text-slate-900 rounded-lg shrink-0 text-xs shadow-2xs transition-colors"
          >
            + Restock Item
          </button>
        </div>
      )}

      {/* Filter Bar Card Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        {/* Search Bar Input (Top) */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Inventory Items, Category, Supplier, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Section (Below Search Bar) */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Report Type */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Report Type</label>
            <select
              value={filterReportType}
              onChange={(e) => setFilterReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-700 h-[36px]"
            >
              <option value="All Reports">All Reports</option>
              <option value="Inventory Reports">Inventory Reports</option>
              <option value="Sales Reports">Sales Reports</option>
            </select>
          </div>

          {/* Franchise */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Franchise</label>
            <select
              value={filterFranchise}
              onChange={(e) => setFilterFranchise(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-700 h-[36px]"
            >
              <option value="All Franchises">All Franchises</option>
              <option value="Headquarters">Headquarters</option>
            </select>
          </div>

          {/* From Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-2 shrink-0 h-[36px]">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">From:</span>
              <input
                type="date"
                value={fromDate}
                max={getTodayISO()}
                onChange={handleFromDateChange}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none cursor-pointer p-0"
              />
              <button
                type="button"
                disabled={!fromDate}
                onClick={() => fromDate && setFromDate("")}
                className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                  fromDate
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-50"
                }`}
                title={fromDate ? "Clear From Date" : ""}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* To Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-2 shrink-0 h-[36px]">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">To:</span>
              <input
                type="date"
                value={toDate}
                max={getTodayISO()}
                onChange={handleToDateChange}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none cursor-pointer p-0"
              />
              <button
                type="button"
                disabled={!toDate}
                onClick={() => toDate && setToDate("")}
                className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                  toDate
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-50"
                }`}
                title={toDate ? "Clear To Date" : ""}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Compare With */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Compare With</label>
            <select
              value={compareWith}
              onChange={(e) => setCompareWith(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-700 h-[36px]"
            >
              <option value="Previous Period">Previous Period</option>
              <option value="Previous Year">Previous Year</option>
            </select>
          </div>

          {/* Add Item Button */}
          <div className="shrink-0">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-3 shrink-0" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Reports / Inventory Overview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Inventory Items ({filteredItems.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Report
            </button>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
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
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Item Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span>{item.name}</span>
                            {item.location && (
                              <p className="text-[10px] text-slate-400 font-normal">Loc: {item.location}</p>
                            )}
                          </div>
                        </div>
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
