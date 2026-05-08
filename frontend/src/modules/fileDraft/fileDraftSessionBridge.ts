import type { FileDraftViewModel } from "../../shared/fileDraft/model";

const FILE_DRAFT_SESSION_PREFIX = "ai-hair:file-draft:";

type FileDraftSessionPayload = {
  updatedAt: number;
  form: FileDraftViewModel;
};

function isQuotaExceededError(error: unknown) {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

function safeSetSessionStorage(
  key: string,
  value: string,
  fallbackCleanupKey?: string,
) {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
    if (fallbackCleanupKey) {
      window.sessionStorage.removeItem(fallbackCleanupKey);
      try {
        window.sessionStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        if (!isQuotaExceededError(retryError)) throw retryError;
      }
    }
    console.warn("sessionStorage quota exceeded, skip saving draft session", {
      key,
    });
    return false;
  }
}

function getStorageKey(draftKey: string) {
  return `${FILE_DRAFT_SESSION_PREFIX}${draftKey}`;
}

function getDraftKeyFromFileDraftStorageKey(key: string): string | null {
  const match = key.match(/^ai-hair:file-draft:(.+?)$/);
  return match?.[1] ?? null;
}

function clearFileDraftSessionsExcept(draftKey: string) {
  if (!draftKey) return;
  const keysToRemove: string[] = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (!key?.startsWith(FILE_DRAFT_SESSION_PREFIX)) continue;

    const storedDraftKey = getDraftKeyFromFileDraftStorageKey(key);
    if (storedDraftKey && storedDraftKey !== draftKey) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.sessionStorage.removeItem(key);
  }
}

export function saveFileDraftSession(
  draftKey: string,
  form: FileDraftViewModel,
) {
  if (!draftKey) return;
  clearFileDraftSessionsExcept(draftKey);
  const payload: FileDraftSessionPayload = {
    updatedAt: Date.now(),
    form,
  };
  safeSetSessionStorage(getStorageKey(draftKey), JSON.stringify(payload));
}

export function loadFileDraftSession(
  draftKey: string,
): FileDraftViewModel | null {
  if (!draftKey) return null;
  const raw = window.sessionStorage.getItem(getStorageKey(draftKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FileDraftSessionPayload>;
    return (parsed.form ?? null) as FileDraftViewModel | null;
  } catch {
    return null;
  }
}

export function clearFileDraftSession(draftKey: string) {
  if (!draftKey) return;
  window.sessionStorage.removeItem(getStorageKey(draftKey));
}
