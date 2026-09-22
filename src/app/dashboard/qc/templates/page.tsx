"use client";

import { useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, UploadCloud, ShieldCheck, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { useQCTemplates } from "@/modules/qc/hooks/useQCTemplates";
import { QCTemplateDraftDialog } from "@/modules/qc/components/QCTemplateDraftDialog";
import { QCTemplatePublishDialog } from "@/modules/qc/components/QCTemplatePublishDialog";
import { QCTemplateVersionHistory, TemplateStatusBadge } from "@/modules/qc/components/QCTemplateVersionHistory";
import { getCurrentUser } from "@/lib/franchise-scope";
import { TemplateVersionItemInput } from "@/modules/qc/types/qc-template-version.types";

// Part 36 — the template-MANAGEMENT surface (as opposed to actually using
// the effective checklist during an inspection, which QUALITY_INSPECTOR
// already does on /dashboard/qc) is restricted to the roles D-18/D-22
// actually grant qc:templates:manage/:publish to. This is a client-side UX
// gate only — the backend's own scope/action checks remain authoritative
// regardless of what this page shows.
const TEMPLATE_MANAGEMENT_ROLES = ["SUPER_ADMIN", "HQ_USER", "FRANCHISE_ADMIN"];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function QCTemplatesPage() {
  const {
    hqPublished, isLoading, error, isMutating,
    isHqUser, canManage, canPublish,
    draft, published, historical,
    fetchAll, createDraft, updateDraft, discardDraft, publish,
  } = useQCTemplates();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const sessionUser = getCurrentUser();
  const roleAllowed = !!sessionUser?.role && TEMPLATE_MANAGEMENT_ROLES.includes(sessionUser.role.toUpperCase());

  if (!roleAllowed) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-2">
          <Lock className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Access restricted</p>
          <p className="text-xs text-gray-400">QC checklist template management is only available to HQ and franchise administrators.</p>
        </div>
      </div>
    );
  }

  const scopeLabel = isHqUser ? "HQ Standard" : "Your Franchise Additions";

  const openCreateDraft = () => { setEditorMode("create"); setEditorOpen(true); };
  const openEditDraft = () => { setEditorMode("edit"); setEditorOpen(true); };

  const handleDraftSave = async (items: TemplateVersionItemInput[]) => {
    if (editorMode === "create") return createDraft(items);
    return updateDraft(draft!.id, items);
  };

  const handleDiscard = async () => {
    if (!draft) return;
    if (!window.confirm(`Permanently discard Draft Version ${draft.versionNumber}? This cannot be undone.`)) return;
    await discardDraft(draft.id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">


      {isLoading && (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">Loading QC checklist templates...</div>
      )}

      {!isLoading && error && (
        <div className="py-10 text-center bg-white rounded-2xl border border-red-100 space-y-2">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchAll} className="text-xs font-semibold text-blue-600 hover:underline">Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Current Published */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-bold text-gray-800">Current Published ({scopeLabel})</h2>
            </div>
            {published ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <Field label="Version"><TemplateStatusBadge status={published.status} /> #{published.versionNumber}</Field>
                <Field label="Scope">{isHqUser ? "Global (HQ)" : "Franchise"}</Field>
                <Field label="Published By">{published.publishedById || "—"}</Field>
                <Field label="Published At">{formatDate(published.publishedAt)}</Field>
                <Field label="Item Count">{published.items.length}</Field>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No Published version yet in this scope.</p>
            )}
          </section>

          {/* HQ Standard read-only reference — franchise users only */}
          {!isHqUser && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-800">HQ Standard (read-only)</h2>
              </div>
              {hqPublished ? (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Version {hqPublished.versionNumber} · {hqPublished.items.length} item(s) · Published {formatDate(hqPublished.publishedAt)}</p>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 mt-2">
                    {hqPublished.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-1.5">
                        <span className="flex-1 text-gray-600">{item.label}</span>
                        <span className="text-gray-400">{item.category}</span>
                        {item.mandatory && <span className="text-[10px] font-bold text-red-400">MANDATORY</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">HQ has not published a standard checklist yet.</p>
              )}
            </section>
          )}

          {/* Draft */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Draft</h2>
              {!draft && canManage && (
                <button onClick={openCreateDraft} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create Draft
                </button>
              )}
            </div>
            {draft ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <Field label="Draft Version"><TemplateStatusBadge status={draft.status} /> #{draft.versionNumber}</Field>
                  <Field label="Last Updated">{formatDate(draft.createdAt)}</Field>
                  <Field label="Item Count">{draft.items.length}</Field>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {canManage && (
                    <button onClick={openEditDraft} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit Draft
                    </button>
                  )}
                  {canManage && (
                    <button onClick={handleDiscard} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Discard Draft
                    </button>
                  )}
                  {canPublish ? (
                    <button onClick={() => setPublishDialogOpen(true)} className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5" /> Publish
                    </button>
                  ) : canManage ? (
                    <span className="px-3 py-1.5 text-xs text-gray-400 italic flex items-center">Publishing requires additional permission</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No Draft in progress.</p>
            )}
          </section>

          {/* History */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-800">Version History</h2>
            <QCTemplateVersionHistory versions={[...(published ? [published] : []), ...historical]} />
          </section>
        </>
      )}

      <QCTemplateDraftDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        mode={editorMode}
        scopeLabel={scopeLabel}
        initialItems={editorMode === "edit" && draft ? draft.items : []}
        hqStandardItems={!isHqUser ? hqPublished?.items || [] : null}
        isSaving={isMutating}
        onSave={handleDraftSave}
      />
      <QCTemplatePublishDialog
        isOpen={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        draft={draft}
        currentPublished={published}
        isPublishing={isMutating}
        onConfirm={() => publish(draft!.id)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-gray-700 font-semibold flex items-center gap-1.5">{children}</p>
    </div>
  );
}
