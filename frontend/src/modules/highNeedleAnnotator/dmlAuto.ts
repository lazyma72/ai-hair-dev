import type { DmlValue } from "./types";

export type DmlAutoConfig = {
  id: string;
  /** 区域名（来自 value.底图.区域名） */
  regionName: string;
  /** 排列规律：仅支持 D/M/L 字符（会被自动归一化） */
  pattern: string;
  /** 整数百分比（0~100） */
  rangeStart: number;
  /** 整数百分比（0~100） */
  rangeEnd: number;
};

export type RegionLineItem = {
  lineId: string;
  regionName: string;
  /** 0~1：区域内相对位置 */
  posRatio: number;
};

export type AutoDmlComputeResult = {
  assignments: Map<string, DmlValue>;
  managedLineIds: Set<string>;
  slotByLineId: Map<string, { configId: string; slotIndex: number }>;
};

export function normalizePattern(raw: string): string {
  return (raw ?? "")
    .toUpperCase()
    .split("")
    .filter((ch) => ch === "D" || ch === "M" || ch === "L")
    .join("");
}

export function nextDmlInPattern(v: DmlValue): Exclude<DmlValue, ""> {
  return v === "D" ? "M" : v === "M" ? "L" : "D";
}

function clampInt(value: unknown, min: number, max: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export function getDmlPatternPresets(): string[] {
  const presets = [
    // 最简单：3 字母全排列
    "DML",
    "DLM",
    "MDL",
    "MLD",
    "LDM",
    "LMD",

    // 常见的加倍/延长
    "DDML",
    "DDLM",
    "DMDL",
    "DMLL",
    "MMDL",
    "LLDM",
    "DDDML",
    "DDDL",
  ];

  const uniq = new Set(presets.map(normalizePattern).filter(Boolean));
  return Array.from(uniq).sort((a, b) => a.length - b.length || a.localeCompare(b));
}

export function replacePatternChar(patternRaw: string, slotIndex: number, next: Exclude<DmlValue, "">): string {
  const pattern = normalizePattern(patternRaw);
  if (!pattern) return pattern;
  const idx = ((slotIndex % pattern.length) + pattern.length) % pattern.length;
  return `${pattern.slice(0, idx)}${next}${pattern.slice(idx + 1)}`;
}

export function computeAutoDml(
  configs: DmlAutoConfig[],
  regionLines: RegionLineItem[],
  options?: { allowedLineIdSet?: Set<string> },
): AutoDmlComputeResult {
  const allowed = options?.allowedLineIdSet;

  const linesByRegion = new Map<string, RegionLineItem[]>();
  regionLines.forEach((line) => {
    if (allowed && !allowed.has(line.lineId)) return;
    const list = linesByRegion.get(line.regionName) ?? [];
    list.push(line);
    linesByRegion.set(line.regionName, list);
  });

  Array.from(linesByRegion.values()).forEach((list) => {
    list.sort((a, b) => {
      const diff = a.posRatio - b.posRatio;
      if (diff !== 0) return diff;
      return a.lineId.localeCompare(b.lineId);
    });
  });

  const assignments = new Map<string, DmlValue>();
  const managedLineIds = new Set<string>();
  const slotByLineId = new Map<string, { configId: string; slotIndex: number }>();

  configs.forEach((config) => {
    const pattern = normalizePattern(config.pattern);
    if (!pattern) return;

    const start = clampInt(config.rangeStart, 0, 100);
    const end = clampInt(config.rangeEnd, 0, 100);
    const rangeMin = Math.min(start, end);
    const rangeMax = Math.max(start, end);

    const allLines = linesByRegion.get(config.regionName) ?? [];
    const targetLines = allLines.filter((l) => {
      const percent = l.posRatio * 100;
      return percent >= rangeMin && percent <= rangeMax;
    });

    targetLines.forEach((line, idx) => {
      const ch = pattern[idx % pattern.length] as DmlValue;
      assignments.set(line.lineId, ch);
      managedLineIds.add(line.lineId);
      slotByLineId.set(line.lineId, { configId: config.id, slotIndex: idx });
    });
  });

  return { assignments, managedLineIds, slotByLineId };
}
