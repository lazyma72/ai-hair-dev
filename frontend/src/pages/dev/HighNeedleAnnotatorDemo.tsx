import * as React from "react";
import { useMemo, useState } from "react";
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

  const header = useMemo(
    () => (
      <div className="text-xs text-slate-500">
        入口：导航栏「高针标注」或直接访问 /admin/high-needle-annotator。JSON 导入/导出已拆到「高针预览」。
      </div>
    ),
    [],
  );

  return (
    <PageShell title="高针图标注 Demo" onBack={() => window.history.back()} actions={header}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">输入 SVG</div>
          <textarea
            rows={8}
            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-slate-300"
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
          />
          <div className="mt-2 text-[11px] text-slate-500">
            默认可点选元素 selector 为：line/path/polyline/polygon 且必须有 id。若你的真实 SVG
            线条有固定 class 或 id 前缀，可通过组件 props 调整。
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
