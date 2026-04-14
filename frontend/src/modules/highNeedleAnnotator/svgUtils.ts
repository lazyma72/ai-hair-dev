import type { DmlValue } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

export function parseSvg(svg: string): Document | null {
  try {
    const parser = new DOMParser();
    return parser.parseFromString(svg, "image/svg+xml");
  } catch {
    return null;
  }
}

export function serializeSvg(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}

export function ensureLineIds(
  svg: string,
  selector: string,
  prefix = "line",
): { svg: string; lineIds: string[] } {
  const doc = parseSvg(svg);
  if (!doc) return { svg, lineIds: [] };

  const used = new Set<string>();
  const nodes = Array.from(doc.querySelectorAll(selector));

  // 统计全局 id 冲突：如果 svg 内存在重复 id，会导致 getElementById / 叠加标注定位到“错线条”。
  const idCounts = new Map<string, number>();
  for (const el of Array.from(doc.querySelectorAll("[id]"))) {
    const id = (el.getAttribute("id") ?? "").trim();
    if (!id) continue;
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  const lineIds = nodes.map((el, idx) => {
    let id = (el.getAttribute("id") ?? "").trim();

    // 如果 id 为空、已被本次使用、或全局存在重复，则强制生成新 id。
    if (!id || used.has(id) || (idCounts.get(id) ?? 0) > 1) {
      id = `${prefix}_${idx + 1}`;
      while (used.has(id) || (idCounts.get(id) ?? 0) > 0) {
        id = `${prefix}_${idx + 1}_${Math.floor(Math.random() * 1000)}`;
      }
      el.setAttribute("id", id);
      idCounts.set(id, 1);
    }

    used.add(id);
    return id;
  });

  return { svg: serializeSvg(doc), lineIds };
}

export function ensureTextIds(
  svg: string,
  selector = "text",
  prefix = "text",
): { svg: string; textIds: string[] } {
  const doc = parseSvg(svg);
  if (!doc) return { svg, textIds: [] };

  const nodes = Array.from(doc.querySelectorAll(selector));

  // 统计全局 id 冲突（避免 getElementById / 叠加标注定位到错节点）
  const idCounts = new Map<string, number>();
  for (const el of Array.from(doc.querySelectorAll("[id]"))) {
    const id = (el.getAttribute("id") ?? "").trim();
    if (!id) continue;
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  const used = new Set<string>();
  const textIds = nodes.map((el, idx) => {
    let id = (el.getAttribute("id") ?? "").trim();
    if (!id || used.has(id) || (idCounts.get(id) ?? 0) > 1) {
      id = `${prefix}_${idx + 1}`;
      while (used.has(id) || (idCounts.get(id) ?? 0) > 0) {
        id = `${prefix}_${idx + 1}_${Math.floor(Math.random() * 1000)}`;
      }
      el.setAttribute("id", id);
      idCounts.set(id, 1);
    }

    used.add(id);
    return id;
  });

  return { svg: serializeSvg(doc), textIds };
}

export function pruneSvgTextNodes(
  svg: string,
  keepTextNodeIds: string[],
): string {
  const doc = parseSvg(svg);
  if (!doc) return svg;

  const keep = new Set(keepTextNodeIds.map((s) => s.trim()).filter(Boolean));
  for (const el of Array.from(doc.querySelectorAll("text"))) {
    const id = (el.getAttribute("id") ?? "").trim();
    if (!id || !keep.has(id)) {
      el.remove();
    }
  }

  return serializeSvg(doc);
}

export function renameIds(svg: string, renameMap: Map<string, string>): string {
  if (renameMap.size === 0) return svg;
  const doc = parseSvg(svg);
  if (!doc) return svg;

  renameMap.forEach((to, from) => {
    const el = doc.getElementById(from);
    if (el) el.setAttribute("id", to);
  });

  return serializeSvg(doc);
}

type SvgTextUpdateOptions = {
  /** 多行文本：会清空并重建 tspans。 */
  lines?: string[];
};

export function updateSvgTextNode(
  svg: string,
  nodeId: string,
  text: string,
  options?: SvgTextUpdateOptions,
): string {
  if (!svg || !nodeId) return svg;
  const doc = parseSvg(svg);
  if (!doc) return svg;

  try {
    // 避免 SVG 内部负坐标文本被裁剪
    doc.documentElement.setAttribute("overflow", "visible");

    const el = doc.getElementById(nodeId);
    if (!el) return svg;

    const tspans = Array.from(el.querySelectorAll("tspan"));
    const lines = options?.lines?.map((s) => s.trim()).filter(Boolean);

    const clearCompressAttrs = () => {
      el.removeAttribute("textLength");
      el.removeAttribute("lengthAdjust");
    };

    if (lines && lines.length > 0) {
      clearCompressAttrs();

      const baseX =
        tspans[0]?.getAttribute("x") ?? el.getAttribute("x") ?? undefined;

      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      lines.forEach((line, i) => {
        const tspan = doc.createElementNS(SVG_NS, "tspan");
        if (baseX) tspan.setAttribute("x", baseX);
        if (i > 0) tspan.setAttribute("dy", "1.2em");
        tspan.textContent = line;
        el.appendChild(tspan);
      });

      return serializeSvg(doc);
    }

    // 统一将文本节点“重建”为单一文本（避免保留旧 tspan 导致文字挤压/重叠）
    clearCompressAttrs();

    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    el.textContent = text;

    return serializeSvg(doc);
  } catch {
    return svg;
  }
}

export function getSvgTextNodeText(svg: string, nodeId: string): string {
  if (!svg || !nodeId) return "";
  const doc = parseSvg(svg);
  if (!doc) return "";
  const el = doc.getElementById(nodeId);
  const text = (el?.textContent ?? "").trim();
  return text;
}

function parseInlineStyle(styleText: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!styleText) return map;

  styleText
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf(":");
      if (idx <= 0) return;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key || !value) return;
      map[key] = value;
    });

  return map;
}

