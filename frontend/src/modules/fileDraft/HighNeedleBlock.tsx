import { useMemo } from "react";
import DownloadSvgButton from "../../components/DownloadSvgButton";
import Section from "../../components/Section";
import type { 高针指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 高针指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import HighNeedlePreview, { buildHighNeedlePreviewSvg } from "./HighNeedlePreview";

type Props = {
  mode: "edit" | "readonly";
  value: 高针指示单;
  onChange?: (v: 高针指示单) => void;
  onOpenSvgEditor?: () => void;
  previewData?: 高针指示单Frontend | null;
  showJsonImporter?: boolean;
  hideUploader?: boolean;
};

export default function HighNeedleBlock({
  mode,
  value,
  onChange,
  onOpenSvgEditor,
  previewData,
}: Props) {
  const isEdit = mode === "edit";
  const preview = previewData?.高针图数据 ?? value.高针图;
  const previewSvg = useMemo(() => {
    return preview ? buildHighNeedlePreviewSvg(preview) : "";
  }, [preview]);
  const hasPreviewSvg = Boolean(previewSvg.trim());
  const fileName = useMemo(() => {
    return hasPreviewSvg ? "已导入 SVG" : null;
  }, [hasPreviewSvg]);

  if (!isEdit) {
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

            {hasPreviewSvg ? (
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
                      svg={previewSvg}
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
              {fileName ? `当前：${fileName}` : "当前仅展示已导入的高针图 SVG"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!onOpenSvgEditor}
                onClick={onOpenSvgEditor}
              >
                {hasPreviewSvg ? "进入 SVG 编辑器" : "导入并编辑 SVG"}
              </button>
              {hasPreviewSvg ? (
                <>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!preview}
                    onClick={() => {
                      if (!preview) return;
                      const blob = new Blob([JSON.stringify(preview, null, 2)], {
                        type: "application/json;charset=utf-8",
                      });
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
                    svg={previewSvg}
                    filename={downloadFilename}
                  />
                </>
              ) : null}
            </div>
          </div>

          {hasPreviewSvg ? (
            <HighNeedlePreview value={preview} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              暂无高针图 SVG，可在数据源中导入后在此预览。
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
