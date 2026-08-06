import { useState, useRef, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { X, Loader2, Upload, Save, FileText, Camera, Check } from "lucide-react";

interface JobActionDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobActionDialog({ job, isOpen, onClose }: JobActionDialogProps) {
  const [status, setStatus] = useState(job?.status || "Pending");
  const [notes, setNotes] = useState(job?.notes || "");
  const [photos, setPhotos] = useState<string[]>(job?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (job) {
      setStatus(job.status || "Pending");
      setNotes(job.notes || "");
      setPhotos(job.photos || []);
    }
  }, [job]);

  const userRole = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return (JSON.parse(u).role || "").toUpperCase().replace(/[\s_]+/g, "_");
      }
    } catch {
      // Ignore
    }
    return "";
  })();

  const isQualityInspector =
    userRole === "QUALITY_INSPECTOR" ||
    userRole === "QUALITY_INSPECTION" ||
    userRole === "QC_INSPECTOR" ||
    userRole === "QC" ||
    userRole === "QUALITY_ASSURANCE";

  const isBillingExecutive =
    userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  if (!isOpen || !job) return null;

  let statusOptions = ["Pending", "Assigned", "In Progress", "Waiting for Parts", "Completed"];

  if (isQualityInspector) {
    statusOptions = ["Pending", "In Progress", "Completed", "Rework", "Ready For Billing"];
  } else if (isBillingExecutive) {
    statusOptions = ["Ready For Billing", "Completed", "Delivered"];
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Using raw fetch here since apiCall stringifies body by default
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setPhotos([...photos, data.url]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
      // clear input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        status,
        notes,
        photos,
      };
      if (status === "Completed" || status === "Ready For Billing") {
        payload.actualCompletion = new Date().toISOString().slice(0, 10);
      }

      await apiCall(`/jobs/${job.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.vehicle}</h2>
            <p className="text-sm text-gray-500 font-medium">{job.service}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Status Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-500" /> Current Status
            </label>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    status === s 
                      ? "bg-yellow-400 text-gray-900 shadow-sm border-transparent" 
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" /> Work Notes & Progress
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about the work done, any issues found, etc..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none h-32 resize-none text-gray-700"
            />
          </div>

          {/* Photos Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Camera className="w-4 h-4 text-green-500" /> Vehicle Photos (Before/After)
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  {/* Assuming backend serves them at http://localhost:5000/uploads/... */}
                  <img src={`http://localhost:5000${url}`} alt="Vehicle" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-gray-500 cursor-pointer disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-6 h-6 animate-spin mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
                <span className="text-xs font-medium">{uploading ? "Uploading..." : "Add Photo"}</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Updates
          </button>
        </div>

      </div>
    </div>
  );
}
