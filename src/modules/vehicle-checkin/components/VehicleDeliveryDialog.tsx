"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";

interface PassCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    vehicleNo: string;
    model: string;
    customer: string;
    phone: string;
    service: string;
    technician: string;
  };
  onSubmit?: (data: any) => void;
}

export default function PassCarDialog({
  isOpen,
  onClose,
  carData,
  onSubmit,
}: PassCarDialogProps) {
  const [formData, setFormData] = useState({
    outTime: new Date().toISOString().slice(0, 16),
    security: "",
    remarks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && carData) {
      onSubmit({
        ...carData,
        ...formData,
      });
    }
    onClose();
  };

  if (!isOpen || !carData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">Mark Car as Out</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Car Info - Read Only */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Car Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Vehicle
                </p>
                <p className="font-semibold text-gray-900">{carData.vehicleNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Model
                </p>
                <p className="font-semibold text-gray-900">{carData.model}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Customer
                </p>
                <p className="font-semibold text-gray-900">{carData.customer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Service
                </p>
                <p className="font-semibold text-gray-900">{carData.service}</p>
              </div>
            </div>
          </div>

          {/* Out Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Out Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="outTime"
              value={formData.outTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              required
            />
          </div>

          {/* Security Guard */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Security Guard <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="security"
              value={formData.security}
              onChange={handleChange}
              placeholder="Guard name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              required
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="All clear. Washed and ready."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ✓ Mark as Out & Create Pass
          </button>
        </form>
      </div>
    </div>
  );
}
