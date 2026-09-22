"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Headset, Lock, Plus, Trash2, Tag, Upload, Loader2, Image as ImageIcon, User, ArrowLeft } from "lucide-react";
import { getSettings, updateSettings, uploadFile } from "@/lib/api";
import AddTechnicianDialog from "@/modules/vehicle-checkin/components/AddTechnicianDialog";
import AddSalesAgentDialog from "@/components/settings/AddSalesAgentDialog";
import AddSecurityGuardDialog from "@/components/settings/AddSecurityGuardDialog";
import ProfilePage from "@/app/dashboard/profile/page";
import { toast } from "react-hot-toast";

function resolveUploadUrl(url: string): string {
  const uploadOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return url.startsWith("http") ? url : `${uploadOrigin}${url}`;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const returnToParam = searchParams.get("returnTo");

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    companyLogo: "",
    gstin: "",
    panNumber: "",
    registeredAddress: "",
    branchAddress: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    gstPercent: "18"
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [salesAgents, setSalesAgents] = useState<string[]>([]);
  const [securityGuards, setSecurityGuards] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  const [isAddSalesAgentOpen, setIsAddSalesAgentOpen] = useState(false);
  const [isAddSecurityOpen, setIsAddSecurityOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [activeTab, setActiveTab] = useState(tabParam || "company");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadFile(file);
      setCompanyInfo((prev) => ({ ...prev, companyLogo: data.url }));
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const tabs = [
    { id: "company", label: "Company Details", icon: Building2 },
    { id: "admin", label: "Administrator Account", icon: User },
    { id: "sales", label: "Sales Agents", icon: Headset },
    { id: "security", label: "Security Guards", icon: Lock },
    { id: "categories", label: "Categories", icon: Tag },
  ];

  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const data = await getSettings();
        if (data) {
          const normInfo = {
            name: data.companyName || "",
            companyLogo: data.companyLogo || "",
            gstin: data.gstin || "",
            panNumber: data.panNumber || "",
            registeredAddress: data.registeredAddress || "",
            branchAddress: data.branchAddress || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            pinCode: data.pinCode || "",
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            gstPercent: String(data.gstPct || "18")
          };
          setCompanyInfo(normInfo);
          setSalesAgents(data.agents || []);
          setSecurityGuards(data.securityGuards || []);
          setCategories(data.categories || []);
        }

        // Fetch technicians directly
        const techsRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/technicians" || "http://localhost:5000/api/technicians", {
          credentials: "include",
        });
        if (techsRes.ok) {
          const techsData = await techsRes.json();
          setTechnicians(techsData);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setCompanyInfo(prev => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "gstin") {
      setCompanyInfo(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 15) }));
    } else if (name === "panNumber") {
      setCompanyInfo(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 10) }));
    } else {
      setCompanyInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Backend's updateSettingSchema (Zod) validates these fields at the top
      // level of the request body and silently drops anything it doesn't
      // recognize — nesting them under "companyInfo" (as this used to) meant
      // every one of these fields was stripped before it ever reached the DB.
      // "agents" is also the schema's actual key name, not "salesAgents".
      const mappedInfo = {
        companyName: companyInfo.name,
        companyLogo: companyInfo.companyLogo,
        gstin: companyInfo.gstin,
        panNumber: companyInfo.panNumber,
        registeredAddress: companyInfo.registeredAddress,
        branchAddress: companyInfo.branchAddress,
        city: companyInfo.city,
        state: companyInfo.state,
        country: companyInfo.country,
        pinCode: companyInfo.pinCode,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        website: companyInfo.website,
        gstPct: Number(companyInfo.gstPercent)
      };
      await updateSettings({ ...mappedInfo, agents: salesAgents, securityGuards, categories });
      toast.success("Company profile saved");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err.message || "Failed to save settings");
    }
  };

  const handleAddTechnician = () => {
    setIsAddTechnicianOpen(true);
  };

  const handleAddTechnicianSubmit = async (technicianData: {
    name: string;
    phone: string;
    email: string;
    experience: string;
    specialization: string;
  }) => {
    if (!technicianData.name) return;

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/technicians" || "http://localhost:5000/api/technicians", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(technicianData)
      });
      if (!res.ok) throw new Error("Failed to add technician");

      const newTech = await res.json();
      setTechnicians([...technicians, newTech]);
      toast.success("Technician added to database");
    } catch (err: any) {
      toast.error("Failed to add technician: " + err.message);
    }
  };

  const handleRemoveTechnician = async (index: number) => {
    if (window.confirm("Are you sure you want to remove this technician?")) {
      const techToRemove = technicians[index];
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + `/technicians/${techToRemove.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to delete technician");

        const newTechnicians = technicians.filter((_, i) => i !== index);
        setTechnicians(newTechnicians);
        toast.success("Technician removed from database");
      } catch (err: any) {
        toast.error("Failed to remove technician: " + err.message);
      }
    }
  };

  const handleAddSalesAgent = () => {
    setIsAddSalesAgentOpen(true);
  };

  const handleAddSalesAgentSubmit = async (agentData: {
    name: string;
  }) => {
    const name = agentData.name.trim();
    if (name && !salesAgents.includes(name)) {
      const newSalesAgents = [...salesAgents, name];
      try {
        await updateSettings({ agents: newSalesAgents });
        setSalesAgents(newSalesAgents);
        toast.success("Sales agent added");
      } catch (err: any) {
        toast.error("Failed to add sales agent: " + err.message);
      }
    }
  };

  const handleRemoveSalesAgent = async (index: number) => {
    if (window.confirm("Are you sure you want to remove this sales agent?")) {
      const newSalesAgents = salesAgents.filter((_, i) => i !== index);
      try {
        await updateSettings({ agents: newSalesAgents });
        setSalesAgents(newSalesAgents);
        toast.success("Sales agent removed");
      } catch (err: any) {
        toast.error("Failed to remove sales agent: " + err.message);
      }
    }
  };

  const handleAddSecurityGuard = () => {
    setIsAddSecurityOpen(true);
  };

  const handleAddSecurityGuardSubmit = async (guardData: {
    name: string;
  }) => {
    const name = guardData.name.trim();
    if (name && !securityGuards.includes(name)) {
      const newSecurityGuards = [...securityGuards, name];
      try {
        await updateSettings({ securityGuards: newSecurityGuards });
        setSecurityGuards(newSecurityGuards);
        toast.success("Security guard added");
      } catch (err: any) {
        toast.error("Failed to add security guard: " + err.message);
      }
    }
  };

  const handleRemoveSecurityGuard = async (index: number) => {
    if (window.confirm("Are you sure you want to remove this security guard?")) {
      const newSecurityGuards = securityGuards.filter((_, i) => i !== index);
      try {
        await updateSettings({ securityGuards: newSecurityGuards });
        setSecurityGuards(newSecurityGuards);
        toast.success("Security guard removed");
      } catch (err: any) {
        toast.error("Failed to remove security guard: " + err.message);
      }
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory.trim())) {
      const newCategories = [...categories, newCategory.trim()];
      try {
        await updateSettings({ categories: newCategories });
        setCategories(newCategories);
        setNewCategory("");
        toast.success("Category added");
      } catch (err: any) {
        toast.error("Failed to add category: " + err.message);
      }
    }
  };

  const handleRemoveCategory = async (index: number) => {
    if (window.confirm("Are you sure you want to remove this category?")) {
      const newCategories = categories.filter((_, i) => i !== index);
      try {
        await updateSettings({ categories: newCategories });
        setCategories(newCategories);
        toast.success("Category removed");
      } catch (err: any) {
        toast.error("Failed to remove category: " + err.message);
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {returnToParam && (
        <button
          type="button"
          onClick={() => router.push(returnToParam)}
          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your company details and administrator account.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
              ? "border-yellow-500 text-yellow-600 bg-yellow-50/50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-8">

        {/* Company Details */}
        {activeTab === "company" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-yellow-500" /> Company Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
                <input type="text" name="name" value={companyInfo.name} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Logo</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-400 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : companyInfo.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveUploadUrl(companyInfo.companyLogo)} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingLogo ? "Uploading..." : companyInfo.companyLogo ? "Replace Logo" : "Upload Logo"}
                    </button>
                    {companyInfo.companyLogo && (
                      <button
                        type="button"
                        onClick={() => setCompanyInfo((prev) => ({ ...prev, companyLogo: "" }))}
                        className="text-[11px] text-red-500 hover:text-red-600 font-semibold text-left"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">GST Number</label>
                <input type="text" name="gstin" value={companyInfo.gstin} onChange={handleCompanyInfoChange} maxLength={15} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PAN Number</label>
                <input type="text" name="panNumber" value={companyInfo.panNumber} onChange={handleCompanyInfoChange} maxLength={10} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Address</label>
                <textarea name="registeredAddress" value={companyInfo.registeredAddress} onChange={handleCompanyInfoChange} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch Address</label>
                <textarea name="branchAddress" value={companyInfo.branchAddress} onChange={handleCompanyInfoChange} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">City</label>
                <input type="text" name="city" value={companyInfo.city} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">State</label>
                <input type="text" name="state" value={companyInfo.state} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Country</label>
                <input type="text" name="country" value={companyInfo.country} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PIN Code</label>
                <input type="text" name="pinCode" value={companyInfo.pinCode} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number (Phone)</label>
                <PhoneInput name="phone" value={companyInfo.phone} onChange={handleCompanyInfoChange} placeholder="XXXXX XXXXX" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input type="email" name="email" value={companyInfo.email} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Website</label>
                <input type="text" name="website" value={companyInfo.website} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">GST %</label>
                <input type="number" name="gstPercent" value={companyInfo.gstPercent} onChange={handleCompanyInfoChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none" />
              </div>
            </div>

            <div className="pt-6">
              <button onClick={handleSaveSettings} className="bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors text-sm shadow-sm">
                <Lock className="w-4 h-4" /> Save Company Profile
              </button>
            </div>
          </div>
        )}

        {activeTab === "admin" && <ProfilePage embedded />}



        {/* Sales Agents */}
        {activeTab === "sales" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Headset className="w-5 h-5 text-yellow-500" /> Sales Agents
              </h2>
              <button onClick={handleAddSalesAgent} className="px-4 py-2 bg-yellow-400 text-gray-900 text-sm font-bold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1 shadow-sm">
                <Plus className="w-4 h-4" /> Add Agent
              </button>
            </div>
            <div className="space-y-0">
              {salesAgents.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">No sales agents added yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {salesAgents.map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">{name.substring(0, 2)}</div>
                        <span className="text-sm font-bold text-gray-800">{name}</span>
                      </div>
                      <button onClick={() => handleRemoveSalesAgent(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Guards */}
        {activeTab === "security" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-500" /> Security Guards
              </h2>
              <button onClick={handleAddSecurityGuard} className="px-4 py-2 bg-yellow-400 text-gray-900 text-sm font-bold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1 shadow-sm">
                <Plus className="w-4 h-4" /> Add Guard
              </button>
            </div>
            <div className="space-y-0">
              {securityGuards.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">No security guards added yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {securityGuards.map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs uppercase">{name.substring(0, 2)}</div>
                        <span className="text-sm font-bold text-gray-800">{name}</span>
                      </div>
                      <button onClick={() => handleRemoveSecurityGuard(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {activeTab === "categories" && (
          <div className="max-w-3xl">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-yellow-500" /> Categories
              </h2>
            </div>

            {/* Add Category Input */}
            <div className="mb-8 pb-8 border-b border-gray-100">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Add New Category
              </label>
              <div className="flex gap-2 max-w-lg">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="e.g., PPF, Coating, Consumable, Chemical..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-colors"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Saved Categories</h3>
              {categories.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No categories found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map((category, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg hover:from-blue-100 hover:to-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-bold text-gray-900">{category}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCategory(i)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded border border-red-200 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Add Technician Dialog */}
      <AddTechnicianDialog
        isOpen={isAddTechnicianOpen}
        onClose={() => setIsAddTechnicianOpen(false)}
        onSubmit={handleAddTechnicianSubmit}
      />

      {/* Add Sales Agent Dialog */}
      <AddSalesAgentDialog
        isOpen={isAddSalesAgentOpen}
        onClose={() => setIsAddSalesAgentOpen(false)}
        onSubmit={handleAddSalesAgentSubmit}
      />

      {/* Add Security Guard Dialog */}
      <AddSecurityGuardDialog
        isOpen={isAddSecurityOpen}
        onClose={() => setIsAddSecurityOpen(false)}
        onSubmit={handleAddSecurityGuardSubmit}
      />
    </div>
  );
}
