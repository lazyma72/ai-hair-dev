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

const MAX_SVG_SCALE = 5;

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
  preferredRegionPosByLineId: Map<string, { x: number; y: number }>;
  preferredLevelPosByLineId: Map<string, { x: number; y: number }>;
  preferredDoublePosByLineId: Map<string, { x: number; y: number }>;
  pendingLevelMarkerPosByLineId: Map<string, { x: number; y: number }>;
  pendingDmlMarkerPosByLineId: Map<string, { x: number; y: number }>;
  draftMarkerPosByLineId: Map<string, { x: number; y: number }>;
  dmlMarkerPosByLineId: Map<string, { x: number; y: number }>;

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
    options?: {
      markerPos?: { x: number; y: number };
      dmlSelectionMode?: "add" | "remove" | "toggle";
    },
  ) => void;
  applyDmlBrushSelection: (
    lineIds: string[],
    mode: "add" | "remove" | "toggle",
    markerPosByLineId?: Map<string, { x: number; y: number }>,
  ) => void;
  getDmlBrushPreview: (
    lineIds: string[],
    mode: "add" | "remove" | "toggle",
  ) => {
    previewByLineId: Map<string, DmlValue>;
    affectedLineIds: string[];
  };
  hasActiveDmlRuleSelection: boolean;
  activeDmlRuleLineIdSet: Set<string>;
  handleLineDmlCycleOverride: (
    id: string,
    markerPos?: { x: number; y: number },
  ) => void;
  ensureRegionMarkerTextNode: (
    lineNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  ensureDmlMarkerTextNode: (
      entries: Array<{ lineNodeId: string; pos: { x: number; y: number } }>,
  ) => void;

  // 图层
  layerToggles: LayerToggles;
  setLayerToggles: React.Dispatch<React.SetStateAction<LayerToggles>>;

  // 文本阶段
  activeTextNodeId: string;
  activeTextKey: string;
  setActiveTextKey: (key: string) => void;
  onTextActivate: (textNodeId: string) => void;
  onTextFontSizeChange: (key: string, fontSize: number) => void;
  onTextPositionCommit: (
    textNodeId: string,
    pos: { x: number; y: number },
  ) => void;
  onTextRemove: (key: string) => void;
};

type DragState = {
  textNodeId: string;
  textEl: SVGTextElement;
  svgRoot: SVGSVGElement;
  startClientX: number;
  startClientY: number;
  initialParentX: number;
  initialParentY: number;
  parentCTM: DOMMatrix;
  originalTransform: string | null;
};

function readNumberAttr(value: string | null | undefined): number | null {
  if (!value) return null;
  const num = Number(value.trim().split(/[ ,]+/)[0]);
  return Number.isFinite(num) ? num : null;
}

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

  const firstTspan = el.querySelector("tspan");
  const xAttr =
    readNumberAttr(firstTspan?.getAttribute("x")) ??
    readNumberAttr(el.getAttribute("x")) ??
    0;
  const yAttr =
    readNumberAttr(firstTspan?.getAttribute("y")) ??
    readNumberAttr(el.getAttribute("y")) ??
    0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pt: any = svgRoot.createSVGPoint?.();
  if (!pt) return null;
  pt.x = xAttr;
  pt.y = yAttr;
  const screenAnchor = pt.matrixTransform(elCTM);
  const parentAnchor = screenAnchor.matrixTransform(parentCTM.inverse());

  return { pos: { x: parentAnchor.x, y: parentAnchor.y }, parentCTM };
}

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
  pt.x = 0;
  pt.y = 0;
  const origin = pt.matrixTransform(inv);
  pt.x = screenDx;
  pt.y = screenDy;
  const moved = pt.matrixTransform(inv);

  return { dx: moved.x - origin.x, dy: moved.y - origin.y };
}

function getSvgViewportMetrics(svgRoot: SVGSVGElement): {
  rect: DOMRect;
  viewBoxX: number;
  viewBoxY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
} | null {
  const rect = svgRoot.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const viewBox = (svgRoot.getAttribute("viewBox") ?? "").trim();
  const parts = viewBox
    .split(/[ ,]+/)
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 4) {
    return {
      rect,
      viewBoxX: parts[0],
      viewBoxY: parts[1],
      viewBoxWidth: parts[2],
      viewBoxHeight: parts[3],
    };
  }

  const width = Number(svgRoot.getAttribute("width"));
  const height = Number(svgRoot.getAttribute("height"));
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return {
      rect,
      viewBoxX: 0,
      viewBoxY: 0,
      viewBoxWidth: width,
      viewBoxHeight: height,
    };
  }

  return null;
}

