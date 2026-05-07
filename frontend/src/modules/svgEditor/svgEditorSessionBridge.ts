import type { DocumentState } from "./svgEditorDocument";

const SVG_EDITOR_PREFIX = "ai-hair:svg-editor:";
const CURRENT_SUFFIX = ":current";
const SNAPSHOT_SUFFIX = ":snapshot";

type EditorSessionPayload = {
  updatedAt: number;
  document: DocumentState;
};

function buildStorageKey(kind: string, draftKey: string, suffix: string) {
  return `${SVG_EDITOR_PREFIX}${kind}:${draftKey}${suffix}`;
}

function parseDocument(raw: string | null): DocumentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EditorSessionPayload>;
    return (parsed.document ?? null) as DocumentState | null;
  } catch {
    return null;
  }
}

function saveDocument(key: string, document: DocumentState) {
  const payload: EditorSessionPayload = {
    updatedAt: Date.now(),
    document,
  };
  window.sessionStorage.setItem(key, JSON.stringify(payload));
}

export function loadSvgEditorDocument(
  kind: string,
  draftKey: string,
): DocumentState | null {
  if (!kind || !draftKey) return null;
  return parseDocument(
    window.sessionStorage.getItem(
      buildStorageKey(kind, draftKey, CURRENT_SUFFIX),
    ),
  );
}

export function saveSvgEditorDocument(
  kind: string,
  draftKey: string,
  document: DocumentState,
) {
  if (!kind || !draftKey) return;
  saveDocument(buildStorageKey(kind, draftKey, CURRENT_SUFFIX), document);
}

export function clearSvgEditorDocument(kind: string, draftKey: string) {
  if (!kind || !draftKey) return;
  window.sessionStorage.removeItem(
    buildStorageKey(kind, draftKey, CURRENT_SUFFIX),
  );
}

export function loadSvgEditorDocumentSnapshot(
  kind: string,
  draftKey: string,
): DocumentState | null {
  if (!kind || !draftKey) return null;
  return parseDocument(
    window.sessionStorage.getItem(
      buildStorageKey(kind, draftKey, SNAPSHOT_SUFFIX),
    ),
  );
}

export function saveSvgEditorDocumentSnapshot(
  kind: string,
  draftKey: string,
  document: DocumentState,
) {
  if (!kind || !draftKey) return;
  saveDocument(buildStorageKey(kind, draftKey, SNAPSHOT_SUFFIX), document);
}

export function clearSvgEditorDocumentSnapshot(kind: string, draftKey: string) {
  if (!kind || !draftKey) return;
  window.sessionStorage.removeItem(
    buildStorageKey(kind, draftKey, SNAPSHOT_SUFFIX),
  );
}
