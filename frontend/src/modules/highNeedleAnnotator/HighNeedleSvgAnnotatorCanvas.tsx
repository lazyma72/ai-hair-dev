import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import type { DmlValue } from "./types";
import type { LayerToggles } from "./useHighNeedleSvgAnnotator";

function cssEscapeId(id: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(id);
  }
  return id.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function getEventLineId(
  target: EventTarget | null,
  lineSelector: string,
  allowedIds: Set<string>,
): string {
  const el = target instanceof Element ? target : null;
  if (!el) return "";

  const candidate = el.closest(lineSelector) as Element | null;
  const directId = (candidate?.getAttribute("id") ?? "").trim();
  if (directId && allowedIds.has(directId)) return directId;

  let cur: Element | null = el;
  while (cur) {
    const id = (cur.getAttribute("id") ?? "").trim();
    if (id && allowedIds.has(id)) return id;
    cur = cur.parentElement;
  }

  return "";
}

type Props = {
  step: "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";
  lineSelector: string;
  allLineIdSet: Set<string>;
  allTextIds: string[];
  renderSvg: string;
  previewValue: unknown;
  canvasEpoch: number;
  showPreview?: boolean;

  visibleMarkerById: Map<
    string,
    {
      regionNo?: number;
      regionTextNodeId?: string;
      levelNo?: number;
      levelTextNodeId?: string;
      dml?: DmlValue;
      dmlTextNodeId?: string;
      isDouble?: boolean;
      doubleTextNodeId?: string;
    }
  >;
  markerTextIdSet: Set<string>;
  draggableMarkerTextIdSet: Set<string>;

  regionLabels?: Array<{ name: string; color: string; lineIds: string[] }>;

  // 交互
  toggleSelect: (
    id: string,
    options?: { silent?: boolean; markerPos?: { x: number; y: number } },
  ) => void;
  handleLineAction: (
    id: string,
    options?: { markerPos?: { x: number; y: number } },
  ) => void;
  ensureLevelMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  ensureDmlMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;

  // 图层
  layerToggles: LayerToggles;
  setLayerToggles: React.Dispatch<React.SetStateAction<LayerToggles>>;

  // 文本阶段
  activeTextNodeId: string;
  onTextActivate: (textNodeId: string) => void;
  onTextPositionCommit: (
    textNodeId: string,
    pos: { x: number; y: number },
  ) => void;
};

type DragState = {
  textNodeId: string;
  textEl: SVGTextElement;
  svgRoot: SVGSVGElement;
  /** 鼠标按下时的客户端坐标（用于计算 screen delta） */
  startClientX: number;
  startClientY: number;
  /** 拖拽开始时文本锚点在父元素坐标系中的位置（x/y attrs + transform 全部考虑在内） */
  initialParentX: number;
  initialParentY: number;
  /** 父元素的屏幕 CTM（用于将 screen delta 转换为父坐标系 delta） */
  parentCTM: DOMMatrix;
  /** 文本元素原始 transform 属性值（拖拽预览时与偏移量组合） */
  originalTransform: string | null;
};

function readNumberAttr(value: string | null | undefined): number | null {
  if (!value) return null;
  const num = Number(value.trim().split(/[ ,]+/)[0]);
  return Number.isFinite(num) ? num : null;
}

/**
 * 返回文本元素锚点在父元素坐标系中的位置，通过 getScreenCTM() 精确计算。
 *
 * 锚点取优先级：text[x/y] > 第一个 tspan[x/y] > (0,0)
 * 这样可以正确处理：
 *   A. transform="translate" 定位（x/y=0）
 *   B. text[x/y] 定位
 *   C. tspan[x/y] 绝对定位（text 本身无 x/y）
 */
