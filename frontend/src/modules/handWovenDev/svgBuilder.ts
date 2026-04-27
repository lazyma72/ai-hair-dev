import type {
  手织图,
  手织图比例项,
  手织图比例键,
  手织图比值,
} from "../../shared/models/手织图";
import { parseSvg, serializeSvg } from "../highNeedleAnnotator/svgUtils";

const 横排分组节点ID = "hand_woven_horizontal_group";
const 方形分组节点ID = "hand_woven_square_group";
const 手织图生成层ID = "hand_woven_generated_overlay";

type 可生成类型 = Extract<手织图["类型"], { type: "横排" | "方形" }>;

type SvgCanvasSize = {
  width: number;
  height: number;
  viewBoxX: number;
  viewBoxY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
};

export function createEmpty手织图SourceSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
  <rect x="0" y="0" width="900" height="560" fill="#ffffff" />
</svg>`;
}

export function createEmpty手织图(): 手织图 {
  return {
    svg: "",
    类型: {
      type: "特殊",
    },
  };
}

function get比值项(
  比值: 手织图比值,
  key: 手织图比例键,
): 手织图比例项 | undefined {
  return 比值[key];
}

function get排序值(item: 手织图比例项 | undefined, fallback: number): number {
  const value = Number(item?.sort);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
}

function get有效比例键列表(比值: 手织图比值): 手织图比例键[] {
  return (["D", "M", "L"] as 手织图比例键[])
    .map((key, index) => ({
      key,
      item: get比值项(比值, key),
      index,
    }))
    .filter(({ item }) => Boolean(item && item.值 > 0))
    .sort((left, right) => {
      const diff =
        get排序值(left.item, left.index + 1) -
        get排序值(right.item, right.index + 1);
      if (diff !== 0) return diff;
      return left.index - right.index;
    })
    .map(({ key }) => key);
}

function format厘米(value: number): string {
  const normalized = Number.isFinite(value) ? value : 0;
  return `${normalized.toFixed(1)}CM`;
}

function format档位名(key: 手织图比例键, item: 手织图比例项): string {
  return `${key}${item.是否染色 ? "T" : ""}色`;
}

function format备注(item: 手织图比例项): string {
  const remark = String(item.remark ?? "").trim();
  return remark ? ` ${remark}` : "";
}

function gcd(a: number, b: number): number {
  let left = Math.abs(Math.round(a));
  let right = Math.abs(Math.round(b));
  while (right !== 0) {
    const next = left % right;
    left = right;
    right = next;
  }
  return left || 1;
}

function make最简整数比值(
  比值: 手织图比值,
  keys: 手织图比例键[],
): Array<{ key: 手织图比例键; count: number; item: 手织图比例项 }> {
  const values = keys
    .map((key) => {
      const item = get比值项(比值, key);
      if (!item || item.值 <= 0) return null;
      return { key, item, value: item.值 };
    })
    .filter(Boolean) as Array<{
    key: 手织图比例键;
    item: 手织图比例项;
    value: number;
  }>;

  if (values.length === 0) {
    return [];
  }

  const maxDigits = values.reduce((max, entry) => {
    const raw = String(entry.value);
    const digits = raw.includes(".") ? raw.split(".")[1].length : 0;
    return Math.max(max, digits);
  }, 0);
  const scale = 10 ** maxDigits;
  const ints = values
    .map((entry) => Math.round(entry.value * scale))
    .filter((n) => n > 0);
  const divisor = ints.reduce((acc, value) => gcd(acc, value), ints[0] ?? 1);

  return values.map((entry) => ({
    key: entry.key,
    item: entry.item,
    count: Math.max(1, Math.round((entry.value * scale) / divisor)),
  }));
}

function rotateRight<T>(list: T[], step: number): T[] {
  if (list.length === 0) return [];
  const normalized = ((step % list.length) + list.length) % list.length;
  if (normalized === 0) return [...list];
  return [...list.slice(-normalized), ...list.slice(0, -normalized)];
}

function getSvgCanvasSize(root: Element): SvgCanvasSize {
  const viewBox = (root.getAttribute("viewBox") ?? "").trim();
  if (viewBox) {
    const [x, y, width, height] = viewBox
      .split(/[ ,]+/)
      .map((value) => Number(value));
    if ([x, y, width, height].every((value) => Number.isFinite(value))) {
      return {
        width,
        height,
        viewBoxX: x,
        viewBoxY: y,
        viewBoxWidth: width,
        viewBoxHeight: height,
      };
    }
  }

  const width = Number(root.getAttribute("width")) || 900;
  const height = Number(root.getAttribute("height")) || 560;
  return {
    width,
    height,
    viewBoxX: 0,
    viewBoxY: 0,
    viewBoxWidth: width,
    viewBoxHeight: height,
  };
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tagName: K,
): SVGElementTagNameMap[K] {
  return doc.createElementNS(
    "http://www.w3.org/2000/svg",
    tagName,
  ) as SVGElementTagNameMap[K];
}

function getOrCreateOverlayGroup(doc: Document): SVGGElement | null {
  const root = doc.documentElement;
  if (!root) return null;
  root.setAttribute("overflow", "visible");

  const existed = doc.getElementById(手织图生成层ID);
  if (existed instanceof SVGGElement) {
    return existed;
  }

  const group = createSvgElement(doc, "g");
  group.setAttribute("id", 手织图生成层ID);
  root.appendChild(group);
  return group;
}

function createContentGroup(
  doc: Document,
  overlayGroup: SVGGElement,
  groupNodeId: string,
): SVGGElement {
  Array.from(overlayGroup.children).forEach((child) => {
    if (child.id !== groupNodeId) {
      child.remove();
    }
  });

  const existed = overlayGroup.querySelector(`#${CSS.escape(groupNodeId)}`);
  const group =
    existed instanceof SVGGElement ? existed : createSvgElement(doc, "g");

  if (!(existed instanceof SVGGElement)) {
    group.setAttribute("id", groupNodeId);
    overlayGroup.appendChild(group);
  }

  while (group.firstChild) {
    group.removeChild(group.firstChild);
  }

  return group;
}

