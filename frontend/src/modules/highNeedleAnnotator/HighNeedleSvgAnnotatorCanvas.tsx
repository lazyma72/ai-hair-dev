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
  startSvgPoint: { x: number; y: number };
  startTextPos: { x: number; y: number };
};

function readNumberAttr(value: string | null | undefined): number | null {
  if (!value) return null;
  const num = Number(value.trim().split(/[ ,]+/)[0]);
  return Number.isFinite(num) ? num : null;
}

function getTextPos(el: SVGTextElement): { x: number; y: number } {
  const xAttr = readNumberAttr(el.getAttribute("x"));
  const yAttr = readNumberAttr(el.getAttribute("y"));

  if (xAttr !== null && yAttr !== null) return { x: xAttr, y: yAttr };

  const bbox = el.getBBox?.();
  if (bbox && Number.isFinite(bbox.x) && Number.isFinite(bbox.y)) {
    return { x: bbox.x, y: bbox.y };
  }

  return { x: 0, y: 0 };
}

function setTextPos(el: SVGTextElement, pos: { x: number; y: number }) {
  el.setAttribute("x", String(pos.x));
  el.setAttribute("y", String(pos.y));

  const tspans = Array.from(el.querySelectorAll("tspan"));
  tspans.forEach((t) => t.setAttribute("x", String(pos.x)));
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
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", resetBrushState);
    return () => window.removeEventListener("mouseup", resetBrushState);
  }, [resetBrushState]);

  useEffect(() => {
    resetBrushState();
  }, [canvasEpoch, resetBrushState]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const curSvg = clientToSvgPoint(drag.svgRoot, e.clientX, e.clientY);
      if (!curSvg) return;

      const dx = curSvg.x - drag.startSvgPoint.x;
      const dy = curSvg.y - drag.startSvgPoint.y;

      const next = {
        x: Math.round((drag.startTextPos.x + dx) * 100) / 100,
        y: Math.round((drag.startTextPos.y + dy) * 100) / 100,
      };

      setTextPos(drag.textEl, next);
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (!drag) return;

      const pos = getTextPos(drag.textEl);
      onTextPositionCommit(drag.textNodeId, pos);
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

            const startSvgPoint = clientToSvgPoint(
              svgRoot,
              e.clientX,
              e.clientY,
            );
            if (!startSvgPoint) return;

            dragRef.current = {
              textNodeId: id,
              textEl,
              svgRoot,
              startSvgPoint,
              startTextPos: getTextPos(textEl),
            };

            return;
          }

          // 区域/档位阶段支持“刷选”；DML/单双阶段仅允许点击写入
          if (step === "DML" || step === "单双") return;

          brushRef.current = true;
          brushVisitedRef.current = new Set();
          brushLastPointRef.current = { x: e.clientX, y: e.clientY };

          const id = getLineIdFromPoint(e.clientX, e.clientY);
          if (!id) return;

          brushVisitedRef.current.add(id);
          toggleSelect(id, { silent: true });
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

          const dx = prev ? cur.x - prev.x : 0;
          const dy = prev ? cur.y - prev.y : 0;
          const dist = prev ? Math.hypot(dx, dy) : 0;
          const steps = prev
            ? Math.min(60, Math.max(1, Math.ceil(dist / 6)))
            : 1;

          for (let i = 0; i <= steps; i += 1) {
            const x = prev ? prev.x + (dx * i) / steps : cur.x;
            const y = prev ? prev.y + (dy * i) / steps : cur.y;
            const id = getLineIdFromPoint(x, y);
            if (!id) continue;
            if (brushVisitedRef.current.has(id)) continue;

            brushVisitedRef.current.add(id);
            toggleSelect(id, { silent: true });
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