function getAnchorInParentSpace(
  el: SVGTextElement,
  svgRoot: SVGSVGElement,
): { pos: { x: number; y: number }; parentCTM: DOMMatrix } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elCTM: DOMMatrix | null = (el as any).getScreenCTM?.() ?? null;
  if (!elCTM) return null;

  const parentEl = el.parentElement as Element | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentCTM: DOMMatrix | null =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (parentEl as any)?.getScreenCTM?.() ?? svgRoot.getScreenCTM?.() ?? null;
  if (!parentCTM) return null;

  // tspan[0] 的绝对 x/y 在 SVG 中优先级高于 text 本身的 x/y
  // 必须与 setSvgTextNodePosition 的锚点计算逻辑保持一致
  const firstTspan = el.querySelector("tspan");
  const xAttr =
    readNumberAttr(firstTspan?.getAttribute("x")) ??
    readNumberAttr(el.getAttribute("x")) ??
    0;
  const yAttr =
    readNumberAttr(firstTspan?.getAttribute("y")) ??
    readNumberAttr(el.getAttribute("y")) ??
    0;

  // Transform the anchor point (x, y) from element local space → screen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pt: any = svgRoot.createSVGPoint?.();
  if (!pt) return null;
  pt.x = xAttr;
  pt.y = yAttr;
  const screenAnchor = pt.matrixTransform(elCTM);

  // Convert screen → parent local space
  const parentAnchor = screenAnchor.matrixTransform(parentCTM.inverse());

  return { pos: { x: parentAnchor.x, y: parentAnchor.y }, parentCTM };
}

/**
 * 将 screen 坐标增量转换为父元素坐标系中的增量（处理父元素含 scale/rotate 的情况）。
 */
function screenDeltaToParent(
  svgRoot: SVGSVGElement,
  parentCTM: DOMMatrix,
  screenDx: number,
  screenDy: number,
): { dx: number; dy: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pt: any = svgRoot.createSVGPoint?.();
  if (!pt) return { dx: screenDx, dy: screenDy };

  const inv = parentCTM.inverse();
  // Transform origin (to get the translation component)
  pt.x = 0;
  pt.y = 0;
  const origin = pt.matrixTransform(inv);
  // Transform the delta point
  pt.x = screenDx;
  pt.y = screenDy;
  const moved = pt.matrixTransform(inv);

  // Subtract origin to get pure vector delta (cancel out translation)
  return { dx: moved.x - origin.x, dy: moved.y - origin.y };
}

/** 以 2×3 affine 矩阵变换一个点（避免 createSVGPoint 开销）。 */
function applyMatrix(
  x: number,
  y: number,
  m: DOMMatrix,
): { x: number; y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}


function getSegmentIntersectionPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): { x: number; y: number } | null {
  const d1x = bx - ax;
  const d1y = by - ay;
  const d2x = dx - cx;
  const d2y = dy - cy;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null;

  const ex = cx - ax;
  const ey = cy - ay;
  const t = (ex * d2y - ey * d2x) / denom;
  const u = (ex * d1y - ey * d1x) / denom;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;

  return {
    x: ax + d1x * t,
    y: ay + d1y * t,
  };
}

/**
 * 每根线段的几何缓存：一组折线段坐标（SVG root 用户空间），
 * 格式 [x1, y1, x2, y2]。
 */
type LineSegment4 = readonly [number, number, number, number];
type LineGeometryCache = Map<string, LineSegment4[]>;

function clientToSvgPoint(
  svgRoot: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svgRoot.getScreenCTM?.();
  if (!ctm) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pt: any = svgRoot.createSVGPoint?.();
  if (!pt) return null;
  pt.x = clientX;
  pt.y = clientY;
  const result = pt.matrixTransform(ctm.inverse());
  return { x: result.x, y: result.y };
}

