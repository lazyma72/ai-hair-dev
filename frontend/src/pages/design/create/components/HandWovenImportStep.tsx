import { message } from "antd";
import { useState } from "react";
import HighNeedleSvgAnnotator from "../../../../modules/highNeedleAnnotator/HighNeedleSvgAnnotator";
import {
  createEmpty手织图,
  手织图To高针图,
  高针图To手织图,
} from "../../../../modules/highNeedleAnnotator/types";
import type { 手织图 } from "../../../../shared/models/手织图";

type Props = {
  title?: string;
  description?: string;
  value: 手织图;
  onChange: (v: 手织图) => void;
  fileName?: string | null;
  onFileNameChange?: (name: string | null) => void;
  emptyText?: string;
  showJsonActions?: boolean;
  fullscreen?: boolean;
  embed?: boolean;
  heightClassName?: string;
  showUploader?: boolean;
};

export default function HandWovenImportStep({
  title = "导入手织图",
  description = "请选择手织图 SVG 文件，并在当前页面完成标注。",
  value,
  onChange,
  fileName,
  onFileNameChange,
  emptyText = "请先选择一份手织图 SVG 文件。",
  showJsonActions = true,
  fullscreen = false,
  embed = false,
  heightClassName,
  showUploader = true,
}: Props) {
  const [annotatorSvg, setAnnotatorSvg] = useState(() => value.底图.svg.trim());
  const [annotatorInitialValue, setAnnotatorInitialValue] = useState(() =>
    value.底图.svg.trim() ? 手织图To高针图(value) : null,
  );
  const [revision, setRevision] = useState(0);

  const content = (
    <section
      className={
        embed
          ? "rounded-xl border border-slate-200 bg-white"
          : fullscreen
            ? "rounded-xl border border-slate-100 bg-slate-50 p-5"
            : "rounded-xl border border-slate-100 bg-slate-50 p-5"
      }
    >
      {!embed ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <div className="mt-1 text-xs text-slate-500">
              先在中间导入 SVG，再直接在同一编辑器中自由切换工具标注。
            </div>
          </div>
          {showJsonActions ? (
            <details className="shrink-0">
              <summary className="cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                JSON 操作
              </summary>
              <div className="mt-2 flex min-w-[140px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        JSON.stringify(value, null, 2),
                      );
                      message.success("已复制 JSON");
                    } catch {
                      message.error("复制失败");
                    }
                  }}
                >
                  复制 JSON
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(value, null, 2)], {
                      type: "application/json;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "hand-woven.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  下载 JSON
                </button>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {showUploader ? (
        <div
          className={
            embed
              ? "border-b border-slate-100 px-5 py-4"
              : "mb-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-6"
          }
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {annotatorSvg.trim() ? "重新导入 SVG 文件" : "选择 SVG 文件"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {annotatorSvg.trim()
                  ? "重新导入将覆盖当前标注并重新开始。"
                  : "请选择手织图 SVG 文件，完成后在下方编辑器中标注。"}
              </div>
            </div>
            <label className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
              {annotatorSvg.trim() ? "重新选择 SVG 文件" : "选择 SVG 文件"}
              <input
                type="file"
                accept="image/svg+xml,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const text =
                      typeof reader.result === "string" ? reader.result : "";
                    const empty = createEmpty手织图(text);
                    onFileNameChange?.(file.name);
                    setAnnotatorSvg(text);
                    setAnnotatorInitialValue(手织图To高针图(empty));
                    setRevision((v) => v + 1);
                    onChange(empty);
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="text-xs text-slate-500">
              {fileName
                ? `当前 SVG：${fileName}`
                : annotatorSvg.trim()
                  ? "当前 SVG：已导入"
                  : "暂未选择 SVG 文件"}
            </div>
          </div>
        </div>
      ) : null}

      {annotatorSvg.trim() ? (
        <div
          className={
            embed
              ? `overflow-hidden ${heightClassName ?? "h-[60vh] min-h-[520px]"}`
              : "h-[70vh] min-h-[560px] overflow-hidden"
          }
        >
          <HighNeedleSvgAnnotator
            key={revision}
            initialSvg={annotatorSvg}
            initialValue={annotatorInitialValue ?? undefined}
            startAt="begin"
            enableDml
            enableDouble={false}
            showPreview={false}
            onChange={(v) => onChange(高针图To手织图(v))}
          />
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-slate-600">{emptyText}</div>
      )}
    </section>
  );

  if (embed) return content;

  return fullscreen ? (
    content
  ) : (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        {description}
      </div>
      {content}
    </>
  );
}
