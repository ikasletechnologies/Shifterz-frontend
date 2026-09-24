"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  ImageIcon,
  Info,
  Loader2,
  Mail,
  MapPin,
  Percent,
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
    <div className="min-h-screen bg-gray-100/70 py-6 sm:py-10 px-4 sm:px-8 flex items-center justify-center">
      {/* Outer Card Container (No shadow) */}
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Welcome to Shifterz
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Let&apos;s get your company onboarded in a few simple steps.
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                  step === 0
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {step > 0 ? <Check className="w-4 h-4" /> : 1}
              </div>
              <span className={`font-bold text-xs sm:text-sm ${step === 0 ? "text-gray-900" : "text-gray-600"}`}>
                Company Info
              </span>
            </div>

            {/* Progress line */}
            <div className="h-1.5 w-20 sm:w-36 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-yellow-400 transition-all duration-300 ${
                  step === 0 ? "w-1/2" : "w-full"
                }`}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                  step === 1
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                2
              </div>
              <span className={`font-bold text-xs sm:text-sm ${step === 1 ? "text-gray-900" : "text-gray-400"}`}>
                Services
              </span>
            </div>
          </div>
        </div>

        {/* Step body (No inner scrolling on Desktop/Laptop) */}
        <div className="px-6 sm:px-10 py-8 space-y-8">
          {step === 0 && (
            <div className="space-y-8">
              {/* Subsection: Tax Details */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>TAX DETAILS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-100/70 border border-amber-200/90 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-amber-800">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Enter your 15-character GSTIN — company and PAN details fill in automatically.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    GST NUMBER *
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
                      placeholder="22AAAAAA0000A1Z5"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-amber-200/90 rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 text-gray-900"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {isFetchingGstin ? (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                      ) : (
                        <Building2 className="w-4 h-4 text-amber-600/70" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsection: Company Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800 pb-2 border-b border-gray-100">
                  <Building2 className="w-4 h-4 text-yellow-500" />
                  <span>COMPANY INFORMATION</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        COMPANY NAME *
                      </label>
                      <input
                        type="text"
                        value={company.name}
                        onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Shifterz Detailing Pvt. Ltd."
                        className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                      />
                    </div>

                    {/* Phone Number & Email Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          PHONE NUMBER *
                        </label>
                        <PhoneInput
                          value={company.phone}
                          onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-gray-50/70 border border-gray-200 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-yellow-400/30 focus-within:border-yellow-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          EMAIL ADDRESS *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            value={company.email}
                            onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                            placeholder="info@shifterz.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PAN Number & Default GST % */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          PAN NUMBER *
                        </label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={tax.panNumber}
                            onChange={(e) => setTax((p) => ({ ...p, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                            maxLength={10}
                            placeholder="ABCDE1234F"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          DEFAULT GST %
                        </label>
                        <div className="relative">
                          <Percent className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="number"
                            value={tax.gstPercent}
                            onChange={(e) => setTax((p) => ({ ...p, gstPercent: e.target.value }))}
                            placeholder="18"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Logo Upload Box */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      LOGO
                    </label>
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-yellow-400 bg-gray-50/50 hover:bg-yellow-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer min-h-[210px] group"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                      ) : company.companyLogo ? (
                        <div className="relative flex flex-col items-center gap-2 w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveUploadUrl(company.companyLogo)}
                            alt="Company logo"
                            className="max-h-28 w-auto object-contain rounded-md"
                          />
                          <span className="text-xs font-bold text-yellow-600 group-hover:underline flex items-center gap-1 mt-1">
                            <Upload className="w-3.5 h-3.5" /> Replace Logo
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-yellow-100/70 flex items-center justify-center transition-colors">
                            <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-700 flex items-center justify-center gap-1">
                              <Upload className="w-3.5 h-3.5 text-gray-400" /> Upload Logo
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG (Max 2MB)</p>
                          </div>
                        </>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsection: Address Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800 pb-2 border-b border-gray-100">
                  <MapPin className="w-4 h-4 text-yellow-500" />
                  <span>ADDRESS DETAILS</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      REGISTERED ADDRESS *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        value={company.registeredAddress}
                        onChange={(e) => setCompany((p) => ({ ...p, registeredAddress: e.target.value }))}
                        rows={2}
                        placeholder="123 Main Business Park, Industrial Area"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      BRANCH ADDRESS
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        value={company.branchAddress}
                        onChange={(e) => setCompany((p) => ({ ...p, branchAddress: e.target.value }))}
                        rows={2}
                        placeholder="Branch / Workshop Address (if different)"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* City, State, Pin Code Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        CITY *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={company.city}
                          onChange={(e) => setCompany((p) => ({ ...p, city: e.target.value }))}
                          placeholder="Bengaluru"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        STATE *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={company.state}
                          onChange={(e) => setCompany((p) => ({ ...p, state: e.target.value }))}
                          placeholder="Karnataka"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        PIN CODE *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={company.pinCode}
                          onChange={(e) => setCompany((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          placeholder="560001"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                <Receipt className="w-4 h-4 text-yellow-500" />
                <span>Services</span>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Name</label>
                  <input
                    type="text"
                    value={draftService.name}
                    onChange={(e) => setDraftService((p) => ({ ...p, name: e.target.value }))}
                    placeholder="PPF Full Body"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400"
                  />
                </div>
                <div className="w-full sm:w-44 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={draftService.category}
                    onChange={(e) => setDraftService((p) => ({ ...p, category: e.target.value }))}
                    placeholder="PPF"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400"
                  />
                </div>
                <div className="w-full sm:w-36 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    value={draftService.price}
                    onChange={(e) => setDraftService((p) => ({ ...p, price: e.target.value }))}
                    placeholder="45000"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftService}
                  className="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  title="Add service"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {services.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configured Services ({services.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {services.map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {s.name} {s.category && <span className="text-gray-400 font-normal">· {s.category}</span>}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-gray-900">₹{Number(s.price || 0).toLocaleString("en-IN")}</span>
                          <button type="button" onClick={() => handleRemoveDraftService(i)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 sm:px-10 py-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || isSaving}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none transition-colors"
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
              className="px-7 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2 text-sm transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishSetup}
              disabled={isSaving}
              className="px-7 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-2 text-sm transition-all disabled:opacity-60"
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
