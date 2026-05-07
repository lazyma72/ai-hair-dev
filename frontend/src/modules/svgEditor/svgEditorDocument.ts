import type { DocumentState } from "../../../../../../personal_test/svg_editor/edit/exported-react-component/layers/data/types";
import { buildDocumentFromSvgImport } from "../../../../../../personal_test/svg_editor/edit/exported-react-component/rendering/fabric/fabricImportExport";

export type SvgDocumentValue = {
  json: string;
  svg: string;
};

export type { DocumentState };

export function parseDocumentJson(
  json: string | undefined,
): DocumentState | null {
  const raw = String(json ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DocumentState;
  } catch {
    return null;
  }
}

export function createBaseSvgDocument(params: {
  name: string;
  svg?: string;
  sourceName?: string | null;
  domain?: DocumentState["domain"];
}): DocumentState {
  const now = new Date().toISOString();
  return {
    meta: {
      documentId: crypto.randomUUID(),
      name: params.name,
      version: 1,
      createdAt: now,
      updatedAt: now,
      sourceFormat: params.svg?.trim() ? "svg" : "unknown",
      sourceName: params.sourceName ?? undefined,
    },
    canvas: {
      width: 960,
      height: 600,
      backgroundColor: "transparent",
    },
    scene: {
      nodes: {},
      order: [],
    },
    svg: params.svg ?? "",
    domain: params.domain ?? {
      车线: [],
      标注样式: {},
      自动修改器: [],
    },
  };
}

export async function buildDocumentFromSvgValue(
  base: DocumentState,
  value: SvgDocumentValue,
): Promise<DocumentState> {
  if (!value.svg?.trim()) return base;
  return buildDocumentFromSvgImport(base, value.svg);
}
