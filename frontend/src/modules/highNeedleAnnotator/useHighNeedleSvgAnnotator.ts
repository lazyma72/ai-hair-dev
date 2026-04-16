import { message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmpty高针图,
  type DmlValue,
  type 标注步骤,
  type 高针图,
  type 高针图系统预置区域,
} from "./types";
import {
  appendSvgTextNode,
  collectSvgTextNodes,
  decorateLines,
  ensureLineIds,
  ensureTextIds,
  getSvgTextNodeFontStyle,
  getSvgTextNodePosition,
  getSvgTextNodeText,
  pruneSvgTextNodes,
  removeSvgTextNodes,
  setSvgTextNodePosition,
  setSvgTextNodeStyle,
  updateSvgTextNode,
} from "./svgUtils";
import {
  makeDmlMap,
  makeDoubleSet,
  normalizeRegionDraft,
  uniquePreserveOrder,
  type RegionDraft,
} from "./helpers";
import {
  normalizePattern,
  type DmlAutoConfig,
  type RegionLineItem,
} from "./dmlAuto";
import { 高针图系统预置区域列表 } from "../../shared/models/高针图";

const DEFAULT_LINE_SELECTOR = "line, path, polyline, polygon";

const CUSTOM_REGION_PRESET_VALUE = "__custom__";

const STEP_ORDER = [
  "区域",
  "档位",
  "DML",
  "单双",
  "自定义文本",
  "完成",
] as const;

const AUTO_REMOVE_TEXT_SET = new Set(["D", "M", "L", "单", "双"]);

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

const REGION_COLOR_PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
] as const;

function allocLocalId(prefix: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny: any = (globalThis as any).crypto;
  const uuid =
    typeof cryptoAny?.randomUUID === "function" ? cryptoAny.randomUUID() : "";
  if (uuid) return `${prefix}_${uuid}`;
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function stepToIndex(step: 标注步骤): number {
  return STEP_ORDER.indexOf(step);
}

type SvgPoint = { x: number; y: number };

type MarkerTextKind = "region" | "level" | "dml" | "double";

function normalize高针图值(value: 高针图): 高针图 {
  return {
    ...value,
    底图: {
      ...value.底图,
      区域名: value.底图.区域名 ?? [],
      区域线条: (value.底图.区域线条 ?? []).map((item) => {
        const legacyTextNodeIds = (
          item as typeof item & { textNodeIds?: string[] }
        ).textNodeIds;
        return {
          ...item,
          textNodeIds: legacyTextNodeIds ?? [],
          lineNodeIds: item.lineNodeIds ?? [],
        };
      }),
      档位标注: (value.底图.档位标注 ?? []).map((item) => ({
        ...item,
        textNodeIds: item.textNodeIds ?? [],
        lineNodeIds: item.lineNodeIds ?? [],
      })),
      文本节点: value.底图.文本节点 ?? {},
    },
    自定义数据: {
      ...value.自定义数据,
      DML标注: (value.自定义数据.DML标注 ?? []).map((item) => ({
        ...item,
        textNodeId: item.textNodeId ?? "",
      })),
      单双标注: (value.自定义数据.单双标注 ?? []).map((item) => ({
        ...item,
        textNodeId: item.textNodeId ?? "",
      })),
    },
  };
}

function mergeTextIdList(
  prev: string[],
  addIds: string[],
  removeIds: string[],
): string[] {
  const removeSet = new Set(removeIds.map((id) => id.trim()).filter(Boolean));
  const next = prev.filter((id) => !removeSet.has(id));
  const seen = new Set(next);

  addIds
    .map((id) => id.trim())
    .filter(Boolean)
    .forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      next.push(id);
    });

  return next;
}

function getMarkerTextAnchorStyle(): Record<string, unknown> {
  return {
    textAnchor: "middle",
    dominantBaseline: "middle",
  };
}

