"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload, Loader2 } from "lucide-react";
import { QCJob, QCPhoto } from "../types/qc.types";
import { QC_PHOTO_CATEGORIES, QC_PHOTO_CATEGORY_LABELS } from "../constants/qc.constants";

interface QCPhotosDialogProps {
  job: QCJob | null;
  photos: QCPhoto[];
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], category: string) => Promise<boolean>;
}

export function QCPhotosDialog({ job, photos, isOpen, onClose, onUpload }: QCPhotosDialogProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [category, setCategory] = useState<string>(QC_PHOTO_CATEGORIES[0]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !job) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePreview = (idx: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    if (!previews.length) return;
    setIsUploading(true);
    const success = await onUpload(previews.map((p) => p.file), category);
    setIsUploading(false);
    if (success) {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-500" /> QC Photos — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing QC photos for the current attempt */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Existing QC Photos ({photos.length})
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {photos.map((p) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative group">
                    <img
                      src={p.url.startsWith("http") ? p.url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.url}`}
                      alt={p.category}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-semibold text-center py-0.5 truncate px-1">
                      {QC_PHOTO_CATEGORY_LABELS[p.category] || p.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New uploads */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Add New Photos
            </p>

            <div className="mb-3">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {QC_PHOTO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {QC_PHOTO_CATEGORY_LABELS[c] || c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={p.url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePreview(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-gray-400 cursor-pointer"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFiles}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Close
          </button>
          {previews.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading..." : `Upload ${previews.length} Photo${previews.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
