import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusView from "../../components/StatusView";
import {
  clearFileDraftSession,
  clearFileDraftSessionSnapshot,
  loadFileDraftSession,
  loadFileDraftSessionSnapshot,
  saveFileDraftSession,
} from "../fileDraft/fileDraftSessionBridge";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import type { DocumentState, SvgDocumentValue } from "./svgEditorDocument";
import type { SvgEditorCanvasHandle } from "./SvgEditorCanvas";

type CanvasProps<TValue extends SvgDocumentValue> = {
  ref?: React.ForwardedRef<SvgEditorCanvasHandle<TValue>>;
  value: TValue;
  initialDocument?: DocumentState | null;
  fileName?: string | null;
  heightClassName?: string;
  onDocumentStateChange?: (document: DocumentState) => void;
};

type Props<TValue extends SvgDocumentValue> = {
  title: string;
  missingDraftError: string;
  Canvas: React.ComponentType<CanvasProps<TValue>>;
  getValue: (draft: FileDraftViewModel) => TValue;
  setValue: (draft: FileDraftViewModel, value: TValue) => FileDraftViewModel;
  loadEditorDocument: (draftKey: string) => DocumentState | null;
  saveEditorDocument: (draftKey: string, document: DocumentState) => void;
  clearEditorDocument: (draftKey: string) => void;
  loadEditorDocumentSnapshot: (draftKey: string) => DocumentState | null;
  clearEditorDocumentSnapshot: (draftKey: string) => void;
};

export default function DraftSvgEditorPage<TValue extends SvgDocumentValue>({
  title,
  missingDraftError,
  Canvas,
  getValue,
  setValue,
  loadEditorDocument,
  saveEditorDocument,
  clearEditorDocument,
  loadEditorDocumentSnapshot,
  clearEditorDocumentSnapshot,
}: Props<TValue>) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftKey = searchParams.get("draftKey")?.trim() ?? "";
  const returnTo = searchParams.get("returnTo")?.trim() ?? "";
  const [draft, setDraft] = useState<FileDraftViewModel | null>(null);
  const [initialDocument, setInitialDocument] = useState<DocumentState | null>(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SvgEditorCanvasHandle<TValue> | null>(null);
  const dragStateRef = useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    setDraft(draftKey ? loadFileDraftSession(draftKey) : null);
    setInitialDocument(draftKey ? loadEditorDocument(draftKey) : null);
  }, [draftKey, loadEditorDocument]);

  useEffect(() => {
    setPanelPosition({
      x: Math.max(16, window.innerWidth - 212),
      y: 16,
    });
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current.dragging) return;
      const nextX = event.clientX - dragStateRef.current.offsetX;
      const nextY = event.clientY - dragStateRef.current.offsetY;
      setPanelPosition({
        x: Math.min(Math.max(8, nextX), Math.max(8, window.innerWidth - 196)),
        y: Math.min(Math.max(8, nextY), Math.max(8, window.innerHeight - 72)),
      });
    };

    const stopDragging = () => {
      dragStateRef.current.dragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  const canEdit = Boolean(draftKey && draft);

  function goBackToEditor() {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate(-1);
  }

  return (
    <div className="relative h-screen overflow-hidden bg-slate-100">
      <StatusView
        loading={false}
        error={
          draftKey
            ? canEdit
              ? ""
              : missingDraftError
            : "缺少 draftKey，无法读取当前稿件草稿。"
        }
      >
        {draft ? (
          <div className="relative h-screen">
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: `${panelPosition.x}px`,
                top: `${panelPosition.y}px`,
              }}
            >
              <div className="pointer-events-auto rounded-2xl border border-slate-200/80 bg-white/92 shadow-sm backdrop-blur">
                <div
                  className="cursor-move rounded-t-2xl border-b border-slate-200/80 px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400"
                  onMouseDown={(event) => {
                    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
                    if (!rect) return;
                    dragStateRef.current = {
                      dragging: true,
                      offsetX: event.clientX - rect.left,
                      offsetY: event.clientY - rect.top,
                    };
                  }}
                >
                  {title}
                </div>
                <div className="flex items-center gap-1 p-1">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      if (!window.confirm(`确认放弃本次${title}编辑并返回吗？`)) {
                        return;
                      }
                      const snapshot = loadFileDraftSessionSnapshot(draftKey);
                      if (snapshot) {
                        saveFileDraftSession(draftKey, snapshot);
                      } else {
                        clearFileDraftSession(draftKey);
                      }
                      clearFileDraftSessionSnapshot(draftKey);
                      const documentSnapshot =
                        loadEditorDocumentSnapshot(draftKey);
                      if (documentSnapshot) {
                        saveEditorDocument(draftKey, documentSnapshot);
                      } else {
                        clearEditorDocument(draftKey);
                      }
                      clearEditorDocumentSnapshot(draftKey);
                      goBackToEditor();
                    }}
                  >
                    放弃编辑
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => {
                      const exported = canvasRef.current?.exportCurrentState();
                      if (exported) {
                        const nextDraft = setValue(draft, exported.value);
                        saveFileDraftSession(draftKey, nextDraft);
                        saveEditorDocument(draftKey, exported.document);
                        setDraft(nextDraft);
                      }
                      clearFileDraftSessionSnapshot(draftKey);
                      clearEditorDocumentSnapshot(draftKey);
                      goBackToEditor();
                    }}
                  >
                    保存并返回
                  </button>
                </div>
              </div>
            </div>

            <Canvas
              ref={canvasRef}
              value={getValue(draft)}
              initialDocument={initialDocument}
              heightClassName="h-screen"
              fileName={getValue(draft).svg?.trim() ? "已导入 SVG" : undefined}
              onDocumentStateChange={(document) => {
                saveEditorDocument(draftKey, document);
              }}
            />
          </div>
        ) : null}
      </StatusView>
    </div>
  );
}
