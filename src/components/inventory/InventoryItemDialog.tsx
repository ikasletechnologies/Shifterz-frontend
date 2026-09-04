"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { getSettings } from "@/lib/api";
import { X, Package } from "lucide-react";

interface InventoryItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (item: any) => void;
}

export default function InventoryItemDialog({
  isOpen,
  onClose,
  onSubmit,
}: InventoryItemDialogProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "PPF",
    unit: "Meter / Bottle / Kit",
    stock: "",
    costPerUnit: "",
    reorderLevel: "",
    supplier: "",
    location: "",
  });

  useEffect(() => {
    if (isOpen) {
      getSettings()
        .then((data) => {
          if (data?.categories) {
            setCategories(data.categories);
            setFormData((prev) => ({
              ...prev,
              category: data.categories.length > 0 ? data.categories[0] : "PPF",
            }));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (["stock", "costPerUnit", "reorderLevel"].includes(name)) {
      if (value !== "") {
        const num = Number(value);
        if (num < 0 || value.includes("-")) {
          return;
        }
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.stock || !formData.costPerUnit) {
      alert("Item name, stock, and cost are required");
      return;
    }

    if (
      Number(formData.stock) < 0 ||
      Number(formData.costPerUnit) < 0 ||
      (formData.reorderLevel !== "" && Number(formData.reorderLevel) < 0)
    ) {
      alert("Opening Stock, Cost Per Unit, and Reorder Level must be non-negative values.");
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }

    setFormData({
      name: "",
      category: "PPF",
      unit: "Meter / Bottle / Kit",
      stock: "",
      costPerUnit: "",
      reorderLevel: "",
      supplier: "",
      location: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <Package className="w-6 h-6 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Add Inventory Item</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Item Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="XPEL PPF Film"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
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
            </div>
          </div>

          {/* Row 2: Unit & Opening Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="Meter / Bottle / Kit"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Opening Stock
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Row 3: Cost Per Unit & Reorder Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Cost Per Unit (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="costPerUnit"
                min="0"
                value={formData.costPerUnit}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Reorder Level
              </label>
              <input
                type="number"
                name="reorderLevel"
                min="0"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder="5"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Row 4: Supplier & Storage Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Supplier name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Storage Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Rack A1"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            ✓ Save Item
          </button>
        </form>
      </div>
    </div>
  );
}
