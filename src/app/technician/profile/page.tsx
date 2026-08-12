"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useEffect, useState } from "react";
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Shield, Building2 } from "lucide-react";
import { getFranchises } from "@/lib/api";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  franchiseId?: string | null;
  franchiseName?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    username: "",
    role: "",
    franchiseId: null,
    franchiseName: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [pwError, setPwError]                 = useState("");

  useEffect(() => {
    async function loadProfile() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          const extractStringName = (val: any): string => {
            if (!val) return "";
            if (typeof val === "string") return val;
            if (typeof val === "object" && val.name) return String(val.name);
            return "";
          };

          let franName = extractStringName(u.franchiseName) || extractStringName(u.branch) || extractStringName(u.franchise);
          if (!franName && u.franchiseId) {
            try {
              const franchises = await getFranchises();
              const found = franchises.find((f: any) => f.id === u.franchiseId);
              if (found) franName = found.name;
            } catch {}
          }
          setProfile({
            id:       u.id,
            name:     u.name     || "",
            email:    u.email    || "",
            phone:    u.phone    || "",
            username: u.username || "",
            role:     u.role     || "",
            franchiseId: u.franchiseId || null,
            franchiseName: franName || (u.franchiseId ? "Assigned Branch" : "Headquarters"),
          });
        } catch {}
      }
    }
    loadProfile();
  }, []);

  const roleLabel = (r: string) =>
    r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");

    if (newPassword && newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        localStorage.setItem("user", JSON.stringify({ ...u, name: profile.name, email: profile.email, phone: profile.phone }));
      } catch {}
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-yellow-100">
          <User className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your account details and password.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Avatar & role card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5">
          <div
            style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-gray-900 shrink-0"
          >
            {initials || <User className="w-9 h-9 text-gray-700" />}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.name || profile.username}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                <Shield className="w-3 h-3" />
                {roleLabel(profile.role)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <Building2 className="w-3 h-3 text-blue-500" />
                {profile.franchiseName || "Headquarters"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Personal info ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                />
              </div>
            </div>

            {/* Assigned Franchise */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assigned Franchise</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  value={profile.franchiseName || "Headquarters"}
                  readOnly
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={profile.username}
                  readOnly
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
              <PhoneInput
                name="phone"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="XXXXX XXXXX"
              />
            </div>
          </div>
        </div>

        {/* ── Change password ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Change Password</h2>
          <p className="text-xs text-gray-400 mb-5">Leave blank to keep your current password.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { label: "New Password",     value: newPassword,     setter: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v) },
              { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(({ label, value, setter, show, toggle }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pwError && (
            <p className="mt-3 text-sm text-red-500 font-medium">{pwError}</p>
          )}
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-gray-900 font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
