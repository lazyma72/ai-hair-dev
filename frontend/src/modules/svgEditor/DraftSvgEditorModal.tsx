import { useEffect, useRef } from "react";
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
  open: boolean;
  title: string;
  Canvas: React.ComponentType<CanvasProps<TValue>>;
  value: TValue;
  onCancel: () => void;
  onSave: (payload: {
    document: DocumentState;
    svg: string;
    value: TValue;
  }) => void;
};

export default function DraftSvgEditorModal<TValue extends SvgDocumentValue>({
  open,
  title,
  Canvas,
  value,
  onCancel,
  onSave,
}: Props<TValue>) {
  const canvasRef = useRef<SvgEditorCanvasHandle<TValue> | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-100">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/92 p-2 shadow-sm backdrop-blur">
        <div className="px-2 text-xs font-medium text-slate-500">{title}</div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            if (!window.confirm(`确认放弃本次${title}编辑吗？`)) {
              return;
            }
            onCancel();
          }}
        >
          放弃编辑
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={() => {
            const exported = canvasRef.current?.exportCurrentState();
            if (!exported) return;
            onSave(exported);
          }}
        >
          保存并关闭
        </button>
      </div>

      <Canvas
        ref={canvasRef}
        value={value}
        heightClassName="h-screen"
        fileName={value.json?.trim() ? "已导入 SVG" : undefined}
      />
    </div>
  );
}
