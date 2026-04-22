import type {
  DML值,
  DML规则命令列表,
  DML规则命令,
  DML按档位标记命令,
  DML区域百分比命令,
} from "../../shared/models/DML规则";

export type DmlRuleSourceType = DML规则命令["type"];

export type DmlCompiledItem = {
  lineNodeId: string;
  值: DML值;
  来源命令id: string;
  来源类型: DmlRuleSourceType;
  slotIndex?: number;
};

export type DmlCompileResult = {
  assignments: Map<string, DML值>;
  managedLineIds: Set<string>;
  items: DmlCompiledItem[];
};

type DmlCompileOptions = {
  includeLineIds?: ReadonlySet<string>;
  includeItems?: boolean;
};

export type DmlCompilableData = {
  底图: {
    区域线条: {
      区域名: string;
      lineNodeIds: string[];
      区域内位置占比: number;
    }[];
    档位标注: {
      区域名: string;
      lineNodeIds: string[];
    }[];
  };
  自定义数据: {
    DML规则命令列表: DML规则命令列表;
  };
};

type DmlCompileIndexes = {
  regionLinesByName: Map<string, OrderedRegionLine[]>;
  levelLineIdsByName: Map<string, string[]>;
};

const dmlCompileIndexCache = new WeakMap<
  DmlCompilableData["底图"],
  DmlCompileIndexes
>();

export function normalizePattern(raw: string): string {
  return (raw ?? "")
    .toUpperCase()
    .split("")
    .filter((ch) => ch === "D" || ch === "M" || ch === "L")
    .join("");
}

export function nextDmlInPattern(v: DML值): DML值 {
  return v === "D" ? "M" : v === "M" ? "L" : "D";
}

function clampRatio(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
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
  return Array.from(uniq).sort(
    (a, b) => a.length - b.length || a.localeCompare(b),
  );
}

export function replacePatternChar(
  patternRaw: string,
  slotIndex: number,
  next: DML值,
): string {
  const pattern = normalizePattern(patternRaw);
  if (!pattern) return pattern;
  const idx = ((slotIndex % pattern.length) + pattern.length) % pattern.length;
  return `${pattern.slice(0, idx)}${next}${pattern.slice(idx + 1)}`;
}

type OrderedRegionLine = {
  lineNodeId: string;
  区域名: string;
  区域内位置占比: number;
  sourceIndex: number;
  subIndex: number;
};

function isDmlBoundaryIncluded(
  value: number,
  start: number,
  end: number,
): boolean {
  const rangeStart = Math.min(start, end);
  const rangeEnd = Math.max(start, end);
  if (rangeEnd >= 1) {
    return value >= rangeStart && value <= rangeEnd;
  }
  return value >= rangeStart && value < rangeEnd;
}

function isDmlBucketSelected(
  index: number,
  total: number,
  start: number,
  end: number,
): boolean {
  if (total <= 0) return false;
  const rangeStart = Math.min(start, end);
  const rangeEnd = Math.max(start, end);
  const bucketEnd = (index + 1) / total;
  return bucketEnd > rangeStart && bucketEnd <= rangeEnd;
}

function isValidDmlValue(v: unknown): v is DML值 {
  return v === "D" || v === "M" || v === "L";
}

function collectOrderedRegionLines(
  data: DmlCompilableData,
): Map<string, OrderedRegionLine[]> {
  const byRegion = new Map<string, OrderedRegionLine[]>();
  data.底图.区域线条.forEach((item, itemIndex) => {
    item.lineNodeIds.forEach((lineNodeId, subIndex) => {
      const list = byRegion.get(item.区域名) ?? [];
      list.push({
        lineNodeId,
        区域名: item.区域名,
        区域内位置占比: clampRatio(item.区域内位置占比),
        sourceIndex: itemIndex,
        subIndex,
      });
      byRegion.set(item.区域名, list);
    });
  });

  byRegion.forEach((list) => {
    list.sort((a, b) => {
      const ratioDiff = a.区域内位置占比 - b.区域内位置占比;
      if (ratioDiff !== 0) return ratioDiff;
      const sourceDiff = a.sourceIndex - b.sourceIndex;
      if (sourceDiff !== 0) return sourceDiff;
      return a.subIndex - b.subIndex;
    });
  });

  return byRegion;
}

function collectLevelLineIds(data: DmlCompilableData): Map<string, string[]> {
  return new Map(
    data.底图.档位标注.map(
      (item) => [item.区域名, item.lineNodeIds.filter(Boolean)] as const,
    ),
  );
}

function getDmlCompileIndexes(data: DmlCompilableData): DmlCompileIndexes {
  const cached = dmlCompileIndexCache.get(data.底图);
  if (cached) return cached;

  const indexes = {
    regionLinesByName: collectOrderedRegionLines(data),
    levelLineIdsByName: collectLevelLineIds(data),
  };
  dmlCompileIndexCache.set(data.底图, indexes);
  return indexes;
}

function sortExplicitRegionLineIds(
  command: DML区域百分比命令,
  byRegion: Map<string, OrderedRegionLine[]>,
): string[] {
  const selectedSet = new Set(command.lineNodeIds.filter(Boolean));
  if (selectedSet.size === 0) return [];

  const orderedTargets: string[] = [];
  const seen = new Set<string>();

  command.区域百分比.forEach((segment) => {
    const list = byRegion.get(segment.区域) ?? [];
    list.forEach((item) => {
      if (!selectedSet.has(item.lineNodeId) || seen.has(item.lineNodeId)) return;
      orderedTargets.push(item.lineNodeId);
      seen.add(item.lineNodeId);
    });
  });

  command.lineNodeIds.forEach((lineNodeId) => {
    if (!selectedSet.has(lineNodeId) || seen.has(lineNodeId)) return;
    orderedTargets.push(lineNodeId);
    seen.add(lineNodeId);
  });

  return orderedTargets;
}

