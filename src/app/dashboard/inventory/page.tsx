"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { Plus, Sliders, Trash2, AlertTriangle } from "lucide-react";
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
  const [filterCategory, setFilterCategory] = useState("All Categories");

  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchInventoryAndSettings() {
      try {
        setIsLoading(true);
        const [invData, settingsData] = await Promise.all([
          getInventory(),
          getSettings()
        ]);
        setItems(invData);
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

  const lowStockItems = items.filter((item) => item.stock <= item.reorder);
  const totalSkus = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.stock * item.cost), 0);
  const categories = new Set(items.map((item) => item.category)).size;

  const filteredItems =
    filterCategory === "All Categories"
      ? items
      : items.filter((item) => item.category === filterCategory);

  const handleAddItem = async (newItem: any) => {
    try {
      const created = await createInventoryItem(newItem);
      setItems([...items, created]);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert("Failed to add item: " + err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteInventoryItem(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleAdjustStock = async (adjustment: any) => {
    if (selectedItem) {
      try {
        const quantityChange =
          adjustment.type === "Add Stock (Purchase)"
            ? parseInt(adjustment.quantity)
            : -parseInt(adjustment.quantity);
        const newStock = selectedItem.stock + quantityChange;
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
        alert("Failed to adjust: " + err.message);
      }
    }
  };

  if (isLoading) return <div className="p-8">Loading inventory...</div>;

  return (
    <div className="p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Total SKUs</p>
          <p className="text-3xl font-black text-gray-900">{totalSkus}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Low Stock Alerts</p>
          <p className="text-3xl font-black text-red-600">{lowStockItems.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Stock Value</p>
          <p className="text-3xl font-black text-yellow-600">₹{totalValue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Categories</p>
          <p className="text-3xl font-black text-gray-900">{categories}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">Low Stock:</p>
            <p className="text-sm text-red-800">
              {lowStockItems.map((item) => `${item.name} (${item.stock} ${item.unit})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option>All Categories</option>
          {dbCategories.length > 0 ? (
            dbCategories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))
          ) : (
            <>
              <option>PPF</option>
              <option>Coating</option>
              <option>Consumable</option>
              <option>Chemical</option>
            </>
          )}
        </select>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-3" />
          Add Item
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Reorder At</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold text-sm ${item.stock <= item.reorder ? "text-red-600" : "text-green-600"}`}>
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 text-gray-900">₹{item.cost.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">₹{(item.stock * item.cost).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-600">{item.reorder}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{item.supplier}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{item.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.stock <= item.reorder ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {item.stock <= item.reorder ? "Low Stock" : "OK"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsAdjustStockOpen(true);
                        }}
                        className="p-1.5 hover:bg-green-50 text-green-600 rounded-md border border-green-100 transition-colors shadow-sm"
                        title="Adjust Stock"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-md border border-red-100 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <InventoryItemDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddItem}
      />

      <AdjustStockDialog
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem ? { name: selectedItem.name, stock: selectedItem.stock } : undefined}
        onSubmit={handleAdjustStock}
      />
    </div>
  );
}
