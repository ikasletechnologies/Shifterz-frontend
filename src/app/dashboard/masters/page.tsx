"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getMasters,
  createMaster,
  updateMaster,
  deleteMaster,
  seedMasters,
  MASTER_CATEGORIES,
  type MasterRecord,
  type MasterCategory,
} from "@/lib/api";
import {
  X,
  Search,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  ShieldCheck,
  Database,
  Layers,
  Check,
  Tag,
} from "lucide-react";

// ─── group categories into sections ───────────────────────────────────────────
const SECTIONS: Record<string, { key: MasterCategory; label: string }[]> = {};
for (const [key, meta] of Object.entries(MASTER_CATEGORIES)) {
  const section = meta.section;
  if (!SECTIONS[section]) SECTIONS[section] = [];
  SECTIONS[section].push({ key: key as MasterCategory, label: meta.label });
}

const SECTION_ORDER = [
  "Customer Masters",
  "Vehicle Masters",
  "Employee Masters",
  "Inventory Masters",
  "Finance Masters",
  "System Masters",
];

// ─── helper: does this category use a "value" field? ─────────────────────────
const VALUE_LABEL: Record<string, string> = {
  GST_RATE: "Tax Rate (%)",
  BUSINESS_HOURS: "Hours Config (JSON)",
  PAYMENT_MODE: "Code",
  NUMBER_SERIES: "Prefix / Format",
  NOTIFICATION_TEMPLATE: "Template Body",
};

