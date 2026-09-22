"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { X, Check, Plus, List, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings, getServices, updateSettings } from "@/lib/api";

interface ServiceData {
  id?: string;
  code?: string;
  name: string;
  category: string;
  price: string | number;
  minPrice?: string | number;
  gst?: string | number;
  duration: string;
  warranty: string;
  description?: string;
  desc?: string;
  status?: string;
}

interface AddServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceData?: ServiceData | null;
  onSave?: (data: ServiceData) => void;
}

export default function AddServiceDialog({ isOpen, onClose, serviceData, onSave }: AddServiceDialogProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formData, setFormData] = useState<ServiceData>({
    name: "",
    category: "",
    price: "",
    duration: "",
    warranty: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      const catSet = new Set<string>();
      try {
        const settings = await getSettings();
        if (settings?.categories && Array.isArray(settings.categories)) {
          settings.categories.forEach((c: string) => c && c.trim() && catSet.add(c.trim()));
        }
      } catch (e) {
        console.error("Error loading settings categories:", e);
      }
      try {
        const servicesList = await getServices();
        if (Array.isArray(servicesList)) {
          servicesList.forEach((s: any) => s?.category && typeof s.category === "string" && s.category.trim() && catSet.add(s.category.trim()));
        }
      } catch (e) {
        console.error("Error loading service categories:", e);
      }

      const categoryList = Array.from(catSet);
      setCategories(categoryList);

      if (categoryList.length === 0) {
        setIsCustomCategory(true);
      } else {
        setIsCustomCategory(false);
      }
    };

    loadCategories();

    if (serviceData) {
      setFormData({
        ...serviceData,
        code: serviceData.code || serviceData.id || "",
        minPrice: serviceData.minPrice ?? 0,
        gst: serviceData.gst ?? 18,
        status: serviceData.status || "Active",
        description: serviceData.description || serviceData.desc || "",
      });
      if (serviceData.category) {
        setFormData(prev => ({ ...prev, category: serviceData.category }));
      }
    } else {
      getServices().then(existingServices => {
        let maxNum = 0;
        if (Array.isArray(existingServices)) {
          existingServices.forEach((s: any) => {
            const codeStr = String(s.code || s.id || "");
            const serMatch = codeStr.match(/SER-HQ-(\d+)/i);
            if (serMatch) {
              const num = parseInt(serMatch[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            } else {
              const match = codeStr.match(/\d+/);
              if (match) {
                const num = parseInt(match[0], 10);
                if (!isNaN(num) && num > maxNum) {
                  maxNum = num;
                }
              }
            }
          });
        }
        const nextNum = maxNum + 1;
        const nextCode = `SER-HQ-${String(nextNum).padStart(2, "0")}`;
        setFormData(prev => ({
          ...prev,
          code: nextCode,
          name: "",
          price: "",
          minPrice: 0,
          gst: 18,
          duration: "",
          warranty: "",
          description: "",
          status: "Active",
        }));
      }).catch(() => {
        setFormData(prev => ({
          ...prev,
          code: "SER-HQ-01",
          name: "",
          price: "",
          minPrice: 0,
          gst: 18,
          duration: "",
          warranty: "",
          description: "",
          status: "Active",
        }));
      });
    }
  }, [isOpen, serviceData]);

  if (!mounted || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.category && typeof formData.category === "string" && formData.category.trim()) {
      const cleanCat = formData.category.trim();
      if (!categories.includes(cleanCat)) {
        try {
          const updatedCats = [...categories, cleanCat];
          await updateSettings({ categories: updatedCats });
          setCategories(updatedCats);
        } catch (err) {
          console.error("Failed to save new category to database:", err);
        }
      }
    }

    if (onSave) {
      onSave({
        ...formData,
        price: Number(formData.price) || 0,
        minPrice: Number(formData.minPrice) || 0,
        gst: Number(formData.gst) || 18,
        desc: formData.description || formData.desc || "",
      });
    }
    onClose();
  };

  const isEditing = !!serviceData?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-[#f59e0b] text-2xl">🏢</span> {isEditing ? "Edit Service" : "Add Service"}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Service Code</label>
              <input 
                type="text" 
                readOnly
                disabled
                value={formData.code || ""}
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-[#334155] cursor-not-allowed select-none opacity-90 focus:outline-none font-mono"
                placeholder="SER-HQ-01"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Service Name *</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="PPF Full Body"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Category *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/dashboard/settings?tab=categories&returnTo=${encodeURIComponent("/dashboard/services?openAdd=true")}`);
                    }}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200/80 transition-colors"
                    title="Open Categories Page in Settings"
                  >
                    <Tag className="w-3 h-3 text-amber-600" /> Manage Categories
                  </button>
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setFormData({ ...formData, category: "" });
                        } else {
                          setFormData({ ...formData, category: categories[0] || "" });
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      {isCustomCategory ? (
                        <><List className="w-3 h-3" /> Select</>
                      ) : (
                        <><Plus className="w-3 h-3" /> Inline New</>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {isCustomCategory || categories.length === 0 ? (
                <input 
                  required
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                  placeholder="Enter category (e.g. Detailing)"
                />
              ) : (
                <select 
                  required
                  value={formData.category}
                  onChange={e => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsCustomCategory(true);
                      setFormData({ ...formData, category: "" });
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                  <option value="__ADD_NEW__">+ Create New Category...</option>
                </select>
              )}
            </div>
            
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Standard Price (₹) *</label>
              <input 
                required
                type="number" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="45000"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Minimum Price (₹)</label>
              <input 
                type="number" 
                value={formData.minPrice ?? 0}
                onChange={e => setFormData({...formData, minPrice: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="40000"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">GST (%)</label>
              <input 
                type="number" 
                value={formData.gst ?? 18}
                onChange={e => setFormData({...formData, gst: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="18"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Status</label>
              <select 
                value={formData.status || "Active"}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Duration</label>
              <input 
                type="text" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="2 days / 4 hours"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Warranty</label>
              <input 
                type="text" 
                value={formData.warranty}
                onChange={e => setFormData({...formData, warranty: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="10 years / —"
              />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors min-h-[80px]"
                placeholder="Short description"
              />
            </div>
          </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 shrink-0 bg-gray-50">
            <button 
              type="submit"
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Check className="w-5 h-5 stroke-3" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
