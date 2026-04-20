import type {
  DML值,
  DML规则,
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
    DML规则: DML规则;
  };
};

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

function isDmlBoundaryIncluded(value: number, start: number, end: number): boolean {
  const rangeStart = Math.min(start, end);
  const rangeEnd = Math.max(start, end);
  if (rangeEnd >= 1) {
    return value >= rangeStart && value <= rangeEnd;
  }
  return value >= rangeStart && value < rangeEnd;
}

function normalizePatternList(pattern: DML值[]): DML值[] {
  return pattern.filter((item): item is DML值 => item === "D" || item === "M" || item === "L");
}

function collectOrderedRegionLines(data: DmlCompilableData): Map<string, OrderedRegionLine[]> {
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
    data.底图.档位标注.map((item) => [item.区域名, item.lineNodeIds.filter(Boolean)] as const),
  );
}

function collectRegionCommandTargets(
  command: DML区域百分比命令,
  byRegion: Map<string, OrderedRegionLine[]>,
): string[] {
  // 以标记为主：如果命令存有显式 lineNodeIds，直接使用，跳过位置计算避免边界拓占
  if (command.lineNodeIds.length > 0) {
    return command.lineNodeIds.filter(Boolean);
  }
  return command.区域百分比.flatMap((segment) => {
    const start = clampRatio(segment.开始位置);
    const end = clampRatio(segment.结束位置);
    const list = byRegion.get(segment.区域) ?? [];
    return list
      .filter((item) => isDmlBoundaryIncluded(item.区域内位置占比, start, end))
      .map((item) => item.lineNodeId);
  });
}

function collectLevelCommandTargets(
  command: DML按档位标记命令,
  byLevel: Map<string, string[]>,
): string[] {
  // 以标记为主：如果命令存有显式 lineNodeIds，直接使用，跳过位置计算避免边界拓占
  if (command.lineNodeIds.length > 0) {
    return command.lineNodeIds.filter(Boolean);
  }
  return command.档位.flatMap((segment) => {
    const list = byLevel.get(segment.档位名称) ?? [];
    if (list.length === 0) return [];
    const start = clampRatio(segment.开始位置);
    const end = clampRatio(segment.结束位置);
    return list.filter((_, index) => {
      const ratio = list.length <= 1 ? 0 : index / (list.length - 1);
      return isDmlBoundaryIncluded(ratio, start, end);
    });
  });
}

function applyPatternAssignments(
  assignments: Map<string, DML值>,
  items: DmlCompiledItem[],
  managedLineIds: Set<string>,
  command: DML区域百分比命令 | DML按档位标记命令,
  targetLineIds: string[],
) {
  const pattern = normalizePatternList(command.规律);
  if (pattern.length === 0) return;

  targetLineIds.forEach((lineNodeId, slotIndex) => {
    const 值 = pattern[slotIndex % pattern.length];
    assignments.set(lineNodeId, 值);
    managedLineIds.add(lineNodeId);
    items.push({
      lineNodeId,
      值,
      来源命令id: command.id,
      来源类型: command.type,
      slotIndex,
    });
  });
}

export function compileDmlRules(data: DmlCompilableData): DmlCompileResult {
  const assignments = new Map<string, DML值>();
  const managedLineIds = new Set<string>();
  const items: DmlCompiledItem[] = [];
  const rules = data.自定义数据.DML规则?.命令列表 ?? [];
  const regionLinesByName = collectOrderedRegionLines(data);
  const levelLineIdsByName = collectLevelLineIds(data);

  rules.forEach((command) => {
    if (command.type === "区域百分比") {
      applyPatternAssignments(
        assignments,
        items,
        managedLineIds,
        command,
        collectRegionCommandTargets(command, regionLinesByName),
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
      );
      return;
    }

    command.标记.forEach((item) => {
      if (!item.nodeId) return;
      assignments.set(item.nodeId, item.值);
      managedLineIds.add(item.nodeId);
      items.push({
        lineNodeId: item.nodeId,
        值: item.值,
        来源命令id: command.id,
        来源类型: command.type,
      });
    });
  });

  return { assignments, managedLineIds, items };
}