function clientToSvgPoint(
  svgRoot: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svgRoot.getScreenCTM?.();
  if (ctm) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pt: any = svgRoot.createSVGPoint?.();
    if (pt) {
      pt.x = clientX;
      pt.y = clientY;
      const result = pt.matrixTransform(ctm.inverse());
      if (Number.isFinite(result.x) && Number.isFinite(result.y)) {
        return { x: result.x, y: result.y };
      }
    }
  }

  const metrics = getSvgViewportMetrics(svgRoot);
  if (!metrics) return null;

  return {
    x:
      metrics.viewBoxX +
      ((clientX - metrics.rect.left) / metrics.rect.width) *
        metrics.viewBoxWidth,
    y:
      metrics.viewBoxY +
      ((clientY - metrics.rect.top) / metrics.rect.height) *
        metrics.viewBoxHeight,
  };
}

function svgToWrapPoint(
  svgRoot: SVGSVGElement,
  wrapRect: DOMRect,
  pos: { x: number; y: number },
): { x: number; y: number } | null {
  const ctm = svgRoot.getScreenCTM?.();
  if (ctm) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pt: any = svgRoot.createSVGPoint?.();
    if (pt) {
      pt.x = pos.x;
      pt.y = pos.y;
      const result = pt.matrixTransform(ctm);
      if (Number.isFinite(result.x) && Number.isFinite(result.y)) {
        return { x: result.x - wrapRect.left, y: result.y - wrapRect.top };
      }
    }
  }

  const metrics = getSvgViewportMetrics(svgRoot);
  if (!metrics || metrics.viewBoxWidth <= 0 || metrics.viewBoxHeight <= 0) {
    return null;
  }

  return {
    x:
      ((pos.x - metrics.viewBoxX) / metrics.viewBoxWidth) *
        metrics.rect.width +
      (metrics.rect.left - wrapRect.left),
    y:
      ((pos.y - metrics.viewBoxY) / metrics.viewBoxHeight) *
        metrics.rect.height +
      (metrics.rect.top - wrapRect.top),
  };
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
  preferredDmlPosByLineId,
  showPreview,
  preferredRegionPosByLineId,
  preferredLevelPosByLineId,
  preferredDoublePosByLineId,
  pendingLevelMarkerPosByLineId,
  pendingDmlMarkerPosByLineId,
  draftMarkerPosByLineId,
  dmlMarkerPosByLineId,
  visibleMarkerById,
  markerTextIdSet,
  draggableMarkerTextIdSet,
  regionLabels,
  toggleSelect,
  handleLineAction,
  applyDmlBrushSelection,
  getDmlBrushPreview,
  hasActiveDmlRuleSelection,
  activeDmlRuleLineIdSet,
  handleLineDmlCycleOverride,
  ensureRegionMarkerTextNode,
  ensureDmlMarkerTextNode,
  layerToggles,
  setLayerToggles,
  activeTextNodeId,
  activeTextKey,
  setActiveTextKey,
  onTextActivate,
  onTextFontSizeChange,
  onTextPositionCommit,
  onTextRemove,
}: Props) {
  const [svgScale, setSvgScale] = useState(1);
  const scaledRenderSvg = useMemo(
    () => scaleSvgViewport(renderSvg, svgScale),
    [renderSvg, svgScale],
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [brushDmlPreviewVersion, setBrushDmlPreviewVersion] = useState(0);
  const zoomAnchorRef = useRef<{
    contentX: number;
    contentY: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  const allTextIdSet = useMemo(() => new Set(allTextIds), [allTextIds]);

  const brushRef = useRef(false);
  const brushVisitedRef = useRef<Set<string>>(new Set());
  const brushLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const brushDmlSelectionModeRef = useRef<"add" | "remove" | "toggle">(
    "toggle",
  );
  const brushDmlLineIdsRef = useRef<string[]>([]);
  const brushDmlMarkerPosByLineIdRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const previewHiddenDmlTextOpacityRef = useRef<Map<string, string>>(new Map());

  /** 刷选描边叠加层 canvas。 */
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);
  const resizeRef = useRef<{
    startY: number;
    startFontSize: number;
    latestFontSize: number;
    key: string;
    textEl: SVGTextElement;
  } | null>(null);

  const dragRef = useRef<DragState | null>(null);
  const pendingAutoRegionTextNodeIdsRef = useRef<Set<string>>(new Set());

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [regionLabelPosByName, setRegionLabelPosByName] = useState<
    Map<string, { x: number; y: number }>
  >(() => new Map());

  const [textHitBoxes, setTextHitBoxes] = useState<
    Array<{
      textNodeId: string;
      left: number;
      top: number;
      width: number;
      height: number;
    }>
  >([]);

  const [activeTextBox, setActiveTextBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const bumpBrushDmlPreview = React.useCallback(() => {
    setBrushDmlPreviewVersion((prev) => prev + 1);
  }, []);

  const dmlBrushPreview = useMemo(
    () =>
      step === "DML"
        ? getDmlBrushPreview(
            brushDmlLineIdsRef.current,
            brushDmlSelectionModeRef.current,
          )
        : { previewByLineId: new Map<string, DmlValue>(), affectedLineIds: [] },
    [brushDmlPreviewVersion, getDmlBrushPreview, step],
  );

  const hiddenDmlPreviewTextNodeIds = useMemo(() => {
    if (step !== "DML") return [] as string[];
    return dmlBrushPreview.affectedLineIds.flatMap((lineId) => {
      const marks = visibleMarkerById.get(lineId);
      const textNodeId = String(marks?.dmlTextNodeId ?? "").trim();
      if (!textNodeId) return [];
      const previewValue = dmlBrushPreview.previewByLineId.get(lineId);
      if (previewValue === marks?.dml) return [];
      return [textNodeId];
    });
  }, [dmlBrushPreview, step, visibleMarkerById]);

  const getRegionMarkerSvgPos = React.useCallback(
    (lineId: string) =>
      draftMarkerPosByLineId.get(lineId) ??
      preferredRegionPosByLineId.get(lineId) ??
      null,
    [draftMarkerPosByLineId, preferredRegionPosByLineId],
  );

  const getLevelMarkerSvgPos = React.useCallback(
    (lineId: string) =>
      (step === "档位" ? draftMarkerPosByLineId.get(lineId) : null) ??
      pendingLevelMarkerPosByLineId.get(lineId) ??
      preferredLevelPosByLineId.get(lineId) ??
      null,
    [
      draftMarkerPosByLineId,
      pendingLevelMarkerPosByLineId,
      preferredLevelPosByLineId,
      step,
    ],
  );

  const getDmlMarkerSvgPos = React.useCallback(
    (lineId: string) =>
      brushDmlMarkerPosByLineIdRef.current.get(lineId) ??
      pendingDmlMarkerPosByLineId.get(lineId) ??
      dmlMarkerPosByLineId.get(lineId) ??
      preferredDmlPosByLineId.get(lineId) ??
      null,
    [
      dmlMarkerPosByLineId,
      pendingDmlMarkerPosByLineId,
      preferredDmlPosByLineId,
    ],
  );

  const getDoubleMarkerSvgPos = React.useCallback(
    (lineId: string) => preferredDoublePosByLineId.get(lineId) ?? null,
    [preferredDoublePosByLineId],
  );

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
      ) {
        filtered.levelNo = marks.levelNo;
      }
      if (
        layerToggles.dml &&
        marks.dml &&
        !marks.dmlTextNodeId &&
        step !== "DML"
      ) {
        filtered.dml = marks.dml;
      }
      if (layerToggles.double && marks.isDouble && !marks.doubleTextNodeId) {
        filtered.isDouble = true;
      }
      if (Object.keys(filtered).length > 0) out.set(id, filtered);
    });

    if (layerToggles.dml && step === "DML") {
      dmlBrushPreview.previewByLineId.forEach((dml, id) => {
        const prev = out.get(id) ?? {};
        out.set(id, {
          ...prev,
          dml,
          dmlTextNodeId: undefined,
        });
      });
    }

    return out;
  }, [dmlBrushPreview.previewByLineId, layerToggles, step, visibleMarkerById]);
  const flushDmlBrushSelection = React.useCallback(() => {
    if (step !== "DML") return;
    if (brushDmlLineIdsRef.current.length === 0) return;

    applyDmlBrushSelection(
      brushDmlLineIdsRef.current,
      brushDmlSelectionModeRef.current,
      brushDmlMarkerPosByLineIdRef.current,
    );
    brushDmlLineIdsRef.current = [];
    brushDmlMarkerPosByLineIdRef.current = new Map();
    bumpBrushDmlPreview();
  }, [applyDmlBrushSelection, bumpBrushDmlPreview, step]);

  const resetBrushState = React.useCallback(() => {
    brushRef.current = false;
    brushVisitedRef.current = new Set();
    brushLastPointRef.current = null;
    brushDmlSelectionModeRef.current = "toggle";
    brushDmlLineIdsRef.current = [];
    brushDmlMarkerPosByLineIdRef.current = new Map();
    bumpBrushDmlPreview();

    // 清空刷选描边叠加层
    const canvas = brushCanvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [bumpBrushDmlPreview]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    if (!svgRoot) return;

    const nextHiddenIdSet = new Set(hiddenDmlPreviewTextNodeIds);
    const prevOpacityById = previewHiddenDmlTextOpacityRef.current;
    const allIds = new Set<string>([
      ...prevOpacityById.keys(),
      ...nextHiddenIdSet,
    ]);

    allIds.forEach((textNodeId) => {
      const textEl = svgRoot.querySelector<SVGElement>(
        `#${cssEscapeId(textNodeId)}`,
      );
      if (!textEl) {
        prevOpacityById.delete(textNodeId);
        return;
      }

      if (nextHiddenIdSet.has(textNodeId)) {
        if (!prevOpacityById.has(textNodeId)) {
          prevOpacityById.set(textNodeId, textEl.style.opacity);
        }
        textEl.style.opacity = "0";
        return;
      }

      if (!prevOpacityById.has(textNodeId)) return;
      const prevOpacity = prevOpacityById.get(textNodeId) ?? "";
      if (prevOpacity) {
        textEl.style.opacity = prevOpacity;
      } else {
        textEl.style.removeProperty("opacity");
      }
      prevOpacityById.delete(textNodeId);
    });

    return () => {
      prevOpacityById.forEach((prevOpacity, textNodeId) => {
        const textEl = svgRoot.querySelector<SVGElement>(
          `#${cssEscapeId(textNodeId)}`,
        );
        if (!textEl) return;
        if (prevOpacity) {
          textEl.style.opacity = prevOpacity;
        } else {
          textEl.style.removeProperty("opacity");
        }
      });
      prevOpacityById.clear();
    };
  }, [hiddenDmlPreviewTextNodeIds]);

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
    const handleWindowMouseUp = () => {
      flushDmlBrushSelection();
      resetBrushState();
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, [flushDmlBrushSelection, resetBrushState]);

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      processBrushMove(e.clientX, e.clientY, e.buttons);
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  });

  useEffect(() => {
    resetBrushState();
    pendingAutoRegionTextNodeIdsRef.current = new Set();
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
      const resize = resizeRef.current;
      if (resize) {
        const deltaY = resize.startY - e.clientY;
        const scaleFactor = 1 + deltaY / 80;
        const nextFontSize = Math.max(
          4,
          Math.min(200, Math.round(resize.startFontSize * scaleFactor)),
        );
        resize.latestFontSize = nextFontSize;
        resize.textEl.style.setProperty(
          "font-size",
          `${nextFontSize}px`,
          "important",
        );
        resize.textEl.setAttribute("font-size", String(nextFontSize));
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const moveDistance = Math.hypot(
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY,
      );
      if (moveDistance < 3) return;
      dragHasMovedRef.current = true;

      const { dx, dy } = screenDeltaToParent(
        drag.svgRoot,
        drag.parentCTM,
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY,
      );

      const origT = drag.originalTransform ? ` ${drag.originalTransform}` : "";
      drag.textEl.setAttribute("transform", `translate(${dx},${dy})${origT}`);
    };

    const onUp = (e: MouseEvent) => {
      if (resizeRef.current) {
        onTextFontSizeChange(
          resizeRef.current.key,
          resizeRef.current.latestFontSize,
        );
        resizeRef.current = null;
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;

      if (dragHasMovedRef.current) {
        const { dx, dy } = screenDeltaToParent(
          drag.svgRoot,
          drag.parentCTM,
          e.clientX - drag.startClientX,
          e.clientY - drag.startClientY,
        );

        onTextPositionCommit(drag.textNodeId, {
          x: drag.initialParentX + dx,
          y: drag.initialParentY + dy,
        });
        drag.textEl.removeAttribute("transform");
      } else {
        markerLineIdByTextId.get(drag.textNodeId);
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
  }, [
    handleLineAction,
    markerLineIdByTextId,
    onTextFontSizeChange,
    onTextPositionCommit,
    step,
  ]);

  useEffect(() => {
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.regionNo === "number" && marks.regionTextNodeId) {
        pendingAutoRegionTextNodeIdsRef.current.delete(id);
      }
    });
  }, [visibleMarkerById]);

  useEffect(() => {
    visibleMarkerById.forEach((marks, id) => {
      if (typeof marks.regionNo !== "number" || marks.regionTextNodeId) return;
      if (pendingAutoRegionTextNodeIdsRef.current.has(id)) return;

      const pos = getRegionMarkerSvgPos(id);
      if (!pos) return;

      pendingAutoRegionTextNodeIdsRef.current.add(id);
      ensureRegionMarkerTextNode(id, pos);
    });
  }, [
    ensureRegionMarkerTextNode,
    getRegionMarkerSvgPos,
    visibleMarkerById,
  ]);

  useEffect(() => {
    const entries: Array<{ lineNodeId: string; pos: { x: number; y: number } }> = [];
    visibleMarkerById.forEach((marks, id) => {
      if (!marks.dml || marks.dmlTextNodeId) return;

      const pos = getDmlMarkerSvgPos(id);
      if (!pos) return;

      entries.push({ lineNodeId: id, pos });
    });

    if (entries.length === 0) return;
    ensureDmlMarkerTextNode(entries);
  }, [
    ensureDmlMarkerTextNode,
    getDmlMarkerSvgPos,
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

    if (step !== "自定义文本") {
      setTextHitBoxes([]);
      setActiveTextBox(null);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const nextBoxes = Array.from(
        wrap.querySelectorAll<SVGGraphicsElement>("text[id]"),
      )
        .map((el) => {
          const textNodeId = (el.getAttribute("id") ?? "").trim();
          if (!textNodeId || markerTextIdSet.has(textNodeId)) return null;
          const rect = el.getBoundingClientRect();
          return {
            textNodeId,
            left: rect.left - wrapRect.left,
            top: rect.top - wrapRect.top,
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(Boolean) as Array<{
        textNodeId: string;
        left: number;
        top: number;
        width: number;
        height: number;
      }>;

      setTextHitBoxes(nextBoxes);

      const active = nextBoxes.find((item) => item.textNodeId === activeTextNodeId);
      if (!active) {
        setActiveTextBox(null);
        return;
      }
      setActiveTextBox({
        left: active.left,
        top: active.top,
        width: active.width,
        height: active.height,
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [activeTextNodeId, markerTextIdSet, scaledRenderSvg, step]);

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

  function beginTextDrag(textNodeId: string, clientX: number, clientY: number) {
    if (!textNodeId) return false;

    const wrap = canvasWrapRef.current;
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
    const textEl = wrap?.querySelector<SVGTextElement>(
      `#${cssEscapeId(textNodeId)}`,
    );
    if (!svgRoot || !textEl) return false;
    const anchorResult = getAnchorInParentSpace(textEl, svgRoot);
    if (!anchorResult) return false;

    dragRef.current = {
      textNodeId,
      textEl,
      svgRoot,
      startClientX: clientX,
      startClientY: clientY,
      initialParentX: anchorResult.pos.x,
      initialParentY: anchorResult.pos.y,
      parentCTM: anchorResult.parentCTM,
      originalTransform: textEl.getAttribute("transform"),
    };
    dragHasMovedRef.current = false;
    return true;
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
    // 步长改为 1px，保证快速拖动时不漏过细线条（原 2px 步长 + 单点命中会跳过 1px 宽线）
    const steps = Math.max(1, Math.ceil(distance));
    const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sampleX = prev.x + dx * t;
      const sampleY = prev.y + dy * t;
      // 使用单点命中测试，避免 BRUSH_HIT_OFFSETS 的多点扩散采样在密集线条中误选相邻线条
      const singleId = getLineIdFromPoint(sampleX, sampleY);
      const lineIds = singleId ? [singleId] : [];

      for (const id of lineIds) {
        if (brushVisitedRef.current.has(id)) continue;
        brushVisitedRef.current.add(id);
        const markerPos = svgRoot
          ? (clientToSvgPoint(svgRoot, sampleX, sampleY) ?? undefined)
          : undefined;
        if (step === "DML") {
          brushDmlLineIdsRef.current.push(id);
          if (markerPos) {
            brushDmlMarkerPosByLineIdRef.current.set(id, markerPos);
          }
          bumpBrushDmlPreview();
        } else if (step === "单双") {
          handleLineAction(id, {
            markerPos,
          });
        } else {
          toggleSelect(id, {
            silent: true,
            markerPos,
          });
        }
      }
    }
  }

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
                setSvgScale((prev) => Math.min(MAX_SVG_SCALE, prev + 0.25));
              }}
            >
              +
            </button>
          </div>
          <span className="text-xs text-slate-400">
            拖拽批量勾选 / Alt+滚轮缩放
          </span>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`mt-3 min-h-0 flex-1 select-none overflow-auto rounded-xl border border-slate-100 bg-white p-3 ${wrapExtraClass}`}
        onWheel={(e) => {
          if (!e.altKey) return;
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
            const next = Math.min(
              MAX_SVG_SCALE,
              Math.max(1, prev * zoomFactor),
            );
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
          const canDragMarkerText =
            isDraggableMarkerText &&
            !(step === "DML" && hasActiveDmlRuleSelection);

          if (
            textId &&
            (canDragMarkerText || (step === "自定义文本" && !isMarkerText))
          ) {
            const id = textId;
            if (!id) return;

            if (step === "自定义文本" && !isMarkerText) {
              beginTextDrag(id, e.clientX, e.clientY);
              onTextActivate(id);
              return;
            }

            if (beginTextDrag(id, e.clientX, e.clientY)) return;
          }

          // 区域/档位/DML/单双阶段都支持按住鼠标沿线刷过；
          // 自定义文本阶段只允许拖动文本。
          if (step === "自定义文本") {
            // 点击空白处取消选中
            setActiveTextKey("");
            return;
          }

          if (step === "DML" && !hasActiveDmlRuleSelection) {
            return;
          }

          brushRef.current = true;
          brushVisitedRef.current = new Set();
          brushLastPointRef.current = { x: e.clientX, y: e.clientY };

          // 初始点击：使用浏览器原生命中测试（尊重 stroke-width，不会误选相邻线条）
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (id) {
            if (step === "DML") {
              brushDmlSelectionModeRef.current = activeDmlRuleLineIdSet.has(id)
                ? "remove"
                : "add";
            }
            brushVisitedRef.current.add(id);
            const markerPos = svgRoot
              ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ?? undefined)
              : undefined;
            if (step === "DML") {
              brushDmlLineIdsRef.current = [id];
              brushDmlMarkerPosByLineIdRef.current = new Map();
              if (markerPos) {
                brushDmlMarkerPosByLineIdRef.current.set(id, markerPos);
              }
              bumpBrushDmlPreview();
            } else if (step === "单双") {
              handleLineAction(id, {
                markerPos,
              });
            } else {
              toggleSelect(id, {
                silent: true,
                markerPos,
              });
            }
          }
        }}
        onMouseUp={() => {
          flushDmlBrushSelection();
          resetBrushState();
        }}
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
          const wrap = canvasWrapRef.current;
          const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (!id) return;
          const markerPos = svgRoot
            ? (clientToSvgPoint(svgRoot, e.clientX, e.clientY) ?? undefined)
            : undefined;
          handleLineDmlCycleOverride(id, markerPos);
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

          {step === "自定义文本"
            ? textHitBoxes.map((box) => {
                const isActive = box.textNodeId === activeTextNodeId;
                return (
                  <div
                    key={`text_hit_${box.textNodeId}`}
                    className="absolute"
                    style={{
                      left: box.left - 6,
                      top: box.top - 6,
                      width: Math.max(box.width + 12, 20),
                      height: Math.max(box.height + 12, 20),
                      zIndex: isActive ? 18 : 12,
                      cursor: "move",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      beginTextDrag(box.textNodeId, e.clientX, e.clientY);
                      onTextActivate(box.textNodeId);
                    }}
                    title="拖动文本"
                  />
                );
              })
            : null}

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
              <div
                className="absolute z-20 flex h-4 w-4 cursor-ns-resize items-center justify-center rounded-sm border border-blue-500 bg-white shadow"
                style={{
                  left: activeTextBox.left + activeTextBox.width + 4 - 4,
                  top: activeTextBox.top + activeTextBox.height + 4 - 4,
                }}
                title="上下拖动缩放字号"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!activeTextKey) return;
                  const wrap = canvasWrapRef.current;
                  const textEl = wrap?.querySelector<SVGTextElement>(
                    `#${cssEscapeId(activeTextNodeId)}`,
                  );
                  if (!textEl) return;
                  const computedFontSize = Number.parseFloat(
                    window.getComputedStyle(textEl).fontSize,
                  );
                  resizeRef.current = {
                    startY: e.clientY,
                    startFontSize: Number.isFinite(computedFontSize)
                      ? computedFontSize
                      : 14,
                    latestFontSize: Number.isFinite(computedFontSize)
                      ? computedFontSize
                      : 14,
                    key: activeTextKey,
                    textEl,
                  };
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500">
                  <path
                    d="M2 1L4 0L6 1M2 7L4 8L6 7"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="4"
                    y1="1"
                    x2="4"
                    y2="7"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
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

            {(() => {
              const wrap = canvasWrapRef.current;
              const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
              const wrapRect = wrap?.getBoundingClientRect();
              const toWrapPos = (svgPos?: { x: number; y: number } | null) => {
                if (!svgPos) return null;
                if (!svgRoot || !wrapRect) return null;
                return svgToWrapPoint(svgRoot, wrapRect, svgPos);
              };

              return Array.from(filteredMarkerById.entries()).flatMap(
                ([id, marks]) => {
                  const regionPos =
                    typeof marks.regionNo === "number"
                      ? toWrapPos(
                          getRegionMarkerSvgPos(id) ??
                            null,
                        )
                      : null;
                  const levelPos =
                    typeof marks.levelNo === "number"
                      ? toWrapPos(
                          getLevelMarkerSvgPos(id) ??
                            null,
                        )
                      : null;
                  const dmlPos = marks.dml
                    ? toWrapPos(
                        getDmlMarkerSvgPos(id) ??
                          null,
                      )
                    : null;
                  const doublePos = marks.isDouble
                    ? toWrapPos(getDoubleMarkerSvgPos(id) ?? null)
                    : null;

                  return [
                    layerToggles.region && regionPos ? (
                      <div
                        key={`${id}_region_no`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 px-0.5 text-[11px] font-bold leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                        style={{
                          left: regionPos.x,
                          top: regionPos.y,
                          color: marks.regionColor ?? "#0284c7",
                        }}
                      >
                        {marks.regionNo}
                      </div>
                    ) : null,
                    layerToggles.level && levelPos ? (
                      <div
                        key={`${id}_level_no`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 px-0.5 text-[13px] font-bold leading-none text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                        style={{ left: levelPos.x, top: levelPos.y }}
                      >
                        {marks.levelNo}
                      </div>
                    ) : null,
                    layerToggles.dml && dmlPos ? (
                      <div
                        key={`${id}_dml`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black px-1 py-px text-[8px] font-bold leading-none text-white shadow"
                        style={{ left: dmlPos.x, top: dmlPos.y }}
                      >
                        {marks.dml}
                      </div>
                    ) : null,
                    layerToggles.double && doublePos ? (
                      <div
                        key={`${id}_double`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 px-0.5 text-[10px] font-semibold leading-none text-purple-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                        style={{ left: doublePos.x, top: doublePos.y }}
                      >
                        双
                      </div>
                    ) : null,
                  ];
                },
              );
            })()}
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
