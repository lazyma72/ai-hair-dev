import { useMemo, useState } from "react";
import DownloadSvgButton from "../../components/DownloadSvgButton";
import Row from "../../components/Row";
import Section from "../../components/Section";
import { ExcelStyleHighNeedleImageTable } from "./ExcelStyleSpecTables";
import HighNeedleImportStep from "../../pages/design/create/components/HighNeedleImportStep";
import type { 高针指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 高针指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import HighNeedlePreviewViewer from "../highNeedleAnnotator/HighNeedlePreviewViewer";

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
  hideUploader = false,
  previewData,
}: Props) {
  const isEdit = mode === "edit";
  const [expanded, setExpanded] = useState(false);
  const hasSvg = Boolean(value.高针图?.底图?.svg?.trim());
  const [showUploader, setShowUploader] = useState(!hideUploader || !hasSvg);
  const fileName = useMemo(() => {
    const svg = value.高针图?.底图?.svg?.trim() ?? "";
    return svg ? "已导入 SVG" : null;
  }, [value.高针图?.底图?.svg]);

  if (!isEdit) {
    const preview = previewData?.高针图数据 ?? value.高针图;
    const downloadSvg = previewData?.高针图svg || preview?.底图?.svg || "";
    const downloadFilename = `${
      previewData?.title?.样品编号 || "high-needle"
    }-high-needle.svg`;
    return (
      <div className="space-y-5">
        {previewData?.title ? (
          <Section title="标题信息">
            <div className="divide-y divide-slate-100">
              <Row label="样品编号" value={previewData.title.样品编号} />
              <Row label="客户编号" value={previewData.title.客户编号} />
              <Row label="品名" value={previewData.title.品名} />
              <Row label="尺寸" value={previewData.title.尺寸} />
              <Row label="原料" value={previewData.title.原料} />
              <Row label="CAP" value={previewData.title.CAP} />
              <Row label="重量" value={previewData.title.重量 || "—"} />
            </div>
          </Section>
        ) : null}

        {previewData ? (
          <Section title="机器规格清单（高针图版）">
            <ExcelStyleHighNeedleImageTable
              rows={previewData.机器规格清单_高针图}
            />
          </Section>
        ) : null}

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

            {preview?.底图?.svg?.trim() ? (
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-slate-700">
                    高针图
                  </div>
                  <DownloadSvgButton
                    svg={downloadSvg}
                    filename={downloadFilename}
                  />
                </div>
                <div className="overflow-hidden rounded border border-slate-100 bg-white">
                  <HighNeedlePreviewViewer
                    data={preview}
                    emptyText="暂无高针图"
                  />
                </div>
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
              {fileName ? `当前：${fileName}` : "暂未导入高针图 SVG"}
            </div>
            <div className="flex items-center gap-2">
              {hideUploader && hasSvg ? (
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  onClick={() => setShowUploader((v) => !v)}
                >
                  更换 SVG
                </button>
              ) : null}
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                onClick={() => setExpanded(true)}
              >
                放大标注
              </button>
            </div>
          </div>

          {!expanded ? (
            <HighNeedleImportStep
              embed
              title="高针图标注"
              value={value.高针图}
              onChange={(v) => onChange?.({ ...value, 高针图: v })}
              showJsonActions
              showUploader={showUploader}
              fileName={fileName}
            />
          ) : null}
        </div>
      </Section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                高针图标注（放大）
              </div>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                onClick={() => setExpanded(false)}
              >
                退出放大
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <HighNeedleImportStep
                embed
                fullscreen
                heightClassName="h-[calc(100vh-180px)] min-h-[680px]"
                title="高针图标注"
                value={value.高针图}
                onChange={(v) => onChange?.({ ...value, 高针图: v })}
                showJsonActions
                showUploader={false}
                fileName={fileName}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
