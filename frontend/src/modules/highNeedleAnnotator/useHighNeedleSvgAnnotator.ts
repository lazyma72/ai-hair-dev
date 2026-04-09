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
  computeAutoDml,
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

function nextDml(v: DmlValue): DmlValue {
  return v === "" ? "D" : v === "D" ? "M" : v === "M" ? "L" : "";
}

export type UseHighNeedleSvgAnnotatorParams = {
  initialSvg: string;
  initialValue?: 高针图;
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
  presets = 高针图系统预置区域列表,
  lineSelector = DEFAULT_LINE_SELECTOR,
  slotTextNodeId,
  enableDml,
  enableDouble,
  onChange,
}: UseHighNeedleSvgAnnotatorParams) {
  const [step, setStep] = useState<标注步骤>(initialValue ? "完成" : "区域");
  const [progress, setProgress] = useState<number>(initialValue ? 5 : 0);
  const [value, setValue] = useState<高针图>(
    () => initialValue ?? createEmpty高针图(initialSvg),
  );
  const [allLineIds, setAllLineIds] = useState<string[]>([]);
  const [allTextIds, setAllTextIds] = useState<string[]>([]);

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
  const manualDmlOverridesRef = useRef<Record<string, DmlValue>>({});
  const autoDmlAssignmentsRef = useRef<Map<string, DmlValue>>(new Map());
  const autoDmlManagedIdsRef = useRef<Set<string>>(new Set());
  const autoDmlSlotByLineIdRef = useRef<
    Map<string, { configId: string; slotIndex: number }>
  >(new Map());

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
      manualDmlOverridesRef.current = {};
      autoDmlAssignmentsRef.current = new Map();
      autoDmlManagedIdsRef.current = new Set();
      autoDmlSlotByLineIdRef.current = new Map();
      setDmlAutoConfigs([]);

      setStep("区域");
      setProgress(0);
    }
  }, [initialSvg, initialValue, lineSelector]);

  // 从 JSON 恢复/预览
  useEffect(() => {
    if (!initialValue) return;

    const ensuredLine = ensureLineIds(initialValue.底图.svg, lineSelector);
    const ensuredText = ensureTextIds(ensuredLine.svg);

    setStep("完成");
    setDirty(false);
    setDraftSelected([]);
    setActiveTextKey("");
    setRegionIndex(0);
    setRegionPresetValue(presets[0]?.name ?? CUSTOM_REGION_PRESET_VALUE);
    setRegionDraft({
      name: presets[0]?.name ?? "",
      lineLength: presets[0]?.lineLength ?? 0,
    });
    setLevelNo(1);

    setDmlAutoConfigs([]);
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

    setAllLineIds(ensuredLine.lineIds);
    setAllTextIds(ensuredText.textIds);
    setProgress(5);

    setValue({
      ...initialValue,
      底图: {
        ...initialValue.底图,
        svg: ensuredText.svg,
        文本节点: initialValue.底图.文本节点 ?? {},
      },
      自定义数据: {
        ...initialValue.自定义数据,
        DML标注: initialValue.自定义数据.DML标注 ?? [],
        单双标注: initialValue.自定义数据.单双标注 ?? [],
      },
    });
  }, [initialValue, lineSelector, presets]);

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

  const usedRegionLines = useMemo(
    () => new Set(value.底图.区域线条.flatMap((d) => d.lineNodeIds)),
    [value.底图.区域线条],
  );

  const usedLevelLines = useMemo(
    () => new Set(value.底图.档位标注.flatMap((d) => d.lineNodeIds)),
    [value.底图.档位标注],
  );

  const dmlById = useMemo(
    () => makeDmlMap(value.自定义数据.DML标注),
    [value.自定义数据.DML标注],
  );
  const doubleById = useMemo(
    () => makeDoubleSet(value.自定义数据.单双标注),
    [value.自定义数据.单双标注],
  );

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
    const map = new Map<string, string>();
    value.底图.区域名.forEach((name, idx) => {
      map.set(name, REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]);
    });
    return map;
  }, [value.底图.区域名]);

  const regionStrokeById = useMemo(() => {
    if (step !== "DML") return undefined;
    const map = new Map<string, string>();
    value.底图.区域线条.forEach((d) => {
      const color = regionColorByName.get(d.区域名);
      if (!color) return;
      d.lineNodeIds.forEach((id) => map.set(id, color));
    });
    return map;
  }, [regionColorByName, step, value.底图.区域线条]);

  const regionLabelItems = useMemo(() => {
    if (step !== "DML") return [];

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
  }, [regionColorByName, step, value.底图.区域线条]);

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
      d.lineNodeIds.forEach((id) => map.set(id, idx + 1));
    });

    if (step === "档位") {
      uniquePreserveOrder(draftSelected).forEach((id) => map.set(id, levelNo));
    }

    return map;
  }, [draftSelected, levelNo, step, value.底图.档位标注]);

  const visibleMarkerById = useMemo(() => {
    const map = new Map<
      string,
      {
        regionNo?: number;
        levelNo?: number;
        dml?: DmlValue;
        isDouble?: boolean;
      }
    >();

    if (step === "区域") {
      regionNoById.forEach((no, id) => {
        map.set(id, { regionNo: no });
      });
      return map;
    }

    if (step === "档位") {
      levelNoById.forEach((no, id) => {
        map.set(id, { levelNo: no });
      });
      return map;
    }

    if (step === "DML") {
      dmlById.forEach((v, id) => {
        if (!v) return;
        map.set(id, { dml: v });
      });
      return map;
    }

    if (step === "单双") {
      doubleById.forEach((id) => {
        map.set(id, { isDouble: true });
      });
      return map;
    }

    return map;
  }, [dmlById, doubleById, levelNoById, regionNoById, step]);

  const availableForStep = useMemo(() => {
    if (step === "完成" || step === "自定义文本") return new Set<string>();

    if (step === "区域") {
      if (progress > 0) return new Set<string>();
      const base = new Set(allLineIds);
      usedRegionLines.forEach((id) => base.delete(id));
      return base;
    }

    if (step === "档位") {
      if (progress !== 1) return new Set<string>();

      const archived = new Set(
        value.底图.区域线条.flatMap((d) => d.lineNodeIds),
      );
      usedLevelLines.forEach((id) => archived.delete(id));
      return archived;
    }

    return new Set(allLineIds);
  }, [
    allLineIds,
    progress,
    step,
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
    const selectedStroke =
      step === "档位" ? "#f59e0b" : step === "区域" ? "#3b82f6" : "#ef4444";

    return decorateLines(value.底图.svg, {
      touchIds: allLineIds,
      selected: new Set(draftSelected),
      disabled: disabledForStep,
      regionNoById,
      regionStrokeById: step === "DML" ? regionStrokeById : undefined,
      levelNoById,
      dmlById: step === "DML" ? dmlById : undefined,
      doubleById: step === "单双" ? doubleById : undefined,
      selectedStroke,
    });
  }, [
    allLineIds,
    disabledForStep,
    dmlById,
    doubleById,
    draftSelected,
    levelNoById,
    regionNoById,
    step,
    value.底图.svg,
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

    setValue((cur) => ({
      ...cur,
      自定义数据: {
        ...cur.自定义数据,
        DML标注: Array.from(merged.entries()).map(([lineNodeId, 标注DML]) => ({
          lineNodeId,
          标注DML,
        })),
      },
    }));
  }

  function recomputeAutoDml(configs: DmlAutoConfig[]) {
    if (step !== "DML") return;

    const allowedLineIdSet = new Set(
      value.底图.档位标注.flatMap((d) => d.lineNodeIds),
    );
    const { assignments, managedLineIds, slotByLineId } = computeAutoDml(
      configs,
      regionLineItems,
      {
        allowedLineIdSet,
      },
    );

    autoDmlSlotByLineIdRef.current = slotByLineId;
    commitMergedDml(assignments, managedLineIds);
  }

  useEffect(() => {
    if (step !== "DML") return;

    setDmlAutoConfigs((prev) => {
      const regionNames = value.底图.区域名;
      if (regionNames.length === 0) return prev;

      const regionSet = new Set(regionNames);
      const next: DmlAutoConfig[] = (prev.length > 0 ? prev : []).filter((c) =>
        regionSet.has(c.regionName),
      );

      regionNames.forEach((name) => {
        if (next.some((c) => c.regionName === name)) return;
        next.push({
          id: allocLocalId("dml_cfg"),
          regionName: name,
          pattern: "",
          rangeStart: 0,
          rangeEnd: 100,
        });
      });

      return next;
    });
  }, [step, value.底图.区域名]);

  useEffect(() => {
    if (step !== "DML") return;
    recomputeAutoDml(dmlAutoConfigs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmlAutoConfigs, regionLineItems, step, value.底图.档位标注]);

  function toggleSelect(id: string, options?: { silent?: boolean }) {
    if (!id) return;
    if (!availableForStep.has(id) && !draftSelected.includes(id)) {
      if (!options?.silent) {
        message.warning("该线条在当前步骤不可操作");
      }
      return;
    }

    setDraftSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleLineAction(id: string) {
    if (!id) return;

    if (step === "DML") {
      if (!availableForStep.has(id)) return;

      // Click always writes a per-line manual override; the auto pattern is never modified.
      // Priority: existing manual override > auto assignment > empty.
      setDirty(true);
      const currentManual = manualDmlOverridesRef.current[id];
      const currentAuto = autoDmlAssignmentsRef.current.get(id) ?? "";
      const currentEffective: DmlValue =
        currentManual !== undefined ? currentManual : (currentAuto as DmlValue);
      const next = nextDml(currentEffective);
      // 无论 next 是否为空，都写入 manual override。
      // 空字符串 ("") 是"明确清除"信号，commitMergedDml 会据此删除自动规律赋值。
      manualDmlOverridesRef.current[id] = next;
      commitMergedDml(
        autoDmlAssignmentsRef.current,
        autoDmlManagedIdsRef.current,
      );
      return;
    }

    if (step === "单双") {
      if (!availableForStep.has(id)) return;

      setDirty(true);
      setValue((v) => {
        const prevSet = makeDoubleSet(v.自定义数据.单双标注);
        const nextSet = new Set(prevSet);
        if (nextSet.has(id)) nextSet.delete(id);
        else nextSet.add(id);

        return {
          ...v,
          自定义数据: {
            ...v.自定义数据,
            单双标注: Array.from(nextSet).map((lineNodeId) => ({
              lineNodeId,
              双数: true,
            })),
          },
        };
      });

      return;
    }

    toggleSelect(id);
  }

  function confirmExit() {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("将清空所有标注并重新开始，确定吗？");
    if (!ok) return;

    autoTextPreparedRef.current = false;
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
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
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
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

    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        档位标注: [],
      },
      自定义数据: {
        ...v.自定义数据,
        DML标注: [],
        单双标注: [],
      },
    }));

    message.success("已清空档位阶段");
  }

  function clearDmlStage() {
    requestCanvasReset();

    setDirty(true);
    manualDmlOverridesRef.current = {};
    autoDmlAssignmentsRef.current = new Map();
    autoDmlManagedIdsRef.current = new Set();
    autoDmlSlotByLineIdRef.current = new Map();
    setDmlAutoConfigs((prev) => prev.map((c) => ({ ...c, pattern: "" })));

    setValue((v) => ({
      ...v,
      自定义数据: {
        ...v.自定义数据,
        DML标注: [],
      },
    }));
    message.success("已清空 DML 标注（并关闭自动规律）");
  }

  function clearDoubleStage() {
    requestCanvasReset();

    setDirty(true);
    setValue((v) => ({
      ...v,
      自定义数据: {
        ...v.自定义数据,
        单双标注: [],
      },
    }));
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

    if (progress > 0) {
      message.error("已进入后续步骤，区域阶段已锁定");
      return;
    }

    const gotoNextStage = options?.gotoNextStage ?? false;

    setDirty(true);
    setDraftSelected([]);

    setValue((v) => {
      const regionNameList = [...v.底图.区域名, draft.name];

      const newLines = selected.map((lineId, i) => ({
        区域名: draft.name,
        lineNodeIds: [lineId],
        lineLength: draft.lineLength,
        区域内位置占比: selected.length <= 1 ? 0.5 : i / (selected.length - 1),
      }));

      return {
        ...v,
        底图: {
          ...v.底图,
          区域名: regionNameList,
          区域线条: [...v.底图.区域线条, ...newLines],
        },
      };
    });

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
    if (progress !== 1) {
      message.error("已进入后续步骤，档位阶段已锁定");
      return;
    }

    const selected = uniquePreserveOrder(draftSelected);
    if (selected.length < 1) {
      message.error("请先选择该档位对应的线条");
      return;
    }

    const levelLabel = `${levelNo}档`;

    setDirty(true);
    setDraftSelected([]);

    setValue((v) => ({
      ...v,
      底图: {
        ...v.底图,
        档位标注: [
          ...v.底图.档位标注,
          { 区域名: levelLabel, lineNodeIds: selected },
        ],
      },
    }));

    setLevelNo((n) => n + 1);
    message.success(`${levelLabel} 已记录`);
  }

  function prepareCustomTextStage() {
    const svgTextNodes = collectSvgTextNodes(value.底图.svg);
    if (svgTextNodes.length === 0) return;

    const removeIds = svgTextNodes
      .filter((d) => AUTO_REMOVE_TEXT_SET.has(d.text))
      .map((d) => d.id);

    const keepNodes = svgTextNodes.filter(
      (d) => !AUTO_REMOVE_TEXT_SET.has(d.text),
    );

    const removeSet = new Set(removeIds);
    const nextSvg =
      removeIds.length > 0
        ? removeSvgTextNodes(value.底图.svg, removeIds)
        : value.底图.svg;

    let changed = removeIds.length > 0 || nextSvg !== value.底图.svg;

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

    if (removeIds.length > 0) {
      setAllTextIds((prev) => prev.filter((id) => !removeSet.has(id)));
    }

    const nextActiveKey =
      activeTextKey &&
      Object.prototype.hasOwnProperty.call(nextTextNodes, activeTextKey)
        ? activeTextKey
        : (Object.keys(nextTextNodes)[0] ?? "");

    setActiveTextKey(nextActiveKey);

    message.success(
      "已自动清理 D/M/L/单/双 文本节点，并将其余文本加入保留列表",
    );
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

      const keepTextNodeIds = uniquePreserveOrder([
        ...Object.values(value.底图.文本节点).map((d) => d.textNodeId),
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
        message.success("已生成底图（已清理无关文本节点）");
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
    activeTextKey,
    setActiveTextKey,
    newTextDraft,
    setNewTextDraft,

    // 派生
    renderSvg,
    previewValue,
    visibleMarkerById,
    regionLabelItems,
    disabledForStep,
    stepTips,

    // 事件/操作
    stepToIndex,
    confirmExit,
    requestCanvasReset,
    toggleSelect,
    handleLineAction,
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

    ensureTextNodeKept,
    createTextNode,
    updateTextNodeText,
    commitTextNodePosition,
    removeTextNode,
    updateTextNodeStyle,
    clearCustomText,
  };
}
