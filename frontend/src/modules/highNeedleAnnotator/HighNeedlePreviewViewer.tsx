import { useEffect, useMemo, useRef, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import { makeDmlMap, makeDoubleSet } from "./helpers";
import type { 高针图 } from "./types";
import { collectSvgTextNodes, decorateLines, pruneSvgTextNodes } from "./svgUtils";

const SVG_NS = "http://www.w3.org/2000/svg";

const REGION_COLOR_PALETTE = [
  "#b91c1c",
  "#b45309",
  "#047857",
  "#1d4ed8",
  "#6d28d9",
  "#be185d",
  "#0f766e",
  "#c2410c",
] as const;

type PreviewToggles = {
  region: boolean;
  level: boolean;
  dml: boolean;
  double: boolean;
  text: boolean;
};

type PreviewLabelItem = {
  lineId: string;
  text: string;
  ratio: number;
  fill: string;
};

type Props = {
  data: 高针图 | null;
  emptyText?: string;
  className?: string;
  hideDoubleToggle?: boolean;
};

function getRegionLineSort(
  item: 高针图["底图"]["区域线条"][number],
  fallback: number,
): number {
  const sort = typeof item.sort === "number" ? item.sort : Number(item.sort);
  if (!Number.isFinite(sort) || sort < 1) return fallback + 1;
  return Math.floor(sort);
}

function buildRegionColorByName(data: 高针图): Map<string, string> {
  const map = new Map<string, string>();
  const orderedNames = (data.底图.区域名 ?? [])
    .map((n) => String(n ?? "").trim())
    .filter(Boolean);
  orderedNames.forEach((name) => {
    if (map.has(name)) return;
    map.set(name, REGION_COLOR_PALETTE[map.size % REGION_COLOR_PALETTE.length]);
  });

  data.底图.区域线条.forEach((d) => {
    const regionName = String(d.区域名 ?? "").trim();
    if (!regionName || map.has(regionName)) return;
    map.set(regionName, REGION_COLOR_PALETTE[map.size % REGION_COLOR_PALETTE.length]);
  });

  return map;
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svgPt: any = svgRoot.createSVGPoint?.();
    if (svgPt) {
      svgPt.x = p.x;
      svgPt.y = p.y;
      const out = svgPt.matrixTransform(elScreen).matrixTransform(rootInv);
      return { x: out.x, y: out.y };
    }
  }

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

function buildPreviewLabels(
  data: 高针图,
  toggles: PreviewToggles,
  existingSvgTextIdSet: ReadonlySet<string>,
  regionColorByName: ReadonlyMap<string, string>,
): PreviewLabelItem[] {
  const doubleSet = makeDoubleSet(data.自定义数据.单双标注);

  const out: PreviewLabelItem[] = [];

  if (toggles.region) {
    const regionLineItems = new Map<
      string,
      Array<{ lineId: string; sort: number }>
    >();
    data.底图.区域线条.forEach((item, itemIndex) => {
      const regionName = String(item.区域名 ?? "").trim();
      const lineId = String(item.lineNodeId ?? "").trim();
      if (!regionName) return;
      if (!lineId) return;
      const list = regionLineItems.get(regionName) ?? [];
      list.push({
        lineId,
        sort: getRegionLineSort(item, itemIndex),
      });
      regionLineItems.set(regionName, list);
    });

    regionLineItems.forEach((items, regionName) => {
      if (items.length === 0) return;
      items.sort((a, b) => a.sort - b.sort);
      const anchor = items[Math.floor(items.length / 2)];
      out.push({
        lineId: anchor.lineId,
        text: regionName,
        ratio: 0.5,
        fill: regionColorByName.get(regionName) ?? "#475569",
      });
    });
  }

  data.底图.档位标注.forEach(({ 区域名, lineNodeIds, textNodeIds = [] }, index) => {
    if (!toggles.level) return;
    const levelText = getLevelMarkerText(
      parseLevelNo(String(区域名 ?? ""), index + 1),
    );
    lineNodeIds.forEach((lineId, lineIndex) => {
      const textNodeId = String(textNodeIds[lineIndex] ?? "").trim();
      if (textNodeId && existingSvgTextIdSet.has(textNodeId)) return;
      out.push({
        lineId,
        text: levelText,
        ratio: 0.5,
        fill: "#0f172a",
      });
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

export default function HighNeedlePreviewViewer({
  data,
  emptyText = "暂无高针图",
  className = "",
  hideDoubleToggle = false,
}: Props) {
  const regionColorByName = useMemo(
    () => (data ? buildRegionColorByName(data) : new Map<string, string>()),
    [data],
  );
  const [toggles, setToggles] = useState<PreviewToggles>({
    region: true,
    level: true,
    dml: true,
    double: true,
    text: true,
  });
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  const previewSvg = useMemo(() => {
    if (!data?.底图?.svg) return "";
    const allTextIds = collectSvgTextNodes(data.底图.svg).map((item) => item.id);
    const existingSvgTextIdSet = new Set(allTextIds);
    const dmlTextIds = allTextIds.filter((id) =>
      String(id ?? "").trim().startsWith("dml_text_"),
    );
    const levelTextIds = data.底图.档位标注.flatMap(({ textNodeIds = [] }) => {
      return textNodeIds.filter((textNodeId) =>
        existingSvgTextIdSet.has(String(textNodeId ?? "").trim()),
      );
    });
    const doubleTextIds = data.自定义数据.单双标注.map((item) =>
      String(item.textNodeId ?? "").trim(),
    );
    const markerTextIds = new Set(
      [...levelTextIds, ...doubleTextIds, ...dmlTextIds]
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
    if (toggles.dml) {
      dmlTextIds.forEach((id) => {
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

    let svg = pruneSvgTextNodes(data.底图.svg, Array.from(visibleTextIds));

    // 给各区域/档位/DML/单双线条施加颜色和加粗
    const regionStrokeById = new Map<string, string>();
    const allTouchIds: string[] = [];
    data.底图.区域线条.forEach((d) => {
      const regionName = String(d.区域名 ?? "").trim();
      const color = regionColorByName.get(regionName);
      const lineId = String(d.lineNodeId ?? "").trim();
      if (!lineId) return;
      allTouchIds.push(lineId);
      if (toggles.region && color) regionStrokeById.set(lineId, color);
    });

    const levelNoById = new Map<string, number>();
    data.底图.档位标注.forEach((d, idx) => {
      const match = String(d.区域名 ?? "")
        .trim()
        .match(/\d+/);
      const no = match ? Number(match[0]) : idx + 1;
      d.lineNodeIds.forEach((id) => {
        const lineId = String(id ?? "").trim();
        if (!lineId) return;
        if (!allTouchIds.includes(lineId)) allTouchIds.push(lineId);
        if (toggles.level && !toggles.region) {
          levelNoById.set(lineId, Number.isFinite(no) && no > 0 ? no : idx + 1);
        }
      });
    });

    const previewDml = makeDmlMap(data);
    const previewDouble = makeDoubleSet(data.自定义数据.单双标注);

    svg = decorateLines(svg, {
      touchIds: allTouchIds,
      regionStrokeById,
      levelNoById: levelNoById.size > 0 ? levelNoById : undefined,
      dmlById: previewDml,
      doubleById: previewDouble,
    });

    return svg;
  }, [data, regionColorByName, toggles]);

  const previewLabels = useMemo(() => {
    if (!data) return [];
    const existingSvgTextIdSet = new Set(
      collectSvgTextNodes(data.底图.svg).map((item) => item.id),
    );
    return buildPreviewLabels(data, toggles, existingSvgTextIdSet, regionColorByName);
  }, [data, regionColorByName, toggles]);

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
      group.appendChild(textEl);
    });
  }, [previewSvg, previewLabels]);

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">预览选项</div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={toggles.region}
              onChange={(e) =>
                setToggles((v) => ({ ...v, region: e.target.checked }))
              }
            />
            区域
          </label>
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
          {hideDoubleToggle ? null : (
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
          )}
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

      {data?.底图?.svg ? (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white p-3">
          <div ref={svgWrapRef} className="inline-block">
            <InlineSvg svg={previewSvg} className="max-w-full" height="auto" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}
