import { message } from "antd";
import { useState } from "react";
import HighNeedleSvgAnnotator from "../../../../modules/highNeedleAnnotator/HighNeedleSvgAnnotator";
import type { 沐茵丝假发成品稿 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { emptyFile } from "../../../admin/add-file/defaults";

type 高针图值 = 沐茵丝假发成品稿["高针指示单"]["高针图"];

type Props = {
  title?: string;
  description?: string;
  value: 高针图值;
  onChange: (v: 高针图值) => void;
  fileName?: string | null;
  onFileNameChange?: (name: string | null) => void;
  emptyText?: string;
  showJsonActions?: boolean;
  fullscreen?: boolean;
};

export default function HighNeedleImportStep({
  title = "导入高针图",
  description = "请选择高针图 SVG 文件，并在当前页面完成标注。",
  value,
  onChange,
  fileName,
  onFileNameChange,
  emptyText = "请先选择一份高针图 SVG 文件。",
  showJsonActions = true,
  fullscreen = false,
}: Props) {
  // Important: do NOT re-init annotator when `value.底图.svg` changes during annotation.
  // The annotator writes marker text nodes back into svg, which would otherwise cause
  // remount + step reset (区域/档位来回跳).
  const [annotatorSvg, setAnnotatorSvg] = useState(() => value.底图.svg.trim());
  const [annotatorInitialValue, setAnnotatorInitialValue] =
    useState<高针图值 | null>(() => (value.底图.svg.trim() ? value : null));
  const [revision, setRevision] = useState(0);

  const content = (
    <section
      className={
        fullscreen
          ? "rounded-xl border border-slate-100 bg-slate-50 p-5"
          : "rounded-xl border border-slate-100 bg-slate-50 p-5"
      }
    >
        <div className="mb-3 flex items-center justify-between">
          <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
              选择 SVG 文件
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
                    const emptyHighNeedle = emptyFile().高针指示单.高针图;
                    emptyHighNeedle.底图.svg = text;
                    onFileNameChange?.(file.name);
                    setAnnotatorSvg(text);
                    setAnnotatorInitialValue(emptyHighNeedle);
                    setRevision((v) => v + 1);
                    onChange(emptyHighNeedle);
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>

            {showJsonActions ? (
              <button
                type="button"
                className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
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
            ) : null}

            {showJsonActions ? (
              <button
                type="button"
                className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(value, null, 2)], {
                    type: "application/json;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "high-needle.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                下载 JSON
              </button>
            ) : null}
          </div>
        </div>

        {fileName ? (
          <div className="mb-3 text-xs text-slate-500">当前 SVG：{fileName}</div>
        ) : null}

        {annotatorSvg.trim() ? (
          <div className="h-[70vh] min-h-[560px] overflow-hidden">
            <HighNeedleSvgAnnotator
              key={revision}
              initialSvg={annotatorSvg}
              initialValue={annotatorInitialValue ?? undefined}
              startAt="begin"
              enableDml
              enableDouble
              showPreview={false}
              onChange={onChange}
            />
          </div>
        ) : (
          <div className="text-sm text-slate-600">{emptyText}</div>
        )}
      </section>
  );

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
