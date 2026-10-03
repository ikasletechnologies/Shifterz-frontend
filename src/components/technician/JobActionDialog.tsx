"use client";
import { useState, useRef, useEffect } from "react";
import { apiCall, uploadFile } from "@/lib/api";
import {
  X, Loader2, Upload, Save, FileText, Camera, Check,
  AlertTriangle, ChevronLeft, ChevronRight, Clipboard,
  ShieldCheck, ZoomIn
} from "lucide-react";

// Origin (protocol+host, no /api) the backend serves uploaded files from
const UPLOAD_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function buildPhotoUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${UPLOAD_ORIGIN}${url}`;
}

function parseFindings(carIn: any) {
  const findings: { type: string; location?: string; severity?: string; notes?: string }[] = [];
  const push = (type: string, value: string | null | undefined) => {
    if (!value || value.trim() === "" || value.trim().toLowerCase() === "none" || value.trim() === "-") return;
    const lines = value.split(/[|\n;]+/).map((l: string) => l.trim()).filter(Boolean);
    let location = "", severity = "";
    const notesArr: string[] = [];
    for (const line of lines) {
      const ll = line.toLowerCase();
      if (ll.startsWith("severity:")) severity = line.replace(/severity:/i, "").trim();
      else if (ll.startsWith("location:")) location = line.replace(/location:/i, "").trim();
      else if (ll.startsWith("note:") || ll.startsWith("notes:")) notesArr.push(line.replace(/notes?:/i, "").trim());
      else notesArr.push(line);
    }
    findings.push({ type, location: location || undefined, severity: severity || undefined, notes: notesArr.join("; ") || undefined });
  };
  push("Scratches / Paint", carIn.scratches);
  push("Dents", carIn.dents);
  push("Broken Parts", carIn.brokenParts);
  push("Glass Damage", carIn.glassDamage);
  push("Wheel / Tyre Damage", carIn.wheelDamage);
  push("Interior Condition", carIn.interiorCondition);
  if (carIn.remarks) push("Other Remarks", carIn.remarks);
  return findings;
}

function severityClass(severity?: string) {
  const s = (severity || "").toLowerCase();
  if (s.includes("major") || s.includes("severe") || s.includes("high")) return "bg-red-50 border-red-200 text-red-700";
  if (s.includes("moderate") || s.includes("medium")) return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-yellow-50 border-yellow-200 text-yellow-700";
}

function Lightbox({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white p-1"><X className="w-6 h-6" /></button>
        <img src={photos[idx]} alt={`Photo ${idx + 1}`} className="w-full max-h-[80vh] object-contain rounded-xl" />
        {photos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"><ChevronRight className="w-5 h-5" /></button>
            <p className="text-center text-white/60 text-sm mt-3">{idx + 1} / {photos.length}</p>
          </>
        )}
      </div>
    </div>
  );
}

function VehicleInspectionSection({ carIn }: { carIn: any }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allPhotos: { url: string; label: string }[] = [];
  if (carIn.photoFront) allPhotos.push({ url: buildPhotoUrl(carIn.photoFront), label: "Front" });
  if (carIn.photoRear) allPhotos.push({ url: buildPhotoUrl(carIn.photoRear), label: "Rear" });
  if (carIn.photoLeft) allPhotos.push({ url: buildPhotoUrl(carIn.photoLeft), label: "Left" });
  if (carIn.photoRight) allPhotos.push({ url: buildPhotoUrl(carIn.photoRight), label: "Right" });
  if (carIn.photoDashboard) allPhotos.push({ url: buildPhotoUrl(carIn.photoDashboard), label: "Dashboard" });
  if (carIn.photoOdometer) allPhotos.push({ url: buildPhotoUrl(carIn.photoOdometer), label: "Odometer" });
  (carIn.photoDamages || []).forEach((p: string, i: number) => { if (p) allPhotos.push({ url: buildPhotoUrl(p), label: `Damage ${i + 1}` }); });
  const findings = parseFindings(carIn);
  const photoUrls = allPhotos.map((p) => p.url);
  return (
    <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" />Vehicle Inspection</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 border border-green-200"><Check className="w-3 h-3" /> Recorded</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Photos</p><p className="text-lg font-black text-slate-900">{allPhotos.length}</p></div>
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Findings</p><p className={`text-lg font-black ${findings.length > 0 ? "text-amber-600" : "text-green-600"}`}>{findings.length}</p></div>
        <div className="bg-white border border-slate-200 rounded-lg p-2 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Odometer</p><p className="text-sm font-bold text-slate-900 truncate">{carIn.odometer || "—"}</p></div>
      </div>
      {findings.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Inspection Findings</p>
          <div className="space-y-2">
            {findings.map((f, i) => (
              <div key={i} className={`border rounded-xl p-3 text-xs space-y-1 ${severityClass(f.severity)}`}>
                <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span className="font-bold text-sm">{f.type}</span>{f.severity && <span className="ml-auto px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold uppercase">{f.severity}</span>}</div>
                {f.location && <p className="pl-5"><span className="font-semibold">Location: </span>{f.location}</p>}
                {f.notes && <p className="pl-5 text-[11px] opacity-80">{f.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"><Check className="w-3.5 h-3.5 shrink-0" /><span className="font-medium">No damage or issues recorded during inspection.</span></div>
      )}
      {allPhotos.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-blue-500" />Inspection Photos<span className="text-slate-400 font-normal normal-case">— click to enlarge</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {allPhotos.map((photo, i) => (
              <div key={i} className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all" onClick={() => setLightboxIndex(i)}>
                <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"><ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" /></div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">{photo.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2"><Camera className="w-3.5 h-3.5 shrink-0 text-slate-400" /><span>No inspection photos were uploaded.</span></div>
      )}
      {lightboxIndex !== null && <Lightbox photos={photoUrls} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
    </div>
  );
}

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
  const [inspectionCarIn, setInspectionCarIn] = useState<any>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (job) {
      setStatus(job.status || "Pending");
      setNotes(job.notes || "");
      setPhotos(job.photos || []);
      if (job.inspectionCarIn) {
        setInspectionCarIn(job.inspectionCarIn);
      } else if (job.id) {
        setLoadingInspection(true);
        apiCall(`/jobs/${job.id}`)
          .then((data: any) => { if (data?.inspectionCarIn) setInspectionCarIn(data.inspectionCarIn); })
          .catch(() => {})
          .finally(() => setLoadingInspection(false));
      }
    }
  }, [job]);

  const userRole = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return (JSON.parse(u).role || "").toUpperCase().replace(/[\s_]+/g, "_");
      }
    } catch { }
    return "";
  })();

  const isQualityInspector = userRole === "QUALITY_INSPECTOR" || userRole === "QUALITY_INSPECTION" || userRole === "QC_INSPECTOR" || userRole === "QC" || userRole === "QUALITY_ASSURANCE";
  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  if (!isOpen || !job) return null;

  let statusOptions = ["Pending", "Assigned", "In Progress", "Waiting for Parts", "Completed"];
  if (isQualityInspector) statusOptions = ["Pending", "In Progress", "Completed"];
  else if (isBillingExecutive) statusOptions = ["Completed", "Delivered"];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const data = await uploadFile(file);
      setPhotos([...photos, data.url]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { status, notes, photos };
      if (status === "Completed" || status === "Ready For Billing") payload.actualCompletion = new Date().toISOString().slice(0, 10);
      await apiCall(`/jobs/${job.id}`, { method: "PUT", body: JSON.stringify(payload) });
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
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div><h2 className="text-xl font-bold text-gray-900">{job.vehicle}</h2><p className="text-sm text-gray-500 font-medium">{job.service}</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Current Status</label>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${status === s ? "bg-yellow-400 text-gray-900 shadow-sm border-transparent" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"}`}>{s}</button>
              ))}
            </div>
          </div>
          {loadingInspection && (
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /><span>Loading inspection data...</span></div>
          )}
          {!loadingInspection && inspectionCarIn && <VehicleInspectionSection carIn={inspectionCarIn} />}
          {!loadingInspection && !inspectionCarIn && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3"><Clipboard className="w-4 h-4 text-slate-400 shrink-0" /><span>No vehicle inspection record found. The inspection may not have been completed yet.</span></div>
          )}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Work Notes &amp; Progress</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details about the work done, any issues found, etc..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none h-32 resize-none text-gray-700" />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Camera className="w-4 h-4 text-green-500" /> Vehicle Photos (Before/After)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={url.startsWith("http") ? url : `${UPLOAD_ORIGIN}${url}`} alt="Vehicle" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-gray-500 cursor-pointer disabled:opacity-50">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
                <span className="text-xs font-medium">{uploading ? "Uploading..." : "Add Photo"}</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Updates
          </button>
        </div>
      </div>
    </div>
  );
}