function scaleSvgViewport(svg: string, scale: number): string {
  if (!svg || Math.abs(scale - 1) < 1e-6) return svg;

  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = doc.documentElement;
    if (root.tagName.toLowerCase() !== "svg") return svg;

    const viewBox = (root.getAttribute("viewBox") ?? "").trim();
    const viewBoxParts = viewBox
      .split(/[ ,]+/)
      .map((part) => Number(part))
      .filter((part) => Number.isFinite(part));
    const fallbackWidth = viewBoxParts.length === 4 ? viewBoxParts[2] : null;
    const fallbackHeight = viewBoxParts.length === 4 ? viewBoxParts[3] : null;

    const scaleAttr = (attr: "width" | "height", fallback: number | null) => {
      const raw = (root.getAttribute(attr) ?? "").trim();
      const match = raw.match(/^(-?\d*\.?\d+)([a-zA-Z%]*)$/);

      if (match) {
        const value = Number(match[1]);
        const unit = match[2] ?? "";
        if (Number.isFinite(value) && unit !== "%") {
          root.setAttribute(attr, `${value * scale}${unit}`);
          return;
        }
      }

      if (fallback && fallback > 0) {
        root.setAttribute(attr, String(fallback * scale));
      }
    };

    scaleAttr("width", fallbackWidth);
    scaleAttr("height", fallbackHeight);

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

export default function HighNeedleSvgAnnotatorCanvas({
  step,
  lineSelector,
  allLineIdSet,
  allTextIds,
  renderSvg,
  previewValue,
  canvasEpoch,
  showPreview,
  visibleMarkerById,
  markerTextIdSet,
  draggableMarkerTextIdSet,
  regionLabels,
  toggleSelect,
  handleLineAction,
  ensureLevelMarkerTextNode,
  ensureDmlMarkerTextNode,
  layerToggles,
  setLayerToggles,
  activeTextNodeId,
  onTextActivate,
  onTextPositionCommit,
}: Props) {
  const [svgScale, setSvgScale] = useState(1);
  const scaledRenderSvg = useMemo(
    () => scaleSvgViewport(renderSvg, svgScale),
    [renderSvg, svgScale],
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const zoomAnchorRef = useRef<{
    contentX: number;
    contentY: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  // 根据图层开关过滤标记
  const filteredMarkerById = useMemo(() => {
    const out = new Map<
      string,
      {
        regionNo?: number;
        regionTextNodeId?: string;
        levelNo?: number;
        levelTextNodeId?: string;
        dml?: DmlValue;
        dmlTextNodeId?: string;
        isDouble?: boolean;
        doubleTextNodeId?: string;
      }
    >();
    visibleMarkerById.forEach((marks, id) => {
      const filtered: typeof marks = {};
      if (
        layerToggles.region &&
        typeof marks.regionNo === "number" &&
        !marks.regionTextNodeId
      ) {
        filtered.regionNo = marks.regionNo;
      }
      if (
        layerToggles.level &&
        typeof marks.levelNo === "number" &&
        !marks.levelTextNodeId
      )
        filtered.levelNo = marks.levelNo;
      if (layerToggles.dml && marks.dml && !marks.dmlTextNodeId) {
        filtered.dml = marks.dml;
      }
      if (layerToggles.double && marks.isDouble && !marks.doubleTextNodeId) {
        filtered.isDouble = true;
      }
      if (Object.keys(filtered).length > 0) out.set(id, filtered);
    });
    return out;
  }, [layerToggles, visibleMarkerById]);

  const allTextIdSet = useMemo(() => new Set(allTextIds), [allTextIds]);

  const brushRef = useRef(false);
  const brushVisitedRef = useRef<Set<string>>(new Set());
  const brushLastPointRef = useRef<{ x: number; y: number } | null>(null);

  /** 几何缓存：各线段在 SVG root 用户空间中的折线段列表，renderSvg 变化后重建。 */
  const geomCacheRef = useRef<LineGeometryCache>(new Map());
  /** 刷选描边叠加层 canvas。 */
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);

  const dragRef = useRef<DragState | null>(null);
  const pendingAutoLevelTextNodeIdsRef = useRef<Set<string>>(new Set());
  const pendingAutoDmlTextNodeIdsRef = useRef<Set<string>>(new Set());

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [anchorById, setAnchorById] = useState<
    Map<string, { x: number; y: number; perpX: number; perpY: number }>
  >(() => new Map());
  const [regionLabelPosByName, setRegionLabelPosByName] = useState<
    Map<string, { x: number; y: number }>
  >(() => new Map());

  const [activeTextBox, setActiveTextBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const resetBrushState = React.useCallback(() => {
    brushRef.current = false;
    brushVisitedRef.current = new Set();
    brushLastPointRef.current = null;

    // 清空刷选描边叠加层
    const canvas = brushCanvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const anchor = zoomAnchorRef.current;
    if (!viewport || !anchor) return;

    const rect = viewport.getBoundingClientRect();
    viewport.scrollLeft =
      anchor.contentX * svgScale - (anchor.clientX - rect.left);
    viewport.scrollTop =
      anchor.contentY * svgScale - (anchor.clientY - rect.top);
    zoomAnchorRef.current = null;
  }, [svgScale]);

  /**
   * 在 DOM 更新（renderSvg 变化）后，把所有线条元素的几何数据采样到
   * SVG root 用户空间的 LineGeometryCache，供刷选时的相交检测使用。
   */
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const raf = requestAnimationFrame(() => {
      const cache: LineGeometryCache = new Map();

      for (const id of allLineIdSet) {
        const el = wrap.querySelector<SVGGeometryElement>(
          `#${cssEscapeId(id)}`,
        );
        if (!el || typeof el.getTotalLength !== "function") continue;

        const elCTM = el.getScreenCTM();
        if (!elCTM) continue;

        // element local space → client pixel space (directly, no rootInv needed).
        // Storing in client-pixel space means the intersection test uses the same
        // coordinate system as e.clientX/Y without any further conversion, so a
        // stale rootCTM after SVG re-render never causes a mismatch.
        const localToClient = elCTM;

        const totalLen = el.getTotalLength();
        // 用元素屏幕 bbox 对角线近似估算采样数，保证足够密度
        const bbox = el.getBoundingClientRect();
        const screenDiag = Math.hypot(bbox.width, bbox.height);
        const numPts = Math.max(4, Math.min(200, Math.ceil(screenDiag / 3)));

        const segments: LineSegment4[] = [];
        let prev: { x: number; y: number } | null = null;

        for (let i = 0; i <= numPts; i++) {
          const lp = el.getPointAtLength((i / numPts) * totalLen);
          const sp = applyMatrix(lp.x, lp.y, localToClient);
          if (prev) segments.push([prev.x, prev.y, sp.x, sp.y]);
          prev = sp;
        }

        if (segments.length > 0) cache.set(id, segments);
      }

      geomCacheRef.current = cache;
    });

    return () => cancelAnimationFrame(raf);
  }, [scaledRenderSvg, allLineIdSet]);

  /** 保证 canvas 尺寸始终与内层包裹 div 一致（device-pixel-ratio 无关）。 */
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const canvas = brushCanvasRef.current;
    if (!wrap || !canvas) return;

    const sync = () => {
      canvas.width = wrap.offsetWidth;
      canvas.height = wrap.offsetHeight;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", resetBrushState);
    return () => window.removeEventListener("mouseup", resetBrushState);
  }, [resetBrushState]);

  useEffect(() => {
    resetBrushState();
  }, [canvasEpoch, resetBrushState]);

  useEffect(() => {
    let hasMoved = false;

    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      hasMoved = true;

      const { dx, dy } = screenDeltaToParent(
        drag.svgRoot,
        drag.parentCTM,
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY,
      );

      // 组合原始 transform + 偏移量进行预览，不修改 x/y/tspan 结构
      const origT = drag.originalTransform ? ` ${drag.originalTransform}` : "";
      drag.textEl.setAttribute("transform", `translate(${dx},${dy})${origT}`);
    };

    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (hasMoved) {
        const { dx, dy } = screenDeltaToParent(
          drag.svgRoot,
          drag.parentCTM,
          e.clientX - drag.startClientX,
          e.clientY - drag.startClientY,
        );

        // 提交：初始锚点位置 + 父坐标系 delta
        onTextPositionCommit(drag.textNodeId, {
          x: drag.initialParentX + dx,
          y: drag.initialParentY + dy,
        });
        drag.textEl.removeAttribute("transform");
      }
      hasMoved = false;
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onTextPositionCommit]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const ids = Array.from(visibleMarkerById.keys());
    if (ids.length === 0) {
      setAnchorById((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const svgRoot = wrap.querySelector<SVGSVGElement>("svg");
      const next = new Map<
        string,
        { x: number; y: number; perpX: number; perpY: number }
      >();

      for (const id of ids) {
        const el = wrap.querySelector<SVGGraphicsElement>(
          `#${cssEscapeId(id)}`,
        );
        if (!el) continue;

        // Use getPointAtLength midpoint for path/polyline/polygon/line so that
        // arc-shaped elements get a marker that sits ON the curve, not at the
        // bounding-box centre (which floats inside the arc).
        const geom = el as unknown as SVGGeometryElement;
        if (svgRoot && typeof geom.getTotalLength === "function") {
          const total = geom.getTotalLength();
          const t = total / 2;
          const mid = geom.getPointAtLength(t);

          // Compute tangent direction at midpoint using tiny forward/back step,
          // then derive the perpendicular unit vector (for stagger offset).
          const eps = Math.min(1, total * 0.01);
          const pA = geom.getPointAtLength(Math.max(0, t - eps));
          const pB = geom.getPointAtLength(Math.min(total, t + eps));
          const tdx = pB.x - pA.x;
          const tdy = pB.y - pA.y;
          const tlen = Math.hypot(tdx, tdy);
          // perpendicular in SVG local space (rotate tangent 90°)
          const localPerpX = tlen > 1e-6 ? -tdy / tlen : 0;
          const localPerpY = tlen > 1e-6 ? tdx / tlen : 1;

          const ctm = (el as SVGGraphicsElement).getScreenCTM?.();
          if (ctm) {
            const pt = svgRoot.createSVGPoint();
            pt.x = mid.x;
            pt.y = mid.y;
            const screenMid = pt.matrixTransform(ctm);

            // Transform perp vector (direction only — subtract mapped origin)
            pt.x = 0;
            pt.y = 0;
            const screenOrigin = pt.matrixTransform(ctm);
            pt.x = localPerpX;
            pt.y = localPerpY;
            const screenPerpPt = pt.matrixTransform(ctm);
            const spx = screenPerpPt.x - screenOrigin.x;
            const spy = screenPerpPt.y - screenOrigin.y;
            const splen = Math.hypot(spx, spy);

            next.set(id, {
              x: screenMid.x - wrapRect.left,
              y: screenMid.y - wrapRect.top,
              perpX: splen > 1e-6 ? spx / splen : 0,
              perpY: splen > 1e-6 ? spy / splen : 1,
            });
            continue;
          }
        }

        // Fallback: bounding-box centre for elements without path geometry
        const rect = el.getBoundingClientRect();
        next.set(id, {
          x: rect.left - wrapRect.left + rect.width / 2,
          y: rect.top - wrapRect.top + rect.height / 2,
          perpX: 0,
          perpY: 1,
        });
      }

      const approxEqual = (a: number, b: number) => Math.abs(a - b) <= 0.25;
      const isSameAnchorMap = (
        prev: Map<string, { x: number; y: number; perpX: number; perpY: number }>,
        nextMap: Map<string, { x: number; y: number; perpX: number; perpY: number }>,
      ) => {
        if (prev.size !== nextMap.size) return false;
        for (const [key, v] of prev) {
          const nv = nextMap.get(key);
          if (!nv) return false;
          if (!approxEqual(v.x, nv.x)) return false;
          if (!approxEqual(v.y, nv.y)) return false;
          if (!approxEqual(v.perpX, nv.perpX)) return false;
          if (!approxEqual(v.perpY, nv.perpY)) return false;
        }
        return true;
      };

      setAnchorById((prev) => (isSameAnchorMap(prev, next) ? prev : next));
    });

    return () => window.cancelAnimationFrame(raf);
  }, [scaledRenderSvg, visibleMarkerById]);

  useEffect(() => {
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.levelNo === "number" && marks.levelTextNodeId) {
        pendingAutoLevelTextNodeIdsRef.current.delete(id);
      }
      if (!marks.dml || !marks.dmlTextNodeId) return;
      pendingAutoDmlTextNodeIdsRef.current.delete(id);
    });
  }, [visibleMarkerById]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.levelNo !== "number" || marks.levelTextNodeId) return;
      if (pendingAutoLevelTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      if (!anchor) return;

      const pos = clientToSvgPoint(
        svgRoot,
        wrapRect.left + anchor.x,
        wrapRect.top + anchor.y,
      );
      if (!pos) return;

      pendingAutoLevelTextNodeIdsRef.current.add(id);
      ensureLevelMarkerTextNode(id, pos);
    });
  }, [anchorById, ensureLevelMarkerTextNode, visibleMarkerById]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (!marks.dml || marks.dmlTextNodeId) return;
      if (pendingAutoDmlTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      if (!anchor) return;

      const pos = clientToSvgPoint(
        svgRoot,
        wrapRect.left + anchor.x,
        wrapRect.top + anchor.y,
      );
      if (!pos) return;

      pendingAutoDmlTextNodeIdsRef.current.add(id);
      ensureDmlMarkerTextNode(id, pos);
    });
  }, [anchorById, ensureDmlMarkerTextNode, visibleMarkerById]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    if (!layerToggles.region || !regionLabels || regionLabels.length === 0) {
      setRegionLabelPosByName((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const next = new Map<string, { x: number; y: number }>();

      regionLabels.forEach((label) => {
        const points: Array<{ x: number; y: number }> = [];
        label.lineIds.forEach((id) => {
          const el = wrap.querySelector<SVGGraphicsElement>(
            `#${cssEscapeId(id)}`,
          );
          if (!el) return;
          const rect = el.getBoundingClientRect();
          points.push({
            x: rect.left - wrapRect.left + rect.width / 2,
            y: rect.top - wrapRect.top + rect.height / 2,
          });
        });

        if (points.length === 0) return;
        const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        next.set(label.name, { x, y });
      });

      setRegionLabelPosByName(next);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [scaledRenderSvg, regionLabels, layerToggles.region]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    if (!activeTextNodeId || step !== "自定义文本") {
      setActiveTextBox(null);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const el = wrap.querySelector<SVGGraphicsElement>(
        `#${cssEscapeId(activeTextNodeId)}`,
      );
      if (!el) {
        setActiveTextBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setActiveTextBox({
        left: rect.left - wrapRect.left,
        top: rect.top - wrapRect.top,
        width: rect.width,
        height: rect.height,
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [activeTextNodeId, scaledRenderSvg, step]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const textEls = Array.from(wrap.querySelectorAll<SVGTextElement>("text"));
    textEls.forEach((el) => {
      const id = (el.getAttribute("id") ?? "").trim();
      if (!id) return;

      const canDrag =
        draggableMarkerTextIdSet.has(id) ||
        (step === "自定义文本" && !markerTextIdSet.has(id));

      el.style.setProperty(
        "pointer-events",
        canDrag ? "auto" : "none",
        "important",
      );
      if (canDrag) {
        el.style.setProperty("cursor", "move", "important");
      } else {
        el.style.removeProperty("cursor");
      }
    });
  }, [draggableMarkerTextIdSet, markerTextIdSet, scaledRenderSvg, step]);

  function getLineIdFromPoint(clientX: number, clientY: number): string {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const id = getEventLineId(el, lineSelector, allLineIdSet);
      if (id) return id;
    }
    return "";
  }

  function getTextIdFromPoint(clientX: number, clientY: number): string {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const id = getEventLineId(el, "text", allTextIdSet);
      if (id) return id;
    }
    return "";
  }

  // Stagger ±18 px perpendicular to each line's tangent direction so that
  // badges for adjacent/parallel lines land on alternating sides.
  //
  // Region/level markers: alternate by their sequence number (odd ↔ even).
  // DML/double markers:   no sequence number → sort spatially by anchor.x
  //                       then alternate by that sorted index, which keeps
  //                       neighbouring strands on opposite sides.
  const staggerOffsetById = useMemo(() => {
    const DIST = 18;
    const m = new Map<string, { dx: number; dy: number }>();

    // Separate markers that have a sequence number from those that don't.
    const numbered: Array<{ id: string; no: number }> = [];
    const unnumbered: Array<{ id: string }> = [];

    filteredMarkerById.forEach((marks, id) => {
      const no = marks.regionNo ?? marks.levelNo;
      if (typeof no === "number") {
        numbered.push({ id, no });
      } else {
        unnumbered.push({ id });
      }
    });

    // Numbered: use the sequence number itself for odd/even alternation.
    numbered.forEach(({ id, no }) => {
      const anchor = anchorById.get(id);
      const sign = no % 2 === 1 ? -DIST : DIST;
      m.set(id, {
        dx: (anchor?.perpX ?? 0) * sign,
        dy: (anchor?.perpY ?? 1) * sign,
      });
    });

    // Unnumbered (DML, double): sort by anchor.x then alternate by index.
    unnumbered
      .sort((a, b) => {
        const ax = anchorById.get(a.id)?.x ?? 0;
        const bx = anchorById.get(b.id)?.x ?? 0;
        return ax - bx;
      })
      .forEach(({ id }, idx) => {
        const anchor = anchorById.get(id);
        const sign = idx % 2 === 0 ? -DIST : DIST;
        m.set(id, {
          dx: (anchor?.perpX ?? 0) * sign,
          dy: (anchor?.perpY ?? 1) * sign,
        });
      });

    return m;
  }, [anchorById, filteredMarkerById]);

  const wrapExtraClass = "";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">SVG 画布</div>
        <div className="flex flex-wrap items-center gap-3">
          {(
            [
              { key: "region", label: "区域" },
              { key: "level", label: "档位" },
              { key: "dml", label: "DML" },
              { key: "double", label: "单双" },
              { key: "text", label: "文本" },
              { key: "rawLines", label: "原线条" },
            ] as const
          ).map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-900 select-none"
            >
              <input
                type="checkbox"
                className="accent-slate-700"
                checked={layerToggles[key]}
                onChange={(e) =>
                  setLayerToggles((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            <button
              type="button"
              className="rounded px-1 font-semibold text-slate-700 hover:bg-slate-200"
              onClick={() => {
                zoomAnchorRef.current = null;
                setSvgScale((prev) => Math.max(1, prev - 0.25));
              }}
            >
              -
            </button>
            <span className="min-w-11 text-center font-semibold">
              {Math.round(svgScale * 100)}%
            </span>
            <button
              type="button"
              className="rounded px-1 font-semibold text-slate-700 hover:bg-slate-200"
              onClick={() => {
                zoomAnchorRef.current = null;
                setSvgScale((prev) => Math.min(3, prev + 0.25));
              }}
            >
              +
            </button>
          </div>
          <span className="text-xs text-slate-400">
            拖拽批量勾选 / Ctrl+滚轮缩放
          </span>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`mt-3 min-h-0 flex-1 select-none overflow-auto rounded-xl border border-slate-100 bg-white p-3 ${wrapExtraClass}`}
        onWheel={(e) => {
          if (!e.ctrlKey) return;
          const viewport = viewportRef.current;
          if (!viewport) return;

          e.preventDefault();

          const rect = viewport.getBoundingClientRect();
          const contentX =
            (e.clientX - rect.left + viewport.scrollLeft) /
            Math.max(svgScale, 0.01);
          const contentY =
            (e.clientY - rect.top + viewport.scrollTop) /
            Math.max(svgScale, 0.01);
          const zoomFactor = Math.exp(-e.deltaY * 0.0015);

          zoomAnchorRef.current = {
            contentX,
            contentY,
            clientX: e.clientX,
            clientY: e.clientY,
          };
          setSvgScale((prev) => {
            const next = Math.min(3, Math.max(1, prev * zoomFactor));
            if (Math.abs(next - prev) < 1e-6) {
              zoomAnchorRef.current = null;
            }
            return next;
          });
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();

          const wrap = canvasWrapRef.current;
          const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
          const textId = getTextIdFromPoint(e.clientX, e.clientY);
          const isMarkerText = textId ? markerTextIdSet.has(textId) : false;
          const isDraggableMarkerText = textId
            ? draggableMarkerTextIdSet.has(textId)
            : false;

          if (
            textId &&
            (isDraggableMarkerText || (step === "自定义文本" && !isMarkerText))
          ) {
            const id = textId;
            if (!id) return;

            if (step === "自定义文本" && !isMarkerText) {
              onTextActivate(id);
            }

            const textEl = wrap?.querySelector<SVGTextElement>(
              `#${cssEscapeId(id)}`,
            );
            if (!svgRoot || !textEl) return;

            const anchorResult = getAnchorInParentSpace(textEl, svgRoot);
            if (!anchorResult) return;

            const nextDragState: DragState = {
              textNodeId: id,
              textEl,
              svgRoot,
              startClientX: e.clientX,
              startClientY: e.clientY,
              initialParentX: anchorResult.pos.x,
              initialParentY: anchorResult.pos.y,
              parentCTM: anchorResult.parentCTM,
              originalTransform: textEl.getAttribute("transform"),
            };

            dragRef.current = nextDragState;

            return;
          }

          // 区域/档位阶段支持“刷选”；DML/单双阶段仅允许点击写入
          if (step === "DML" || step === "单双" || step === "自定义文本")
            return;

          brushRef.current = true;
          brushVisitedRef.current = new Set();
          brushLastPointRef.current = { x: e.clientX, y: e.clientY };

          // 初始点击：使用浏览器原生命中测试（尊重 stroke-width，不会误选相邻线条）
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (id) {
            brushVisitedRef.current.add(id);
            toggleSelect(id, {
              silent: true,
              markerPos:
                step === "档位" && svgRoot
                  ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ??
                    undefined)
                  : undefined,
            });
          }
        }}
        onMouseUp={resetBrushState}
        onMouseLeave={resetBrushState}
        onMouseMove={(e) => {
          if (!brushRef.current) return;
          if (step === "DML" || step === "单双" || step === "自定义文本")
            return;
          if ((e.buttons & 1) === 0) return;

          const prev = brushLastPointRef.current;
          const cur = { x: e.clientX, y: e.clientY };
          brushLastPointRef.current = cur;

          // ── 绘制刷选描边叠加层 ──────────────────────────────────────
          const canvas = brushCanvasRef.current;
          const wrap2 = canvasWrapRef.current;
          if (canvas && wrap2 && prev) {
            const wrapRect = wrap2.getBoundingClientRect();
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.strokeStyle = "rgba(99,102,241,0.75)";
              ctx.lineWidth = 2;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.beginPath();
              ctx.moveTo(prev.x - wrapRect.left, prev.y - wrapRect.top);
              ctx.lineTo(cur.x - wrapRect.left, cur.y - wrapRect.top);
              ctx.stroke();
            }
          }

          if (!prev) return;

          // ── 几何相交检测（缓存与鼠标坐标均为 client 像素，无需转换）──────
          for (const [id, segs] of geomCacheRef.current) {
            if (brushVisitedRef.current.has(id)) continue;
            for (const [ax, ay, bx, by] of segs) {
              const intersection = getSegmentIntersectionPoint(
                prev.x,
                prev.y,
                cur.x,
                cur.y,
                ax,
                ay,
                bx,
                by,
              );
              if (intersection) {
                brushVisitedRef.current.add(id);
                const svgRoot = wrap2?.querySelector<SVGSVGElement>("svg");
                toggleSelect(id, {
                  silent: true,
                  markerPos:
                    step === "档位" && svgRoot
                      ? (clientToSvgPoint(
                          svgRoot,
                          intersection.x,
                          intersection.y,
                        ) ?? undefined)
                      : undefined,
                });
                break;
              }
            }
          }
        }}
        onClick={(e) => {
          // DML/单双阶段：点击即写入
          if (step !== "单双") return;
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          const wrap = canvasWrapRef.current;
          const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
          if (id) {
            handleLineAction(id, {
              markerPos: svgRoot
                ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ?? undefined)
                : undefined,
            });
          }
        }}
        onContextMenu={(e) => {
          if (step !== "DML") return;

          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (!id) return;

          e.preventDefault();

          const wrap = canvasWrapRef.current;
          const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
          handleLineAction(id, {
            markerPos: svgRoot
              ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ?? undefined)
              : undefined,
          });
        }}
      >
        <div ref={canvasWrapRef} className="relative inline-block">
          <InlineSvg
            key={`${canvasEpoch}_${svgScale}`}
            svg={scaledRenderSvg}
            className="max-w-full"
            height="auto"
          />

          {/* 刷选描边叠加层（不影响交互） */}
          <canvas
            ref={brushCanvasRef}
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: 10 }}
          />

          {activeTextBox ? (
            <div
              className="pointer-events-none absolute rounded border-2 border-blue-500"
              style={{
                left: activeTextBox.left - 4,
                top: activeTextBox.top - 4,
                width: activeTextBox.width + 8,
                height: activeTextBox.height + 8,
              }}
            />
          ) : null}

          <div className="pointer-events-none absolute inset-0">
            {layerToggles.region
              ? (regionLabels ?? []).map((label) => {
                  const pos = regionLabelPosByName.get(label.name);
                  if (!pos) return null;

                  return (
                    <div
                      key={`region_${label.name}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: pos.x, top: pos.y }}
                    >
                      <div
                        className="rounded px-2 py-0.5 text-[11px] font-semibold text-white shadow"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </div>
                    </div>
                  );
                })
              : null}

            {Array.from(filteredMarkerById.entries()).map(([id, marks]) => {
              const pos = anchorById.get(id);
              if (!pos) return null;
              const stagger = staggerOffsetById.get(id) ?? { dx: 0, dy: 0 };

              return (
                <div
                  key={id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pos.x + stagger.dx, top: pos.y + stagger.dy }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {typeof marks.regionNo === "number" ? (
                      <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-semibold leading-none text-white shadow">
                        {marks.regionNo}
                      </div>
                    ) : null}
                    {typeof marks.levelNo === "number" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white shadow">
                        {marks.levelNo}
                      </div>
                    ) : null}
                    {marks.dml ? (
                      <div className="rounded bg-black px-1 py-px text-[8px] font-bold leading-none text-white shadow">
                        {marks.dml}
                      </div>
                    ) : null}
                    {marks.isDouble ? (
                      <div className="rounded bg-amber-700 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                        双
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showPreview !== false ? (
        <div className="mt-4 min-h-0 shrink-0">
          <div className="mb-1 text-xs font-medium text-slate-600">
            结构化数据预览
          </div>
          <pre className="max-h-[220px] overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
            {JSON.stringify(previewValue, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