function sortExplicitLevelLineIds(
  command: DML按档位标记命令,
  byLevel: Map<string, string[]>,
): string[] {
  const selectedSet = new Set(command.lineNodeIds.filter(Boolean));
  if (selectedSet.size === 0) return [];

  const orderedTargets: string[] = [];
  const seen = new Set<string>();

  command.档位.forEach((segment) => {
    const list = byLevel.get(segment.档位名称) ?? [];
    list.forEach((lineNodeId) => {
      if (!selectedSet.has(lineNodeId) || seen.has(lineNodeId)) return;
      orderedTargets.push(lineNodeId);
      seen.add(lineNodeId);
    });
  });

  command.lineNodeIds.forEach((lineNodeId) => {
    if (!selectedSet.has(lineNodeId) || seen.has(lineNodeId)) return;
    orderedTargets.push(lineNodeId);
    seen.add(lineNodeId);
  });

  return orderedTargets;
}

function collectRegionCommandTargets(
  command: DML区域百分比命令,
  byRegion: Map<string, OrderedRegionLine[]>,
): string[] {
  // 以标记为主：如果命令存有显式 lineNodeIds，直接使用，跳过位置计算避免边界拓占
  if (command.lineNodeIds.length > 0) {
    return sortExplicitRegionLineIds(command, byRegion);
  }
  return command.区域百分比.flatMap((segment) => {
    const start = clampRatio(segment.开始位置);
    const end = clampRatio(segment.结束位置);
    const list = byRegion.get(segment.区域) ?? [];
    return list
      .filter((_, index) => isDmlBucketSelected(index, list.length, start, end))
      .map((item) => item.lineNodeId);
  });
}

function collectLevelCommandTargets(
  command: DML按档位标记命令,
  byLevel: Map<string, string[]>,
): string[] {
  // 以标记为主：如果命令存有显式 lineNodeIds，直接使用，跳过位置计算避免边界拓占
  if (command.lineNodeIds.length > 0) {
    return sortExplicitLevelLineIds(command, byLevel);
  }
  return command.档位.flatMap((segment) => {
    const list = byLevel.get(segment.档位名称) ?? [];
    if (list.length === 0) return [];
    const start = clampRatio(segment.开始位置);
    const end = clampRatio(segment.结束位置);
    return list.filter((_, index) =>
      isDmlBucketSelected(index, list.length, start, end),
    );
  });
}

function applyPatternAssignments(
  assignments: Map<string, DML值>,
  items: DmlCompiledItem[],
  managedLineIds: Set<string>,
  command: DML区域百分比命令 | DML按档位标记命令,
  targetLineIds: string[],
  options?: DmlCompileOptions,
) {
  const pattern = normalizePattern(command.规律);
  if (!pattern) return;

  targetLineIds.forEach((lineNodeId, slotIndex) => {
    if (options?.includeLineIds && !options.includeLineIds.has(lineNodeId)) {
      return;
    }
    const 值 = pattern[slotIndex % pattern.length] as DML值;
    assignments.set(lineNodeId, 值);
    managedLineIds.add(lineNodeId);
    if (options?.includeItems !== false) {
      items.push({
        lineNodeId,
        值,
        来源命令id: command.id,
        来源类型: command.type,
        slotIndex,
      });
    }
  });
}

function compileDmlRulesInternal(
  data: DmlCompilableData,
  options?: DmlCompileOptions,
): DmlCompileResult {
  const assignments = new Map<string, DML值>();
  const managedLineIds = new Set<string>();
  const items: DmlCompiledItem[] = [];
  const rules = data.自定义数据.DML规则命令列表 ?? [];
  const { regionLinesByName, levelLineIdsByName } = getDmlCompileIndexes(data);

  rules.forEach((command) => {
    if (command.type === "区域百分比") {
      applyPatternAssignments(
        assignments,
        items,
        managedLineIds,
        command,
        collectRegionCommandTargets(command, regionLinesByName),
        options,
      );
      return;
    }

    if (command.type === "按档位标记") {
      applyPatternAssignments(
        assignments,
        items,
        managedLineIds,
        command,
        collectLevelCommandTargets(command, levelLineIdsByName),
        options,
      );
      return;
    }

    if (!isValidDmlValue(command.规律)) return;
    const specialValue = command.规律;
    command.lineNodeIds.forEach((lineNodeId) => {
      if (!lineNodeId) return;
      if (options?.includeLineIds && !options.includeLineIds.has(lineNodeId)) {
        return;
      }
      assignments.set(lineNodeId, specialValue);
      managedLineIds.add(lineNodeId);
      if (options?.includeItems !== false) {
        items.push({
          lineNodeId,
          值: specialValue,
          来源命令id: command.id,
          来源类型: command.type,
        });
      }
    });
  });

  return { assignments, managedLineIds, items };
}

export function compileDmlRules(data: DmlCompilableData): DmlCompileResult {
  return compileDmlRulesInternal(data);
}

export function compileDmlRulesForLineIds(
  data: DmlCompilableData,
  lineIds: Iterable<string>,
): DmlCompileResult {
  const includeLineIds = new Set(
    Array.from(lineIds)
      .map((lineId) => String(lineId ?? "").trim())
      .filter(Boolean),
  );
  if (includeLineIds.size === 0) {
    return {
      assignments: new Map(),
      managedLineIds: new Set(),
      items: [],
    };
  }

  return compileDmlRulesInternal(data, {
    includeLineIds,
    includeItems: false,
  });
}
