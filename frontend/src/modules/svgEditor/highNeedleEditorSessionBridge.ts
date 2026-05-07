import type { DocumentState } from "./svgEditorDocument";
import {
  clearSvgEditorDocument,
  clearSvgEditorDocumentSnapshot,
  loadSvgEditorDocument,
  loadSvgEditorDocumentSnapshot,
  saveSvgEditorDocument,
  saveSvgEditorDocumentSnapshot,
} from "./svgEditorSessionBridge";

const HIGH_NEEDLE_EDITOR_KIND = "high-needle";

export function loadHighNeedleEditorDocument(
  draftKey: string,
): DocumentState | null {
  return loadSvgEditorDocument(HIGH_NEEDLE_EDITOR_KIND, draftKey);
}

export function saveHighNeedleEditorDocument(
  draftKey: string,
  document: DocumentState,
) {
  saveSvgEditorDocument(HIGH_NEEDLE_EDITOR_KIND, draftKey, document);
}

export function clearHighNeedleEditorDocument(draftKey: string) {
  clearSvgEditorDocument(HIGH_NEEDLE_EDITOR_KIND, draftKey);
}

export function loadHighNeedleEditorDocumentSnapshot(
  draftKey: string,
): DocumentState | null {
  return loadSvgEditorDocumentSnapshot(HIGH_NEEDLE_EDITOR_KIND, draftKey);
}

export function saveHighNeedleEditorDocumentSnapshot(
  draftKey: string,
  document: DocumentState,
) {
  saveSvgEditorDocumentSnapshot(HIGH_NEEDLE_EDITOR_KIND, draftKey, document);
}

export function clearHighNeedleEditorDocumentSnapshot(draftKey: string) {
  clearSvgEditorDocumentSnapshot(HIGH_NEEDLE_EDITOR_KIND, draftKey);
}
