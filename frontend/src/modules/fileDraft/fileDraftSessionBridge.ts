import type { FileDraftViewModel } from "../../shared/fileDraft/model";

const FILE_DRAFT_SESSION_PREFIX = "ai-hair:file-draft:";
const FILE_DRAFT_SNAPSHOT_SUFFIX = ":snapshot";

type FileDraftSessionPayload = {
  updatedAt: number;
  form: FileDraftViewModel;
};

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
    form,
  };
  window.sessionStorage.setItem(
    getStorageKey(draftKey),
    JSON.stringify(payload),
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
    return (parsed.form ?? null) as FileDraftViewModel | null;
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
    form,
  };
  window.sessionStorage.setItem(
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
    return (parsed.form ?? null) as FileDraftViewModel | null;
  } catch {
    return null;
  }
}

export function clearFileDraftSessionSnapshot(draftKey: string) {
  if (!draftKey) return;
  window.sessionStorage.removeItem(getSnapshotStorageKey(draftKey));
}
