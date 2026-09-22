"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Building2,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { PhoneInput } from "@/components/common/PhoneInput";
import { updateSettings, uploadFile, createService, lookupGstin } from "@/lib/api";
import { isValidGST, formatGSTInput } from "@/lib/validation";

function resolveUploadUrl(url: string): string {
  const uploadOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return url.startsWith("http") ? url : `${uploadOrigin}${url}`;
}

interface DraftService {
  name: string;
  category: string;
  price: string;
}

const STEPS = ["Company Info", "Services"] as const;

export function SuperAdminSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [company, setCompany] = useState({
    name: "",
    companyLogo: "",
    phone: "",
    email: "",
    registeredAddress: "",
    branchAddress: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
  });
  const [tax, setTax] = useState({ gstin: "", panNumber: "", gstPercent: "18" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [gstinInput, setGstinInput] = useState("");
  const [isFetchingGstin, setIsFetchingGstin] = useState(false);
  const lastFetchedGstinRef = useRef<string>("");

  const [services, setServices] = useState<DraftService[]>([]);
  const [draftService, setDraftService] = useState<DraftService>({ name: "", category: "", price: "" });

  const handleFetchGstin = async () => {
    const inputGst = tax.gstin || gstinInput;
    if (!isValidGST(inputGst)) {
      toast.error("Enter a valid 15-character GSTIN first");
      return;
    }
    setIsFetchingGstin(true);
    try {
      const { details } = await lookupGstin(inputGst);
      setCompany((prev) => ({
        ...prev,
        name: details.legalName || details.tradeName || prev.name,
        registeredAddress: details.address || prev.registeredAddress,
        city: details.city || prev.city,
        state: details.state || prev.state,
        pinCode: details.pinCode || prev.pinCode,
      }));
      setTax((prev) => ({
        ...prev,
        gstin: details.gstin || inputGst,
        panNumber: details.pan || prev.panNumber,
      }));
      setGstinInput(details.gstin || inputGst);
      toast.success("Company details fetched from GSTIN — review and edit below if needed");
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch GSTIN details");
    } finally {
      setIsFetchingGstin(false);
    }
  };

  useEffect(() => {
    if (isValidGST(tax.gstin) && tax.gstin !== lastFetchedGstinRef.current) {
      lastFetchedGstinRef.current = tax.gstin;
      handleFetchGstin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tax.gstin]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadFile(file);
      setCompany((prev) => ({ ...prev, companyLogo: data.url }));
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const canProceedFromCompany = company.name.trim().length > 0;

  const handleAddDraftService = () => {
    if (!draftService.name.trim() || !draftService.price.trim()) {
      toast.error("Enter a service name and price");
      return;
    }
    setServices((prev) => [...prev, draftService]);
    setDraftService({ name: "", category: draftService.category, price: "" });
  };

  const handleRemoveDraftService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const finishSetup = async () => {
    setIsSaving(true);
    try {
      // A service typed into the quick-add row but never confirmed with the
      // "+" button was silently dropped on Finish — nothing in the UI told
      // the user their entry hadn't been saved yet. Fold it in here so
      // whatever is visibly on screen is what actually gets persisted.
      const pendingDraft =
        draftService.name.trim() && draftService.price.trim() ? [draftService] : [];
      const allServices = [...services, ...pendingDraft];

      const categories = Array.from(
        new Set(allServices.map((s) => s.category.trim()).filter(Boolean))
      );

      await updateSettings({
        companyName: company.name.trim(),
        companyLogo: company.companyLogo,
        phone: company.phone,
        email: company.email,
        registeredAddress: company.registeredAddress,
        branchAddress: company.branchAddress,
        city: company.city,
        state: company.state,
        country: company.country,
        pinCode: company.pinCode,
        gstin: tax.gstin,
        panNumber: tax.panNumber,
        gstPct: Number(tax.gstPercent) || 18,
        categories,
        isSetupComplete: true,
      });

      for (const s of allServices) {
        try {
          await createService({
            name: s.name.trim(),
            category: s.category.trim() || "General",
            price: Number(s.price) || 0,
            // Backend requires a non-empty duration with no default — the
            // wizard's quick-add row doesn't collect one to keep onboarding
            // fast, so every service gets this placeholder and can be
            // corrected later from Dashboard -> Services.
            duration: "1 day",
            status: "Active",
          });
        } catch (err: any) {
          console.error("Failed to create service during setup:", s.name, err);
          toast.error(`Couldn't save "${s.name}" — you can add it again from Services later. (${err.message || "Unknown error"})`);
        }
      }

      toast.success("Company setup complete — welcome aboard!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save setup — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">Welcome to Shifterz</h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < step
                        ? "bg-emerald-500 text-white"
                        : i === step
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${i === step ? "text-gray-900" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-3" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="px-6 sm:px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-6">
              {/* Subsection: Tax Details (GSTIN first — auto-fetches on valid entry) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" /> Tax Details
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-yellow-800 uppercase tracking-wider">
                    GST Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tax.gstin}
                      onChange={(e) => {
                        const val = formatGSTInput(e.target.value);
                        setGstinInput(val);
                        setTax((p) => ({ ...p, gstin: val }));
                      }}
                      maxLength={15}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                    {isFetchingGstin && (
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <p className="text-[11px] text-yellow-700">
                    Enter your 15-character GSTIN — company and PAN details fill in automatically.
                  </p>
                </div>
              </div>

              {/* Subsection: Company Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
                  <Building2 className="w-4 h-4 text-yellow-500" /> Company Information
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name *</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Shifterz Detailing Pvt. Ltd."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1.5 shrink-0">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-11 h-11 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-400 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : company.companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveUploadUrl(company.companyLogo)} alt="Company logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="text-[10px] font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        {company.companyLogo ? "Replace" : "Upload"}
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <PhoneInput
                    value={company.phone}
                    onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                    placeholder="info@shifterz.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PAN Number</label>
                  <input
                    type="text"
                    value={tax.panNumber}
                    onChange={(e) => setTax((p) => ({ ...p, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default GST %</label>
                  <input
                    type="number"
                    value={tax.gstPercent}
                    onChange={(e) => setTax((p) => ({ ...p, gstPercent: e.target.value }))}
                    placeholder="18"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Subsection: Address Details */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
                  <MapPin className="w-4 h-4 text-yellow-500" /> Address Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Address</label>
                    <textarea
                      value={company.registeredAddress}
                      onChange={(e) => setCompany((p) => ({ ...p, registeredAddress: e.target.value }))}
                      rows={2}
                      placeholder="123 Main Business Park, Industrial Area"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch Address</label>
                    <textarea
                      value={company.branchAddress}
                      onChange={(e) => setCompany((p) => ({ ...p, branchAddress: e.target.value }))}
                      rows={2}
                      placeholder="Branch / Workshop Address (if different)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={company.city}
                      onChange={(e) => setCompany((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Bengaluru"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">State</label>
                    <input
                      type="text"
                      value={company.state}
                      onChange={(e) => setCompany((p) => ({ ...p, state: e.target.value }))}
                      placeholder="Karnataka"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PIN Code</label>
                    <input
                      type="text"
                      value={company.pinCode}
                      onChange={(e) => setCompany((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                      placeholder="560001"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Receipt className="w-4 h-4 text-yellow-500" /> Services
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Name</label>
                  <input
                    type="text"
                    value={draftService.name}
                    onChange={(e) => setDraftService((p) => ({ ...p, name: e.target.value }))}
                    placeholder="PPF Full Body"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
                <div className="w-28 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={draftService.category}
                    onChange={(e) => setDraftService((p) => ({ ...p, category: e.target.value }))}
                    placeholder="PPF"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
                <div className="w-24 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</label>
                  <input
                    type="number"
                    value={draftService.price}
                    onChange={(e) => setDraftService((p) => ({ ...p, price: e.target.value }))}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftService}
                  className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg shrink-0"
                  title="Add service"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {services.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {services.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm text-gray-800 truncate">
                        {s.name} {s.category && <span className="text-gray-400">· {s.category}</span>}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-gray-900">₹{Number(s.price || 0).toLocaleString("en-IN")}</span>
                        <button type="button" onClick={() => handleRemoveDraftService(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || isSaving}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 0 && !canProceedFromCompany) {
                  toast.error("Enter a company name to continue");
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-1.5 text-sm shadow-sm"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishSetup}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1.5 text-sm shadow-sm disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Finish Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
