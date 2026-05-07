import React, { useEffect, useMemo, useRef, useState } from "react";
import "./src/App.css";
import "./EmbeddedHighNeedleEditor.css";
import { EditorProvider } from "./src/app/EditorContext";
import { EditorShell } from "./src/layers/view/EditorShell";
import { createEditor, type Editor } from "./src/kernel/createEditor";
import type { DocumentState, 高针图业务数据 } from "./src/layers/data/types";
import { buildDocumentFromSvgImport } from "./src/rendering/fabric/fabricImportExport";
import { applyDmlModifiers } from "./src/layers/businessCommands/markDmlAnnotations";
import type { 高针图 } from "../../shared/models/高针图";

type Props = {
  value: 高针图;
  onChange: (value: 高针图) => void;
  fileName?: string | null;
  heightClassName?: string;
  /** 传入 EditorShell 顶部工具栏右侧的自定义节点（如"退出放大"按钮） */
  headerRight?: React.ReactNode;
};

function createEditorDocumentName(fileName?: string | null) {
  return fileName?.trim() || "高针图";
}

function toEditorDomain(value: 高针图): 高针图业务数据 {
  return {
    车线: Array.isArray(value.车线) ? value.车线 : [],
    标注样式: value.标注样式 ?? {},
    自动修改器: value.自动修改器 ?? [],
  };
}

function createDocumentFromHighNeedle(
  value: 高针图,
  fileName?: string | null,
): DocumentState {
  const now = new Date().toISOString();
  return {
    meta: {
      documentId: crypto.randomUUID(),
      name: createEditorDocumentName(fileName),
      version: 1,
      createdAt: now,
      updatedAt: now,
      sourceFormat: value.svg?.trim() ? "svg" : "unknown",
      sourceName: fileName ?? undefined,
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
    svg: value.svg ?? "",
    domain: toEditorDomain(value),
  };
}

async function buildEditorDocumentFromHighNeedle(
  value: 高针图,
  fileName?: string | null,
): Promise<DocumentState> {
  const base = createDocumentFromHighNeedle(value, fileName);
  if (!value.svg?.trim()) return base;
  const imported = await buildDocumentFromSvgImport(base, value.svg);
  return {
    ...imported,
    meta: {
      ...imported.meta,
      name: createEditorDocumentName(fileName),
      sourceName: fileName ?? undefined,
    },
    domain: toEditorDomain(value),
  };
}

function toHighNeedleValue(document: DocumentState, svg: string): 高针图 {
  const persisted = applyDmlModifiers({
    ...document,
    meta: {
      ...document.meta,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    svg,
    车线: persisted.domain.车线.map((item) => ({
      id: item.id,
      编号: item.编号,
      区域: item.区域,
      车线编号: String((item as { 车线编号?: unknown }).车线编号 ?? ""),
      尺数: item.尺数,
      档位: item.档位,
      DML: item.DML,
      是双数: item.是双数,
      标注NodeId: {
        车线编号: item.标注NodeId.车线编号,
        档位: item.标注NodeId.档位,
        单双: item.标注NodeId.单双,
        DML: item.标注NodeId.DML,
      },
    })),
    标注样式: persisted.domain.标注样式,
    自动修改器: persisted.domain.自动修改器,
  };
}

export default function EmbeddedHighNeedleEditor({
  value,
  onChange,
  fileName,
  heightClassName = "h-[60vh] min-h-[520px]",
  headerRight,
}: Props) {
  const editorRef = useRef<Editor | null>(null);
  if (!editorRef.current) {
    editorRef.current = createEditor();
  }

  const [importError, setImportError] = useState("");
  const selfSyncedFingerprintRef = useRef<string>("");
  const sourceFingerprint = useMemo(() => JSON.stringify(value), [value]);

  useEffect(() => {
    if (sourceFingerprint === selfSyncedFingerprintRef.current) {
      selfSyncedFingerprintRef.current = "";
      return;
    }

    let cancelled = false;
    const editor = editorRef.current!;
    void buildEditorDocumentFromHighNeedle(value, fileName)
      .then((nextDoc) => {
        if (cancelled) return;
        editor.data.setState(nextDoc);
        setImportError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setImportError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [fileName, sourceFingerprint]);

  return (
    <div className={`embeddedEditorScope overflow-hidden bg-white ${heightClassName}`}>
      {importError ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          导入失败：{importError}
        </div>
      ) : null}

      <div className="h-full">
        <EditorProvider editor={editorRef.current}>
          <EditorShell
            headerRight={headerRight}
            onDocumentChange={({ document, svg }) => {
              const nextValue = toHighNeedleValue(document, svg);
              selfSyncedFingerprintRef.current = JSON.stringify(nextValue);
              onChange(nextValue);
            }}
          />
        </EditorProvider>
      </div>
    </div>
  );
}
