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
import { X } from "lucide-react";

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
    if (!formName.trim()) { setFormError("Name is required."); return; }
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
    <div className="flex h-full gap-6">
      {/* ── Left Nav ── */}
      <aside className="w-56 shrink-0 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight mb-1">Masters</h2>
          <p className="text-xs text-slate-400">HQ-only configuration</p>
        </div>

        <div className="space-y-4">
          {SECTION_ORDER.map((section) => {
            const cats = SECTIONS[section];
            if (!cats) return null;
            return (
              <div key={section}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">
                  {section}
                </p>
                <div className="space-y-0.5">
                  {cats.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeCategory === key
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-sm shadow-amber-500/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {activeLabel}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage {activeLabel.toLowerCase()} used across all franchises. Changes apply system-wide.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              {seedLoading ? "Seeding..." : "⚡ Seed Defaults"}
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              + Add {activeLabel.replace(/s$/, "")}
            </button>
          </div>
        </div>

        {/* Seed result banner */}
        {seedResult && (
          <div className={`p-3 rounded-xl text-xs border ${
            seedResult.startsWith("✅")
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {seedResult}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeLabel.toLowerCase()}...`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {filtered.length} / {records.length} entries
          </span>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading {activeLabel.toLowerCase()}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-2xl">
                📋
              </div>
              <p className="text-white font-medium text-sm">
                {records.length === 0 ? `No ${activeLabel.toLowerCase()} configured yet` : "No results match your search"}
              </p>
              <p className="text-slate-400 text-xs">
                {records.length === 0
                  ? `Click "⚡ Seed Defaults" to load standard defaults, or "Add" to create a new entry.`
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Name</th>
                    {filtered.some((r) => r.code) && <th className="py-3.5 px-5">Code</th>}
                    {valueLabelForCategory && <th className="py-3.5 px-5">{valueLabelForCategory}</th>}
                    <th className="py-3.5 px-5">Sort</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/25 transition-colors group">
                      <td className="py-3.5 px-5 font-medium text-white">{r.name}</td>
                      {filtered.some((x) => x.code) && (
                        <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">{r.code || "—"}</td>
                      )}
                      {valueLabelForCategory && (
                        <td className="py-3.5 px-5 text-amber-400 text-xs font-medium max-w-xs truncate">
                          {r.value || "—"}
                        </td>
                      )}
                      <td className="py-3.5 px-5 text-slate-400 text-xs">{r.sortOrder}</td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => handleToggleStatus(r)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            r.status === "Active"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-700/50"
                          }`}
                        >
                          {r.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(r)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/20 transition-colors"
                          >
                            Remove
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
        <p className="text-[11px] text-slate-500 px-1">
          ⚠️ <strong className="text-slate-400">HQ Authority Only</strong> — Changes apply across all franchises. Historical transactions retain their values at time of recording and are not affected by master data updates.
        </p>
      </div>

      {/* ── Add / Edit Dialog ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {editing ? `Edit ${activeLabel.replace(/s$/, "")}` : `Add ${activeLabel.replace(/s$/, "")}`}
                </h3>
                <p className="text-xs text-amber-400 font-medium">Category: {activeLabel}</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name *</label>
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Code / Slug (Optional)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MSUZ"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    min={0}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {valueLabelForCategory && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {valueLabelForCategory}
                  </label>
                  {activeCategory === "BUSINESS_HOURS" || activeCategory === "NOTIFICATION_TEMPLATE" ? (
                    <textarea
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      rows={3}
                      placeholder="Enter configuration value..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder={activeCategory === "GST_RATE" ? "e.g. 18" : "Additional value..."}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
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