function build横排标签(type: Extract<可生成类型, { type: "横排" }>): Array<{
  key: 手织图比例键;
  item: 手织图比例项;
  text: string;
}> {
  return get有效比例键列表(type.比值)
    .map((key) => {
      const item = type.比值[key];
      if (!item) return null;
      return {
        key,
        item,
        text: `${format厘米(item.值)} ${format档位名(key, item)}${format备注(item)}`,
      };
    })
    .filter(Boolean) as Array<{
    key: 手织图比例键;
    item: 手织图比例项;
    text: string;
  }>;
}

function render横排到源图(
  doc: Document,
  overlayGroup: SVGGElement,
  type: Extract<可生成类型, { type: "横排" }>,
): void {
  const labels = build横排标签(type);
  const canvas = getSvgCanvasSize(doc.documentElement);
  const paddingX = Math.max(32, canvas.viewBoxWidth * 0.08);
  const topY = canvas.viewBoxY + Math.max(56, canvas.viewBoxHeight * 0.12);
  const minGap = 28;
  const lineStrokeWidth = 1.5;
  const textFontSize = 14;
  const textX = canvas.viewBoxX + paddingX + 12;
  const estimateCharWidth = textFontSize * 0.62;
  const maxTextWidth = labels.reduce((max, entry) => {
    return Math.max(max, entry.text.length * estimateCharWidth);
  }, "请先填写有效比值".length * estimateCharWidth);
  const lineEndX = textX + maxTextWidth;
  const groupNodeId = type.groupNodeId || 横排分组节点ID;
  const group = createContentGroup(doc, overlayGroup, groupNodeId);

  if (labels.length === 0) {
    const placeholderBottomY = topY + 60;
    const topLine = createSvgElement(doc, "line");
    topLine.setAttribute("x1", String(canvas.viewBoxX + paddingX));
    topLine.setAttribute("y1", String(topY));
    topLine.setAttribute("x2", String(lineEndX));
    topLine.setAttribute("y2", String(topY));
    topLine.setAttribute("stroke", "#475569");
    topLine.setAttribute("stroke-width", String(lineStrokeWidth));
    group.appendChild(topLine);

    const bottomLine = createSvgElement(doc, "line");
    bottomLine.setAttribute("x1", String(canvas.viewBoxX + paddingX));
    bottomLine.setAttribute("y1", String(placeholderBottomY));
    bottomLine.setAttribute("x2", String(lineEndX));
    bottomLine.setAttribute("y2", String(placeholderBottomY));
    bottomLine.setAttribute("stroke", "#475569");
    bottomLine.setAttribute("stroke-width", String(lineStrokeWidth));
    group.appendChild(bottomLine);

    const textEl = createSvgElement(doc, "text");
    textEl.setAttribute("x", String(textX));
    textEl.setAttribute("y", String(topY + 34));
    textEl.setAttribute("fill", "#0f172a");
    textEl.setAttribute(
      "font-family",
      "system-ui, -apple-system, Segoe UI, sans-serif",
    );
    textEl.setAttribute("font-size", String(textFontSize));
    textEl.setAttribute("font-weight", "600");
    textEl.textContent = "请先填写有效比值";
    group.appendChild(textEl);
    return;
  }

  const totalRatio = labels.reduce(
    (sum, entry) => sum + Math.max(entry.item.值, 0),
    0,
  );
  const scaledGaps = labels.map((entry) =>
    Math.max(minGap, (entry.item.值 / totalRatio) * 180),
  );
  const lineYs = [topY];
  scaledGaps.forEach((gap) => {
    lineYs.push(lineYs[lineYs.length - 1] + gap);
  });

  lineYs.forEach((y) => {
    const line = createSvgElement(doc, "line");
    line.setAttribute("x1", String(canvas.viewBoxX + paddingX));
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(lineEndX));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "#475569");
    line.setAttribute("stroke-width", String(lineStrokeWidth));
    group.appendChild(line);
  });

  const textEl = createSvgElement(doc, "text");
  textEl.setAttribute("fill", "#0f172a");
  textEl.setAttribute(
    "font-family",
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
  );
  textEl.setAttribute("font-size", String(textFontSize));
  textEl.setAttribute("font-weight", "600");

  labels.forEach((entry, index) => {
    const startY = lineYs[index];
    const endY = lineYs[index + 1];
    const textY = startY + (endY - startY) / 2 + 4;
    const tspan = createSvgElement(doc, "tspan");
    tspan.setAttribute("x", String(textX));
    tspan.setAttribute("y", String(textY));
    tspan.textContent = entry.text;
    textEl.appendChild(tspan);
  });

  group.appendChild(textEl);
}

