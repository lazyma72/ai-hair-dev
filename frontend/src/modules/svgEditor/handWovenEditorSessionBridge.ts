import type { DocumentState } from "./svgEditorDocument";
import {
  clearSvgEditorDocument,
  clearSvgEditorDocumentSnapshot,
  loadSvgEditorDocument,
  loadSvgEditorDocumentSnapshot,
  saveSvgEditorDocument,
  saveSvgEditorDocumentSnapshot,
} from "./svgEditorSessionBridge";

const HAND_WOVEN_EDITOR_KIND = "hand-woven";

export function loadHandWovenEditorDocument(
  draftKey: string,
): DocumentState | null {
  return loadSvgEditorDocument(HAND_WOVEN_EDITOR_KIND, draftKey);
}

export function saveHandWovenEditorDocument(
  draftKey: string,
  document: DocumentState,
) {
  saveSvgEditorDocument(HAND_WOVEN_EDITOR_KIND, draftKey, document);
}

export function clearHandWovenEditorDocument(draftKey: string) {
  clearSvgEditorDocument(HAND_WOVEN_EDITOR_KIND, draftKey);
}

export function loadHandWovenEditorDocumentSnapshot(
  draftKey: string,
): DocumentState | null {
  return loadSvgEditorDocumentSnapshot(HAND_WOVEN_EDITOR_KIND, draftKey);
}

export function saveHandWovenEditorDocumentSnapshot(
  draftKey: string,
  document: DocumentState,
) {
  saveSvgEditorDocumentSnapshot(HAND_WOVEN_EDITOR_KIND, draftKey, document);
}

export function clearHandWovenEditorDocumentSnapshot(draftKey: string) {
  clearSvgEditorDocumentSnapshot(HAND_WOVEN_EDITOR_KIND, draftKey);
}
