import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import type { DmlValue } from "./types";

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

  visibleMarkerById: Map<
    string,
    { regionNo?: number; levelNo?: number; dml?: DmlValue; isDouble?: boolean }
  >;

  regionLabels?: Array<{ name: string; color: string; lineIds: string[] }>;

  // 交互
  toggleSelect: (id: string, options?: { silent?: boolean }) => void;
  handleLineAction: (id: string) => void;

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

/**
 * 判断线段 AB 与线段 CD 是否相交（含端点）。
 * 使用向量叉积（cross-product）法。
 */
function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1x = bx - ax,
    d1y = by - ay;
  const d2x = dx - cx,
    d2y = dy - cy;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return false; // 平行
  const ex = cx - ax,
    ey = cy - ay;
  const t = (ex * d2y - ey * d2x) / denom;
  const u = (ex * d1y - ey * d1x) / denom;
  return t >= -1e-6 && t <= 1 + 1e-6 && u >= -1e-6 && u <= 1 + 1e-6;
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

export default function HighNeedleSvgAnnotatorCanvas({
  step,
  lineSelector,
  allLineIdSet,
  allTextIds,
  renderSvg,
  previewValue,
  canvasEpoch,
  visibleMarkerById,
  regionLabels,
  toggleSelect,
  handleLineAction,
  activeTextNodeId,
  onTextActivate,
  onTextPositionCommit,
}: Props) {
  const allTextIdSet = useMemo(() => new Set(allTextIds), [allTextIds]);

  const brushRef = useRef(false);
  const brushVisitedRef = useRef<Set<string>>(new Set());
  const brushLastPointRef = useRef<{ x: number; y: number } | null>(null);

  /** 几何缓存：各线段在 SVG root 用户空间中的折线段列表，renderSvg 变化后重建。 */
  const geomCacheRef = useRef<LineGeometryCache>(new Map());
  /** 刷选描边叠加层 canvas。 */
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);

  const dragRef = useRef<DragState | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [anchorById, setAnchorById] = useState<
    Map<string, { x: number; y: number }>
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

  /**
   * 在 DOM 更新（renderSvg 变化）后，把所有线条元素的几何数据采样到
   * SVG root 用户空间的 LineGeometryCache，供刷选时的相交检测使用。
   */
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const raf = requestAnimationFrame(() => {
      const svgRoot = wrap.querySelector<SVGSVGElement>("svg");
      if (!svgRoot) return;

      const rootCTM = svgRoot.getScreenCTM();
      if (!rootCTM) return;
      const rootInvCTM = rootCTM.inverse();

      const cache: LineGeometryCache = new Map();

      for (const id of allLineIdSet) {
        const el = wrap.querySelector<SVGGeometryElement>(
          `#${cssEscapeId(id)}`,
        );
        if (!el || typeof el.getTotalLength !== "function") continue;

        const elCTM = el.getScreenCTM();
        if (!elCTM) continue;

        // element local → SVG root user space（与页面 scroll/zoom 无关）
        const localToSvg = rootInvCTM.multiply(elCTM);

        const totalLen = el.getTotalLength();
        // 用元素屏幕 bbox 对角线近似估算采样数，保证足够密度
        const bbox = el.getBoundingClientRect();
        const screenDiag = Math.hypot(bbox.width, bbox.height);
        const numPts = Math.max(4, Math.min(200, Math.ceil(screenDiag / 3)));

        const segments: LineSegment4[] = [];
        let prev: { x: number; y: number } | null = null;

        for (let i = 0; i <= numPts; i++) {
          const lp = el.getPointAtLength((i / numPts) * totalLen);
          const sp = applyMatrix(lp.x, lp.y, localToSvg);
          if (prev) segments.push([prev.x, prev.y, sp.x, sp.y]);
          prev = sp;
        }

        if (segments.length > 0) cache.set(id, segments);
      }

      geomCacheRef.current = cache;
    });

    return () => cancelAnimationFrame(raf);
  }, [renderSvg, allLineIdSet]);

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
      setAnchorById(new Map());
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const svgRoot = wrap.querySelector<SVGSVGElement>("svg");
      const next = new Map<string, { x: number; y: number }>();

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
          const mid = geom.getPointAtLength(geom.getTotalLength() / 2);
          // mid is in SVG-user-space; convert to screen then to canvas-relative
          const ctm = (el as SVGGraphicsElement).getScreenCTM?.();
          if (ctm) {
            const pt = svgRoot.createSVGPoint();
            pt.x = mid.x;
            pt.y = mid.y;
            const screen = pt.matrixTransform(ctm);
            next.set(id, {
              x: screen.x - wrapRect.left,
              y: screen.y - wrapRect.top,
            });
            continue;
          }
        }

        // Fallback: bounding-box centre for elements without path geometry
        const rect = el.getBoundingClientRect();
        next.set(id, {
          x: rect.left - wrapRect.left + rect.width / 2,
          y: rect.top - wrapRect.top + rect.height / 2,
        });
      }

      setAnchorById(next);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [renderSvg, visibleMarkerById]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    if (step !== "DML" || !regionLabels || regionLabels.length === 0) {
      setRegionLabelPosByName(new Map());
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
  }, [renderSvg, regionLabels, step]);

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
  }, [activeTextNodeId, renderSvg, step]);

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

  // Stagger ±14 px vertically based on the marker's own annotation number
  // (odd → above, even → below).  Using the annotation number instead of
  // x-sorted position ensures sequence 1,2,3 always alternates up/down
  // regardless of the physical left-right arrangement of lines in the SVG,
  // preventing the visual "213" ordering confusion.
  const staggerOffsetById = useMemo(() => {
    const m = new Map<string, number>();
    visibleMarkerById.forEach((marks, id) => {
      const no = marks.regionNo ?? marks.levelNo ?? 0;
      m.set(id, no % 2 === 1 ? -14 : 14); // odd → above, even → below
    });
    return m;
  }, [visibleMarkerById]);

  const wrapExtraClass =
    step === "自定义文本"
      ? "[&_text]:cursor-move [&_text]:pointer-events-auto"
      : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">SVG 画布</div>
        <div className="text-xs text-slate-500">
          拖拽批量选择：按住鼠标拖动经过线条（区域/档位步骤）
        </div>
      </div>

      <div
        className={`mt-3 select-none overflow-x-auto rounded-xl border border-slate-100 bg-white p-3 ${wrapExtraClass}`}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();

          if (step === "自定义文本") {
            const id = getTextIdFromPoint(e.clientX, e.clientY);
            if (!id) return;

            onTextActivate(id);

            const wrap = canvasWrapRef.current;
            const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
            const textEl = wrap?.querySelector<SVGTextElement>(
              `#${cssEscapeId(id)}`,
            );
            if (!svgRoot || !textEl) return;

            const anchorResult = getAnchorInParentSpace(textEl, svgRoot);
            if (!anchorResult) return;

            dragRef.current = {
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

            return;
          }

          // 区域/档位阶段支持“刷选”；DML/单双阶段仅允许点击写入
          if (step === "DML" || step === "单双") return;

          brushRef.current = true;
          brushVisitedRef.current = new Set();
          brushLastPointRef.current = { x: e.clientX, y: e.clientY };

          // 初始点击也做相交检测（将起点当作零长度段处理）
          const wrap = canvasWrapRef.current;
          const svgRoot = wrap?.querySelector<SVGSVGElement>("svg");
          if (svgRoot) {
            const rootCTM = svgRoot.getScreenCTM();
            if (rootCTM) {
              const inv = rootCTM.inverse();
              const pt = applyMatrix(e.clientX, e.clientY, inv);
              // 对起点做极小扰动以触发相交
              for (const [id, segs] of geomCacheRef.current) {
                if (brushVisitedRef.current.has(id)) continue;
                for (const [ax, ay, bx, by] of segs) {
                  if (
                    segmentsIntersect(
                      pt.x - 0.5,
                      pt.y - 0.5,
                      pt.x + 0.5,
                      pt.y + 0.5,
                      ax,
                      ay,
                      bx,
                      by,
                    )
                  ) {
                    brushVisitedRef.current.add(id);
                    toggleSelect(id, { silent: true });
                    break;
                  }
                }
              }
            }
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

          // ── 几何相交检测 ────────────────────────────────────────────
          const svgRoot = wrap2?.querySelector<SVGSVGElement>("svg");
          if (!svgRoot) return;

          const rootCTM = svgRoot.getScreenCTM();
          if (!rootCTM) return;
          const inv = rootCTM.inverse();

          const svgFrom = applyMatrix(prev.x, prev.y, inv);
          const svgTo = applyMatrix(cur.x, cur.y, inv);

          for (const [id, segs] of geomCacheRef.current) {
            if (brushVisitedRef.current.has(id)) continue;
            for (const [ax, ay, bx, by] of segs) {
              if (
                segmentsIntersect(
                  svgFrom.x,
                  svgFrom.y,
                  svgTo.x,
                  svgTo.y,
                  ax,
                  ay,
                  bx,
                  by,
                )
              ) {
                brushVisitedRef.current.add(id);
                toggleSelect(id, { silent: true });
                break;
              }
            }
          }
        }}
        onClick={(e) => {
          // DML/单双阶段：点击即写入
          if (step !== "DML" && step !== "单双") return;
          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (id) handleLineAction(id);
        }}
      >
        <div ref={canvasWrapRef} className="relative inline-block">
          <InlineSvg
            key={canvasEpoch}
            svg={renderSvg}
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
            {step === "DML"
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

            {Array.from(visibleMarkerById.entries()).map(([id, marks]) => {
              const pos = anchorById.get(id);
              if (!pos) return null;
              const staggerY = staggerOffsetById.get(id) ?? 0;

              return (
                <div
                  key={id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pos.x, top: pos.y + staggerY }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {typeof marks.regionNo === "number" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white shadow">
                        {marks.regionNo}
                      </div>
                    ) : null}
                    {typeof marks.levelNo === "number" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white shadow">
                        {marks.levelNo}
                      </div>
                    ) : null}
                    {marks.dml ? (
                      <div className="rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow">
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

      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-slate-600">
          结构化数据预览
        </div>
        <pre className="max-h-[280px] overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
          {JSON.stringify(previewValue, null, 2)}
        </pre>
      </div>
    </div>
  );
}
