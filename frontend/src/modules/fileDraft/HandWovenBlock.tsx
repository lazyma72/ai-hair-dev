import { useMemo } from "react";
import DownloadSvgButton from "../../components/DownloadSvgButton";
import Section from "../../components/Section";
import InlineSvg from "../../components/InlineSvg";
import type { 手织指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import { build手织图间色比例预览Svg } from "../handWovenDev/svgBuilder";
import HandWovenEditor from "../handWovenDev/HandWovenEditor";
import {
  buildExportSvg,
  DEFAULT_VIEW_STATE,
} from "../svgEditor/externalSvgEditor";
import type { DocumentState } from "../svgEditor/externalSvgEditor";

type Props = {
  mode: "edit" | "readonly";
  value: 手织指示单;
  onChange?: (v: 手织指示单) => void;
  onOpenSvgEditor?: () => void;
  previewData?: 手织指示单Frontend | null;
  hideUploader?: boolean;
};

function parseDocumentJson(json: string | undefined): DocumentState | null {
  const raw = String(json ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DocumentState;
  } catch {
    return null;
  }
}

function buildHandWovenPreviewSvg(json: string | undefined) {
  const document = parseDocumentJson(json);
  if (!document) return "";
  return buildExportSvg(document, DEFAULT_VIEW_STATE);
}

function getHandWovenJson(value: 手织指示单["手织图"]): string {
  return String((value as 手织指示单["手织图"] & { json?: string })?.json ?? "");
}

export default function HandWovenBlock({
  mode,
  value,
  onChange,
  onOpenSvgEditor,
  hideUploader = false,
  previewData: _previewData,
}: Props) {
  const isEdit = mode === "edit";
  const previewSvg = useMemo(
    () => buildHandWovenPreviewSvg(getHandWovenJson(value.手织图)),
    [value.手织图],
  );
  const hasSvg = Boolean(previewSvg);
  const ratioPreviewSvg = useMemo(
    () => build手织图间色比例预览Svg(value.手织图),
    [value.手织图],
  );
  const fileName = useMemo(() => {
    return previewSvg ? "已导入 SVG" : null;
  }, [previewSvg]);

  if (!isEdit) {
    const downloadFilename = "hand-woven.svg";
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

            {previewSvg ? (
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-slate-700">
                    手织图 SVG
                  </div>
                  <DownloadSvgButton
                    svg={previewSvg}
                    filename={downloadFilename}
                  />
                </div>
                <div className="overflow-hidden rounded border border-slate-100 bg-white">
                  <InlineSvg
                    svg={previewSvg}
                    className="min-h-[200px] w-full overflow-auto bg-white p-3"
                    height="auto"
                    fitWidth
                  />
                </div>
              </div>
            ) : null}

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
                    fitWidth
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
              {fileName ? `当前：${fileName}` : "当前仅展示已导入的手织图 SVG"}
            </div>
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!onOpenSvgEditor}
              onClick={onOpenSvgEditor}
            >
              {hasSvg ? "进入 SVG 编辑器" : "导入并编辑 SVG"}
            </button>
          </div>

          <HandWovenEditor
            embed
            title="手织图导入"
            value={value.手织图}
            onChange={(v) => onChange?.({ ...value, 手织图: v })}
            showJsonActions={false}
            showUploader={!hideUploader}
            fileName={fileName}
            svgMode="external"
          />

          {previewSvg ? (
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-700">
                  手织图 SVG
                </div>
                <DownloadSvgButton
                  svg={previewSvg}
                  filename="hand-woven.svg"
                />
              </div>
              <div className="overflow-hidden rounded border border-slate-100 bg-white">
                <InlineSvg
                  svg={previewSvg}
                  className="min-h-[200px] w-full overflow-auto bg-white p-3"
                  height="auto"
                  fitWidth
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              暂无手织图 SVG，可进入 SVG 编辑器导入后在此预览。
            </div>
          )}
        </div>
      </Section>

    </div>
  );
}
