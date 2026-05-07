import { useEffect, useMemo, useState } from "react";
import DownloadSvgButton from "../../components/DownloadSvgButton";
import Section from "../../components/Section";
import EmbeddedHighNeedleEditor from "../../pages/editor/EmbeddedHighNeedleEditor";
import type { 高针指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 高针指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import HighNeedlePreview from "./HighNeedlePreview";

type Props = {
  mode: "edit" | "readonly";
  value: 高针指示单;
  onChange?: (v: 高针指示单) => void;
  previewData?: 高针指示单Frontend | null;
  showJsonImporter?: boolean;
  hideUploader?: boolean;
};

export default function HighNeedleBlock({
  mode,
  value,
  onChange,
  previewData,
}: Props) {
  const isEdit = mode === "edit";
  const [expanded, setExpanded] = useState(false);
  const fileName = useMemo(() => {
    const svg = value.高针图?.svg?.trim() ?? "";
    return svg ? "已导入 SVG" : null;
  }, [value.高针图?.svg]);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  if (!isEdit) {
    const preview = previewData?.高针图数据 ?? value.高针图;
    const downloadSvg = previewData?.高针图svg || preview?.svg || "";
    const downloadFilename = `${
      previewData?.title?.样品编号 || "high-needle"
    }-high-needle.svg`;
    return (
      <div className="space-y-5">
        <Section title="高针指示单">
          <div className="space-y-4 p-4">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-700">
                注意事项
              </div>
              <div className="whitespace-pre-line rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {value.注意事项 || "—"}
              </div>
            </div>

            {preview?.svg?.trim() ? (
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-slate-700">
                    高针图
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!preview}
                      onClick={() => {
                        if (!preview) return;
                        const blob = new Blob(
                          [JSON.stringify(preview, null, 2)],
                          {
                            type: "application/json;charset=utf-8",
                          },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${
                          previewData?.title?.样品编号 || "high-needle"
                        }-high-needle.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      导出 JSON
                    </button>
                    <DownloadSvgButton
                      svg={downloadSvg}
                      filename={downloadFilename}
                    />
                  </div>
                </div>
                <HighNeedlePreview value={preview} />
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section title="高针指示单">
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-700">
              注意事项
            </div>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="高针 :1.高针后帽子不能变形。"
              value={value.注意事项}
              onChange={(e) =>
                onChange?.({ ...value, 注意事项: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {fileName
                ? `当前：${fileName}`
                : "请在编辑器内的文件菜单导入高针图 SVG"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                onClick={() => setExpanded(true)}
              >
                放大标注
              </button>
            </div>
          </div>

          {value.高针图?.svg?.trim() ? (
            <HighNeedlePreview value={value.高针图} />
          ) : (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              请先在放大标注中导入高针图 SVG。
            </div>
          )}

          <div className={expanded ? "fixed inset-0 z-[90] bg-white" : "hidden"}>
            <EmbeddedHighNeedleEditor
              heightClassName="h-full min-h-0"
              value={value.高针图}
              onChange={(v) => onChange?.({ ...value, 高针图: v })}
              fileName={fileName}
              headerRight={
                expanded ? (
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                    onClick={() => setExpanded(false)}
                  >
                    退出放大
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