export default function MastersPage() {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>("VEHICLE_BRAND");
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formStatus, setFormStatus] = useState("Active");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Seed state
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMasters({ category: activeCategory });
      setRecords(data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadRecords();
    setSearch("");
  }, [loadRecords]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormCode("");
    setFormValue("");
    setFormSortOrder(records.length);
    setFormStatus("Active");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (r: MasterRecord) => {
    setEditing(r);
    setFormName(r.name);
    setFormCode(r.code || "");
    setFormValue(r.value || "");
    setFormSortOrder(r.sortOrder);
    setFormStatus(r.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      if (editing) {
        await updateMaster(editing.id, {
          name: formName.trim(),
          code: formCode.trim() || undefined,
          value: formValue.trim() || undefined,
          sortOrder: formSortOrder,
          status: formStatus,
        });
      } else {
        await createMaster({
          category: activeCategory,
          name: formName.trim(),
          code: formCode.trim() || undefined,
          value: formValue.trim() || undefined,
          sortOrder: formSortOrder,
          status: formStatus,
        });
      }
      setIsFormOpen(false);
      loadRecords();
    } catch (err: any) {
      setFormError(err.message || "Save failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (r: MasterRecord) => {
    const next = r.status === "Active" ? "Inactive" : "Active";
    await updateMaster(r.id, { status: next });
    loadRecords();
  };

  const handleDelete = async (r: MasterRecord) => {
    if (!confirm(`Remove "${r.name}" from ${MASTER_CATEGORIES[activeCategory as MasterCategory]?.label}?`)) return;
    await deleteMaster(r.id);
    loadRecords();
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const result = await seedMasters();
      setSeedResult(`✅ Seeded successfully: ${result.created} created, ${result.skipped} already existed (${result.total} total defaults).`);
      loadRecords();
    } catch (err: any) {
      setSeedResult(`❌ Seed failed: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  const filtered = records.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.code || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.value || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeLabel = MASTER_CATEGORIES[activeCategory]?.label || activeCategory;
  const valueLabelForCategory = VALUE_LABEL[activeCategory];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left Category Nav Card ── */}
        <aside className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="px-2 pt-1 pb-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Master Catalogs
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              HQ Only
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {SECTION_ORDER.map((section) => {
              const cats = SECTIONS[section];
              if (!cats) return null;
              return (
                <div key={section} className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                    {section}
                  </p>
                  <div className="space-y-0.5">
                    {cats.map(({ key, label }) => {
                      const isActive = activeCategory === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveCategory(key)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                            isActive
                              ? "bg-yellow-50 text-yellow-900 border border-yellow-300 shadow-2xs font-bold"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 space-y-5 min-w-0 w-full">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {activeLabel}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    {records.length} {records.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage standard {activeLabel.toLowerCase()} used across all franchise branches. Changes apply system-wide.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleSeed}
                  disabled={seedLoading}
                  className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  title="Load recommended default values"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  {seedLoading ? "Seeding..." : "Seed Defaults"}
                </button>
                <button
                  onClick={openCreate}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add {activeLabel.replace(/s$/, "")}
                </button>
              </div>
            </div>

            {/* Seed result notification banner */}
            {seedResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                  seedResult.startsWith("✅")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <span>{seedResult}</span>
                <button
                  onClick={() => setSeedResult(null)}
                  className="text-gray-400 hover:text-gray-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeLabel.toLowerCase()} by name, code or value...`}
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl hidden sm:inline-block">
                Showing {filtered.length} of {records.length}
              </span>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-16 text-center text-gray-500 text-sm">
                Loading {activeLabel.toLowerCase()}...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-200 mx-auto flex items-center justify-center text-yellow-600">
                  <Tag className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-base">
                  {records.length === 0
                    ? `No ${activeLabel.toLowerCase()} configured yet`
                    : "No matching entries found"}
                </p>
                <p className="text-gray-500 text-xs max-w-sm mx-auto">
                  {records.length === 0
                    ? `Click "Seed Defaults" to prefill standard options, or click "Add ${activeLabel.replace(/s$/, "")}" to create one.`
                    : "Try adjusting your search keywords."}
                </p>
                {records.length === 0 && (
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={handleSeed}
                      disabled={seedLoading}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                    >
                      ⚡ Seed Defaults
                    </button>
                    <button
                      onClick={openCreate}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      + Add New
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Name</th>
                      {filtered.some((r) => r.code) && <th className="py-3.5 px-6">Code</th>}
                      {valueLabelForCategory && <th className="py-3.5 px-6">{valueLabelForCategory}</th>}
                      <th className="py-3.5 px-6">Sort Order</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-yellow-50/30 transition-colors group">
                        <td className="py-3.5 px-6 font-semibold text-gray-900">{r.name}</td>
                        {filtered.some((x) => x.code) && (
                          <td className="py-3.5 px-6">
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-xs border border-gray-200">
                              {r.code || "—"}
                            </span>
                          </td>
                        )}
                        {valueLabelForCategory && (
                          <td className="py-3.5 px-6 text-yellow-800 text-xs font-semibold max-w-xs truncate">
                            {r.value || "—"}
                          </td>
                        )}
                        <td className="py-3.5 px-6 text-gray-500 text-xs font-medium">{r.sortOrder}</td>
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => handleToggleStatus(r)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                              r.status === "Active"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                            }`}
                            title="Click to toggle status"
                          >
                            {r.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PRD notice */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="text-gray-800">HQ Authority Only</strong> — Changes to master records take effect system-wide across all franchises. Historical transactions retain their recorded values.
            </span>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Dialog ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editing ? `Edit ${activeLabel.replace(/s$/, "")}` : `Add ${activeLabel.replace(/s$/, "")}`}
                </h3>
                <span className="inline-block mt-0.5 text-xs font-semibold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                  Category: {activeLabel}
                </span>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={`e.g. ${
                    activeCategory === "VEHICLE_BRAND" ? "Maruti Suzuki" :
                    activeCategory === "FUEL_TYPE" ? "Electric (EV)" :
                    activeCategory === "DEPARTMENT" ? "Workshop" :
                    activeCategory === "GST_RATE" ? "18% GST" :
                    "Enter name"
                  }`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Code / Slug</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MSUZ"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    min={0}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
              </div>

              {valueLabelForCategory && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {valueLabelForCategory}
                  </label>
                  {activeCategory === "BUSINESS_HOURS" || activeCategory === "NOTIFICATION_TEMPLATE" ? (
                    <textarea
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      rows={3}
                      placeholder="Enter configuration value..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder={activeCategory === "GST_RATE" ? "e.g. 18" : "Additional value..."}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : editing ? "Save Changes" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