export function getSvgTextNodeFontStyle(
  svg: string,
  nodeId: string,
): Record<string, unknown> {
  if (!svg || !nodeId) return {};
  const doc = parseSvg(svg);
  if (!doc) return {};

  const el = doc.getElementById(nodeId);
  if (!el) return {};

  const styleMap = parseInlineStyle(el.getAttribute("style") ?? "");
  const readAttr = (key: string): string =>
    (el.getAttribute(key) ?? styleMap[key] ?? "").trim();

  const fill = readAttr("fill");
  const fontWeight = readAttr("font-weight");
  const fontSizeRaw = readAttr("font-size");

  const result: Record<string, unknown> = {};
  if (fill) result.fill = fill;
  if (fontWeight) result.fontWeight = fontWeight;
  if (fontSizeRaw) {
    const parsed = Number.parseFloat(fontSizeRaw);
    result.fontSize = Number.isFinite(parsed) ? parsed : fontSizeRaw;
  }

  return result;
}

export type SvgTextNodeInfo = {
  id: string;
  text: string;
  fontStyle: Record<string, unknown>;
};

export function collectSvgTextNodes(svg: string): SvgTextNodeInfo[] {
  const doc = parseSvg(svg);
  if (!doc) return [];

  const nodes = Array.from(doc.querySelectorAll("text"));
  return nodes
    .map((el) => {
      const id = (el.getAttribute("id") ?? "").trim();
      if (!id) return null;

      const text = (el.textContent ?? "").trim();

      const styleMap = parseInlineStyle(el.getAttribute("style") ?? "");
      const readAttr = (key: string): string =>
        (el.getAttribute(key) ?? styleMap[key] ?? "").trim();

      const fill = readAttr("fill");
      const fontWeight = readAttr("font-weight");
      const fontSizeRaw = readAttr("font-size");

      const fontStyle: Record<string, unknown> = {};
      if (fill) fontStyle.fill = fill;
      if (fontWeight) fontStyle.fontWeight = fontWeight;
      if (fontSizeRaw) {
        const parsed = Number.parseFloat(fontSizeRaw);
        fontStyle.fontSize = Number.isFinite(parsed) ? parsed : fontSizeRaw;
      }

      return { id, text, fontStyle };
    })
    .filter(Boolean) as SvgTextNodeInfo[];
}

export function removeSvgTextNodes(svg: string, nodeIds: string[]): string {
  if (!svg) return svg;
  if (!nodeIds || nodeIds.length === 0) return svg;
  const doc = parseSvg(svg);
  if (!doc) return svg;

  const remove = new Set(nodeIds.map((s) => s.trim()).filter(Boolean));
  if (remove.size === 0) return svg;

  remove.forEach((id) => {
    const el = doc.getElementById(id);
    if (el && el.tagName.toLowerCase() === "text") {
      el.remove();
    }
  });

  return serializeSvg(doc);
}