function build方形行数据(type: Extract<可生成类型, { type: "方形" }>): {
  columns: number;
  rows: string[][];
} {
  const keys = get有效比例键列表(type.比值);
  const normalized = make最简整数比值(type.比值, keys);
  const sequence = normalized.flatMap(({ key, count, item }) =>
    Array.from({ length: count }, () =>
      format档位名(key, item).replace(/色$/, ""),
    ),
  );

  if (sequence.length === 0) {
    return {
      columns: 1,
      rows: [["-"], ["-"], ["-"]],
    };
  }

  return {
    columns: sequence.length,
    rows: Array.from({ length: 3 }, (_, index) => rotateRight(sequence, index)),
  };
}

function render方形到源图(
  doc: Document,
  overlayGroup: SVGGElement,
  type: Extract<可生成类型, { type: "方形" }>,
): void {
  const matrix = build方形行数据(type);
  const cellWidth = 82;
  const cellHeight = 54;
  const canvas = getSvgCanvasSize(doc.documentElement);
  const gridWidth = matrix.columns * cellWidth;
  const gridHeight = 3 * cellHeight;
  const gridX =
    canvas.viewBoxX + Math.max(40, (canvas.viewBoxWidth - gridWidth) / 2);
  const gridY = canvas.viewBoxY + Math.max(68, canvas.viewBoxHeight * 0.18);
  const groupNodeId = type.groupNodeId || 方形分组节点ID;
  const group = createContentGroup(doc, overlayGroup, groupNodeId);
  const background = createSvgElement(doc, "rect");
  background.setAttribute("x", String(gridX));
  background.setAttribute("y", String(gridY));
  background.setAttribute("width", String(gridWidth));
  background.setAttribute("height", String(gridHeight));
  background.setAttribute("fill", "#f8fafc");
  background.setAttribute("stroke", "#94a3b8");
  group.appendChild(background);

  Array.from({ length: matrix.columns + 1 }, (_, index) => {
    const x = gridX + index * cellWidth;
    const line = createSvgElement(doc, "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", String(gridY));
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(gridY + gridHeight));
    line.setAttribute("stroke", "#94a3b8");
    group.appendChild(line);
  });

  Array.from({ length: 4 }, (_, index) => {
    const y = gridY + index * cellHeight;
    const line = createSvgElement(doc, "line");
    line.setAttribute("x1", String(gridX));
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(gridX + gridWidth));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "#94a3b8");
    group.appendChild(line);
  });

  const textEl = createSvgElement(doc, "text");
  textEl.setAttribute("fill", "#0f172a");
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("dominant-baseline", "middle");
  textEl.setAttribute(
    "font-family",
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
  );
  textEl.setAttribute("font-size", "18");
  textEl.setAttribute("font-weight", "700");

  matrix.rows.forEach((row, rowIndex) => {
    row.forEach((token, colIndex) => {
      const x = gridX + colIndex * cellWidth + cellWidth / 2;
      const y = gridY + rowIndex * cellHeight + cellHeight / 2 + 4;
      const tspan = createSvgElement(doc, "tspan");
      tspan.setAttribute("x", String(x));
      tspan.setAttribute("y", String(y));
      tspan.textContent = token;
      textEl.appendChild(tspan);
    });
  });

  group.appendChild(textEl);
}

