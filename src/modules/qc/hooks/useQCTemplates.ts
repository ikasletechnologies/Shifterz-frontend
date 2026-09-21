import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  listTemplateVersions,
  getHqPublishedVersion,
  createTemplateVersion,
  updateTemplateVersion,
  discardTemplateVersion,
  publishTemplateVersion,
} from "../services/qc-template-version.service";
import { TemplateVersion, TemplateVersionItemInput } from "../types/qc-template-version.types";
import { fetchCurrentUserActions, hasAction, ResolvedActionUser } from "@/lib/actionPermissions";

// Same HQ role check the backend's QcTemplateVersionService.resolveOwnScope
// uses (SUPER_ADMIN/HQ_USER) — kept identical rather than inferring it from
// franchiseId, since that's the actual rule the backend enforces.
const HQ_ROLES = ["SUPER_ADMIN", "HQ_USER"];

export function useQCTemplates() {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [hqPublished, setHqPublished] = useState<TemplateVersion | null>(null);
  const [currentUser, setCurrentUser] = useState<ResolvedActionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [v, hq, user] = await Promise.all([
        listTemplateVersions(),
        getHqPublishedVersion().catch(() => null),
        fetchCurrentUserActions().catch(() => null),
      ]);
      setVersions(v || []);
      setHqPublished(hq);
      setCurrentUser(user);
      setError(null);
    } catch (err: any) {
      setError("Failed to load QC checklist template data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isHqUser = !!currentUser && HQ_ROLES.includes((currentUser.role || "").toUpperCase());
  const canManage = hasAction(currentUser?.actions, "qc:templates:manage");
  const canPublish = hasAction(currentUser?.actions, "qc:templates:publish");

  // `versions` is always the caller's OWN scope (HQ's own versions for an
  // HQ user, the franchise's own versions for a franchise user) — the
  // backend's GET /qc/template-versions never returns another scope's data.
  const draft = useMemo(() => versions.find((v) => v.status === "Draft") || null, [versions]);
  const published = useMemo(() => versions.find((v) => v.status === "Published") || null, [versions]);
  const historical = useMemo(
    () => versions.filter((v) => v.status === "Superseded").sort((a, b) => b.versionNumber - a.versionNumber),
    [versions]
  );

  const createDraft = async (items: TemplateVersionItemInput[]) => {
    setIsMutating(true);
    try {
      await createTemplateVersion(items);
      toast.success("Draft created");
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Failed to create Draft: " + err.message);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const updateDraft = async (id: string, items: TemplateVersionItemInput[]) => {
    setIsMutating(true);
    try {
      await updateTemplateVersion(id, items);
      toast.success("Draft saved");
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Failed to save Draft: " + err.message);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const discardDraft = async (id: string) => {
    setIsMutating(true);
    try {
      await discardTemplateVersion(id);
      toast.success("Draft discarded");
      await fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Failed to discard Draft: " + err.message);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  // Part 21 — a publish conflict (someone else published/changed the scope
  // concurrently) must never be silently overwritten: refresh state and
  // tell the user plainly, rather than retrying or pretending it worked.
  // The backend has no dedicated 409 for this today (confirmed by reading
  // qc-template-version.service.ts — it's a ValidationError, HTTP 400,
  // distinguished only by message text), so status-code branching alone
  // isn't reliable here; message-pattern matching is the honest option
  // given the actual current contract.
  const publish = async (id: string) => {
    setIsMutating(true);
    try {
      const result = await publishTemplateVersion(id);
      toast.success(`Version ${result.versionNumber} published`);
      await fetchAll();
      return true;
    } catch (err: any) {
      const isConflict =
        err.status === 409 ||
        /concurrently|already exists|already "|cannot be published again/i.test(err.message || "");
      if (isConflict) {
        toast.error("This template changed since you loaded it. Refreshing the current state — please review and try again.");
        await fetchAll();
      } else {
        toast.error("Failed to publish: " + err.message);
      }
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    versions,
    hqPublished,
    currentUser,
    isLoading,
    error,
    isMutating,
    isHqUser,
    canManage,
    canPublish,
    draft,
    published,
    historical,
    fetchAll,
    createDraft,
    updateDraft,
    discardDraft,
    publish,
  };
}