export function setSvgTextNodeStyle(
  svg: string,
  nodeId: string,
  fontStyle: Record<string, unknown>,
): string {
  if (!svg || !nodeId) return svg;
  const doc = parseSvg(svg);
  if (!doc) return svg;

  try {
    doc.documentElement.setAttribute("overflow", "visible");

    const el = doc.getElementById(nodeId);
    if (!el) return svg;

    // 避免 textLength/lengthAdjust 造成长文本被“压缩”
    el.removeAttribute("textLength");
    el.removeAttribute("lengthAdjust");

    const style = (el as unknown as SVGElement).style;

    const setOrRemoveStyle = (prop: string, value: unknown) => {
      if (value === undefined || value === null || value === "") {
        style.removeProperty(prop);
        return;
      }
      style.setProperty(prop, String(value), "important");
    };

    const setOrRemoveAttr = (attr: string, value: unknown) => {
      if (value === undefined || value === null || value === "") {
        el.removeAttribute(attr);
        return;
      }
      el.setAttribute(attr, String(value));
    };

    // 同时写入 style（更高优先级）+ attribute（便于回读）
    setOrRemoveStyle("fill", fontStyle.fill);
    setOrRemoveStyle("font-size", fontStyle.fontSize);
    setOrRemoveStyle("font-weight", fontStyle.fontWeight);

    setOrRemoveAttr("fill", fontStyle.fill);
    setOrRemoveAttr("font-size", fontStyle.fontSize);
    setOrRemoveAttr("font-weight", fontStyle.fontWeight);

    return serializeSvg(doc);
  } catch {
    return svg;
  }
}

export function setSvgTextNodePosition(
  svg: string,
  nodeId: string,
  pos: { x: number; y: number },
): string {
  if (!svg || !nodeId) return svg;
  const doc = parseSvg(svg);
  if (!doc) return svg;

  try {
    doc.documentElement.setAttribute("overflow", "visible");

    const el = doc.getElementById(nodeId);
    if (!el) return svg;

    const parseFirst = (v: string | null): number | null => {
      if (!v) return null;
      const n = Number(v.trim().split(/[ ,]+/)[0]);
      return Number.isFinite(n) ? n : null;
    };

    // 读取"原始锚点"：即不含 transform 时 x/y 属性所定义的坐标。
    // 与 canvas 的 getAnchorInParentSpace 保持相同优先级：
    //   tspan[0].x/y  >  text.x/y  >  0
    // （SVG 规范：tspan 绝对 x/y 会覆盖继承自 text 的坐标）
    const firstTspan = el.querySelector("tspan");
    const rawX =
      parseFirst(firstTspan?.getAttribute("x") ?? null) ??
      parseFirst(el.getAttribute("x")) ??
      0;
    const rawY =
      parseFirst(firstTspan?.getAttribute("y") ?? null) ??
      parseFirst(el.getAttribute("y")) ??
      0;

    // 所需偏移量 = 目标位置 - 原始锚点
    const tx = pos.x - rawX;
    const ty = pos.y - rawY;

    // 将现有 transform 中的 translate 部分替换为新值，保留 rotate/scale/matrix 等
    const existing = el.getAttribute("transform") ?? "";
    const withoutTranslate = existing
      .replace(/translate\s*\([^)]*\)/gi, "")
      .trim();
    const newTransform = `translate(${tx},${ty})${withoutTranslate ? ` ${withoutTranslate}` : ""}`;

    el.setAttribute("transform", newTransform);

    // ⚠️  不修改 x、y 及任何 tspan 属性——transform 整体平移，行间距结构完全保留

    return serializeSvg(doc);
  } catch {
    return svg;
  }
}

function getDefaultTextPos(root: SVGSVGElement): { x: number; y: number } {
  const vb = (root.getAttribute("viewBox") ?? "").trim();
  if (vb) {
    const [x, y, w, h] = vb.split(/[ ,]+/).map((n) => Number(n));
    if ([x, y, w, h].every((n) => Number.isFinite(n))) {
      return { x: x + w * 0.5, y: y + h * 0.5 };
    }
  }

  const width = Number(root.getAttribute("width"));
  const height = Number(root.getAttribute("height"));
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return { x: width * 0.5, y: height * 0.5 };
  }

  return { x: 50, y: 50 };
}