function normalize生成类型(type: 可生成类型): 可生成类型 {
  const 比值: 手织图比值 = {
    D: {
      ...type.比值.D,
      sort: get排序值(type.比值.D, 1),
    },
    M: type.比值.M
      ? {
          ...type.比值.M,
          sort: get排序值(type.比值.M, 2),
        }
      : undefined,
    L: type.比值.L
      ? {
          ...type.比值.L,
          sort: get排序值(type.比值.L, 3),
        }
      : undefined,
  };
  if (type.type === "横排") {
    return {
      ...type,
      groupNodeId: type.groupNodeId || 横排分组节点ID,
      比值,
    };
  }

  return {
    ...type,
    groupNodeId: type.groupNodeId || 方形分组节点ID,
    比值,
  };
}

export function build手织图Svg(
  data: 手织图,
  options?: { sourceSvg?: string },
): 手织图 {
  if (data.类型.type === "特殊") {
    return data;
  }

  const normalizedType = normalize生成类型(data.类型);
  const sourceSvg = options?.sourceSvg?.trim() || createEmpty手织图SourceSvg();
  const doc = parseSvg(sourceSvg);
  if (!doc?.documentElement) {
    return {
      ...data,
      svg: sourceSvg,
      类型: normalizedType,
    };
  }

  const overlayGroup = getOrCreateOverlayGroup(doc);
  if (!overlayGroup) {
    return {
      ...data,
      svg: sourceSvg,
      类型: normalizedType,
    };
  }

  if (normalizedType.type === "横排") {
    render横排到源图(doc, overlayGroup, normalizedType);
  } else {
    render方形到源图(doc, overlayGroup, normalizedType);
  }

  return {
    ...data,
    svg: serializeSvg(doc),
    类型: normalizedType,
  };
}

export function get当前分组节点ID(data: 手织图): string {
  return data.类型.type === "特殊" ? "" : data.类型.groupNodeId;
}

export function get有效排序(data: 手织图): 手织图比例键[] {
  if (data.类型.type === "特殊") return [];
  return get有效比例键列表(data.类型.比值);
}
