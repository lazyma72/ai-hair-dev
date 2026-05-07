import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import { serializeDocument } from "../svgEditor/externalSvgEditor";
import { loadHandWovenEditorDocument } from "../svgEditor/handWovenEditorSessionBridge";
import { loadHighNeedleEditorDocument } from "../svgEditor/highNeedleEditorSessionBridge";

const FILE_DRAFT_SESSION_PREFIX = "ai-hair:file-draft:";
const FILE_DRAFT_SNAPSHOT_SUFFIX = ":snapshot";

type FileDraftSessionPayload = {
  updatedAt: number;
  form: FileDraftViewModel;
};

function stripHeavySvgEditorFields(
  form: FileDraftViewModel,
): FileDraftViewModel {
  return form;
}

function hydrateSvgEditorJson(
  draftKey: string,
  form: FileDraftViewModel | null,
): FileDraftViewModel | null {
  if (!draftKey || !form) return form;

  const handWovenDocument = loadHandWovenEditorDocument(draftKey);
  const highNeedleDocument = loadHighNeedleEditorDocument(draftKey);

  return {
    ...form,
    手织指示单: {
      ...form.手织指示单,
      手织图: {
        ...form.手织指示单.手织图,
        json:
          handWovenDocument != null
            ? serializeDocument(handWovenDocument)
            : form.手织指示单.手织图.json,
      },
    },
    高针指示单: {
      ...form.高针指示单,
      高针图: {
        ...form.高针指示单.高针图,
        json:
          highNeedleDocument != null
            ? serializeDocument(highNeedleDocument)
            : form.高针指示单.高针图.json,
      },
    },
  };
}

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

function getSnapshotStorageKey(draftKey: string) {
  return `${getStorageKey(draftKey)}${FILE_DRAFT_SNAPSHOT_SUFFIX}`;
}

export function createFileDraftSessionKey() {
  return `draft_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function saveFileDraftSession(
  draftKey: string,
  form: FileDraftViewModel,
) {
  if (!draftKey) return;
  const payload: FileDraftSessionPayload = {
    updatedAt: Date.now(),
    form: stripHeavySvgEditorFields(form),
  };
  safeSetSessionStorage(
    getStorageKey(draftKey),
    JSON.stringify(payload),
    getSnapshotStorageKey(draftKey),
  );
}

export function loadFileDraftSession(
  draftKey: string,
): FileDraftViewModel | null {
  if (!draftKey) return null;
  const raw = window.sessionStorage.getItem(getStorageKey(draftKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FileDraftSessionPayload>;
    return hydrateSvgEditorJson(
      draftKey,
      (parsed.form ?? null) as FileDraftViewModel | null,
    );
  } catch {
    return null;
  }
}

export function clearFileDraftSession(draftKey: string) {
  if (!draftKey) return;
  window.sessionStorage.removeItem(getStorageKey(draftKey));
}

export function saveFileDraftSessionSnapshot(
  draftKey: string,
  form: FileDraftViewModel,
) {
  if (!draftKey) return;
  const payload: FileDraftSessionPayload = {
    updatedAt: Date.now(),
    form: stripHeavySvgEditorFields(form),
  };
  safeSetSessionStorage(
    getSnapshotStorageKey(draftKey),
    JSON.stringify(payload),
  );
}

export function loadFileDraftSessionSnapshot(
  draftKey: string,
): FileDraftViewModel | null {
  if (!draftKey) return null;
  const raw = window.sessionStorage.getItem(getSnapshotStorageKey(draftKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FileDraftSessionPayload>;
    return hydrateSvgEditorJson(
      draftKey,
      (parsed.form ?? null) as FileDraftViewModel | null,
    );
  } catch {
    return null;
  }
}

export function clearFileDraftSessionSnapshot(draftKey: string) {
  if (!draftKey) return;
  window.sessionStorage.removeItem(getSnapshotStorageKey(draftKey));
}
