import * as React from "react";
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import { parseSvg } from "../highNeedleAnnotator/svgUtils";

type Props = {
  svg: string;
  title?: string;
  groupNodeId?: string;
  onChange: (nextSvg: string) => void;
};

const SKIP_TAGS = new Set(["defs", "style", "title", "desc", "metadata"]);
const SELECTED_FILTER = "drop-shadow(0 0 0.6px #2563eb) drop-shadow(0 0 4px rgba(37,99,235,0.65))";
const ROOT_CONTENT_GROUP_ID = "svg_editor_root_content_group";
const MODE_LABELS = {
  preview: "默认模式",
  text: "文本模式",
  line: "线条模式",
  scale: "缩放模式",
} as const;

type EditorMode = keyof typeof MODE_LABELS;
type LineTool = "select" | "draw-line" | "draw-curve";

type TextBox = {
  index: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ViewBoxState = {
  x: number;
  y: number;
  width: number;
  height: number;
  raw: string;
};

type LineDraft =
  | {
      type: "line" | "curve";
      start: { x: number; y: number };
      current: { x: number; y: number };
    }
  | null;

type GroupBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
} | null;

type ScaleBox = {
  kind: "root" | "generated";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
} | null;

function isGraphicElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return false;
  if (el.closest("defs")) return false;
  return [
    "g",
    "text",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "image",
    "use",
  ].includes(tag);
}

function isTextElement(el: Element): boolean {
  return el.tagName.toLowerCase() === "text";
}

function isLineElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return tag === "line" || tag === "path" || tag === "polyline" || tag === "polygon";
}

function describeNode(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = (el.getAttribute("id") ?? "").trim();
  if (id) return `${tag}#${id}`;
  return tag;
}

function getGroupNode(root: SVGSVGElement | null, groupNodeId?: string): Element | null {
  if (!root || !groupNodeId) return null;
  return (
    Array.from(root.querySelectorAll("g")).find(
      (node) => node.getAttribute("id") === groupNodeId,
    ) ?? null
  );
}

function ensureRootContentGroup(root: SVGSVGElement): SVGGElement {
  const existed = root.querySelector(`:scope > g#${ROOT_CONTENT_GROUP_ID}`);
  if (existed && existed instanceof SVGGElement) {
    return existed;
  }

  const group = createSvgElement("g");
  group.setAttribute("id", ROOT_CONTENT_GROUP_ID);
  const movableChildren = Array.from(root.children).filter((child) => {
    const tag = child.tagName.toLowerCase();
    return !SKIP_TAGS.has(tag) && child.getAttribute("id") !== ROOT_CONTENT_GROUP_ID;
  });
  movableChildren.forEach((child) => {
    group.appendChild(child);
  });
  root.appendChild(group);
  return group;
}

function isInsideGroup(node: Element, groupNodeId?: string): boolean {
  if (!groupNodeId) return false;
  const parentGroup = node.closest("g");
  return Boolean(parentGroup && parentGroup.getAttribute("id") === groupNodeId);
}

function getGroupTransformState(node: Element): {
  translateX: number;
  translateY: number;
  scale: number;
} {
  return {
    translateX: Number(node.getAttribute("data-editor-tx") ?? "0") || 0,
    translateY: Number(node.getAttribute("data-editor-ty") ?? "0") || 0,
    scale: Number(node.getAttribute("data-editor-scale") ?? "1") || 1,
  };
}

function applyGroupTransform(
  node: Element,
  transform: {
    translateX: number;
    translateY: number;
    scale: number;
    originX: number;
    originY: number;
  },
) {
  const { translateX, translateY, scale, originX, originY } = transform;
  const e = originX + translateX - originX * scale;
  const f = originY + translateY - originY * scale;
  node.setAttribute(
    "transform",
    `matrix(${scale} 0 0 ${scale} ${e} ${f})`,
  );
  node.setAttribute("data-editor-tx", String(translateX));
  node.setAttribute("data-editor-ty", String(translateY));
  node.setAttribute("data-editor-scale", String(scale));
}

