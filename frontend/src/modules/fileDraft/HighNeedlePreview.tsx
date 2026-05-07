import { useMemo, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import type { 高针图 } from "../../shared/models/高针图";
import {
  buildExportSvg,
  DEFAULT_VIEW_STATE,
  type ViewState,
} from "../svgEditor/externalSvgEditor";
import type { DocumentState } from "../svgEditor/externalSvgEditor";
import { parseDocumentJson } from "../svgEditor/svgEditorDocument";

type Props = {
  value: 高针图;
};

type PreviewVisibility = {
  档位: boolean;
  车线编号: boolean;
  单双: boolean;
  DML: boolean;
};

const DEFAULT_VISIBILITY: PreviewVisibility = {
  档位: true,
  车线编号: false,
  单双: true,
  DML: true,
};

function toPreviewViewState(visibility: PreviewVisibility): ViewState {
  return {
    ...DEFAULT_VIEW_STATE,
    标注文本: {
      ...DEFAULT_VIEW_STATE.标注文本,
      档位: visibility.档位,
      车线编号: visibility.车线编号,
      单双: visibility.单双,
      DML: visibility.DML,
    },
  };
}

export function buildHighNeedlePreviewSvg(
  value: 高针图,
  visibility: PreviewVisibility = DEFAULT_VISIBILITY,
): string {
  const document = parseDocumentJson(value.json);
  if (document) {
    const nextDocument: DocumentState = {
      ...document,
      domain: {
        ...document.domain,
        车线: value.车线 ?? [],
        标注样式: value.标注样式 ?? {},
        自动修改器: value.自动修改器 ?? [],
      } as unknown as DocumentState["domain"],
    };
    return buildExportSvg(nextDocument, toPreviewViewState(visibility));
  }
  return "";
}

export default function HighNeedlePreview({ value }: Props) {
  const [visibility, setVisibility] = useState<PreviewVisibility>(DEFAULT_VISIBILITY);
  const previewSvg = useMemo(
    () => buildHighNeedlePreviewSvg(value, visibility),
    [value, visibility],
  );

  if (!previewSvg.trim()) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        {(["档位", "车线编号", "单双", "DML"] as const).map((key) => (
          <label key={key} className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={visibility[key]}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setVisibility((prev) => ({
                  ...prev,
                  [key]: checked,
                }));
              }}
            />
            {key}
          </label>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-slate-100 bg-white">
        <InlineSvg
          svg={previewSvg}
          className="w-full"
          height="auto"
          fitWidth
        />
      </div>
    </div>
  );
}