export function appendSvgTextNode(
  svg: string,
  options: {
    nodeId: string;
    text: string;
    x?: number;
    y?: number;
    fontStyle?: Record<string, unknown>;
  },
): string {
  const doc = parseSvg(svg);
  if (!doc) return svg;

  try {
    doc.documentElement.setAttribute("overflow", "visible");

    const root = doc.documentElement as unknown as SVGSVGElement;
    const { x, y } =
      typeof options.x === "number" && typeof options.y === "number"
        ? { x: options.x, y: options.y }
        : getDefaultTextPos(root);

    const textEl = doc.createElementNS(SVG_NS, "text");
    textEl.setAttribute("id", options.nodeId);
    textEl.setAttribute("x", String(x));
    textEl.setAttribute("y", String(y));
    textEl.textContent = options.text;

    root.appendChild(textEl);

    if (options.fontStyle) {
      return setSvgTextNodeStyle(
        serializeSvg(doc),
        options.nodeId,
        options.fontStyle,
      );
    }

    return serializeSvg(doc);
  } catch {
    return svg;
  }
}

export function decorateLines(
  svg: string,
  options: {
    /** 需要确保可命中的线条集合（不改变颜色，仅补齐 pointer-events/cursor）。 */
    touchIds?: string[];
    selected?: Set<string>;
    disabled?: Set<string>;
    /** 区域节点序号（用于渲染 1、2、3…） */
    regionNoById?: Map<string, number>;
    /** 区域线条自定义颜色（DML 阶段用于按区域上色） */
    regionStrokeById?: Map<string, string>;
    /** 档位号（用于渲染 1档、2档…） */
    levelNoById?: Map<string, number>;
    dmlById?: Map<string, DmlValue>;
    doubleById?: Set<string>;
    /** 当前步骤正在“勾选”的高亮色 */
    selectedStroke?: string;
  },
): string {
  const doc = parseSvg(svg);
  if (!doc) return svg;

  const {
    touchIds,
    selected,
    disabled,
    regionNoById,
    regionStrokeById,
    levelNoById,
    dmlById,
    doubleById,
    selectedStroke,
  } = options;

  const allIds = new Set<string>();

  touchIds?.forEach((id) => allIds.add(id));

  (selected ?? new Set()).forEach((id) => allIds.add(id));
  (disabled ?? new Set()).forEach((id) => allIds.add(id));
  regionNoById?.forEach((_, id) => allIds.add(id));
  regionStrokeById?.forEach((_, id) => allIds.add(id));
  levelNoById?.forEach((_, id) => allIds.add(id));
  dmlById?.forEach((_, id) => allIds.add(id));
  doubleById?.forEach((id) => allIds.add(id));

  allIds.forEach((id) => {
    const el = doc.getElementById(id);
    if (!el) return;

    const isSelected = selected?.has(id);
    const isDisabled = disabled?.has(id);
    const regionNo = regionNoById?.get(id);
    const regionStroke = regionStrokeById?.get(id);
    const levelNo = levelNoById?.get(id);
    const dml = dmlById?.get(id);
    const isDouble = doubleById?.has(id);

    const nextStroke = isSelected
      ? (selectedStroke ?? "#ef4444")
      : typeof levelNo === "number"
        ? "#f59e0b"
        : regionStroke
          ? regionStroke
          : typeof regionNo === "number"
            ? "#ef4444"
            : dml === "D"
              ? "#ef4444"
              : dml === "M"
                ? "#f59e0b"
                : dml === "L"
                  ? "#eab308"
                  : isDouble
                    ? "#a855f7"
                    : isDisabled
                      ? "#cbd5e1"
                      : undefined;

    // 确保细线可命中（点击/刷选）
    (el as unknown as SVGElement).setAttribute("pointer-events", "stroke");
    (el as unknown as SVGElement).setAttribute("cursor", "pointer");

    if (nextStroke) {
      // 使用 SVG attribute 写入，避免 sanitizer 因 style 过滤导致 stroke 丢失
      (el as unknown as SVGElement).setAttribute("stroke", nextStroke);
    }

    const baseWidth = parseFloat(el.getAttribute("stroke-width") ?? "1") || 1;

    let nextWidth = baseWidth;
    if (isSelected) {
      nextWidth = Math.max(baseWidth, 2.5);
    } else if (
      regionStroke ||
      typeof regionNo === "number" ||
      typeof levelNo === "number" ||
      (dml ?? "").trim() ||
      isDouble
    ) {
      nextWidth = Math.max(baseWidth, 2);
    }

    if (isDouble) {
      nextWidth += 1;
    }

    if (nextWidth !== baseWidth) {
      (el as unknown as SVGElement).setAttribute("stroke-width", String(nextWidth));
    }

    if (isDisabled) {
      (el as unknown as SVGElement).setAttribute("opacity", "0.35");
    } else {
      (el as unknown as SVGElement).removeAttribute("opacity");
    }
  });

  return serializeSvg(doc);
}
