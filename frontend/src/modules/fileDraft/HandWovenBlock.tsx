import { useMemo, useState } from "react";
import DownloadSvgButton from "../../components/DownloadSvgButton";
import Section from "../../components/Section";
import InlineSvg from "../../components/InlineSvg";
import HandWovenImportStep from "../../pages/design/create/components/HandWovenImportStep";
import type { 手织指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import { build手织图间色比例预览Svg } from "../handWovenDev/svgBuilder";
import HandWovenSvgPreviewCard from "../handWovenDev/HandWovenSvgPreviewCard";

type Props = {
  mode: "edit" | "readonly";
  value: 手织指示单;
  onChange?: (v: 手织指示单) => void;
  previewData?: 手织指示单Frontend | null;
  hideUploader?: boolean;
};

export default function HandWovenBlock({
  mode,
  value,
  onChange,
  hideUploader = false,
  previewData: _previewData,
}: Props) {
  const isEdit = mode === "edit";
  const hasSvg = Boolean(value.手织图?.svg?.trim());
  const ratioPreviewSvg = useMemo(
    () => build手织图间色比例预览Svg(value.手织图),
    [value.手织图],
  );
  const [showUploader, setShowUploader] = useState(!hideUploader || !hasSvg);
  const fileName = useMemo(() => {
    const svg = value.手织图?.svg?.trim() ?? "";
    return svg ? "已导入 SVG" : null;
  }, [value.手织图?.svg]);

  if (!isEdit) {
    const previewSvg = value.手织图?.svg?.trim() ?? "";
    return (
      <div className="space-y-5">
        <Section title="手织指示单">
          <div className="space-y-4 p-4">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-700">
                注意事项
              </div>
              <div className="whitespace-pre-line rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {value.注意事项 || "—"}
              </div>
            </div>

            <HandWovenSvgPreviewCard svg={previewSvg} />

            {ratioPreviewSvg ? (
              <div>
                <div className="mb-1 text-xs font-medium text-slate-700">
                  间色比例
                </div>
                <div className="overflow-hidden rounded border border-slate-100 bg-white">
                  <InlineSvg
                    svg={ratioPreviewSvg}
                    className="min-h-[180px] w-full overflow-auto bg-white p-3"
                    height="auto"
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
            <div className="mb-1 text-xs font-medium text-slate-700">
              注意事项
            </div>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="手织 :1.手织后帽子不能变形。"
              value={value.注意事项}
              onChange={(e) =>
                onChange?.({ ...value, 注意事项: e.target.value })
              }
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

    </div>
  );
}
