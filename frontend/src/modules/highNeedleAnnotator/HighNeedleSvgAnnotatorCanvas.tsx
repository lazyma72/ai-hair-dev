import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import type { DmlValue } from "./types";
import type { LayerToggles } from "./useHighNeedleSvgAnnotator";

const BRUSH_HIT_OFFSETS = [
  { x: 0, y: 0 },
  { x: -4, y: 0 },
  { x: 4, y: 0 },
  { x: 0, y: -4 },
  { x: 0, y: 4 },
  { x: -3, y: -3 },
  { x: -3, y: 3 },
  { x: 3, y: -3 },
  { x: 3, y: 3 },
] as const;

function reportDoubleMarkDragDebug(
  hypothesisId: "A" | "B" | "C" | "D",
  location: string,
  msg: string,
  data: Record<string, unknown>,
) {
  // #region debug-point shared:report
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "double-mark-drag",
      runId: "pre-fix",
      hypothesisId,
      location,
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function reportHighNeedleLagDebug(
  hypothesisId: "A" | "B" | "C" | "D" | "E",
  location: string,
  msg: string,
  data: Record<string, unknown>,
) {
  // #region debug-point shared:report-high-needle-lag
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "high-needle-lag",
      runId: "pre-fix",
      hypothesisId,
      location,
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

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
  preferredDmlPosByLineId: Map<string, { x: number; y: number }>;
  preferredMarkerPosByLineId: Map<string, { x: number; y: number }>;
  draftMarkerPosByLineId: Map<string, { x: number; y: number }>;
  dmlMarkerPosByLineId: Map<string, { x: number; y: number }>;
  pendingDmlMarkerPosByLineId: Map<string, { x: number; y: number }>;

  visibleMarkerById: Map<
    string,
    {
      regionNo?: number;
      regionTextNodeId?: string;
      regionColor?: string;
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
  ensureRegionMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  ensureLevelMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  ensureDmlMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  ensureDoubleMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;

  // 图层
  layerToggles: LayerToggles;
  setLayerToggles: React.Dispatch<React.SetStateAction<LayerToggles>>;

  // 文本阶段
  activeTextNodeId: string;
  activeTextKey: string;
  setActiveTextKey: (key: string) => void;
  onTextActivate: (textNodeId: string) => void;
  onTextPositionCommit: (
    textNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  onTextRemove: (key: string) => void;
  onTextStyleChange: (key: string, patch: Record<string, unknown>) => void;
  textNodeMap: Record<string, { textNodeId: string; text?: string; fontStyle?: Record<string, unknown> }>;
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

function svgToWrapPoint(
  svgRoot: SVGSVGElement,
  wrapRect: DOMRect,
  pos: { x: number; y: number },
): { x: number; y: number } | null {
  const ctm = svgRoot.getScreenCTM?.();
  if (!ctm) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pt: any = svgRoot.createSVGPoint?.();
  if (!pt) return null;
  pt.x = pos.x;
  pt.y = pos.y;
  const result = pt.matrixTransform(ctm);
  return { x: result.x - wrapRect.left, y: result.y - wrapRect.top };
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

function getLineIdsFromPoint(
  clientX: number,
  clientY: number,
  lineSelector: string,
  allowedIds: Set<string>,
): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const offset of BRUSH_HIT_OFFSETS) {
    const elements = document.elementsFromPoint(
      clientX + offset.x,
      clientY + offset.y,
    );
    for (const el of elements) {
      const id = getEventLineId(el, lineSelector, allowedIds);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
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
  preferredDmlPosByLineId,
  preferredMarkerPosByLineId,
  draftMarkerPosByLineId,
  dmlMarkerPosByLineId,
  pendingDmlMarkerPosByLineId,
  visibleMarkerById,
  markerTextIdSet,
  draggableMarkerTextIdSet,
  regionLabels,
  toggleSelect,
  handleLineAction,
  ensureRegionMarkerTextNode,
  ensureLevelMarkerTextNode,
  ensureDmlMarkerTextNode,
  ensureDoubleMarkerTextNode,
  layerToggles,
  setLayerToggles,
  activeTextNodeId,
  activeTextKey,
  setActiveTextKey,
  onTextActivate,
  onTextPositionCommit,
  onTextRemove,
  onTextStyleChange,
  textNodeMap,
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
        regionColor?: string;
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
        step === "区域" &&
        typeof marks.regionNo === "number" &&
        !marks.regionTextNodeId
      ) {
        filtered.regionNo = marks.regionNo;
        filtered.regionColor = marks.regionColor;
      }
      if (
        layerToggles.level &&
        typeof marks.levelNo === "number" &&
        !marks.levelTextNodeId
      )
        filtered.levelNo = marks.levelNo;
      if (layerToggles.dml && marks.dml && !marks.dmlTextNodeId && step !== "DML") {
        filtered.dml = marks.dml;
      }
      if (layerToggles.double && marks.isDouble && !marks.doubleTextNodeId) {
        filtered.isDouble = true;
      }
      if (Object.keys(filtered).length > 0) out.set(id, filtered);
    });
    return out;
  }, [layerToggles, step, visibleMarkerById]);

  const allTextIdSet = useMemo(() => new Set(allTextIds), [allTextIds]);

  const brushRef = useRef(false);
  const brushVisitedRef = useRef<Set<string>>(new Set());
  const brushLastPointRef = useRef<{ x: number; y: number } | null>(null);

  /** 刷选描边叠加层 canvas。 */
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);

  const dragRef = useRef<DragState | null>(null);
  const renderSampleRef = useRef(0);
  const dragMoveSampleRef = useRef(0);
  const brushMoveSampleRef = useRef(0);
  const pendingAutoRegionTextNodeIdsRef = useRef<Set<string>>(new Set());
  const pendingAutoLevelTextNodeIdsRef = useRef<Set<string>>(new Set());
  const pendingAutoDmlTextNodeIdsRef = useRef<Set<string>>(new Set());
  const pendingAutoDoubleTextNodeIdsRef = useRef<Set<string>>(new Set());

  // --- 文本缩放拖拽手柄 ---
  const resizeRef = useRef<{
    startY: number;
    startFontSize: number;
    key: string;
  } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rs = resizeRef.current;
      if (!rs) return;
      const deltaY = rs.startY - e.clientY; // 向上拖 → 放大
      const scaleFactor = 1 + deltaY / 80;
      const nextSize = Math.round(
        Math.max(4, Math.min(200, rs.startFontSize * scaleFactor)),
      );
      onTextStyleChange(rs.key, { fontSize: nextSize });
    };
    const onUp = () => {
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onTextStyleChange]);

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

  // #region debug-point A:canvas-render-sample
  renderSampleRef.current += 1;
  useEffect(() => {
    if (renderSampleRef.current % 20 !== 0) return;
    reportHighNeedleLagDebug(
      "A",
      "HighNeedleSvgAnnotatorCanvas:render",
      "canvas render sample",
      {
        step,
        renderCount: renderSampleRef.current,
        markerCount: visibleMarkerById.size,
        filteredMarkerCount: filteredMarkerById.size,
        activeTextNodeId,
      },
    );
  });
  // #endregion

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

  const markerLineIdByTextId = useMemo(() => {
    const map = new Map<string, string>();
    visibleMarkerById.forEach((marks, lineId) => {
      if (marks.regionTextNodeId) map.set(marks.regionTextNodeId, lineId);
      if (marks.levelTextNodeId) map.set(marks.levelTextNodeId, lineId);
      if (marks.dmlTextNodeId) map.set(marks.dmlTextNodeId, lineId);
      if (marks.doubleTextNodeId) map.set(marks.doubleTextNodeId, lineId);
    });
    return map;
  }, [visibleMarkerById]);

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
    const handleWindowMouseMove = (e: MouseEvent) => {
      processBrushMove(e.clientX, e.clientY, e.buttons);
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  });

  useEffect(() => {
    resetBrushState();
  }, [canvasEpoch, resetBrushState]);

  // Delete / Backspace 快捷键删除选中文本
  useEffect(() => {
    if (step !== "自定义文本" || !activeTextKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // 排除用户正在输入框中
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onTextRemove(activeTextKey);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, activeTextKey, onTextRemove]);

  const dragHasMovedRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const startedAt = performance.now();
      const moveDistance = Math.hypot(
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY,
      );
      if (moveDistance < 3) return;
      dragHasMovedRef.current = true;
      // #region debug-point D:drag-move
      reportDoubleMarkDragDebug("D", "HighNeedleSvgAnnotatorCanvas:onMove", "marker drag move", {
        step,
        textNodeId: drag.textNodeId,
        moveDistance,
      });
      // #endregion

      const { dx, dy } = screenDeltaToParent(
        drag.svgRoot,
        drag.parentCTM,
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY,
      );

      // 组合原始 transform + 偏移量进行预览，不修改 x/y/tspan 结构
      const origT = drag.originalTransform ? ` ${drag.originalTransform}` : "";
      drag.textEl.setAttribute("transform", `translate(${dx},${dy})${origT}`);

      // #region debug-point C:drag-move-perf
      dragMoveSampleRef.current += 1;
      const durationMs = performance.now() - startedAt;
      if (durationMs >= 4 || dragMoveSampleRef.current % 10 === 0) {
        reportHighNeedleLagDebug(
          "C",
          "HighNeedleSvgAnnotatorCanvas:onMove",
          "drag move sample",
          {
            step,
            textNodeId: drag.textNodeId,
            moveDistance,
            durationMs,
            sampleCount: dragMoveSampleRef.current,
          },
        );
      }
      // #endregion
    };

    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (dragHasMovedRef.current) {
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
      } else {
        // 点击标记文本（未拖动）不触发 handleLineAction，避免误删 DML/单双标注
        // 用户应直接点击线条本身来切换 DML/单双
        const lineId = markerLineIdByTextId.get(drag.textNodeId);
        // #region debug-point C:text-click
        reportDoubleMarkDragDebug("C", "HighNeedleSvgAnnotatorCanvas:onUp", "marker text click without drag", {
          step,
          textNodeId: drag.textNodeId,
          lineId,
        });
        // #endregion
      }
      dragHasMovedRef.current = false;
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [handleLineAction, markerLineIdByTextId, onTextPositionCommit, step]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const ids = Array.from(visibleMarkerById.keys());
    if (ids.length === 0) {
      setAnchorById((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const startedAt = performance.now();
      const wrapRect = wrap.getBoundingClientRect();
      const svgRoot = wrap.querySelector<SVGSVGElement>("svg");
      const next = new Map<
        string,
        { x: number; y: number; perpX: number; perpY: number }
      >();

      for (const id of ids) {
        const dmlPreferredPos =
          pendingDmlMarkerPosByLineId.get(id) ??
          dmlMarkerPosByLineId.get(id) ??
          preferredDmlPosByLineId.get(id);
        const preferredPos = filteredMarkerById.get(id)?.dml
          ? dmlPreferredPos
          : draftMarkerPosByLineId.get(id) ?? preferredMarkerPosByLineId.get(id);
        if (svgRoot && preferredPos) {
          const wrapPos = svgToWrapPoint(svgRoot, wrapRect, preferredPos);
          if (wrapPos) {
            next.set(id, {
              x: wrapPos.x,
              y: wrapPos.y,
              perpX: 0,
              perpY: 1,
            });
            continue;
          }
        }

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

      // #region debug-point B:anchor-recompute
      const durationMs = performance.now() - startedAt;
      if (durationMs >= 8 || ids.length >= 30) {
        reportHighNeedleLagDebug(
          "B",
          "HighNeedleSvgAnnotatorCanvas:anchor-effect",
          "anchor recompute sample",
          {
            step,
            idCount: ids.length,
            nextCount: next.size,
            durationMs,
          },
        );
      }
      // #endregion
    });

    return () => window.cancelAnimationFrame(raf);
  }, [
    dmlMarkerPosByLineId,
    draftMarkerPosByLineId,
    filteredMarkerById,
    pendingDmlMarkerPosByLineId,
    preferredDmlPosByLineId,
    preferredMarkerPosByLineId,
    scaledRenderSvg,
    visibleMarkerById,
  ]);

  useEffect(() => {
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.regionNo === "number" && marks.regionTextNodeId) {
        pendingAutoRegionTextNodeIdsRef.current.delete(id);
      }
      if (typeof marks.levelNo === "number" && marks.levelTextNodeId) {
        pendingAutoLevelTextNodeIdsRef.current.delete(id);
      }
      if (marks.dml && marks.dmlTextNodeId) {
        pendingAutoDmlTextNodeIdsRef.current.delete(id);
      }
      if (marks.isDouble && marks.doubleTextNodeId) {
        pendingAutoDoubleTextNodeIdsRef.current.delete(id);
      }
    });
  }, [visibleMarkerById]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.regionNo !== "number" || marks.regionTextNodeId) return;
      if (pendingAutoRegionTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      const pos =
        draftMarkerPosByLineId.get(id) ??
        preferredMarkerPosByLineId.get(id) ??
        (anchor
          ? clientToSvgPoint(
              svgRoot,
              wrapRect.left + anchor.x,
              wrapRect.top + anchor.y,
            )
          : null);
      if (!pos) return;

      pendingAutoRegionTextNodeIdsRef.current.add(id);
      ensureRegionMarkerTextNode(id, pos);
    });
  }, [
    anchorById,
    draftMarkerPosByLineId,
    ensureRegionMarkerTextNode,
    preferredMarkerPosByLineId,
    visibleMarkerById,
  ]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.levelNo !== "number" || marks.levelTextNodeId) return;
      if (pendingAutoLevelTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      const pos =
        pendingDmlMarkerPosByLineId.get(id) ??
        dmlMarkerPosByLineId.get(id) ??
        preferredDmlPosByLineId.get(id) ??
        (anchor
          ? clientToSvgPoint(
              svgRoot,
              wrapRect.left + anchor.x,
              wrapRect.top + anchor.y,
            )
          : null);
      if (!pos) return;

      pendingAutoLevelTextNodeIdsRef.current.add(id);
      ensureLevelMarkerTextNode(id, pos);
    });
  }, [
    anchorById,
    ensureLevelMarkerTextNode,
    preferredMarkerPosByLineId,
    visibleMarkerById,
  ]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (!marks.dml || marks.dmlTextNodeId) return;
      if (pendingAutoDmlTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      const pos =
        preferredMarkerPosByLineId.get(id) ??
        (anchor
          ? clientToSvgPoint(
              svgRoot,
              wrapRect.left + anchor.x,
              wrapRect.top + anchor.y,
            )
          : null);
      if (!pos) return;

      pendingAutoDmlTextNodeIdsRef.current.add(id);
      ensureDmlMarkerTextNode(id, pos);
    });
  }, [
    anchorById,
    dmlMarkerPosByLineId,
    ensureDmlMarkerTextNode,
    pendingDmlMarkerPosByLineId,
    preferredDmlPosByLineId,
    visibleMarkerById,
  ]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!wrap || !svgRoot) return;

    const wrapRect = wrap.getBoundingClientRect();
    visibleMarkerById.forEach((marks, id) => {
      if (!marks.isDouble || marks.doubleTextNodeId) return;
      if (pendingAutoDoubleTextNodeIdsRef.current.has(id)) return;

      const anchor = anchorById.get(id);
      const pos =
        preferredMarkerPosByLineId.get(id) ??
        (anchor
          ? clientToSvgPoint(
              svgRoot,
              wrapRect.left + anchor.x,
              wrapRect.top + anchor.y,
            )
          : null);
      if (!pos) return;

      pendingAutoDoubleTextNodeIdsRef.current.add(id);
      ensureDoubleMarkerTextNode(id, pos);
    });
  }, [
    anchorById,
    ensureDoubleMarkerTextNode,
    preferredMarkerPosByLineId,
    visibleMarkerById,
  ]);

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
        // 用几乎不可见的描边扩大文字命中范围，提升档位/DML/单双拖拽手感
        el.style.setProperty("stroke", "rgba(15,23,42,0.01)", "important");
        el.style.setProperty("stroke-width", "20", "important");
        el.style.setProperty("paint-order", "stroke", "important");
      } else {
        el.style.removeProperty("cursor");
        el.style.removeProperty("stroke");
        el.style.removeProperty("stroke-width");
        el.style.removeProperty("paint-order");
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

  function processBrushMove(clientX: number, clientY: number, buttons = 1) {
    if (!brushRef.current) return;
    if (step === "自定义文本") return;
    if ((buttons & 1) === 0) return;
    const startedAt = performance.now();

    const prev = brushLastPointRef.current;
    const cur = { x: clientX, y: clientY };
    brushLastPointRef.current = cur;

    const canvas = brushCanvasRef.current;
    const wrap = canvasWrapRef.current;
    if (canvas && wrap && prev) {
      const wrapRect = wrap.getBoundingClientRect();
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

    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / 2));
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sampleX = prev.x + dx * t;
      const sampleY = prev.y + dy * t;
      const lineIds = getLineIdsFromPoint(
        sampleX,
        sampleY,
        lineSelector,
        allLineIdSet,
      );

      for (const id of lineIds) {
        if (brushVisitedRef.current.has(id)) continue;
        brushVisitedRef.current.add(id);
        const markerPos = svgRoot
          ? (clientToSvgPoint(svgRoot, sampleX, sampleY) ?? undefined)
          : undefined;
        // #region debug-point A:brush-hit
        reportDoubleMarkDragDebug("A", "HighNeedleSvgAnnotatorCanvas:processBrushMove", "brush hit line", {
          step,
          lineId: id,
          sampleX,
          sampleY,
          hasMarkerPos: Boolean(markerPos),
        });
        // #endregion
        if (step === "DML" || step === "单双") {
          handleLineAction(id, { markerPos });
        } else {
          toggleSelect(id, {
            silent: true,
            markerPos,
          });
        }
      }
    }

    // #region debug-point D:brush-move-perf
    brushMoveSampleRef.current += 1;
    const durationMs = performance.now() - startedAt;
    if (durationMs >= 4 || brushMoveSampleRef.current % 10 === 0) {
      reportHighNeedleLagDebug(
        "D",
        "HighNeedleSvgAnnotatorCanvas:processBrushMove",
        "brush move sample",
        {
          step,
          durationMs,
          steps,
          sampleCount: brushMoveSampleRef.current,
        },
      );
    }
    // #endregion
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

    // Region keeps the original alternating offset. Level aligns with the
    // clicked marker position and therefore should not be staggered away.
    numbered.forEach(({ id, no }) => {
      const anchor = anchorById.get(id);
      const marks = filteredMarkerById.get(id);
      if (typeof marks?.levelNo === "number") {
        m.set(id, { dx: 0, dy: 0 });
        return;
      }
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
            // #region debug-point D:drag-start
            reportDoubleMarkDragDebug("D", "HighNeedleSvgAnnotatorCanvas:onMouseDown", "start marker text drag candidate", {
              step,
              textId,
              isMarkerText,
              isDraggableMarkerText,
            });
            // #endregion
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
            dragHasMovedRef.current = false;

            return;
          }

          // 区域/档位/DML/单双阶段都支持按住鼠标沿线刷过；
          // 自定义文本阶段只允许拖动文本。
          if (step === "自定义文本") {
            // 点击空白处取消选中
            setActiveTextKey("");
            return;
          }

          brushRef.current = true;
          brushVisitedRef.current = new Set();
          brushLastPointRef.current = { x: e.clientX, y: e.clientY };

          // 初始点击：使用浏览器原生命中测试（尊重 stroke-width，不会误选相邻线条）
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (id) {
            brushVisitedRef.current.add(id);
            const markerPos = svgRoot
              ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ?? undefined)
              : undefined;
            // #region debug-point A:brush-start
            reportDoubleMarkDragDebug("A", "HighNeedleSvgAnnotatorCanvas:onMouseDown", "brush start hit line", {
              step,
              lineId: id,
              hasMarkerPos: Boolean(markerPos),
            });
            // #endregion
            if (step === "DML" || step === "单双") {
              handleLineAction(id, { markerPos });
            } else {
              toggleSelect(id, {
                silent: true,
                markerPos,
              });
            }
          }
        }}
        onMouseUp={resetBrushState}
        onMouseMove={(e) => {
          processBrushMove(e.clientX, e.clientY, e.buttons);
        }}
        onClick={(e) => {
          if (step !== "DML") return;
          e.preventDefault();
        }}
        onContextMenu={(e) => {
          if (step !== "DML") return;
          e.preventDefault();
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

          {activeTextBox && step === "自定义文本" ? (
            <>
              {/* 选中框 */}
              <div
                className="pointer-events-none absolute rounded border-2 border-blue-500"
                style={{
                  left: activeTextBox.left - 4,
                  top: activeTextBox.top - 4,
                  width: activeTextBox.width + 8,
                  height: activeTextBox.height + 8,
                }}
              />
              {/* 右上角删除按钮 */}
              <button
                type="button"
                className="absolute z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white shadow hover:bg-red-600"
                style={{
                  left: activeTextBox.left + activeTextBox.width + 4 - 2,
                  top: activeTextBox.top - 4 - 8,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTextKey) onTextRemove(activeTextKey);
                }}
                title="删除文本"
              >
                ×
              </button>
              {/* 右下角缩放手柄 — 上下拖拽改变字号 */}
              <div
                className="absolute z-20 flex h-4 w-4 cursor-ns-resize items-center justify-center rounded-sm border border-blue-500 bg-white shadow"
                style={{
                  left: activeTextBox.left + activeTextBox.width + 4 - 4,
                  top: activeTextBox.top + activeTextBox.height + 4 - 4,
                }}
                title={`字号 ${Number(textNodeMap[activeTextKey]?.fontStyle?.fontSize ?? 14)} — 上下拖动缩放`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!activeTextKey) return;
                  resizeRef.current = {
                    startY: e.clientY,
                    startFontSize: Number(
                      textNodeMap[activeTextKey]?.fontStyle?.fontSize ?? 14,
                    ),
                    key: activeTextKey,
                  };
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500">
                  <path d="M2 1L4 0L6 1M2 7L4 8L6 7" stroke="currentColor" fill="none" strokeWidth="1.2" />
                  <line x1="4" y1="1" x2="4" y2="7" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
            </>
          ) : activeTextBox ? (
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
                      <div
                        className="px-0.5 text-[11px] font-bold leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                        style={{ color: marks.regionColor ?? "#0284c7" }}
                      >
                        {marks.regionNo}
                      </div>
                    ) : null}
                    {typeof marks.levelNo === "number" ? (
                      <div className="px-0.5 text-[13px] font-bold leading-none text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
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
