"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/api";

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
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<ServiceData>({
    name: "",
    category: "PPF",
    price: "",
    duration: "",
    warranty: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      getSettings().then(data => {
        if (data?.categories) {
          setCategories(data.categories);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (serviceData) {
      setFormData({
        ...serviceData,
        code: serviceData.code || serviceData.id || "",
        minPrice: serviceData.minPrice ?? 0,
        gst: serviceData.gst ?? 18,
        status: serviceData.status || "Active",
        description: serviceData.description || serviceData.desc || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        category: categories.length > 0 ? categories[0] : "PPF",
        price: "",
        minPrice: 0,
        gst: 18,
        duration: "",
        warranty: "",
        description: "",
        status: "Active",
      });
    }
  }, [serviceData, isOpen, categories]);

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                value={formData.code || ""}
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                placeholder="Auto or e.g. SRV-001"
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
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
              >
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))
                ) : (
                  <>
                    <option value="PPF">PPF</option>
                    <option value="Coating">Coating</option>
                    <option value="Detailing">Detailing</option>
                    <option value="Add-on">Add-on</option>
                  </>
                )}
              </select>
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
