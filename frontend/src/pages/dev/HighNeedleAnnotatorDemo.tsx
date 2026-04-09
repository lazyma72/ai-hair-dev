import * as React from "react";
import { useRef, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import HighNeedleSvgAnnotator from "../../modules/highNeedleAnnotator/HighNeedleSvgAnnotator";

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="700" height="360" viewBox="0 0 700 360">
  <rect x="0" y="0" width="700" height="360" fill="#ffffff" />
  <g id="grid" stroke="#e2e8f0" stroke-width="1">
    <line id="line_1" x1="80" y1="80" x2="620" y2="80" />
    <line id="line_2" x1="80" y1="120" x2="620" y2="120" />
    <line id="line_3" x1="80" y1="160" x2="620" y2="160" />
    <line id="line_4" x1="80" y1="200" x2="620" y2="200" />
    <line id="line_5" x1="80" y1="240" x2="620" y2="240" />
    <line id="line_6" x1="80" y1="280" x2="620" y2="280" />
  </g>
  <g id="labels" fill="#0f172a" font-family="system-ui" font-size="14">
    <text x="30" y="86">A</text>
    <text x="30" y="126">B</text>
    <text x="30" y="166">C</text>
    <text x="30" y="206">D</text>
    <text x="30" y="246">E</text>
    <text x="30" y="286">F</text>
  </g>
  <g id="meta" fill="#334155" font-family="system-ui" font-size="12">
    <text x="80" y="40">Demo SVG（仅用于体验标注流程）</text>
    <text id="slot_text" x="80" y="330">档位：</text>
  </g>
</svg>`;

export default function HighNeedleAnnotatorDemoPage() {
  const [svg, setSvg] = useState(SAMPLE_SVG);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setSvg(text);
        setFileName(file.name);
      }
    };
    reader.readAsText(file, "utf-8");
    // reset so the same file can be re-selected
    e.target.value = "";
  }

  const header = useMemo(
    () => (
      <div className="text-xs text-slate-500">
        入口：导航栏「高针标注」或直接访问 /admin/high-needle-annotator。JSON
        导入/导出已拆到「高针预览」。
      </div>
    ),
    [],
  );

  return (
    <PageShell
      title="高针图标注 Demo"
      onBack={() => window.history.back()}
      actions={header}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            选择 SVG 文件
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件…
            </button>
            <span className="text-xs text-slate-500">
              {fileName ?? "未选择文件，当前使用内置 Demo SVG"}
            </span>
            {fileName ? (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-red-500"
                onClick={() => {
                  setSvg(SAMPLE_SVG);
                  setFileName(null);
                }}
              >
                重置
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mt-2 text-[11px] text-slate-500">
            默认可点选元素 selector 为：line/path/polyline/polygon 且必须有
            id。若你的真实 SVG 线条有固定 class 或 id 前缀，可通过组件 props
            调整。
          </div>
        </div>

        <HighNeedleSvgAnnotator
          initialSvg={svg}
          slotTextNodeId="slot_text"
          enableDml
          enableDouble
        />
      </div>
    </PageShell>
  );
}
