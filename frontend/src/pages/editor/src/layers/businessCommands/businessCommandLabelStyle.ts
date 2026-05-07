import type { DocumentState, EditorNode } from "../data/types";

export type BusinessCommandAnnotationField =
  | "车线编号"
  | "档位"
  | "单双"
  | "DML";

export const DEFAULT_BUSINESS_COMMAND_LABEL_FONT_SIZE = 18;
// Allow smaller labels for dense drawings; UI inputs and clamping use this value.
export const MIN_BUSINESS_COMMAND_LABEL_FONT_SIZE = 4;
export const MAX_BUSINESS_COMMAND_LABEL_FONT_SIZE = 72;
export const DEFAULT_CARLINE_LABEL_COLOR = "#eab308";
export const DEFAULT_GEAR_LABEL_COLOR = "#ef4444";
export const DEFAULT_ODD_EVEN_LABEL_COLOR = "#2563eb";

const MIN_LABEL_WIDTH = 28;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readNodeFontSize(node?: EditorNode) {
  const fontSize = node?.fabricObject.fontSize;
  return isFiniteNumber(fontSize)
    ? clampBusinessCommandLabelFontSize(fontSize)
    : null;
}

function resolveOriginFactor(origin: string | undefined) {
  if (origin === "center") return 0.5;
  if (origin === "right" || origin === "bottom") return 1;
  return 0;
}

export function clampBusinessCommandLabelFontSize(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_BUSINESS_COMMAND_LABEL_FONT_SIZE;
  }
  return Math.min(
    MAX_BUSINESS_COMMAND_LABEL_FONT_SIZE,
    Math.max(MIN_BUSINESS_COMMAND_LABEL_FONT_SIZE, Math.round(value)),
  );
}

export function resolveBusinessCommandLabelFontSize(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
) {
  const configuredFontSize = document.domain.标注样式[field]?.字号;
  return isFiniteNumber(configuredFontSize)
    ? clampBusinessCommandLabelFontSize(configuredFontSize)
    : DEFAULT_BUSINESS_COMMAND_LABEL_FONT_SIZE;
}

export function getDefaultBusinessCommandLabelColor(
  field: BusinessCommandAnnotationField,
) {
  if (field === "车线编号") return DEFAULT_CARLINE_LABEL_COLOR;
  if (field === "档位") return DEFAULT_GEAR_LABEL_COLOR;
  if (field === "单双") return DEFAULT_ODD_EVEN_LABEL_COLOR;
  return "#111111";
}

export function resolveBusinessCommandLabelColor(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
) {
  const configuredColor = document.domain.标注样式[field]?.字色;
  return isNonEmptyString(configuredColor)
    ? configuredColor
    : getDefaultBusinessCommandLabelColor(field);
}

export function resolveFirstAnnotationLabelColor(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
) {
  for (const id of document.scene.order) {
    const node = document.scene.nodes[id];
    if (!node || node.business.type !== "标注") continue;
    if (node.business.字段 !== field) continue;
    const color = node.fabricObject.fill;
    if (isNonEmptyString(color)) return color;
  }
  return null;
}

export function resolveCarlineAnnotationLabelColor(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
  carlineNodeId: string,
) {
  for (const id of document.scene.order) {
    const node = document.scene.nodes[id];
    if (!node || node.business.type !== "标注") continue;
    if (node.business.字段 !== field) continue;
    if (node.business.归属车线Id !== carlineNodeId) continue;
    const color = node.fabricObject.fill;
    if (isNonEmptyString(color)) return color;
  }
  return null;
}

export function resolveFirstAnnotationFontSize(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
) {
  for (const id of document.scene.order) {
    const node = document.scene.nodes[id];
    if (!node || node.business.type !== "标注") continue;
    if (node.business.字段 !== field) continue;
    const fontSize = readNodeFontSize(node);
    if (fontSize !== null) return fontSize;
  }
  return null;
}

export function resolveCarlineAnnotationFontSize(
  document: DocumentState,
  field: BusinessCommandAnnotationField,
  carlineNodeId: string,
) {
  for (const id of document.scene.order) {
    const node = document.scene.nodes[id];
    if (!node || node.business.type !== "标注") continue;
    if (node.business.字段 !== field) continue;
    if (node.business.归属车线Id !== carlineNodeId) continue;
    const fontSize = readNodeFontSize(node);
    if (fontSize !== null) return fontSize;
  }
  return null;
}

export function buildBusinessCommandLabelLayout(
  text: string,
  position: { x: number; y: number },
  fontSize: number,
) {
  const normalizedFontSize = clampBusinessCommandLabelFontSize(fontSize);
  const textLength = Math.max(text.length, 1);
  const width = Math.max(
    MIN_LABEL_WIDTH,
    normalizedFontSize * (textLength + 1),
  );
  const height = normalizedFontSize * 1.1;

  return {
    left: position.x - width / 2,
    top: position.y - height / 2,
    width,
    fontSize: normalizedFontSize,
    textAlign: "center" as const,
    originX: "left" as const,
    originY: "top" as const,
  };
}

export function resolveBusinessCommandAnnotationAnchor(node: EditorNode) {
  const width = isFiniteNumber(node.fabricObject.width)
    ? node.fabricObject.width
    : MIN_LABEL_WIDTH;
  const fontSize =
    readNodeFontSize(node) ?? DEFAULT_BUSINESS_COMMAND_LABEL_FONT_SIZE;
  const height = fontSize * 1.1;
  const left = isFiniteNumber(node.fabricObject.left)
    ? node.fabricObject.left
    : 0;
  const top = isFiniteNumber(node.fabricObject.top) ? node.fabricObject.top : 0;
  const originX =
    typeof node.fabricObject.originX === "string"
      ? node.fabricObject.originX
      : "left";
  const originY =
    typeof node.fabricObject.originY === "string"
      ? node.fabricObject.originY
      : "top";

  return {
    x: left + width * (0.5 - resolveOriginFactor(originX)),
    y: top + height * (0.5 - resolveOriginFactor(originY)),
  };
}