function getViewBoxState(root: SVGSVGElement): ViewBoxState {
  const viewBox = (root.getAttribute("viewBox") ?? "").trim();
  if (viewBox) {
    const [x, y, width, height] = viewBox.split(/[ ,]+/).map(Number);
    if ([x, y, width, height].every((value) => Number.isFinite(value))) {
      return { x, y, width, height, raw: `${x} ${y} ${width} ${height}` };
    }
  }
  const width = Number(root.getAttribute("width")) || 900;
  const height = Number(root.getAttribute("height")) || 560;
  return { x: 0, y: 0, width, height, raw: `0 0 ${width} ${height}` };
}

function ensureSvgStyles(svg: SVGSVGElement) {
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.background = "#fff";
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(
    "http://www.w3.org/2000/svg",
    tagName,
  ) as SVGElementTagNameMap[K];
}

export default function OpenSourceSvgEditor({
  svg,
  title = "开源 SVG 编辑器",
  groupNodeId,
  onChange,
}: Props) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useRef<SVGSVGElement | null>(null);
  const nodesRef = React.useRef<Element[]>([]);
  const interactionRef = React.useRef<
    | {
        type: "drag" | "resize";
        index: number;
        startPoint: { x: number; y: number };
        startTranslate: { x: number; y: number; rest: string };
        startFontSize: number;
        startTspanFontSizes: number[];
      }
    | null
  >(null);
  const groupInteractionRef = React.useRef<
    | {
        type: "drag" | "resize";
        target: "generated" | "root";
        startPoint: { x: number; y: number };
        startTranslateX: number;
        startTranslateY: number;
        startScale: number;
        originX: number;
        originY: number;
        boxWidth: number;
        boxHeight: number;
      }
    | null
  >(null);
  const latestSvgRef = React.useRef(svg);
  const onChangeRef = React.useRef(onChange);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const [nodeCount, setNodeCount] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [mode, setMode] = React.useState<EditorMode>("preview");
  const [lineTool, setLineTool] = React.useState<LineTool>("select");
  const [textBoxes, setTextBoxes] = React.useState<TextBox[]>([]);
  const [viewBoxState, setViewBoxState] = React.useState<ViewBoxState | null>(null);
  const [lineDraft, setLineDraft] = React.useState<LineDraft>(null);
  const [groupBox, setGroupBox] = React.useState<GroupBox>(null);
  const [rootScaleBox, setRootScaleBox] = React.useState<ScaleBox>(null);

  React.useEffect(() => {
    latestSvgRef.current = svg;
  }, [svg]);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const syncBack = React.useCallback((nextRoot?: SVGSVGElement | null) => {
    const activeRoot = nextRoot ?? rootRef.current;
    if (!activeRoot) return;
    const nextSvg = activeRoot.outerHTML;
    if (nextSvg !== latestSvgRef.current) {
      latestSvgRef.current = nextSvg;
      onChangeRef.current(nextSvg);
    }
  }, []);

  const applySelectionStyles = React.useCallback((nextIndex: number | null) => {
    nodesRef.current.forEach((node, index) => {
      if (!(node instanceof SVGElement)) return;
      if (index === nextIndex) {
        node.style.filter = SELECTED_FILTER;
      } else {
        node.style.filter = "";
      }
    });
  }, []);

  const refreshTextBoxes = React.useCallback(() => {
    if (mode !== "text") {
      setTextBoxes([]);
      return;
    }
    const root = rootRef.current;
    if (!root) {
      setTextBoxes([]);
      return;
    }
    const generatedGroupNode = getGroupNode(root, groupNodeId);
    setViewBoxState(getViewBoxState(root));
    const nextBoxes = nodesRef.current
      .map((node, index) => {
        if (!isTextElement(node)) return null;
        if (generatedGroupNode && generatedGroupNode.contains(node)) return null;
        if (!(node instanceof SVGGraphicsElement)) return null;
        const box = node.getBBox();
        const translate = parseTranslate(node.getAttribute("transform"));
        const padding = 6;
        return {
          index,
          label: describeNode(node),
          x: box.x + translate.x - padding,
          y: box.y + translate.y - padding,
          width: Math.max(box.width + padding * 2, 28),
          height: Math.max(box.height + padding * 2, 24),
        };
      })
      .filter(Boolean) as TextBox[];
    setTextBoxes(nextBoxes);
  }, [groupNodeId, mode]);

  const refreshGroupBox = React.useCallback(() => {
    if (!groupNodeId || mode !== "text") {
      setGroupBox(null);
      return;
    }
    const root = rootRef.current;
    if (!root) {
      setGroupBox(null);
      return;
    }
    const groupNode = getGroupNode(root, groupNodeId);
    if (!groupNode || !(groupNode instanceof SVGGraphicsElement)) {
      setGroupBox(null);
      return;
    }
    setViewBoxState(getViewBoxState(root));
    const box = groupNode.getBBox();
    const transform = getGroupTransformState(groupNode);
    const padding = 10;
    setGroupBox({
      x: box.x + transform.translateX - padding,
      y: box.y + transform.translateY - padding,
      width: Math.max(box.width * transform.scale + padding * 2, 40),
      height: Math.max(box.height * transform.scale + padding * 2, 40),
      label: describeNode(groupNode),
    });
  }, [groupNodeId, mode]);

  const refreshScaleBoxes = React.useCallback(() => {
    const root = rootRef.current;
    if (!root || mode !== "scale") {
      setRootScaleBox(null);
      return;
    }
    setViewBoxState(getViewBoxState(root));
    const rootGroup = getGroupNode(root, ROOT_CONTENT_GROUP_ID);
    if (rootGroup && rootGroup instanceof SVGGraphicsElement) {
      const box = rootGroup.getBBox();
      const transform = getGroupTransformState(rootGroup);
      const padding = 10;
      setRootScaleBox({
        kind: "root",
        x: box.x + transform.translateX - padding,
        y: box.y + transform.translateY - padding,
        width: Math.max(box.width * transform.scale + padding * 2, 60),
        height: Math.max(box.height * transform.scale + padding * 2, 60),
        label: "svg-root",
      });
    } else {
      setRootScaleBox(null);
    }
  }, [mode]);

  function parseTranslate(value: string | null): { x: number; y: number; rest: string } {
    const raw = (value ?? "").trim();
    const match = raw.match(/translate\(([^)]+)\)/);
    if (!match) return { x: 0, y: 0, rest: raw };
    const [full, inner] = match;
    const [x, y = "0"] = inner.split(/[ ,]+/);
    return {
      x: Number(x) || 0,
      y: Number(y) || 0,
      rest: raw.replace(full, "").trim(),
    };
  }

  function applyTranslate(
    el: Element,
    translate: { x: number; y: number; rest: string },
  ) {
    const translateText = `translate(${translate.x} ${translate.y})`;
    const nextTransform = translate.rest
      ? `${translate.rest} ${translateText}`.trim()
      : translateText;
    el.setAttribute("transform", nextTransform);
  }

  function clientToSvgPoint(clientX: number, clientY: number) {
    const viewport = viewportRef.current;
    const viewBox = viewBoxState;
    if (!viewport || !viewBox) return null;
    const rect = viewport.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
      y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
    };
  }

  React.useEffect(() => {
    applySelectionStyles(selectedIndex);
    const selectedNode =
      selectedIndex != null ? nodesRef.current[selectedIndex] ?? null : null;
    setSelectedLabel(selectedNode ? describeNode(selectedNode) : "");
  }, [applySelectionStyles, selectedIndex]);

  const canEditNode = React.useCallback(
    (node: Element) => {
      if (mode === "preview") return false;
      if (mode === "text") return isTextElement(node) && !isInsideGroup(node, groupNodeId);
      return lineTool === "select" && isLineElement(node);
    },
    [groupNodeId, lineTool, mode],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const parsed = parseSvg(svg);
    const root = parsed?.documentElement;
    if (!root || root.tagName.toLowerCase() !== "svg") {
      setNodeCount(0);
      nodesRef.current = [];
      rootRef.current = null;
      setSelectedLabel("");
      setTextBoxes([]);
      setViewBoxState(null);
      setGroupBox(null);
      setRootScaleBox(null);
      return;
    }

    const mountedRoot = document.importNode(root, true) as unknown as SVGSVGElement;
    ensureSvgStyles(mountedRoot);
    ensureRootContentGroup(mountedRoot);
    rootRef.current = mountedRoot;
    container.appendChild(mountedRoot);

    const cleanupTasks: Array<() => void> = [];
    const editableNodes = Array.from(mountedRoot.querySelectorAll("*")).filter(isGraphicElement);
    nodesRef.current = editableNodes;
    setNodeCount(editableNodes.length);
    setViewBoxState(getViewBoxState(mountedRoot));

    editableNodes.forEach((node, index) => {
      const instance = SVG(node as unknown as SVGElement) as any;
      if (typeof instance.draggable !== "function") return;

      const editable = canEditNode(node);
      node.setAttribute("cursor", editable ? "move" : "default");

      if (editable && mode === "line") {
        instance.draggable();
        const handleDragEnd = () => {
          syncBack();
        };
        instance.on("dragend.editor", handleDragEnd);
        cleanupTasks.push(() => {
          instance.off("dragend.editor", handleDragEnd);
        });
      }

      const handleClick = (event: Event) => {
        event.stopPropagation();
        if (!editable) return;
        setSelectedIndex(index);
      };
      node.addEventListener("click", handleClick);

      const handleDoubleClick = (event: Event) => {
        event.stopPropagation();
        if (!editable) return;
        const tag = node.tagName.toLowerCase();
        if (mode === "text" && tag === "text") {
          const current = node.textContent ?? "";
          const next = window.prompt("编辑文本内容", current);
          if (next != null) {
            node.textContent = next;
            syncBack(mountedRoot);
          }
          return;
        }

        if (mode === "line" && isLineElement(node)) {
          const promptLabel =
            tag === "path" ? "编辑路径 d" : "编辑线条描边颜色";
          const currentValue =
            tag === "path"
              ? node.getAttribute("d") ?? ""
              : node.getAttribute("stroke") ?? "#0f172a";
          const next = window.prompt(promptLabel, currentValue);
          if (next == null) return;

          if (tag === "path") {
            node.setAttribute("d", next);
          } else {
            node.setAttribute("stroke", next);
          }
          syncBack(mountedRoot);
        }
      };
      node.addEventListener("dblclick", handleDoubleClick);

      cleanupTasks.push(() => {
        if (typeof instance.draggable === "function" && !editable) {
          try {
            instance.draggable(false);
          } catch {}
        }
        node.removeEventListener("click", handleClick);
        node.removeEventListener("dblclick", handleDoubleClick);
      });
    });

    const handleBackgroundClick = () => {
      setSelectedIndex(null);
      setSelectedLabel("");
      applySelectionStyles(null);
    };
    mountedRoot.addEventListener("click", handleBackgroundClick);
    cleanupTasks.push(() => {
      mountedRoot.removeEventListener("click", handleBackgroundClick);
    });

    const nextSelectedIndex =
      selectedIndex != null &&
      editableNodes[selectedIndex] &&
      canEditNode(editableNodes[selectedIndex])
        ? selectedIndex
        : null;
    setSelectedIndex(nextSelectedIndex);
    requestAnimationFrame(() => {
      refreshTextBoxes();
      refreshGroupBox();
      refreshScaleBoxes();
    });

    return () => {
      cleanupTasks.forEach((task) => task());
      container.innerHTML = "";
    };
  }, [canEditNode, mode, refreshGroupBox, refreshScaleBoxes, refreshTextBoxes, svg, syncBack]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.width = `${zoom * 100}%`;
    requestAnimationFrame(() => {
      refreshTextBoxes();
      refreshGroupBox();
      refreshScaleBoxes();
    });
  }, [refreshGroupBox, refreshScaleBoxes, refreshTextBoxes, zoom, svg]);

  React.useEffect(() => {
    if (mode !== "text") return;
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      const node = nodesRef.current[interaction.index];
      if (!node) return;
      const point = clientToSvgPoint(event.clientX, event.clientY);
      if (!point) return;
      const dx = point.x - interaction.startPoint.x;
      const dy = point.y - interaction.startPoint.y;

      if (interaction.type === "drag") {
        applyTranslate(node, {
          x: interaction.startTranslate.x + dx,
          y: interaction.startTranslate.y + dy,
          rest: interaction.startTranslate.rest,
        });
      } else {
        const scale = Math.max(
          0.4,
          (interaction.startFontSize + Math.max(dx, dy) * 0.2) /
            Math.max(interaction.startFontSize, 1),
        );
        const nextFontSize = Math.max(
          8,
          interaction.startFontSize + Math.max(dx, dy) * 0.2,
        );
        node.setAttribute("font-size", String(Math.round(nextFontSize * 10) / 10));
        Array.from(node.querySelectorAll("tspan")).forEach((tspan, idx) => {
          const baseSize =
            interaction.startTspanFontSizes[idx] || interaction.startFontSize;
          const nextTspanSize = Math.max(8, baseSize * scale);
          tspan.setAttribute(
            "font-size",
            String(Math.round(nextTspanSize * 10) / 10),
          );
        });
      }
      refreshTextBoxes();
    };

    const handlePointerUp = () => {
      if (!interactionRef.current) return;
      interactionRef.current = null;
      syncBack();
      refreshTextBoxes();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [mode, refreshTextBoxes, svg, syncBack, viewBoxState, zoom]);

  React.useEffect(() => {
    if (mode !== "text" && mode !== "scale") return;
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = groupInteractionRef.current;
      if (!interaction) return;
      const root = rootRef.current;
      if (!root) return;
      const targetNode =
        interaction.target === "root"
          ? getGroupNode(root, ROOT_CONTENT_GROUP_ID)
          : getGroupNode(root, groupNodeId);
      if (!targetNode) return;
      const point = clientToSvgPoint(event.clientX, event.clientY);
      if (!point) return;
      const dx = point.x - interaction.startPoint.x;
      const dy = point.y - interaction.startPoint.y;
      if (interaction.type === "drag") {
        applyGroupTransform(targetNode, {
          translateX: interaction.startTranslateX + dx,
          translateY: interaction.startTranslateY + dy,
          scale: interaction.startScale,
          originX: interaction.originX,
          originY: interaction.originY,
        });
      } else {
        const scaleDelta = Math.max(
          dx / Math.max(interaction.boxWidth, 1),
          dy / Math.max(interaction.boxHeight, 1),
        );
        applyGroupTransform(targetNode, {
          translateX: interaction.startTranslateX,
          translateY: interaction.startTranslateY,
          scale: Math.max(0.2, interaction.startScale * (1 + scaleDelta)),
          originX: interaction.originX,
          originY: interaction.originY,
        });
      }
      refreshGroupBox();
      refreshScaleBoxes();
    };

    const handlePointerUp = () => {
      if (!groupInteractionRef.current) return;
      groupInteractionRef.current = null;
      syncBack();
      refreshGroupBox();
      refreshScaleBoxes();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [groupNodeId, mode, refreshGroupBox, refreshScaleBoxes, syncBack, viewBoxState]);

  React.useEffect(() => {
    if (mode !== "line" || lineTool === "select") {
      setLineDraft(null);
    }
  }, [lineTool, mode]);

  function startTextInteraction(
    index: number,
    type: "drag" | "resize",
    event: React.PointerEvent,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const point = clientToSvgPoint(event.clientX, event.clientY);
    const node = nodesRef.current[index];
    if (!point || !node) return;
    const parsedTransform = parseTranslate(node.getAttribute("transform"));
    const fontSize = Number(node.getAttribute("font-size") ?? "16") || 16;
    const startTspanFontSizes = Array.from(node.querySelectorAll("tspan")).map(
      (tspan) => Number(tspan.getAttribute("font-size") ?? String(fontSize)) || fontSize,
    );
    interactionRef.current = {
      type,
      index,
      startPoint: point,
      startTranslate: parsedTransform,
      startFontSize: fontSize,
      startTspanFontSizes,
    };
    setSelectedIndex(index);
  }

  function editTextNode(index: number) {
    const node = nodesRef.current[index];
    if (!node || !isTextElement(node)) return;
    const current = node.textContent ?? "";
    const next = window.prompt("编辑文本内容", current);
    if (next == null) return;
    node.textContent = next;
    refreshTextBoxes();
    syncBack();
  }

  function deleteTextNode(index: number) {
    const node = nodesRef.current[index];
    if (!node || !isTextElement(node)) return;
    node.remove();
    nodesRef.current = nodesRef.current.filter((_, itemIndex) => itemIndex !== index);
    setNodeCount(nodesRef.current.length);
    setSelectedIndex(null);
    setSelectedLabel("");
    refreshTextBoxes();
    syncBack();
  }

  function buildCurvePath(
    start: { x: number; y: number },
    current: { x: number; y: number },
  ) {
    const dx = current.x - start.x;
    const controlX1 = start.x + dx * 0.35;
    const controlX2 = start.x + dx * 0.65;
    const offsetY = Math.max(Math.abs(dx) * 0.18, 24);
    const controlY1 = start.y - offsetY;
    const controlY2 = current.y + offsetY;
    return `M ${start.x} ${start.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${current.x} ${current.y}`;
  }

  function appendDrawnLine(draft: Exclude<LineDraft, null>) {
    const root = rootRef.current;
    if (!root) return;
    if (draft.type === "line") {
      const line = createSvgElement("line");
      line.setAttribute("x1", String(draft.start.x));
      line.setAttribute("y1", String(draft.start.y));
      line.setAttribute("x2", String(draft.current.x));
      line.setAttribute("y2", String(draft.current.y));
      line.setAttribute("stroke", "#0f172a");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("fill", "none");
      root.appendChild(line);
    } else {
      const path = createSvgElement("path");
      path.setAttribute("d", buildCurvePath(draft.start, draft.current));
      path.setAttribute("stroke", "#0f172a");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      root.appendChild(path);
    }
    syncBack(root);
  }

  function handleViewportPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (mode !== "line" || lineTool === "select") return;
    const point = clientToSvgPoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    setLineDraft({
      type: lineTool === "draw-curve" ? "curve" : "line",
      start: point,
      current: point,
    });
  }

  function handleViewportPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!lineDraft || mode !== "line" || lineTool === "select") return;
    const point = clientToSvgPoint(event.clientX, event.clientY);
    if (!point) return;
    setLineDraft((prev) => (prev ? { ...prev, current: point } : prev));
  }

  function handleViewportPointerUp() {
    if (!lineDraft) return;
    appendDrawnLine(lineDraft);
    setLineDraft(null);
  }

  function startGroupDrag(event: React.PointerEvent) {
    if (!groupNodeId || mode !== "text") return;
    const root = rootRef.current;
    if (!root) return;
    const groupNode = getGroupNode(root, groupNodeId);
    const point = clientToSvgPoint(event.clientX, event.clientY);
    if (!groupNode || !point) return;
    const box = (groupNode as SVGGraphicsElement).getBBox();
    const transform = getGroupTransformState(groupNode);
    event.preventDefault();
    event.stopPropagation();
    groupInteractionRef.current = {
      type: "drag",
      target: "generated",
      startPoint: point,
      startTranslateX: transform.translateX,
      startTranslateY: transform.translateY,
      startScale: transform.scale,
      originX: box.x,
      originY: box.y,
      boxWidth: box.width,
      boxHeight: box.height,
    };
    setSelectedLabel(describeNode(groupNode));
  }

  function startGroupResize(event: React.PointerEvent) {
    if (!groupNodeId || mode !== "scale") return;
    const root = rootRef.current;
    if (!root) return;
    const groupNode = getGroupNode(root, groupNodeId);
    const point = clientToSvgPoint(event.clientX, event.clientY);
    if (!groupNode || !point || !(groupNode instanceof SVGGraphicsElement)) return;
    const box = groupNode.getBBox();
    const transform = getGroupTransformState(groupNode);
    event.preventDefault();
    event.stopPropagation();
    groupInteractionRef.current = {
      type: "resize",
      target: "generated",
      startPoint: point,
      startTranslateX: transform.translateX,
      startTranslateY: transform.translateY,
      startScale: transform.scale,
      originX: box.x,
      originY: box.y,
      boxWidth: box.width,
      boxHeight: box.height,
    };
    setSelectedLabel(describeNode(groupNode));
  }

  function startRootResize(event: React.PointerEvent) {
    if (mode !== "scale") return;
    const root = rootRef.current;
    if (!root) return;
    const rootGroup = getGroupNode(root, ROOT_CONTENT_GROUP_ID);
    const point = clientToSvgPoint(event.clientX, event.clientY);
    if (!rootGroup || !point || !(rootGroup instanceof SVGGraphicsElement)) return;
    const box = rootGroup.getBBox();
    const transform = getGroupTransformState(rootGroup);
    event.preventDefault();
    event.stopPropagation();
    groupInteractionRef.current = {
      type: "resize",
      target: "root",
      startPoint: point,
      startTranslateX: transform.translateX,
      startTranslateY: transform.translateY,
      startScale: transform.scale,
      originX: box.x,
      originY: box.y,
      boxWidth: box.width,
      boxHeight: box.height,
    };
    setSelectedLabel("svg-root");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-[11px] text-slate-500">
            {nodeCount} 个节点，仿照 Figma 切换模式编辑
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(MODE_LABELS) as EditorMode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                mode === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => {
                setMode(item);
                setSelectedIndex(null);
                setSelectedLabel("");
                applySelectionStyles(null);
                setLineTool("select");
                setLineDraft(null);
              }}
            >
              {MODE_LABELS[item]}
            </button>
          ))}
          {mode === "line" ? (
            <div className="ml-1 flex items-center gap-2 rounded bg-slate-100 px-2 py-1">
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${
                  lineTool === "select"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setLineTool("select")}
              >
                选择
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${
                  lineTool === "draw-line"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setLineTool("draw-line")}
              >
                直线
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${
                  lineTool === "draw-curve"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setLineTool("draw-curve")}
              >
                曲线
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))))}
          >
            缩小
          </button>
          <button
            type="button"
            className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            onClick={() => setZoom(1)}
          >
            100%
          </button>
          <button
            type="button"
            className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(1))))}
          >
            放大
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            {mode === "preview"
              ? "默认模式只预览和缩放，不允许编辑"
              : mode === "text"
                ? groupBox
                  ? "文本模式：生成组可整体拖动；非生成组文本可拖动、双击编辑、右上角 X 删除、右下角缩放"
                  : "文本模式：拖动文本框可移动，双击文本框可编辑，右上角 X 可删除，右下角可缩放"
                : mode === "scale"
                  ? "缩放模式：可整体缩放上传 SVG；如果存在生成组，也可单独缩放生成组"
                : lineTool === "select"
                  ? "线条模式：可拖动线条/曲线，双击线条或曲线可编辑"
                  : lineTool === "draw-line"
                    ? "线条模式：在画布中按下并拖拽可绘制直线"
                    : "线条模式：在画布中按下并拖拽可绘制曲线"}
          </div>
          <div>
            当前缩放：{Math.round(zoom * 100)}%
            {selectedLabel ? `，当前节点：${selectedLabel}` : `，当前模式：${MODE_LABELS[mode]}`}
          </div>
        </div>
        <div className="h-[560px] overflow-auto rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div
            ref={viewportRef}
            className="relative min-h-[480px] min-w-[720px]"
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerLeave={handleViewportPointerUp}
          >
            <div ref={containerRef} className="min-h-[480px] min-w-[720px]" />
            {mode === "text" && viewBoxState ? (
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={viewBoxState.raw}
                preserveAspectRatio="xMidYMid meet"
              >
                {textBoxes.map((box) => (
                  <g key={box.index}>
                    {selectedIndex === box.index ? (
                      <rect
                        x={box.x - 2}
                        y={box.y - 2}
                        width={box.width + 4}
                        height={box.height + 4}
                        rx={6}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        pointerEvents="none"
                      />
                    ) : null}
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      rx={4}
                      fill={
                        selectedIndex === box.index
                          ? "rgba(37,99,235,0.10)"
                          : "rgba(148,163,184,0.05)"
                      }
                      stroke={selectedIndex === box.index ? "#2563eb" : "#94a3b8"}
                      strokeWidth={selectedIndex === box.index ? 1.5 : 1}
                      pointerEvents="all"
                      onPointerDown={(event) => startTextInteraction(box.index, "drag", event)}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        editTextNode(box.index);
                      }}
                    />
                    {selectedIndex === box.index ? (
                      <>
                        <g
                          pointerEvents="all"
                        >
                          <rect
                            x={box.x + box.width - 28}
                            y={box.y - 18}
                            width={28}
                            height={18}
                            rx={4}
                            fill="#ef4444"
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              deleteTextNode(box.index);
                            }}
                          />
                          <text
                            x={box.x + box.width - 14}
                            y={box.y - 5}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                            pointerEvents="none"
                          >
                            X
                          </text>
                        </g>
                        <rect
                          x={box.x + box.width - 10}
                          y={box.y + box.height - 10}
                          width={10}
                          height={10}
                          rx={2}
                          fill="#2563eb"
                          pointerEvents="all"
                          style={{ cursor: "nwse-resize" }}
                          onPointerDown={(event) => startTextInteraction(box.index, "resize", event)}
                        />
                      </>
                    ) : null}
                  </g>
                ))}
              </svg>
            ) : null}
            {mode === "text" && viewBoxState && groupBox ? (
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={viewBoxState.raw}
                preserveAspectRatio="xMidYMid meet"
              >
                <rect
                  x={groupBox.x}
                  y={groupBox.y}
                  width={groupBox.width}
                  height={groupBox.height}
                  rx={8}
                  fill="rgba(37,99,235,0.04)"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  pointerEvents="all"
                  style={{ cursor: "move" }}
                  onPointerDown={startGroupDrag}
                />
                <rect
                  x={groupBox.x + groupBox.width - 12}
                  y={groupBox.y + groupBox.height - 12}
                  width={12}
                  height={12}
                  rx={2}
                  fill="#2563eb"
                  pointerEvents="all"
                  style={{ cursor: "nwse-resize" }}
                  onPointerDown={startGroupResize}
                />
              </svg>
            ) : null}
            {mode === "scale" && viewBoxState ? (
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={viewBoxState.raw}
                preserveAspectRatio="xMidYMid meet"
              >
                {rootScaleBox ? (
                  <>
                    <rect
                      x={rootScaleBox.x}
                      y={rootScaleBox.y}
                      width={rootScaleBox.width}
                      height={rootScaleBox.height}
                      rx={8}
                      fill="rgba(15,23,42,0.03)"
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      pointerEvents="none"
                    />
                    <rect
                      x={rootScaleBox.x + rootScaleBox.width - 12}
                      y={rootScaleBox.y + rootScaleBox.height - 12}
                      width={12}
                      height={12}
                      rx={2}
                      fill="#0f172a"
                      pointerEvents="all"
                      style={{ cursor: "nwse-resize" }}
                      onPointerDown={startRootResize}
                    />
                  </>
                ) : null}
                {groupBox ? (
                  <>
                    <rect
                      x={groupBox.x}
                      y={groupBox.y}
                      width={groupBox.width}
                      height={groupBox.height}
                      rx={8}
                      fill="rgba(37,99,235,0.04)"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      pointerEvents="none"
                    />
                    <rect
                      x={groupBox.x + groupBox.width - 12}
                      y={groupBox.y + groupBox.height - 12}
                      width={12}
                      height={12}
                      rx={2}
                      fill="#2563eb"
                      pointerEvents="all"
                      style={{ cursor: "nwse-resize" }}
                      onPointerDown={startGroupResize}
                    />
                  </>
                ) : null}
              </svg>
            ) : null}
            {mode === "line" && viewBoxState && lineDraft ? (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={viewBoxState.raw}
                preserveAspectRatio="xMidYMid meet"
              >
                {lineDraft.type === "line" ? (
                  <line
                    x1={lineDraft.start.x}
                    y1={lineDraft.start.y}
                    x2={lineDraft.current.x}
                    y2={lineDraft.current.y}
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                ) : (
                  <path
                    d={buildCurvePath(lineDraft.start, lineDraft.current)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                )}
              </svg>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
