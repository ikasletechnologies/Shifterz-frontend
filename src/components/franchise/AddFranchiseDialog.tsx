"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { X, Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { isValidGST, formatGSTInput } from "@/lib/validation";

interface FranchiseData {
  id?: string;
  name: string;
  city: string;
  owner: string;
  phone: string;
  startDate: string;
  royalty: string;
  status: string;
  adminUsername?: string;
  adminPassword?: string;
  businessName?: string;
  gstNumber?: string;
  email?: string;
  address?: string;
  state?: string;
  pinCode?: string;
}

interface AddFranchiseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  franchiseData?: FranchiseData | null;
  onSave?: (data: FranchiseData) => void;
}

export default function AddFranchiseDialog({ isOpen, onClose, franchiseData, onSave }: AddFranchiseDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FranchiseData>({
    name: "",
    city: "",
    owner: "",
    phone: "",
    startDate: new Date().toISOString().split("T")[0],
    royalty: "5",
    status: "Active",
    adminUsername: "",
    adminPassword: "",
    businessName: "",
    gstNumber: "",
    email: "",
    address: "",
    state: "",
    pinCode: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (franchiseData) {
      setFormData(franchiseData);
    } else {
      setFormData({
        name: "",
        city: "",
        owner: "",
        phone: "",
        startDate: new Date().toISOString().split("T")[0],
        royalty: "5",
        status: "Active",
        adminUsername: "",
        adminPassword: "",
        businessName: "",
        gstNumber: "",
        email: "",
        address: "",
        state: "",
        pinCode: "",
      });
    }
  }, [franchiseData, isOpen]);

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Email Address (Compulsory for new, optional/validated if present for existing)
    if (!isEditing) {
      if (!formData.email || !formData.email.trim()) {
        toast.error("Email Address is compulsory");
        return;
      }
    }
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Invalid Email Address format");
        return;
      }
    }

    // Validate GST Number (Compulsory for new, optional/validated if present for existing)
    if (!isEditing) {
      if (!formData.gstNumber || !formData.gstNumber.trim()) {
        toast.error("GST Number is compulsory");
        return;
      }
    }
    if (formData.gstNumber && formData.gstNumber.trim()) {
      if (!isValidGST(formData.gstNumber)) {
        toast.error("Wrong GST Number format. Format must match: 29ABCDE1234F1Z5");
        return;
      }
      // Store GST Number as uppercase
      formData.gstNumber = formData.gstNumber.toUpperCase();
    }

    // Validate Business Address (Compulsory for new, optional if existing)
    if (!isEditing) {
      if (!formData.address || !formData.address.trim()) {
        toast.error("Business Address is compulsory");
        return;
      }
    }

    if (onSave) onSave(formData);
    onClose();
  };

  const isEditing = !!franchiseData?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-[#f59e0b] text-2xl">🏢</span> {isEditing ? "Edit Franchise" : "Add Franchise"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Basic Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-yellow-400 rounded-full"></span>
                Basic Details
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Franchise Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name || ""}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Shifterz Chennai"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Owner Name</label>
                  <input 
                    type="text" 
                    value={formData.owner || ""}
                    onChange={e => setFormData({...formData, owner: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Full name"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone || ""}
                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10)})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate || ""}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Royalty %</label>
                  <input 
                    type="number" 
                    value={formData.royalty || ""}
                    onChange={e => setFormData({...formData, royalty: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="5"
                  />
                </div>

                {/* Auto-License notice — replaces the old manual License Status dropdown */}
                {!isEditing && (
                  <div className="col-span-2">
                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <span className="text-blue-500 mt-0.5 text-base">🔑</span>
                      <div>
                        <p className="text-xs font-bold text-blue-700">License auto-generated on submission</p>
                        <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                          A unique License Key will be automatically generated and linked to this franchise.
                          Both the franchise and license will become <strong>Active</strong> immediately upon creation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Business Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-yellow-400 rounded-full"></span>
                Location & Business Details
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName || ""}
                    onChange={e => setFormData({...formData, businessName: e.target.value.replace(/[^A-Za-z\s]/g, "")})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Legal Entity Name"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">GST Number *</label>
                  <input 
                    type="text" 
                    value={formData.gstNumber || ""}
                    onChange={e => setFormData({...formData, gstNumber: formatGSTInput(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Email Address *</label>
                  <input 
                    type="email" 
                    value={formData.email || ""}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="branch@shifterz.in"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Business Address *</label>
                  <input 
                    type="text" 
                    value={formData.address || ""}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Street, Building, etc."
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">City *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.city || ""}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Chennai"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">State</label>
                  <input 
                    type="text" 
                    value={formData.state || ""}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="Tamil Nadu"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.pinCode || ""}
                    onChange={e => setFormData({...formData, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6)})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="600001"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2 mt-2">
                <span className="w-1.5 h-4 bg-yellow-400 rounded-full"></span>
                Administrator Account
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Admin Username {!isEditing && "*"}</label>
                  <input
                    required={!isEditing}
                    type="text"
                    value={formData.adminUsername || ""}
                    onChange={e => setFormData({...formData, adminUsername: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                    placeholder="branch_admin"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{isEditing ? "Reset Password" : "Admin Password *"}</label>
                  <div className="relative">
                    <input
                      required={!isEditing}
                      type={showPassword ? "text" : "password"}
                      value={formData.adminPassword || ""}
                      onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:bg-white transition-colors"
                      placeholder={isEditing ? "Leave blank to keep current password" : "••••••••"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-white">
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