function getMarkerTextFontStyle(kind: MarkerTextKind): Record<string, unknown> {
  if (kind === "region") {
    return {
      fill: "#0369a1",
      fontWeight: "700",
      fontSize: 10,
      ...getMarkerTextAnchorStyle(),
    };
  }
  if (kind === "level") {
    return {
      fill: "#92400e",
      fontWeight: "700",
      fontSize: 12,
      ...getMarkerTextAnchorStyle(),
    };
  }
  if (kind === "dml") {
    return {
      fill: "#111827",
      fontWeight: "700",
      fontSize: 10,
      ...getMarkerTextAnchorStyle(),
    };
  }
  return {
    fill: "#78350f",
    fontWeight: "700",
    fontSize: 10,
    ...getMarkerTextAnchorStyle(),
  };
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

function filterExistingTextNodeMap(
  sourceMap: ReadonlyMap<string, string>,
  existingSvgTextIdSet: ReadonlySet<string>,
): Map<string, string> {
  const next = new Map<string, string>();
  sourceMap.forEach((textNodeId, key) => {
    if (!existingSvgTextIdSet.has(textNodeId)) return;
    next.set(key, textNodeId);
  });
  return next;
}

function upsertMarkerTextNode(
  svg: string,
  options: {
    textNodeId: string;
    createNodeId: string;
    createWhenMissing: boolean;
    text: string;
    pos?: SvgPoint;
    fontStyle: Record<string, unknown>;
  },
): { svg: string; textNodeId: string; created: boolean } {
  const currentId = options.textNodeId.trim();

  const hasCurrentNode =
    currentId.length > 0 &&
    collectSvgTextNodes(svg).some((item) => item.id === currentId);

  if (hasCurrentNode) {
    let nextSvg = updateSvgTextNode(svg, currentId, options.text);
    nextSvg = setSvgTextNodeStyle(nextSvg, currentId, options.fontStyle);
    if (options.pos) {
      nextSvg = setSvgTextNodePosition(nextSvg, currentId, options.pos);
    }
    return { svg: nextSvg, textNodeId: currentId, created: false };
  }

  if (!options.createWhenMissing) {
    return { svg, textNodeId: "", created: false };
  }

  const createdId = options.createNodeId.trim();
  let nextSvg = appendSvgTextNode(svg, {
    nodeId: createdId,
    text: options.text,
    x: options.pos?.x,
    y: options.pos?.y,
    fontStyle: options.fontStyle,
  });
  nextSvg = updateSvgTextNode(nextSvg, createdId, options.text);
  return { svg: nextSvg, textNodeId: createdId, created: true };
}

export type LayerToggles = {
  region: boolean;
  level: boolean;
  dml: boolean;
  double: boolean;
  text: boolean;
  /** 展示无区域标记的原始线条（关闭则隐藏未分配区域的线条） */
  rawLines: boolean;
};

export type UseHighNeedleSvgAnnotatorParams = {
  initialSvg: string;
  initialValue?: 高针图;
  /** 传了 initialValue 时，默认会进入“完成”；如需从第一步开始可设为 begin */
  startAt?: "begin" | "done";
  presets?: 高针图系统预置区域[];
  lineSelector?: string;
  slotTextNodeId?: string;
  enableDml?: boolean;
  enableDouble?: boolean;
  onChange?: (v: 高针图) => void;
};

export default function useHighNeedleSvgAnnotator({
  initialSvg,
  initialValue,
  startAt = "done",
  presets = 高针图系统预置区域列表,
  lineSelector = DEFAULT_LINE_SELECTOR,
  slotTextNodeId,
  enableDml,
  enableDouble,
  onChange,
}: UseHighNeedleSvgAnnotatorParams) {
  const startFromDone = Boolean(initialValue) && startAt === "done";

  const [step, setStep] = useState<标注步骤>(startFromDone ? "完成" : "区域");
  const [progress, setProgress] = useState<number>(startFromDone ? 5 : 0);
  const [value, setValue] = useState<高针图>(() =>
    initialValue
      ? normalize高针图值(initialValue)
      : createEmpty高针图(initialSvg),
  );
  const [allLineIds, setAllLineIds] = useState<string[]>([]);
  const [allTextIds, setAllTextIds] = useState<string[]>([]);

  const [layerToggles, setLayerToggles] = useState<LayerToggles>({
    region: true,
    level: true,
    dml: true,
    double: true,
    text: true,
    rawLines: true,
  });

  const allLineIdSet = useMemo(() => new Set(allLineIds), [allLineIds]);

  const firstPreset = presets[0];

  const [regionIndex, setRegionIndex] = useState(0);
  const [regionPresetValue, setRegionPresetValue] = useState<string>(
    firstPreset?.name ?? CUSTOM_REGION_PRESET_VALUE,
  );
  const [regionDraft, setRegionDraft] = useState<RegionDraft>(() => ({
    name: firstPreset?.name ?? "",
    lineLength: firstPreset?.lineLength ?? 0,
  }));

  const [levelNo, setLevelNo] = useState(1);
  const [draftSelected, setDraftSelected] = useState<string[]>([]);

  const [dmlAutoConfigs, setDmlAutoConfigs] = useState<DmlAutoConfig[]>([]);
  const [dmlPattern, setDmlPattern] = useState("DML");
  const [dmlSelectionVersion, setDmlSelectionVersion] = useState(0);
  const manualDmlOverridesRef = useRef<Record<string, DmlValue>>({});
  const autoDmlAssignmentsRef = useRef<Map<string, DmlValue>>(new Map());
  const autoDmlManagedIdsRef = useRef<Set<string>>(new Set());
  const autoDmlSlotByLineIdRef = useRef<
    Map<string, { configId: string; slotIndex: number }>
  >(new Map());
  const draftMarkerPosByLineIdRef = useRef<Map<string, SvgPoint>>(new Map());
  const [draftLevelTextNodeIdByLineId, setDraftLevelTextNodeIdByLineId] =
    useState<Map<string, string>>(() => new Map());
  const pendingDmlMarkerPosByLineIdRef = useRef<Map<string, SvgPoint>>(
    new Map(),
  );
  const dmlMarkerPosByLineIdRef = useRef<Map<string, SvgPoint>>(new Map());

  const [activeTextKey, setActiveTextKey] = useState<string>("");
  const [newTextDraft, setNewTextDraft] = useState<{
    text: string;
    fill: string;
    fontWeight: string;
    fontSize: number;
  }>({
    text: "文本",
    fill: "#111827",
    fontWeight: "700",
    fontSize: 14,
  });

  const autoTextPreparedRef = useRef(false);
  const [textStageHiddenTextIds, setTextStageHiddenTextIds] = useState<
    string[]
  >([]);

  // 保存初始化后的干净 SVG 及线条/文本 id，用于「清空区域阶段」真正回滚到初始状态。
  const cleanSvgRef = useRef<string>("");
  const initialLineIdsRef = useRef<string[]>([]);
  const initialTextIdsRef = useRef<string[]>([]);

  const [dirty, setDirty] = useState(false);
  const [canvasEpoch, setCanvasEpoch] = useState(0);

  // 初始化：保证线条 / 文本节点 id 可用（仅补齐 id，不写入交互样式）。
  useEffect(() => {
    const ensuredLine = ensureLineIds(initialSvg, lineSelector);
    const ensuredText = ensureTextIds(ensuredLine.svg);

    cleanSvgRef.current = ensuredText.svg;
    initialLineIdsRef.current = ensuredLine.lineIds;
    initialTextIdsRef.current = ensuredText.textIds;

    setAllLineIds(ensuredLine.lineIds);
    setAllTextIds(ensuredText.textIds);
    setValue((v) => ({ ...v, 底图: { ...v.底图, svg: ensuredText.svg } }));

    if (!initialValue) {
      autoTextPreparedRef.current = false;
      setTextStageHiddenTextIds([]);
      manualDmlOverridesRef.current = {};
      autoDmlAssignmentsRef.current = new Map();
      autoDmlManagedIdsRef.current = new Set();
      autoDmlSlotByLineIdRef.current = new Map();
      dmlMarkerPosByLineIdRef.current = new Map();
      setDmlPattern("DML");
      setDmlSelectionVersion(0);
      setDraftLevelTextNodeIdByLineId(new Map());
      setDmlAutoConfigs([]);

      setStep("区域");
      setProgress(0);
    }
  }, [initialSvg, initialValue, lineSelector]);

  // 从 JSON 恢复/预览
  useEffect(() => {
    if (!initialValue) return;

    const normalizedInitialValue = normalize高针图值(initialValue);

    const ensuredLine = ensureLineIds(
      normalizedInitialValue.底图.svg,
      lineSelector,
    );
    const ensuredText = ensureTextIds(ensuredLine.svg);

    setStep(startFromDone ? "完成" : "区域");
    setDirty(false);
    setDraftSelected([]);
    setDraftLevelTextNodeIdByLineId(new Map());
    setActiveTextKey("");
    setRegionIndex(0);
    setRegionPresetValue(presets[0]?.name ?? CUSTOM_REGION_PRESET_VALUE);
    setRegionDraft({
      name: presets[0]?.name ?? "",
      lineLength: presets[0]?.lineLength ?? 0,
    });
    setLevelNo(1);

    setDmlAutoConfigs([]);
    setTextStageHiddenTextIds([]);
    manualDmlOverridesRef.current = {};
    (initialValue.自定义数据?.DML标注 ?? []).forEach((d) => {
      const id = String(d?.lineNodeId ?? "").trim();
      const v = String(d?.标注DML ?? "")
        .trim()
        .toUpperCase();
      if (!id) return;
      if (v === "D" || v === "M" || v === "L") {
        manualDmlOverridesRef.current[id] = v as DmlValue;
      }
    });
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
    dmlMarkerPosByLineIdRef.current = new Map();
    setDmlPattern("DML");
    setDmlSelectionVersion(0);

    setAllLineIds(ensuredLine.lineIds);
    setAllTextIds(ensuredText.textIds);
    setProgress(startFromDone ? 5 : 0);

    setValue({
      ...normalizedInitialValue,
      底图: {
        ...normalizedInitialValue.底图,
        svg: ensuredText.svg,
        文本节点: normalizedInitialValue.底图.文本节点 ?? {},
      },
    });
  }, [initialValue, lineSelector, presets, startFromDone]);

  useEffect(() => {
    onChange?.(value);
  }, [onChange, value]);

  useEffect(() => {
    if (!dirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (step !== "自定义文本") return;
    if (autoTextPreparedRef.current) return;

    autoTextPreparedRef.current = true;
    prepareCustomTextStage();
  }, [step]);

  useEffect(() => {
    if (step === "区域" || step === "档位") return;
    draftMarkerPosByLineIdRef.current = new Map();
  }, [step]);

  useEffect(() => {
    if (step === "自定义文本") return;
    autoTextPreparedRef.current = false;
    setTextStageHiddenTextIds((prev) => (prev.length === 0 ? prev : []));
  }, [step]);

  const usedRegionLines = useMemo(
    () => new Set(value.底图.区域线条.flatMap((d) => d.lineNodeIds)),
    [value.底图.区域线条],
  );

  const usedLevelLines = useMemo(
    () => new Set(value.底图.档位标注.flatMap((d) => d.lineNodeIds)),
    [value.底图.档位标注],
  );
  const regionLineIdsInOrder = useMemo(
    () =>
      uniquePreserveOrder(value.底图.区域线条.flatMap((d) => d.lineNodeIds)),
    [value.底图.区域线条],
  );
  const levelLineIdsInOrder = useMemo(
    () =>
      uniquePreserveOrder(value.底图.档位标注.flatMap((d) => d.lineNodeIds)),
    [value.底图.档位标注],
  );
  const missingLevelLineIds = useMemo(
    () => regionLineIdsInOrder.filter((lineId) => !usedLevelLines.has(lineId)),
    [regionLineIdsInOrder, usedLevelLines],
  );
  const hasLevelData = levelLineIdsInOrder.length > 0;
  const hasMarkData =
    value.自定义数据.DML标注.length > 0 || value.自定义数据.单双标注.length > 0;
  const canEditRegion = !hasLevelData && !hasMarkData;
  const canEditDml = missingLevelLineIds.length === 0 && hasLevelData;
  const canEditDouble = missingLevelLineIds.length === 0 && hasLevelData;
  const canEnterDone = missingLevelLineIds.length === 0 && hasLevelData;

  const dmlById = useMemo(
    () => makeDmlMap(value.自定义数据.DML标注),
    [value.自定义数据.DML标注],
  );
  const doubleById = useMemo(
    () => makeDoubleSet(value.自定义数据.单双标注),
    [value.自定义数据.单双标注],
  );

  const existingSvgTextIdSet = useMemo(
    () =>
      new Set(
        collectSvgTextNodes(value.底图.svg)
          .map((item) => String(item.id ?? "").trim())
          .filter(Boolean),
      ),
    [value.底图.svg],
  );

  const regionTextNodeIdByLineId = useMemo(() => {
    const map = new Map<string, string>();
    value.底图.区域线条.forEach((item) => {
      const textNodeIds = (item as typeof item & { textNodeIds?: string[] })
        .textNodeIds;
      item.lineNodeIds.forEach((lineId, index) => {
        const textNodeId = String(textNodeIds?.[index] ?? "").trim();
        if (!textNodeId) return;
        map.set(lineId, textNodeId);
      });
    });
    return map;
  }, [value.底图.区域线条]);

  const actualRegionTextNodeIdByLineId = useMemo(
    () =>
      filterExistingTextNodeMap(regionTextNodeIdByLineId, existingSvgTextIdSet),
    [existingSvgTextIdSet, regionTextNodeIdByLineId],
  );

  const levelLocationByLineId = useMemo(() => {
    const map = new Map<string, { itemIndex: number; lineIndex: number }>();
    value.底图.档位标注.forEach((item, itemIndex) => {
      item.lineNodeIds.forEach((rawLineId, lineIndex) => {
        const lineId = String(rawLineId ?? "").trim();
        if (!lineId) return;
        map.set(lineId, { itemIndex, lineIndex });
      });
    });
    return map;
  }, [value.底图.档位标注]);

  const levelTextNodeIdByLineId = useMemo(() => {
    const map = new Map<string, string>();
    value.底图.档位标注.forEach((item) => {
      item.lineNodeIds.forEach((lineId, index) => {
        const textNodeId = String(item.textNodeIds[index] ?? "").trim();
        if (!textNodeId) return;
        map.set(lineId, textNodeId);
      });
    });
    return map;
  }, [value.底图.档位标注]);

  const actualPersistedLevelTextNodeIdByLineId = useMemo(
    () =>
      filterExistingTextNodeMap(levelTextNodeIdByLineId, existingSvgTextIdSet),
    [existingSvgTextIdSet, levelTextNodeIdByLineId],
  );

  const actualDraftLevelTextNodeIdByLineId = useMemo(
    () =>
      filterExistingTextNodeMap(
        draftLevelTextNodeIdByLineId,
        existingSvgTextIdSet,
      ),
    [draftLevelTextNodeIdByLineId, existingSvgTextIdSet],
  );

  const effectiveLevelTextNodeIdByLineId = useMemo(() => {
    const map = new Map(actualPersistedLevelTextNodeIdByLineId);
    actualDraftLevelTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      if (!textNodeId) return;
      map.set(lineId, textNodeId);
    });
    return map;
  }, [
    actualDraftLevelTextNodeIdByLineId,
    actualPersistedLevelTextNodeIdByLineId,
  ]);

  const dmlTextNodeIdByLineId = useMemo(() => {
    const map = new Map<string, string>();
    value.自定义数据.DML标注.forEach((item) => {
      const textNodeId = String(item.textNodeId ?? "").trim();
      if (!textNodeId) return;
      map.set(item.lineNodeId, textNodeId);
    });
    return map;
  }, [value.自定义数据.DML标注]);

  const actualDmlTextNodeIdByLineId = useMemo(
    () =>
      filterExistingTextNodeMap(dmlTextNodeIdByLineId, existingSvgTextIdSet),
    [dmlTextNodeIdByLineId, existingSvgTextIdSet],
  );

  const preferredDmlPosByLineId = useMemo(() => {
    const map = new Map<string, SvgPoint>();
    actualDmlTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      const pos = getSvgTextNodePosition(value.底图.svg, textNodeId);
      if (!pos) return;
      map.set(lineId, pos);
    });
    return map;
  }, [actualDmlTextNodeIdByLineId, value.底图.svg]);

  const doubleTextNodeIdByLineId = useMemo(() => {
    const map = new Map<string, string>();
    value.自定义数据.单双标注.forEach((item) => {
      const textNodeId = String(item.textNodeId ?? "").trim();
      if (!textNodeId) return;
      map.set(item.lineNodeId, textNodeId);
    });
    return map;
  }, [value.自定义数据.单双标注]);

  const actualDoubleTextNodeIdByLineId = useMemo(
    () =>
      filterExistingTextNodeMap(doubleTextNodeIdByLineId, existingSvgTextIdSet),
    [doubleTextNodeIdByLineId, existingSvgTextIdSet],
  );

  const preferredMarkerPosByLineId = useMemo(() => {
    const map = new Map<string, SvgPoint>();

    const appendTextPos = (lineId: string, textNodeId?: string) => {
      if (map.has(lineId)) return;
      const nextTextNodeId = String(textNodeId ?? "").trim();
      if (!nextTextNodeId) return;
      const pos = getSvgTextNodePosition(value.底图.svg, nextTextNodeId);
      if (!pos) return;
      map.set(lineId, pos);
    };

    actualRegionTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      appendTextPos(lineId, textNodeId);
    });
    actualDmlTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      appendTextPos(lineId, textNodeId);
    });
    actualDoubleTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      appendTextPos(lineId, textNodeId);
    });
    effectiveLevelTextNodeIdByLineId.forEach((textNodeId, lineId) => {
      appendTextPos(lineId, textNodeId);
    });

    return map;
  }, [
    actualDmlTextNodeIdByLineId,
    actualDoubleTextNodeIdByLineId,
    actualRegionTextNodeIdByLineId,
    effectiveLevelTextNodeIdByLineId,
    value.底图.svg,
  ]);

  const markerTextIdSet = useMemo(() => {
    const ids = new Set<string>();
    actualRegionTextNodeIdByLineId.forEach((id) => ids.add(id));
    effectiveLevelTextNodeIdByLineId.forEach((id) => ids.add(id));
    actualDmlTextNodeIdByLineId.forEach((id) => ids.add(id));
    actualDoubleTextNodeIdByLineId.forEach((id) => ids.add(id));
    return ids;
  }, [
    actualDmlTextNodeIdByLineId,
    actualDoubleTextNodeIdByLineId,
    actualRegionTextNodeIdByLineId,
    effectiveLevelTextNodeIdByLineId,
  ]);

  const draggableMarkerTextIdSet = useMemo(() => {
    const ids = new Set<string>();
    effectiveLevelTextNodeIdByLineId.forEach((id) => ids.add(id));
    actualDmlTextNodeIdByLineId.forEach((id) => ids.add(id));
    actualDoubleTextNodeIdByLineId.forEach((id) => ids.add(id));
    return ids;
  }, [
    actualDmlTextNodeIdByLineId,
    actualDoubleTextNodeIdByLineId,
    effectiveLevelTextNodeIdByLineId,
  ]);

  useEffect(() => {
    if (draftLevelTextNodeIdByLineId.size === 0) return;

    const keepLineIdSet =
      step === "档位" ? new Set(draftSelected) : new Set<string>();
    const staleEntries = Array.from(
      draftLevelTextNodeIdByLineId.entries(),
    ).filter(([lineId]) => !keepLineIdSet.has(lineId));
    if (staleEntries.length === 0) return;

    const removedTextIds = uniquePreserveOrder(
      staleEntries
        .map(([, textNodeId]) => String(textNodeId ?? "").trim())
        .filter(Boolean),
    );

    setDraftLevelTextNodeIdByLineId((prev) => {
      const next = new Map(prev);
      staleEntries.forEach(([lineId]) => next.delete(lineId));
      return next;
    });

    if (removedTextIds.length === 0) return;

    setValue((cur) => ({
      ...cur,
      底图: {
        ...cur.底图,
        svg: removeSvgTextNodes(cur.底图.svg, removedTextIds),
      },
    }));
    setAllTextIds((prev) => mergeTextIdList(prev, [], removedTextIds));
  }, [draftLevelTextNodeIdByLineId, draftSelected, step]);

  const persistedMarkerTextIds = useMemo(
    () =>
      uniquePreserveOrder([
        ...Array.from(actualRegionTextNodeIdByLineId.values()),
        ...Array.from(actualPersistedLevelTextNodeIdByLineId.values()),
        ...Array.from(actualDmlTextNodeIdByLineId.values()),
        ...Array.from(actualDoubleTextNodeIdByLineId.values()),
      ])
        .map((id) => String(id ?? "").trim())
        .filter(Boolean),
    [
      actualDmlTextNodeIdByLineId,
      actualDoubleTextNodeIdByLineId,
      actualPersistedLevelTextNodeIdByLineId,
      actualRegionTextNodeIdByLineId,
    ],
  );

  useEffect(() => {
    if (persistedMarkerTextIds.length === 0) return;

    const anchorStyle = getMarkerTextAnchorStyle();
    let nextSvg = value.底图.svg;
    let changed = false;

    persistedMarkerTextIds.forEach((textNodeId) => {
      const currentStyle = getSvgTextNodeFontStyle(nextSvg, textNodeId);
      if (
        currentStyle.textAnchor === anchorStyle.textAnchor &&
        currentStyle.dominantBaseline === anchorStyle.dominantBaseline
      ) {
        return;
      }

      nextSvg = setSvgTextNodeStyle(nextSvg, textNodeId, {
        ...currentStyle,
        ...anchorStyle,
      });
      changed = true;
    });

    if (!changed || nextSvg === value.底图.svg) return;

    setValue((cur) => {
      if (cur.底图.svg !== value.底图.svg) return cur;
      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: nextSvg,
        },
      };
    });
  }, [persistedMarkerTextIds, value.底图.svg]);

  useEffect(() => {
    const orphanManagedTextIds = uniquePreserveOrder(
      collectSvgTextNodes(value.底图.svg)
        .map((item) => String(item.id ?? "").trim())
        .filter(
          (textNodeId) =>
            isManagedMarkerTextId(textNodeId) &&
            !markerTextIdSet.has(textNodeId),
        ),
    );
    if (orphanManagedTextIds.length === 0) return;

    setValue((cur) => {
      if (cur.底图.svg !== value.底图.svg) return cur;
      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: removeSvgTextNodes(cur.底图.svg, orphanManagedTextIds),
        },
      };
    });
    setAllTextIds((prev) => mergeTextIdList(prev, [], orphanManagedTextIds));
  }, [markerTextIdSet, value.底图.svg]);

  const regionLineItems = useMemo<RegionLineItem[]>(() => {
    const out: RegionLineItem[] = [];
    value.底图.区域线条.forEach((d) => {
      const name = String(d.区域名 ?? "").trim();
      const ratio =
        typeof d.区域内位置占比 === "number" ? d.区域内位置占比 : 0.5;
      (d.lineNodeIds ?? []).forEach((id) => {
        const lineId = String(id ?? "").trim();
        if (!lineId) return;
        out.push({ lineId, regionName: name, posRatio: ratio });
      });
    });
    return out;
  }, [value.底图.区域线条]);

  const regionColorByName = useMemo(() => {
    const fromRegionNameList = value.底图.区域名
      .map((n) => String(n ?? "").trim())
      .filter(Boolean);

    const fromLines = value.底图.区域线条
      .map((d) => String(d.区域名 ?? "").trim())
      .filter(Boolean);

    const orderedNames = uniquePreserveOrder(
      fromRegionNameList.length > 0 ? fromRegionNameList : fromLines,
    );

    const map = new Map<string, string>();
    orderedNames.forEach((name, idx) => {
      map.set(name, REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]);
    });
    return map;
  }, [value.底图.区域名, value.底图.区域线条]);

  const regionStrokeById = useMemo(() => {
    const map = new Map<string, string>();

    value.底图.区域线条.forEach((d) => {
      const regionName = String(d.区域名 ?? "").trim();
      const color = regionColorByName.get(regionName);
      if (!color) return;

      d.lineNodeIds.forEach((id) => {
        const lineId = String(id ?? "").trim();
        if (!lineId) return;
        map.set(lineId, color);
      });
    });

    return map;
  }, [regionColorByName, value.底图.区域线条]);

  const currentRegionDraftColor = useMemo(() => {
    const draftName = String(regionDraft.name ?? "").trim();
    if (draftName) {
      const existed = regionColorByName.get(draftName);
      if (existed) return existed;
    }
    const nextIndex = value.底图.区域线条.length % REGION_COLOR_PALETTE.length;
    return REGION_COLOR_PALETTE[nextIndex];
  }, [regionColorByName, regionDraft.name, value.底图.区域线条.length]);

  const regionLabelItems = useMemo(() => {
    const byName = new Map<string, string[]>();
    value.底图.区域线条.forEach((d) => {
      const name = String(d.区域名 ?? "").trim();
      if (!name) return;
      const list = byName.get(name) ?? [];
      d.lineNodeIds.forEach((id) => {
        const lineId = String(id ?? "").trim();
        if (!lineId) return;
        list.push(lineId);
      });
      byName.set(name, list);
    });

    return Array.from(byName.entries()).map(([name, lineIds]) => ({
      name,
      color: regionColorByName.get(name) ?? "#ef4444",
      lineIds: uniquePreserveOrder(lineIds),
    }));
  }, [regionColorByName, value.底图.区域线条]);

  const regionNoById = useMemo(() => {
    const map = new Map<string, number>();

    value.底图.区域线条.forEach((d, idx) => {
      d.lineNodeIds.forEach((id) => map.set(id, idx + 1));
    });

    if (step === "区域") {
      const start = value.底图.区域线条.length;
      uniquePreserveOrder(draftSelected).forEach((id, i) => {
        if (!map.has(id)) map.set(id, start + i + 1);
      });
    }

    return map;
  }, [draftSelected, step, value.底图.区域线条]);

  const levelNoById = useMemo(() => {
    const map = new Map<string, number>();

    value.底图.档位标注.forEach((d, idx) => {
      const markerLevelNo = parseLevelNo(String(d.区域名 ?? ""), idx + 1);
      d.lineNodeIds.forEach((id) => map.set(id, markerLevelNo));
    });

    if (step === "档位") {
      uniquePreserveOrder(draftSelected).forEach((id) => map.set(id, levelNo));
    }

    return map;
  }, [draftSelected, levelNo, step, value.底图.档位标注]);

  const levelTextById = useMemo(() => {
    const map = new Map<string, string>();
    levelNoById.forEach((no, id) => {
      map.set(id, getLevelMarkerText(no));
    });
    return map;
  }, [levelNoById]);

  const persistedLevelTextTargets = useMemo(
    () =>
      value.底图.档位标注.flatMap((item, itemIndex) => {
        const levelText = getLevelMarkerText(
          parseLevelNo(String(item.区域名 ?? ""), itemIndex + 1),
        );

        return item.textNodeIds
          .map((rawTextNodeId) => String(rawTextNodeId ?? "").trim())
          .filter(Boolean)
          .map((textNodeId) => ({ textNodeId, text: levelText }));
      }),
    [value.底图.档位标注],
  );

  useEffect(() => {
    if (persistedLevelTextTargets.length === 0) return;

    let nextSvg = value.底图.svg;
    let changed = false;

    persistedLevelTextTargets.forEach(({ textNodeId, text }) => {
      if (getSvgTextNodeText(nextSvg, textNodeId) === text) return;

      nextSvg = updateSvgTextNode(nextSvg, textNodeId, text);
      changed = true;
    });

    if (!changed || nextSvg === value.底图.svg) return;

    setValue((cur) => {
      if (cur.底图.svg !== value.底图.svg) return cur;
      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: nextSvg,
        },
      };
    });
  }, [persistedLevelTextTargets, value.底图.svg]);

  const visibleMarkerById = useMemo(() => {
    const map = new Map<
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

    regionNoById.forEach((no, id) => {
      map.set(id, {
        ...map.get(id),
        regionNo: no,
        regionTextNodeId: actualRegionTextNodeIdByLineId.get(id),
        regionColor:
          regionStrokeById.get(id) ??
          (step === "区域" && draftSelected.includes(id)
            ? currentRegionDraftColor
            : undefined),
      });
    });

    levelNoById.forEach((no, id) => {
      map.set(id, {
        ...map.get(id),
        levelNo: no,
        levelTextNodeId: effectiveLevelTextNodeIdByLineId.get(id),
      });
    });

    dmlById.forEach((v, id) => {
      if (!v) return;
      map.set(id, {
        ...map.get(id),
        dml: v,
        dmlTextNodeId: actualDmlTextNodeIdByLineId.get(id),
      });
    });

    doubleById.forEach((id) => {
      map.set(id, {
        ...map.get(id),
        isDouble: true,
        doubleTextNodeId: actualDoubleTextNodeIdByLineId.get(id),
      });
    });

    return map;
  }, [
    dmlById,
    actualDmlTextNodeIdByLineId,
    doubleById,
    actualDoubleTextNodeIdByLineId,
    levelNoById,
    effectiveLevelTextNodeIdByLineId,
    regionNoById,
    actualRegionTextNodeIdByLineId,
    currentRegionDraftColor,
    draftSelected,
    regionStrokeById,
    step,
  ]);

  const availableForStep = useMemo(() => {
    if (step === "完成" || step === "自定义文本") return new Set<string>();

    if (step === "区域") {
      if (!canEditRegion) return new Set<string>();
      const base = new Set(allLineIds);
      usedRegionLines.forEach((id) => base.delete(id));
      return base;
    }

    if (step === "档位") {
      const archived = new Set(
        value.底图.区域线条.flatMap((d) => d.lineNodeIds),
      );
      usedLevelLines.forEach((id) => archived.delete(id));
      return archived;
    }

    if (step === "DML" || step === "单双") {
      if (missingLevelLineIds.length > 0) return new Set<string>();
      return new Set(levelLineIdsInOrder);
    }

    return new Set<string>();
  }, [
    allLineIds,
    canEditRegion,
    step,
    levelLineIdsInOrder,
    missingLevelLineIds.length,
    usedLevelLines,
    usedRegionLines,
    value.底图.区域线条,
    value.底图.档位标注,
  ]);

  const disabledForStep = useMemo(() => {
    if (step === "完成" || step === "自定义文本") return new Set<string>();

    const disabled = new Set<string>();
    for (const id of allLineIds) {
      if (!availableForStep.has(id) && !draftSelected.includes(id)) {
        disabled.add(id);
      }
    }
    return disabled;
  }, [allLineIds, availableForStep, draftSelected, step]);

  const renderSvg = useMemo(() => {
    const startedAt = performance.now();
    const selectedStroke =
      step === "档位"
        ? "#f59e0b"
        : step === "区域"
          ? currentRegionDraftColor
          : "#ef4444";

    const visibleTextIdSet = new Set<string>();
    if (layerToggles.text) {
      allTextIds.forEach((id) => {
        if (step === "自定义文本" && textStageHiddenTextIds.includes(id))
          return;
        if (!markerTextIdSet.has(id) && !isManagedMarkerTextId(id)) {
          visibleTextIdSet.add(id);
        }
      });
    }
    if (layerToggles.region && step === "区域") {
      actualRegionTextNodeIdByLineId.forEach((id) => visibleTextIdSet.add(id));
    }
    if (layerToggles.level) {
      effectiveLevelTextNodeIdByLineId.forEach((id) =>
        visibleTextIdSet.add(id),
      );
    }
    if (layerToggles.dml) {
      actualDmlTextNodeIdByLineId.forEach((id) => visibleTextIdSet.add(id));
    }
    if (layerToggles.double) {
      actualDoubleTextNodeIdByLineId.forEach((id) => visibleTextIdSet.add(id));
    }

    const baseSvg = pruneSvgTextNodes(
      value.底图.svg,
      Array.from(visibleTextIdSet),
    );

    // 「原线条」关闭时：隐藏没有区域归属的线条
    const assignedLineIds = new Set(
      value.底图.区域线条.flatMap((d) => d.lineNodeIds),
    );
    const hiddenLineIds = !layerToggles.rawLines
      ? new Set(allLineIds.filter((id) => !assignedLineIds.has(id)))
      : undefined;

    const nextSvg = decorateLines(baseSvg, {
      touchIds: allLineIds,
      selected: new Set(draftSelected),
      disabled: new Set<string>(),
      hiddenIds: hiddenLineIds,
      regionNoById,
      regionStrokeById: layerToggles.region ? regionStrokeById : undefined,
      levelNoById: layerToggles.level ? levelNoById : undefined,
      dmlById: layerToggles.dml ? dmlById : undefined,
      doubleById: layerToggles.double ? doubleById : undefined,
      selectedStroke,
    });

    // #region debug-point E:render-svg-recompute
    const durationMs = performance.now() - startedAt;
    if (durationMs >= 8 || draftSelected.length >= 10) {
      reportHighNeedleLagDebug(
        "E",
        "useHighNeedleSvgAnnotator:renderSvg",
        "renderSvg recompute sample",
        {
          step,
          durationMs,
          lineCount: allLineIds.length,
          textCount: allTextIds.length,
          draftSelectedCount: draftSelected.length,
          visibleMarkerTextCount: markerTextIdSet.size,
        },
      );
    }
    // #endregion

    return nextSvg;
  }, [
    allLineIds,
    allTextIds,
    disabledForStep,
    dmlById,
    actualDmlTextNodeIdByLineId,
    doubleById,
    actualDoubleTextNodeIdByLineId,
    draftSelected,
    effectiveLevelTextNodeIdByLineId,
    layerToggles,
    levelNoById,
    markerTextIdSet,
    step,
    textStageHiddenTextIds,
    regionNoById,
    actualRegionTextNodeIdByLineId,
    regionStrokeById,
    currentRegionDraftColor,
    step,
    value.底图.svg,
    value.底图.区域线条,
  ]);

  function commitMergedDml(
    autoAssignments: Map<string, DmlValue>,
    managedLineIds: Set<string>,
  ) {
    autoDmlAssignmentsRef.current = autoAssignments;
    autoDmlManagedIdsRef.current = managedLineIds;

    // 手动覆盖优先级高于自动规律，不删除任何手动覆盖
    const manual = manualDmlOverridesRef.current;

    const merged = new Map<string, DmlValue>();
    autoAssignments.forEach((v, id) => merged.set(id, v));
    Object.entries(manual).forEach(([id, v]) => {
      const vv = String(v).trim() as DmlValue;
      if (vv === "D" || vv === "M" || vv === "L") {
        merged.set(id, vv);
      } else {
        // 手动标记为空（""）时，明确清除该线条的自动规律赋值
        merged.delete(id);
      }
    });

    const addedTextIds: string[] = [];
    const removedTextIds: string[] = [];

    setValue((cur) => {
      const prevByLineId = new Map(
        cur.自定义数据.DML标注.map((item) => [item.lineNodeId, item]),
      );
      let nextSvg = cur.底图.svg;

      const nextDmlItems = Array.from(merged.entries()).map(
        ([lineNodeId, 标注DML]) => {
          const prev = prevByLineId.get(lineNodeId);
          const dmlPos =
            pendingDmlMarkerPosByLineIdRef.current.get(lineNodeId) ??
            dmlMarkerPosByLineIdRef.current.get(lineNodeId) ??
            preferredDmlPosByLineId.get(lineNodeId);
          const result = upsertMarkerTextNode(nextSvg, {
            textNodeId: String(prev?.textNodeId ?? ""),
            createNodeId: allocLocalId("dml_text"),
            createWhenMissing: Boolean(prev?.textNodeId || dmlPos),
            text: 标注DML,
            pos: dmlPos,
            fontStyle: getMarkerTextFontStyle("dml"),
          });
          nextSvg = result.svg;
          if (result.created && result.textNodeId) {
            addedTextIds.push(result.textNodeId);
          }

          return {
            lineNodeId,
            textNodeId: result.textNodeId,
            标注DML,
          };
        },
      );

      prevByLineId.forEach((prev, lineNodeId) => {
        if (merged.has(lineNodeId)) return;
        const textNodeId = String(prev.textNodeId ?? "").trim();
        if (!textNodeId) return;
        nextSvg = removeSvgTextNodes(nextSvg, [textNodeId]);
        removedTextIds.push(textNodeId);
        dmlMarkerPosByLineIdRef.current.delete(lineNodeId);
      });

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: nextSvg,
        },
        自定义数据: {
          ...cur.自定义数据,
          DML标注: nextDmlItems,
        },
      };
    });

    pendingDmlMarkerPosByLineIdRef.current = new Map();
    if (addedTextIds.length > 0 || removedTextIds.length > 0) {
      setAllTextIds((prev) =>
        mergeTextIdList(prev, addedTextIds, removedTextIds),
      );
    }
  }

  const dmlOrderRankByLineId = useMemo(() => {
    const regionOrderIndex = new Map<string, number>();
    value.底图.区域名.forEach((name, index) => {
      regionOrderIndex.set(String(name ?? "").trim(), index);
    });

    const map = new Map<string, number>();
    regionLineItems.forEach((item, index) => {
      const regionIndex =
        regionOrderIndex.get(String(item.regionName ?? "").trim()) ??
        Number.MAX_SAFE_INTEGER;
      const rank =
        regionIndex * 100000 + Math.round(item.posRatio * 10000) * 10 + index;
      map.set(item.lineId, rank);
    });
    return map;
  }, [regionLineItems, value.底图.区域名]);

  useEffect(() => {
    if (step !== "DML") return;
    if (dmlSelectionVersion === 0) return;

    const normalizedPattern = normalizePattern(dmlPattern);
    if (!normalizedPattern) return;

    const selected = uniquePreserveOrder(draftSelected).filter((lineId) =>
      availableForStep.has(lineId),
    );

    const orderedSelected = [...selected].sort((a, b) => {
      const rankA = dmlOrderRankByLineId.get(a) ?? Number.MAX_SAFE_INTEGER;
      const rankB = dmlOrderRankByLineId.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

    const assignments = new Map<string, DmlValue>();
    orderedSelected.forEach((lineId, index) => {
      assignments.set(
        lineId,
        normalizedPattern[index % normalizedPattern.length] as DmlValue,
      );
    });

    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map(assignments);
    autoDmlManagedIdsRef.current = new Set(orderedSelected);
    autoDmlSlotByLineIdRef.current = new Map();
    commitMergedDml(assignments, new Set(orderedSelected));
  }, [
    availableForStep,
    dmlOrderRankByLineId,
    dmlPattern,
    dmlSelectionVersion,
    draftSelected,
    step,
  ]);

  function toggleSelect(
    id: string,
    options?: { silent?: boolean; markerPos?: SvgPoint },
  ) {
    if (!id) return;
    const existed = draftSelected.includes(id);
    if (!availableForStep.has(id) && !draftSelected.includes(id)) {
      if (!options?.silent) {
        message.warning("该线条在当前步骤不可操作");
      }
      return;
    }

    setDraftSelected((prev) => {
      const existedInPrev = prev.includes(id);
      if (step === "区域" || step === "档位") {
        if (existedInPrev) {
          draftMarkerPosByLineIdRef.current.delete(id);
        } else if (options?.markerPos) {
          draftMarkerPosByLineIdRef.current.set(id, options.markerPos);
        }
      } else if (step === "DML") {
        if (existedInPrev) {
          pendingDmlMarkerPosByLineIdRef.current.delete(id);
          dmlMarkerPosByLineIdRef.current.delete(id);
        } else if (options?.markerPos) {
          pendingDmlMarkerPosByLineIdRef.current.set(id, options.markerPos);
          dmlMarkerPosByLineIdRef.current.set(id, options.markerPos);
        }
      }

      return existedInPrev ? prev.filter((x) => x !== id) : [...prev, id];
    });

    if (step === "档位" && !existed && options?.markerPos) {
      ensureLevelMarkerTextNode(id, options.markerPos);
    }
    if (step === "DML") {
      setDmlSelectionVersion((prev) => prev + 1);
    }
  }

  function handleLineAction(id: string, options?: { markerPos?: SvgPoint }) {
    if (!id) return;

    if (step === "DML") {
      if (!canEditDml) {
        message.warning(
          missingLevelLineIds.length > 0
            ? `还有 ${missingLevelLineIds.length} 条区域线未标注档位，暂不能编辑 DML`
            : "请先完成档位标注后再编辑 DML",
        );
        return;
      }
      if (!availableForStep.has(id)) return;
      setDirty(true);
      toggleSelect(id, { silent: true, markerPos: options?.markerPos });
      return;
    }

    if (step === "单双") {
      if (!canEditDouble) {
        message.warning(
          missingLevelLineIds.length > 0
            ? `还有 ${missingLevelLineIds.length} 条区域线未标注档位，暂不能编辑单双`
            : "请先完成档位标注后再编辑单双",
        );
        return;
      }
      if (!availableForStep.has(id)) return;

      setDirty(true);
      const addedTextIds: string[] = [];
      const removedTextIds: string[] = [];
      setValue((v) => {
        const prevByLineId = new Map(
          v.自定义数据.单双标注.map((item) => [item.lineNodeId, item]),
        );
        const existed = prevByLineId.get(id);
        let nextSvg = v.底图.svg;
        let nextItems = v.自定义数据.单双标注.filter(
          (item) => item.lineNodeId !== id,
        );
        // #region debug-point A:double-handle
        reportDoubleMarkDragDebug(
          "A",
          "useHighNeedleSvgAnnotator:handleLineAction",
          "toggle double line action",
          {
            step,
            lineId: id,
            existed: Boolean(existed),
            hasMarkerPos: Boolean(options?.markerPos),
            prevDoubleCount: v.自定义数据.单双标注.length,
          },
        );
        // #endregion

        if (!existed) {
          const result = upsertMarkerTextNode(nextSvg, {
            textNodeId: "",
            createNodeId: allocLocalId("double_text"),
            createWhenMissing: Boolean(options?.markerPos),
            text: "双",
            pos: options?.markerPos,
            fontStyle: getMarkerTextFontStyle("double"),
          });
          nextSvg = result.svg;
          if (result.created && result.textNodeId) {
            addedTextIds.push(result.textNodeId);
          }
          // #region debug-point B:double-create
          reportDoubleMarkDragDebug(
            "B",
            "useHighNeedleSvgAnnotator:handleLineAction",
            "create double text result",
            {
              lineId: id,
              created: result.created,
              textNodeId: result.textNodeId,
              hasMarkerPos: Boolean(options?.markerPos),
            },
          );
          // #endregion
          nextItems = [
            ...nextItems,
            { lineNodeId: id, textNodeId: result.textNodeId, 双数: true },
          ];
        } else {
          const textNodeId = String(existed.textNodeId ?? "").trim();
          if (textNodeId) {
            nextSvg = removeSvgTextNodes(nextSvg, [textNodeId]);
            removedTextIds.push(textNodeId);
          }
          // #region debug-point A:double-remove
          reportDoubleMarkDragDebug(
            "A",
            "useHighNeedleSvgAnnotator:handleLineAction",
            "remove double text result",
            {
              lineId: id,
              textNodeId,
            },
          );
          // #endregion
        }

        return {
          ...v,
          底图: {
            ...v.底图,
            svg: nextSvg,
          },
          自定义数据: {
            ...v.自定义数据,
            单双标注: nextItems,
          },
        };
      });

      if (addedTextIds.length > 0 || removedTextIds.length > 0) {
        setAllTextIds((prev) =>
          mergeTextIdList(prev, addedTextIds, removedTextIds),
        );
      }

      return;
    }

    toggleSelect(id);
  }

  function ensureDmlMarkerTextNode(lineNodeId: string, pos: SvgPoint) {
    if (!lineNodeId) return;

    let addedTextId = "";

    setValue((cur) => {
      const index = cur.自定义数据.DML标注.findIndex(
        (item) => item.lineNodeId === lineNodeId,
      );
      if (index < 0) return cur;

      const prev = cur.自定义数据.DML标注[index];
      if (String(prev.textNodeId ?? "").trim()) return cur;

      const text = String(prev.标注DML ?? "").trim() as DmlValue;
      if (text !== "D" && text !== "M" && text !== "L") return cur;

      const result = upsertMarkerTextNode(cur.底图.svg, {
        textNodeId: "",
        createNodeId: allocLocalId("dml_text"),
        createWhenMissing: true,
        text,
        pos,
        fontStyle: getMarkerTextFontStyle("dml"),
      });
      if (!result.textNodeId) return cur;

      addedTextId = result.textNodeId;
      const nextItems = [...cur.自定义数据.DML标注];
      nextItems[index] = {
        ...prev,
        textNodeId: result.textNodeId,
      };

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: result.svg,
        },
        自定义数据: {
          ...cur.自定义数据,
          DML标注: nextItems,
        },
      };
    });

    if (addedTextId) {
      setAllTextIds((prev) => mergeTextIdList(prev, [addedTextId], []));
    }
  }

  function ensureDoubleMarkerTextNode(lineNodeId: string, pos: SvgPoint) {
    if (!lineNodeId) return;

    let addedTextId = "";

    setValue((cur) => {
      const index = cur.自定义数据.单双标注.findIndex(
        (item) => item.lineNodeId === lineNodeId,
      );
      if (index < 0) return cur;

      const prev = cur.自定义数据.单双标注[index];
      if (!prev?.双数) return cur;
      if (String(prev.textNodeId ?? "").trim()) return cur;

      const result = upsertMarkerTextNode(cur.底图.svg, {
        textNodeId: "",
        createNodeId: allocLocalId("double_text"),
        createWhenMissing: true,
        text: "双",
        pos,
        fontStyle: getMarkerTextFontStyle("double"),
      });
      if (!result.textNodeId) return cur;

      addedTextId = result.textNodeId;
      const nextItems = [...cur.自定义数据.单双标注];
      nextItems[index] = {
        ...prev,
        textNodeId: result.textNodeId,
      };

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: result.svg,
        },
        自定义数据: {
          ...cur.自定义数据,
          单双标注: nextItems,
        },
      };
    });

    if (addedTextId) {
      setAllTextIds((prev) => mergeTextIdList(prev, [addedTextId], []));
    }
  }

  function ensureRegionMarkerTextNode(lineNodeId: string, pos: SvgPoint) {
    if (!lineNodeId) return;

    let addedTextId = "";

    setValue((cur) => {
      const itemIndex = cur.底图.区域线条.findIndex((item) =>
        item.lineNodeIds.includes(lineNodeId),
      );
      if (itemIndex < 0) return cur;

      const lineIndex =
        cur.底图.区域线条[itemIndex].lineNodeIds.indexOf(lineNodeId);
      if (lineIndex < 0) return cur;

      const prevItem = cur.底图.区域线条[
        itemIndex
      ] as (typeof cur.底图.区域线条)[number] & {
        textNodeIds?: string[];
      };
      const existingTextNodeId = String(
        (prevItem as typeof prevItem & { textNodeIds?: string[] })
          .textNodeIds?.[lineIndex] ?? "",
      ).trim();
      if (existingTextNodeId) return cur;

      const regionNo = String(itemIndex + 1);
      const result = upsertMarkerTextNode(cur.底图.svg, {
        textNodeId: "",
        createNodeId: allocLocalId("region_text"),
        createWhenMissing: true,
        text: regionNo,
        pos,
        fontStyle: getMarkerTextFontStyle("region"),
      });
      if (!result.textNodeId) return cur;

      addedTextId = result.textNodeId;
      const nextItems = [...cur.底图.区域线条];
      const nextTextNodeIds = [...(prevItem.textNodeIds ?? [])];
      nextTextNodeIds[lineIndex] = result.textNodeId;
      nextItems[itemIndex] = {
        ...prevItem,
        textNodeIds: nextTextNodeIds,
      } as (typeof nextItems)[number];

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: result.svg,
          区域线条: nextItems,
        },
      };
    });

    if (addedTextId) {
      setAllTextIds((prev) => mergeTextIdList(prev, [addedTextId], []));
    }
  }

  function ensureLevelMarkerTextNode(lineNodeId: string, pos: SvgPoint) {
    if (!lineNodeId) return;

    let addedTextId = "";
    let draftTextNodeId = "";

    setValue((cur) => {
      const savedLevelLocation = levelLocationByLineId.get(lineNodeId);
      const isDraftLevelLine = draftSelected.includes(lineNodeId);
      if (
        !savedLevelLocation &&
        !availableForStep.has(lineNodeId) &&
        !isDraftLevelLine
      ) {
        return cur;
      }

      const levelText = String(levelTextById.get(lineNodeId) ?? "").trim();
      if (!levelText) return cur;

      const existingTextNodeId = savedLevelLocation
        ? String(
            cur.底图.档位标注[savedLevelLocation.itemIndex]?.textNodeIds[
              savedLevelLocation.lineIndex
            ] ?? "",
          ).trim()
        : String(draftLevelTextNodeIdByLineId.get(lineNodeId) ?? "").trim();

      const result = upsertMarkerTextNode(cur.底图.svg, {
        textNodeId: existingTextNodeId,
        createNodeId: allocLocalId("level_text"),
        createWhenMissing: true,
        text: levelText,
        pos,
        fontStyle: getMarkerTextFontStyle("level"),
      });
      if (!result.textNodeId) return cur;

      if (result.created) {
        addedTextId = result.textNodeId;
      }

      if (savedLevelLocation) {
        const nextLevelItems = [...cur.底图.档位标注];
        const prevLevelItem = nextLevelItems[savedLevelLocation.itemIndex];
        if (!prevLevelItem) return cur;

        const nextTextNodeIds = [...prevLevelItem.textNodeIds];
        nextTextNodeIds[savedLevelLocation.lineIndex] = result.textNodeId;
        nextLevelItems[savedLevelLocation.itemIndex] = {
          ...prevLevelItem,
          textNodeIds: nextTextNodeIds,
        };

        return {
          ...cur,
          底图: {
            ...cur.底图,
            svg: result.svg,
            档位标注: nextLevelItems,
          },
        };
      }

      draftTextNodeId = result.textNodeId;
      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: result.svg,
        },
      };
    });

    if (draftTextNodeId) {
      setDraftLevelTextNodeIdByLineId((prev) => {
        const next = new Map(prev);
        next.set(lineNodeId, draftTextNodeId);
        return next;
      });
    }

    if (addedTextId) {
      setAllTextIds((prev) => mergeTextIdList(prev, [addedTextId], []));
    }
  }

  function confirmExit() {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("将清空所有标注并重新开始，确定吗？");
    if (!ok) return;

    autoTextPreparedRef.current = false;
    setTextStageHiddenTextIds([]);
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
    dmlMarkerPosByLineIdRef.current = new Map();
    setDmlSelectionVersion(0);
    draftMarkerPosByLineIdRef.current = new Map();
    setDraftLevelTextNodeIdByLineId(new Map());
    pendingDmlMarkerPosByLineIdRef.current = new Map();
    setDmlAutoConfigs([]);

    requestCanvasReset();

    const cleanSvg = cleanSvgRef.current || "";
    setAllLineIds(initialLineIdsRef.current);
    setAllTextIds(initialTextIdsRef.current);

    setStep("区域");
    setProgress(0);
    setRegionIndex(0);
    setRegionPresetValue(presets[0]?.name ?? CUSTOM_REGION_PRESET_VALUE);
    setRegionDraft({
      name: presets[0]?.name ?? "",
      lineLength: presets[0]?.lineLength ?? 0,
    });
    setLevelNo(1);
    setDraftSelected([]);
    setActiveTextKey("");
    setDirty(false);

    setValue(createEmpty高针图(cleanSvg));
    message.success("已重新开始");
  }

  function requestCanvasReset() {
    setCanvasEpoch((n) => n + 1);
  }

  function clearRegionStage() {
    if (
      value.底图.区域线条.length === 0 &&
      draftSelected.length === 0 &&
      progress === 0
    ) {
      message.info("当前没有区域数据可清空");
      return;
    }

    // eslint-disable-next-line no-alert
    const ok = window.confirm("将清空【区域】以及后续所有标注，确定吗？");
    if (!ok) return;

    autoTextPreparedRef.current = false;
    setTextStageHiddenTextIds([]);
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
    setDmlSelectionVersion(0);
    draftMarkerPosByLineIdRef.current = new Map();
    setDraftLevelTextNodeIdByLineId(new Map());
    pendingDmlMarkerPosByLineIdRef.current = new Map();
    setDmlAutoConfigs([]);

    requestCanvasReset();

    // 恢复为初始化时保存的干净 SVG 及 id 列表，确保自定义文本阶段注入的
    // <text> 节点和 allTextIds 也被完整清除。
    const cleanSvg = cleanSvgRef.current || "";
    setAllLineIds(initialLineIdsRef.current);
    setAllTextIds(initialTextIdsRef.current);

    setDirty(true);
    setStep("区域");
    setProgress(0);
    setRegionIndex(0);
    setRegionPresetValue(presets[0]?.name ?? CUSTOM_REGION_PRESET_VALUE);
    setRegionDraft({
      name: presets[0]?.name ?? "",
      lineLength: presets[0]?.lineLength ?? 0,
    });
    setLevelNo(1);
    setDraftSelected([]);
    setActiveTextKey("");

    setValue(createEmpty高针图(cleanSvg));
    message.success("已清空区域阶段");
  }

  function clearLevelStage() {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("将清空【档位】以及后续 DML/单双标注，确定吗？");
    if (!ok) return;

    requestCanvasReset();

    setDirty(true);
    setLevelNo(1);
    setDraftSelected([]);
    setDraftLevelTextNodeIdByLineId(new Map());
    draftMarkerPosByLineIdRef.current = new Map();
    pendingDmlMarkerPosByLineIdRef.current = new Map();

    const removedTextIds = uniquePreserveOrder([
      ...Array.from(draftLevelTextNodeIdByLineId.values()),
      ...value.底图.档位标注.flatMap((item) => item.textNodeIds ?? []),
      ...value.自定义数据.DML标注.map((item) => item.textNodeId),
      ...value.自定义数据.单双标注.map((item) => item.textNodeId),
    ]);

    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        svg: removeSvgTextNodes(v.底图.svg, removedTextIds),
        档位标注: [],
      },
      自定义数据: {
        ...v.自定义数据,
        DML标注: [],
        单双标注: [],
      },
    }));

    if (removedTextIds.length > 0) {
      setAllTextIds((prev) => mergeTextIdList(prev, [], removedTextIds));
    }

    message.success("已清空档位阶段");
  }

  function clearDmlStage() {
    requestCanvasReset();

    setDirty(true);
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
    dmlMarkerPosByLineIdRef.current = new Map();
    setDmlSelectionVersion(0);
    pendingDmlMarkerPosByLineIdRef.current = new Map();
    pendingDmlMarkerPosByLineIdRef.current = new Map();
    setDraftSelected([]);

    const removedTextIds = uniquePreserveOrder(
      value.自定义数据.DML标注.map((item) => item.textNodeId),
    );

    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        svg: removeSvgTextNodes(v.底图.svg, removedTextIds),
      },
      自定义数据: {
        ...v.自定义数据,
        DML标注: [],
      },
    }));
    if (removedTextIds.length > 0) {
      setAllTextIds((prev) => mergeTextIdList(prev, [], removedTextIds));
    }
    message.success("已清空 DML 标注（并关闭自动规律）");
  }

  function clearDoubleStage() {
    requestCanvasReset();

    setDirty(true);
    const removedTextIds = uniquePreserveOrder(
      value.自定义数据.单双标注.map((item) => item.textNodeId),
    );
    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        svg: removeSvgTextNodes(v.底图.svg, removedTextIds),
      },
      自定义数据: {
        ...v.自定义数据,
        单双标注: [],
      },
    }));
    if (removedTextIds.length > 0) {
      setAllTextIds((prev) => mergeTextIdList(prev, [], removedTextIds));
    }
    message.success("已清空 单双 标注");
  }

  function clampPercent(v: unknown): number {
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  function addDmlAutoConfig() {
    setDirty(true);
    const defaultRegion = value.底图.区域名[0] ?? "";
    setDmlAutoConfigs((prev) => [
      ...prev,
      {
        id: allocLocalId("dml_cfg"),
        regionName: defaultRegion,
        pattern: "",
        rangeStart: 0,
        rangeEnd: 100,
      },
    ]);
  }

  function updateDmlAutoConfig(
    configId: string,
    patch: Partial<
      Pick<DmlAutoConfig, "regionName" | "pattern" | "rangeStart" | "rangeEnd">
    >,
  ) {
    setDirty(true);
    setDmlAutoConfigs((prev) =>
      prev.map((c) => {
        if (c.id !== configId) return c;

        return {
          ...c,
          ...(patch.regionName !== undefined
            ? { regionName: patch.regionName }
            : {}),
          ...(patch.pattern !== undefined
            ? { pattern: normalizePattern(patch.pattern) }
            : {}),
          ...(patch.rangeStart !== undefined
            ? { rangeStart: clampPercent(patch.rangeStart) }
            : {}),
          ...(patch.rangeEnd !== undefined
            ? { rangeEnd: clampPercent(patch.rangeEnd) }
            : {}),
        };
      }),
    );
  }

  function removeDmlAutoConfig(configId: string) {
    setDirty(true);
    setDmlAutoConfigs((prev) => prev.filter((c) => c.id !== configId));
  }

  function resetDmlAutoConfigs() {
    setDirty(true);
    setDmlAutoConfigs(
      value.底图.区域名.map((name) => ({
        id: allocLocalId("dml_cfg"),
        regionName: name,
        pattern: "",
        rangeStart: 0,
        rangeEnd: 100,
      })),
    );
  }

  function finishRegion(options?: { gotoNextStage?: boolean }) {
    const draft = normalizeRegionDraft(regionDraft, presets);
    const selected = uniquePreserveOrder(draftSelected);

    if (!draft.name) {
      message.error("请先选择/输入区域名");
      return;
    }
    if (selected.length < 1) {
      message.error("请先在 SVG 中勾选该区域的线条");
      return;
    }

    if (!canEditRegion) {
      message.error("当前已存在档位或 DML/单双数据，请先清空区域阶段后再重做");
      return;
    }

    const gotoNextStage = options?.gotoNextStage ?? false;

    setDirty(true);
    setDraftSelected([]);

    const addedTextIds: string[] = [];

    setValue((v) => {
      let nextSvg = v.底图.svg;
      const regionNameList = [...v.底图.区域名, draft.name];

      const startNo = v.底图.区域线条.length;
      const newLines = selected.map((lineId, i) => {
        const markerPos = draftMarkerPosByLineIdRef.current.get(lineId);
        const result = upsertMarkerTextNode(nextSvg, {
          textNodeId: "",
          createNodeId: allocLocalId("region_text"),
          createWhenMissing: Boolean(markerPos),
          text: String(startNo + i + 1),
          pos: markerPos,
          fontStyle: getMarkerTextFontStyle("region"),
        });
        nextSvg = result.svg;
        if (result.created && result.textNodeId) {
          addedTextIds.push(result.textNodeId);
        }

        return {
          区域名: draft.name,
          textNodeIds: result.textNodeId ? [result.textNodeId] : [],
          lineNodeIds: [lineId],
          lineLength: draft.lineLength,
          区域内位置占比:
            selected.length <= 1 ? 0.5 : i / (selected.length - 1),
        };
      });

      return {
        ...v,
        底图: {
          ...v.底图,
          svg: nextSvg,
          区域名: regionNameList,
          区域线条: [...v.底图.区域线条, ...newLines],
        },
      };
    });

    if (addedTextIds.length > 0) {
      setAllTextIds((prev) => mergeTextIdList(prev, addedTextIds, []));
    }
    selected.forEach((id) => draftMarkerPosByLineIdRef.current.delete(id));

    if (gotoNextStage) {
      requestCanvasReset();

      setStep("档位");
      setProgress(1);
      setDraftSelected([]);

      message.success("已保存，进入下一阶段");
      return;
    }

    const nextPreset = presets[regionIndex + 1];
    setRegionIndex((i) => i + 1);
    setRegionPresetValue(nextPreset?.name ?? CUSTOM_REGION_PRESET_VALUE);
    setRegionDraft({
      name: nextPreset?.name ?? "",
      lineLength: nextPreset?.lineLength ?? 0,
    });

    message.success("已保存，开始下一区域");
  }

  function finishLevel() {
    if (step !== "档位") {
      message.error("当前不在档位标注模式");
      return;
    }

    if (value.底图.区域线条.length === 0) {
      message.error("请先完成区域标注后再保存档位");
      return;
    }

    const selected = uniquePreserveOrder(draftSelected);
    if (selected.length < 1) {
      message.error("请先选择该档位对应的线条");
      return;
    }

    const levelLabel = `${levelNo}档`;
    const levelText = getLevelMarkerText(levelNo);
    const addedTextIds: string[] = [];
    const draftLevelTextIds = new Map(draftLevelTextNodeIdByLineId);

    setDirty(true);

    setValue((v) => {
      let nextSvg = v.底图.svg;
      const textNodeIds = selected.map((lineNodeId) => {
        const markerPos =
          draftMarkerPosByLineIdRef.current.get(lineNodeId) ??
          preferredMarkerPosByLineId.get(lineNodeId);
        const result = upsertMarkerTextNode(nextSvg, {
          textNodeId: draftLevelTextIds.get(lineNodeId) ?? "",
          createNodeId: allocLocalId("level_text"),
          createWhenMissing: Boolean(
            draftLevelTextIds.get(lineNodeId) ?? markerPos,
          ),
          text: levelTextById.get(lineNodeId) ?? levelText,
          pos: markerPos,
          fontStyle: getMarkerTextFontStyle("level"),
        });
        nextSvg = result.svg;
        if (result.created && result.textNodeId) {
          addedTextIds.push(result.textNodeId);
        }
        return result.textNodeId;
      });

      return {
        ...v,
        底图: {
          ...v.底图,
          svg: nextSvg,
          档位标注: [
            ...v.底图.档位标注,
            { 区域名: levelLabel, textNodeIds, lineNodeIds: selected },
          ],
        },
      };
    });

    if (addedTextIds.length > 0) {
      setAllTextIds((prev) => mergeTextIdList(prev, addedTextIds, []));
    }
    setDraftLevelTextNodeIdByLineId(new Map());
    setDraftSelected([]);
    selected.forEach((id) => draftMarkerPosByLineIdRef.current.delete(id));

    setLevelNo((n) => n + 1);
    message.success(`${levelLabel} 已记录`);
  }

  function prepareCustomTextStage() {
    const svgTextNodes = collectSvgTextNodes(value.底图.svg);
    if (svgTextNodes.length === 0) return;

    // 文本阶段默认“隐藏” D/M/L/单/双（仅限非标注系统创建的 text）
    // 注意：不删除 SVG 节点，不修改 allTextIds，最终保存时才可选择性 prune。
    const hideIds = svgTextNodes
      .filter(
        (d) => AUTO_REMOVE_TEXT_SET.has(d.text) && !markerTextIdSet.has(d.id),
      )
      .map((d) => d.id);

    const keepNodes = svgTextNodes.filter(
      (d) => !AUTO_REMOVE_TEXT_SET.has(d.text),
    );

    const removeSet = new Set(hideIds);
    const nextSvg = value.底图.svg;
    let changed = false;

    const nextTextNodes = { ...value.底图.文本节点 };

    Object.entries(nextTextNodes).forEach(([k, v]) => {
      if (removeSet.has(v.textNodeId)) {
        delete (nextTextNodes as Record<string, any>)[k];
        changed = true;
      }
    });

    const existedIdSet = new Set(
      Object.values(nextTextNodes).map((d) => d.textNodeId),
    );

    keepNodes.forEach((node) => {
      if (existedIdSet.has(node.id)) return;

      const key = allocateTextKey(nextTextNodes);
      existedIdSet.add(node.id);

      (nextTextNodes as Record<string, any>)[key] = {
        textNodeId: node.id,
        text: node.text,
        fontStyle: {
          ...getDefaultTextFontStyle(),
          ...(node.fontStyle ?? {}),
        },
      };
      changed = true;
    });

    if (!changed) {
      if (!activeTextKey) {
        const firstKey = Object.keys(nextTextNodes)[0] ?? "";
        if (firstKey) setActiveTextKey(firstKey);
      }
      setTextStageHiddenTextIds((prev) => (prev.length ? prev : hideIds));
      return;
    }

    requestCanvasReset();
    setDirty(true);

    setValue((cur) => ({
      ...cur,
      底图: {
        ...cur.底图,
        svg: nextSvg,
        文本节点: nextTextNodes,
      },
    }));

    setTextStageHiddenTextIds(hideIds);

    const nextActiveKey =
      activeTextKey &&
      Object.prototype.hasOwnProperty.call(nextTextNodes, activeTextKey)
        ? activeTextKey
        : (Object.keys(nextTextNodes)[0] ?? "");

    setActiveTextKey(nextActiveKey);

    message.success("已默认隐藏 D/M/L/单/双 文本，并将其余文本加入保留列表");
  }

  function goNextStep() {
    if (step === "区域") {
      if (value.底图.区域线条.length === 0) {
        message.error("请至少保存一个区域后再进入下一阶段");
        return;
      }

      const proceed = () => {
        requestCanvasReset();
        setStep("档位");
        setProgress(1);
        setDraftSelected([]);
      };

      if (draftSelected.length > 0) {
        // eslint-disable-next-line no-alert
        const ok = window.confirm(
          `当前区域有 ${draftSelected.length} 条线条未保存，直接开启下一阶段将放弃这些选中。确定继续吗？`,
        );
        if (ok) proceed();
        return;
      }

      proceed();
      return;
    }

    if (step === "档位") {
      if (draftSelected.length > 0) {
        message.error("请先保存当前档位，或取消勾选后再进入下一阶段");
        return;
      }
      if (value.底图.档位标注.length === 0) {
        message.error("请至少保存一个档位后再进入下一阶段");
        return;
      }
      if (missingLevelLineIds.length > 0) {
        message.error(
          `还有 ${missingLevelLineIds.length} 条区域线未标注档位，请补齐后再继续`,
        );
        return;
      }

      if (enableDml) {
        setStep("DML");
        setProgress(2);
      } else if (enableDouble) {
        setStep("单双");
        setProgress(3);
      } else {
        setStep("自定义文本");
        setProgress(4);
      }

      setDraftSelected([]);
      return;
    }

    if (step === "DML") {
      if (enableDouble) {
        setStep("单双");
        setProgress(3);
      } else {
        setStep("自定义文本");
        setProgress(4);
      }

      setDraftSelected([]);
      return;
    }

    if (step === "单双") {
      setStep("自定义文本");
      setProgress(4);
      setDraftSelected([]);
      return;
    }

    if (step === "自定义文本") {
      requestCanvasReset();

      if (!canEnterDone) {
        message.error(
          missingLevelLineIds.length > 0
            ? `还有 ${missingLevelLineIds.length} 条区域线未标注档位，无法完成`
            : "请先完成档位标注后再完成",
        );
        return;
      }

      const keepTextNodeIds = uniquePreserveOrder([
        ...Object.values(value.底图.文本节点).map((d) => d.textNodeId),
        ...Array.from(markerTextIdSet),
        ...(slotTextNodeId ? [slotTextNodeId] : []),
      ]);

      if (keepTextNodeIds.length > 0) {
        setDirty(true);
        setValue((v) => ({
          ...v,
          底图: {
            ...v.底图,
            svg: pruneSvgTextNodes(v.底图.svg, keepTextNodeIds),
          },
        }));
        message.success(
          "已生成底图（已清理无关文本节点；隐藏文本会在此阶段被清理）",
        );
      } else {
        message.info("未选择自定义文本：已跳过文本清理");
      }

      setStep("完成");
      setProgress(5);
      setDraftSelected([]);
      setActiveTextKey("");
    }
  }

  const previewValue = useMemo(
    () => ({
      ...value,
      底图: {
        ...value.底图,
        svg: value.底图.svg ? "[svg omitted in preview]" : "",
      },
    }),
    [value],
  );

  const stepTips =
    step === "区域"
      ? "第 1 步：按顺序标注区域线条（⚠️顺序影响后续 DML 排列）。"
      : step === "档位"
        ? "第 2 步：从 1 档开始，批量选择线条并保存，下一档继续。"
        : step === "DML"
          ? "第 3 步：点击线条循环 D → M → L → 空。"
          : step === "单双"
            ? "第 4 步：点击线条切换“是否双数”。"
            : step === "自定义文本"
              ? "第 5 步：点击画布文字加入保留列表；拖拽可调整位置；右侧可新建/编辑样式。"
              : "完成：可复制结构化数据。";

  function allocateTextKey(map: Record<string, unknown>): string {
    let index = Object.keys(map).length + 1;
    let key = `文本${index}`;
    while (Object.prototype.hasOwnProperty.call(map, key)) {
      index += 1;
      key = `文本${index}`;
    }
    return key;
  }

  function getDefaultTextFontStyle() {
    return {
      fill: newTextDraft.fill,
      fontWeight: newTextDraft.fontWeight,
      fontSize: newTextDraft.fontSize,
    };
  }

  function ensureTextNodeKept(textNodeId: string) {
    if (!textNodeId) return;

    const existed = Object.entries(value.底图.文本节点).find(
      ([, v]) => v.textNodeId === textNodeId,
    );
    if (existed) {
      setActiveTextKey(existed[0]);
      return;
    }

    const key = allocateTextKey(value.底图.文本节点);
    const text = getSvgTextNodeText(value.底图.svg, textNodeId);
    const fontStyle = {
      ...getDefaultTextFontStyle(),
      ...getSvgTextNodeFontStyle(value.底图.svg, textNodeId),
    };

    setDirty(true);

    setValue((cur) => ({
      ...cur,
      底图: {
        ...cur.底图,
        文本节点: {
          ...cur.底图.文本节点,
          [key]: {
            textNodeId,
            text,
            fontStyle,
          },
        },
      },
    }));

    setActiveTextKey(key);
  }

  function createTextNode() {
    const key = allocateTextKey(value.底图.文本节点);
    const nodeId = `custom_text_${Date.now()}`;
    const fontStyle = getDefaultTextFontStyle();

    requestCanvasReset();
    setDirty(true);

    setValue((cur) => ({
      ...cur,
      底图: {
        ...cur.底图,
        svg: appendSvgTextNode(cur.底图.svg, {
          nodeId,
          text: newTextDraft.text,
          fontStyle,
        }),
        文本节点: {
          ...cur.底图.文本节点,
          [key]: {
            textNodeId: nodeId,
            text: newTextDraft.text,
            fontStyle,
            created: true,
          },
        },
      },
    }));

    setAllTextIds((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
    setActiveTextKey(key);
    message.success("已添加文本节点（可拖动）");
  }

  function updateTextNodeText(key: string, text: string) {
    setDirty(true);
    setValue((cur) => {
      const prev = cur.底图.文本节点[key];
      if (!prev) return cur;

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: updateSvgTextNode(cur.底图.svg, prev.textNodeId, text),
          文本节点: {
            ...cur.底图.文本节点,
            [key]: {
              ...prev,
              text,
            },
          },
        },
      };
    });
  }

  function commitTextNodePosition(
    textNodeId: string,
    pos: { x: number; y: number },
  ) {
    if (!textNodeId) return;
    setDirty(true);
    setValue((cur) => ({
      ...cur,
      底图: {
        ...cur.底图,
        svg: setSvgTextNodePosition(cur.底图.svg, textNodeId, pos),
      },
    }));
  }

  function removeTextNode(key: string) {
    const removedId = value.底图.文本节点[key]?.textNodeId;
    const nextActiveKey =
      activeTextKey === key
        ? (Object.keys(value.底图.文本节点).filter((k) => k !== key)[0] ?? "")
        : activeTextKey;

    requestCanvasReset();

    setDirty(true);
    setValue((cur) => {
      const prev = cur.底图.文本节点[key];
      if (!prev) return cur;

      const next = { ...cur.底图.文本节点 };
      delete next[key];

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: removeSvgTextNodes(cur.底图.svg, [prev.textNodeId]),
          文本节点: next,
        },
      };
    });

    if (removedId) {
      setAllTextIds((prev) => prev.filter((id) => id !== removedId));
    }

    setActiveTextKey(nextActiveKey);
  }

  function updateTextNodeStyle(key: string, patch: Record<string, unknown>) {
    setDirty(true);
    setValue((cur) => {
      const prev = cur.底图.文本节点[key];
      if (!prev) return cur;

      const merged = {
        ...(prev.fontStyle ?? {}),
        ...patch,
      };

      return {
        ...cur,
        底图: {
          ...cur.底图,
          svg: setSvgTextNodeStyle(cur.底图.svg, prev.textNodeId, merged),
          文本节点: {
            ...cur.底图.文本节点,
            [key]: {
              ...prev,
              fontStyle: merged,
            },
          },
        },
      };
    });
  }

  function clearCustomText() {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("将清空自定义文本配置，确定吗？");
    if (!ok) return;

    requestCanvasReset();

    setDirty(true);
    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        文本节点: {},
      },
    }));
    setActiveTextKey("");
    message.success("已清空自定义文本");
  }

  return {
    // 基础参数
    presets,
    lineSelector,
    enableDml,
    enableDouble,

    // 状态
    step,
    setStep,
    progress,
    setProgress,
    value,
    setValue,
    dirty,
    canvasEpoch,

    allLineIds,
    allLineIdSet,
    allTextIds,
    markerTextIdSet,
    draggableMarkerTextIdSet,

    // 区域/档位草稿
    regionIndex,
    regionPresetValue,
    setRegionPresetValue,
    regionDraft,
    setRegionDraft,
    levelNo,
    draftSelected,
    setDraftSelected,
    dmlAutoConfigs,
    dmlPattern,
    setDmlPattern,
    activeTextKey,
    setActiveTextKey,
    newTextDraft,
    setNewTextDraft,

    // 派生
    renderSvg,
    previewValue,
    visibleMarkerById,
    preferredDmlPosByLineId,
    preferredMarkerPosByLineId,
    draftMarkerPosByLineId: draftMarkerPosByLineIdRef.current,
    dmlMarkerPosByLineId: dmlMarkerPosByLineIdRef.current,
    pendingDmlMarkerPosByLineId: pendingDmlMarkerPosByLineIdRef.current,
    regionLabelItems,
    disabledForStep,
    stepTips,
    missingLevelLineIds,
    canEditRegion,
    canEditDml,
    canEditDouble,
    canEnterDone,

    // 图层控制
    layerToggles,
    setLayerToggles,

    // 事件/操作
    stepToIndex,
    confirmExit,
    requestCanvasReset,
    toggleSelect,
    handleLineAction,
    ensureRegionMarkerTextNode,
    ensureLevelMarkerTextNode,
    ensureDmlMarkerTextNode,
    ensureDoubleMarkerTextNode,
    clearRegionStage,
    clearLevelStage,
    clearDmlStage,
    clearDoubleStage,
    addDmlAutoConfig,
    updateDmlAutoConfig,
    removeDmlAutoConfig,
    resetDmlAutoConfigs,
    finishRegion,
    finishLevel,
    goNextStep,
    completeTextStage: goNextStep,

    ensureTextNodeKept,
    createTextNode,
    updateTextNodeText,
    commitTextNodePosition,
    removeTextNode,
    updateTextNodeStyle,
    clearCustomText,
  };
}
