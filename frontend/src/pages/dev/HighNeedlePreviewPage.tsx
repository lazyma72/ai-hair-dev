import * as React from "react";
import { message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import PageShell from "../../components/PageShell";
import {
  makeDmlMap,
  makeDoubleSet,
} from "../../modules/highNeedleAnnotator/helpers";
import type { 高针图 } from "../../modules/highNeedleAnnotator/types";
import {
  空DML规则命令列表,
  type DML规则命令列表,
} from "../../shared/models/DML规则";
import {
  collectSvgTextNodes,
  pruneSvgTextNodes,
} from "../../modules/highNeedleAnnotator/svgUtils";

const SVG_NS = "http://www.w3.org/2000/svg";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function normalize高针图(raw: any): 高针图 {
  const DML规则命令列表: DML规则命令列表 = Array.isArray(raw?.自定义数据?.DML规则命令列表)
    ? raw.自定义数据.DML规则命令列表
    : Array.isArray(raw?.自定义数据?.DML规则?.命令列表)
      ? raw.自定义数据.DML规则.命令列表
      : 空DML规则命令列表();

  return {
    ...raw,
    底图: {
      ...raw?.底图,
      svg: raw?.底图?.svg ?? "",
      区域名: raw?.底图?.区域名 ?? [],
      区域线条: raw?.底图?.区域线条 ?? [],
      档位标注: (raw?.底图?.档位标注 ?? []).map((item: any) => ({
        ...item,
        lineNodeIds: item?.lineNodeIds ?? [],
        textNodeIds: item?.textNodeIds ?? [],
      })),
      文本节点: raw?.底图?.文本节点 ?? {},
    },
    自定义数据: {
      ...raw?.自定义数据,
      DML规则命令列表,
      单双标注: (raw?.自定义数据?.单双标注 ?? []).map((item: any) => ({
        ...item,
        textNodeId: item?.textNodeId ?? "",
      })),
    },
  } as 高针图;
}

type PreviewToggles = {
  level: boolean;
  dml: boolean;
  double: boolean;
  text: boolean;
};

function parseLevelNo(levelLabel: string, fallbackNo: number): number {
  const match = String(levelLabel ?? "")
    .trim()
    .match(/\d+/);
  if (!match) return fallbackNo;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackNo;
}

function getLevelMarkerText(levelNo: number): string {
  return String(levelNo);
}

function isManagedMarkerTextId(textNodeId: string): boolean {
  const id = String(textNodeId ?? "").trim();
  return (
    id.startsWith("region_text_") ||
    id.startsWith("level_text_") ||
    id.startsWith("dml_text_") ||
    id.startsWith("double_text_")
  );
}

function cssEscapeId(id: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(id);
  }
  return id.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function transformToSvgRootPoint(
  svgRoot: SVGSVGElement,
  el: Element,
  p: { x: number; y: number },
): { x: number; y: number } {
  // 真实 SVG 常见：viewBox + 非 px 宽高 + <g transform="...">。
  // 仅用 getCTM 在部分 SVG 上会出现“整体偏移/缩放不一致”。
  // 这里优先使用：element.getScreenCTM -> screen space -> root.getScreenCTM().inverse -> root user space。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elScreen: any = (el as any).getScreenCTM?.();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootScreen: any = (svgRoot as any).getScreenCTM?.();

  let rootInv: any = null;
  try {
    rootInv = rootScreen?.inverse?.();
  } catch {
    rootInv = null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DOMPointCtor: any = (globalThis as any).DOMPoint;
  if (elScreen && rootInv && typeof DOMPointCtor === "function") {
    const pt = new DOMPointCtor(p.x, p.y);
    const out = pt.matrixTransform(elScreen).matrixTransform(rootInv);
    return { x: out.x, y: out.y };
  }

  if (elScreen && rootInv) {
    // fallback for older env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svgPt: any = svgRoot.createSVGPoint?.();
    if (svgPt) {
      svgPt.x = p.x;
      svgPt.y = p.y;
      const out = svgPt.matrixTransform(elScreen).matrixTransform(rootInv);
      return { x: out.x, y: out.y };
    }
  }

  // 最后兜底：getCTM（只处理 <g transform> 的本地到 root 变换）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matrix: any = (el as any).getCTM?.();
  if (!matrix) return p;

  if (typeof DOMPointCtor === "function") {
    const pt = new DOMPointCtor(p.x, p.y);
    const out = pt.matrixTransform(matrix);
    return { x: out.x, y: out.y };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgPt: any = svgRoot.createSVGPoint?.();
  if (!svgPt) return p;
  svgPt.x = p.x;
  svgPt.y = p.y;
  const out = svgPt.matrixTransform(matrix);
  return { x: out.x, y: out.y };
}

function getPointAtRatio(
  svgRoot: SVGSVGElement,
  el: Element,
  ratio: number,
): { x: number; y: number } | null {
  // SVGGeometryElement: line/path/polyline/polygon 支持 getTotalLength/getPointAtLength
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geo: any = el as any;
  if (
    typeof geo.getTotalLength === "function" &&
    typeof geo.getPointAtLength === "function"
  ) {
    try {
      const len = geo.getTotalLength();
      if (!Number.isFinite(len) || len <= 0) return null;
      const pt = geo.getPointAtLength(len * ratio);
      if (!pt) return null;
      return transformToSvgRootPoint(svgRoot, el, { x: pt.x, y: pt.y });
    } catch {
      // ignore
    }
  }

  // fallback: bbox（同样要过 CTM 变换）
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bbox = (el as any).getBBox?.();
    if (bbox && Number.isFinite(bbox.x) && Number.isFinite(bbox.y)) {
      return transformToSvgRootPoint(svgRoot, el, {
        x: bbox.x + bbox.width * ratio,
        y: bbox.y + bbox.height / 2,
      });
    }
  } catch {
    // ignore
  }

  return null;
}

type PreviewLabelItem = {
  lineId: string;
  text: string;
  ratio: number;
  fill: string;
};

function buildPreviewLabels(
  data: 高针图,
  toggles: PreviewToggles,
  existingSvgTextIdSet: ReadonlySet<string>,
): PreviewLabelItem[] {
  const dmlById = makeDmlMap(data);
  const doubleSet = makeDoubleSet(data.自定义数据.单双标注);

  const out: PreviewLabelItem[] = [];

  data.底图.档位标注.forEach((item, index) => {
    if (!toggles.level) return;
    const levelText = getLevelMarkerText(
      parseLevelNo(String(item.区域名 ?? ""), index + 1),
    );
    item.lineNodeIds.forEach((lineId, lineIndex) => {
      const textNodeId = String(item.textNodeIds[lineIndex] ?? "").trim();
      if (textNodeId && existingSvgTextIdSet.has(textNodeId)) return;
      out.push({
        lineId,
        text: levelText,
        ratio: 0.2,
        fill: "#0f172a",
      });
    });
  });

  dmlById.forEach((v, lineId) => {
    if (!toggles.dml) return;
    out.push({
      lineId,
      text: v,
      ratio: 0.5,
      fill: "#f59e0b",
    });
  });

  data.自定义数据.单双标注.forEach((item) => {
    if (!toggles.double) return;
    const textNodeId = String(item.textNodeId ?? "").trim();
    if (textNodeId && existingSvgTextIdSet.has(textNodeId)) return;
    if (!doubleSet.has(item.lineNodeId)) return;
    out.push({
      lineId: item.lineNodeId,
      text: "双",
      ratio: 0.7,
      fill: "#10b981",
    });
  });

  return out;
}

export default function HighNeedlePreviewPage() {
  const [jsonText, setJsonText] = useState("");
  const [loaded, setLoaded] = useState<高针图 | null>(null);
  const [toggles, setToggles] = useState<PreviewToggles>({
    level: true,
    dml: true,
    double: true,
    text: true,
  });

  const header = useMemo(
    () => (
      <div className="text-xs text-slate-500">
        入口：导航栏「高针预览」或直接访问 /admin/high-needle-preview。
      </div>
    ),
    [],
  );

  const minimalJson = useMemo(() => {
    if (!loaded) return null;
    return {
      ...loaded,
      底图: {
        ...loaded.底图,
        svg: "",
      },
    };
  }, [loaded]);

  const previewSvg = useMemo(() => {
    if (!loaded?.底图?.svg) return "";
    const allTextIds = collectSvgTextNodes(loaded.底图.svg).map(
      (item) => item.id,
    );
    const existingSvgTextIdSet = new Set(allTextIds);
    const levelTextIds = loaded.底图.档位标注.flatMap((item) =>
      (item.textNodeIds ?? []).filter((textNodeId) =>
        existingSvgTextIdSet.has(String(textNodeId ?? "").trim()),
      ),
    );
    const doubleTextIds = loaded.自定义数据.单双标注.map((item) =>
      String(item.textNodeId ?? "").trim(),
    );
    const markerTextIds = new Set(
      [...levelTextIds, ...doubleTextIds]
        .map((id) => String(id ?? "").trim())
        .filter(Boolean),
    );

    const visibleTextIds = new Set<string>();
    if (toggles.text) {
      allTextIds.forEach((id) => {
        if (!markerTextIds.has(id) && !isManagedMarkerTextId(id)) {
          visibleTextIds.add(id);
        }
      });
    }
    if (toggles.level) {
      levelTextIds.forEach((id) => {
        const nextId = String(id ?? "").trim();
        if (nextId) visibleTextIds.add(nextId);
      });
    }
    if (toggles.double) {
      doubleTextIds.forEach((id) => {
        const nextId = String(id ?? "").trim();
        if (nextId) visibleTextIds.add(nextId);
      });
    }

    return pruneSvgTextNodes(loaded.底图.svg, Array.from(visibleTextIds));
  }, [loaded, toggles]);

  const previewLabels = useMemo(() => {
    if (!loaded) return [];
    const existingSvgTextIdSet = new Set(
      collectSvgTextNodes(loaded.底图.svg).map((item) => item.id),
    );
    return buildPreviewLabels(loaded, toggles, existingSvgTextIdSet);
  }, [loaded, toggles]);

  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = svgWrapRef.current;
    if (!wrap) return;

    const svgRoot = wrap.querySelector<SVGSVGElement>("svg");
    if (!svgRoot) return;

    let group = svgRoot.querySelector<SVGGElement>("#aime_preview_labels");
    if (!group) {
      group = document.createElementNS(SVG_NS, "g") as unknown as SVGGElement;
      group.setAttribute("id", "aime_preview_labels");
      group.setAttribute("pointer-events", "none");
      svgRoot.appendChild(group);
    }

    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }

    // 为保证“互不影响字体”，每种类型都写死 font-family / font-size / font-weight
    previewLabels.forEach((item) => {
      if (!item.text) return;

      const lineEl = svgRoot.querySelector<SVGGraphicsElement>(
        `#${cssEscapeId(item.lineId)}`,
      );
      if (!lineEl) return;

      const pt = getPointAtRatio(svgRoot, lineEl, item.ratio);
      if (!pt) return;

      const textEl = document.createElementNS(SVG_NS, "text");
      textEl.setAttribute("x", String(pt.x));
      textEl.setAttribute("y", String(pt.y));
      textEl.setAttribute("text-anchor", "middle");
      textEl.setAttribute("dominant-baseline", "middle");
      textEl.setAttribute("fill", item.fill);
      textEl.setAttribute(
        "font-family",
        "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      );
      textEl.setAttribute("font-size", "12");
      textEl.setAttribute("font-weight", "700");
      textEl.textContent = item.text;
      group?.appendChild(textEl);
    });
  }, [previewSvg, previewLabels]);

  return (
    <PageShell
      title="高针预览"
      onBack={() => window.history.back()}
      actions={header}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            导入 / 导出 JSON
          </div>
          <textarea
            rows={8}
            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="把导出的 JSON 粘贴到这里，然后点“导入预览”"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => {
                try {
                  const parsed = normalize高针图(JSON.parse(jsonText));
                  if (!parsed?.底图?.svg) {
                    message.error("JSON 缺少 底图.svg");
                    return;
                  }
                  setLoaded(parsed);
                  message.success("已导入并进入预览");
                } catch {
                  message.error("JSON 解析失败");
                }
              }}
            >
              导入预览
            </button>

            <button
              type="button"
              className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!minimalJson}
              onClick={() => {
                if (!minimalJson) return;
                void navigator.clipboard.writeText(
                  JSON.stringify(minimalJson, null, 2),
                );
                message.success("已复制最小 JSON");
              }}
            >
              复制最小 JSON
            </button>

            <button
              type="button"
              className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!loaded}
              onClick={() => {
                if (!loaded) return;
                downloadJson("high-needle.json", loaded);
              }}
            >
              下载最新 JSON
            </button>

            <button
              type="button"
              className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => {
                setJsonText("");
                setLoaded(null);
                message.success("已清空");
              }}
            >
              清空
            </button>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            说明：该页面仅做预览，不包含标注流程。优先使用已保存的标记文本节点；缺失时才按
            20%/50%/70% 位置回退展示。
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">预览选项</div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={toggles.level}
                  onChange={(e) =>
                    setToggles((v) => ({ ...v, level: e.target.checked }))
                  }
                />
                档位
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={toggles.double}
                  onChange={(e) =>
                    setToggles((v) => ({ ...v, double: e.target.checked }))
                  }
                />
                单双
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={toggles.dml}
                  onChange={(e) =>
                    setToggles((v) => ({ ...v, dml: e.target.checked }))
                  }
                />
                DML
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={toggles.text}
                  onChange={(e) =>
                    setToggles((v) => ({ ...v, text: e.target.checked }))
                  }
                />
                文本
              </label>
            </div>
          </div>

          {loaded ? (
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white p-3">
              <div ref={svgWrapRef} className="inline-block">
                <InlineSvg
                  svg={previewSvg}
                  className="max-w-full"
                  height="auto"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              请先在上方粘贴并导入 JSON。
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
