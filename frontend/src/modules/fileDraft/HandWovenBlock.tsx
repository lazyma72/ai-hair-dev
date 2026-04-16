import { useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Row from "../../components/Row";
import Section from "../../components/Section";
import HandWovenImportStep from "../../pages/design/create/components/HandWovenImportStep";
import type { 手织指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import HighNeedlePreviewViewer from "../highNeedleAnnotator/HighNeedlePreviewViewer";
import { 手织图To高针图 } from "../highNeedleAnnotator/types";

type Props = {
  mode: "edit" | "readonly";
  value: 手织指示单;
  onChange?: (v: 手织指示单) => void;
  previewData?: 手织指示单Frontend | null;
  hideUploader?: boolean;
};

const 规格列: Column<手织指示单Frontend["人工规格清单_手织图"][number]>[] = [
  { key: "档位", title: "档位", render: (r) => r.档位 },
  { key: "整长", title: "整长", render: (r) => r.整长 || "—" },
  { key: "毛长", title: "毛长", render: (r) => r.毛长 || "—" },
  {
    key: "重量",
    title: "重量 D/M/L",
    render: (r) =>
      `D:${r.重量.D}${r.重量.M != null ? " M:" + r.重量.M : ""}${r.重量.L != null ? " L:" + r.重量.L : ""}`,
  },
];

export default function HandWovenBlock({
  mode,
  value,
  onChange,
  hideUploader = false,
  previewData,
}: Props) {
  const isEdit = mode === "edit";
  const [expanded, setExpanded] = useState(false);
  const hasSvg = Boolean(value.手织图?.底图?.svg?.trim());
  const [showUploader, setShowUploader] = useState(!hideUploader || !hasSvg);
  const fileName = useMemo(() => {
    const svg = value.手织图?.底图?.svg?.trim() ?? "";
    return svg ? "已导入 SVG" : null;
  }, [value.手织图?.底图?.svg]);

  if (!isEdit) {
    const preview高针 = value.手织图?.底图?.svg?.trim()
      ? 手织图To高针图(value.手织图)
      : null;
    return (
      <div className="space-y-5">
        {previewData?.title ? (
          <Section title="标题信息">
            <div className="divide-y divide-slate-100">
              <Row label="样品编号" value={previewData.title.样品编号} />
              <Row label="客户编号" value={previewData.title.客户编号} />
              <Row label="品名" value={previewData.title.品名} />
              <Row label="CAP" value={previewData.title.CAP} />
              <Row label="尺寸" value={`${previewData.title.尺寸}`} />
              <Row label="重量" value={`${previewData.title.重量}g`} />
              <Row label="原材料" value={previewData.title.原材料} />
              <Row label="颜色编号" value={previewData.title.颜色编号} />
            </div>
          </Section>
        ) : null}

        {previewData ? (
          <Section title="人工规格清单（手织图版）">
            <div className="overflow-x-auto">
              <DataTable
                columns={规格列}
                rows={previewData.人工规格清单_手织图}
                rowKey={(r) => r.档位}
              />
            </div>
          </Section>
        ) : null}

        <Section title="手织指示单">
          <div className="space-y-4 p-4">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-700">注意事项</div>
              <div className="whitespace-pre-line rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {value.注意事项 || "—"}
              </div>
            </div>

            {preview高针 ? (
              <div>
                <div className="mb-1 text-xs font-medium text-slate-700">手织图</div>
                <div className="overflow-hidden rounded border border-slate-100 bg-white">
                  <HighNeedlePreviewViewer
                    data={preview高针}
                    emptyText="暂无手织图"
                    hideDoubleToggle
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
      <Section title="手织指示单">
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-700">注意事项</div>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="手织 :1.手织后帽子不能变形。"
              value={value.注意事项}
              onChange={(e) => onChange?.({ ...value, 注意事项: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {fileName ? `当前：${fileName}` : "暂未导入手织图 SVG"}
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

          <HandWovenImportStep
            embed
            title="手织图标注"
            value={value.手织图}
            onChange={(v) => onChange?.({ ...value, 手织图: v })}
            showJsonActions
            showUploader={showUploader}
            fileName={fileName}
          />
        </div>
      </Section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                手织图标注（放大）
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
              <HandWovenImportStep
                embed
                fullscreen
                heightClassName="h-[calc(100vh-180px)] min-h-[680px]"
                title="手织图标注"
                value={value.手织图}
                onChange={(v) => onChange?.({ ...value, 手织图: v })}
                showJsonActions
                showUploader={showUploader}
                fileName={fileName}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
