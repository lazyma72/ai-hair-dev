import type { DmlValue, 高针图, 高针图系统预置区域 } from "./types";
import { compileDmlRules } from "./dmlAuto";

export function normalizeLabel(s: string): string {
  return s.trim();
}

export function normalizeSlotToken(s: string): string {
  return s.replace(/档$/, "").trim();
}

export function uniquePreserveOrder(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const k = x.trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

type SortableLineItem = {
  lineNodeId?: string;
  sort?: number;
};

export function buildLineIdsBySortOrder(items: SortableLineItem[]): string[] {
  const normalized = items
    .map((item, index) => {
      const lineNodeId = String(item.lineNodeId ?? "").trim();
      const rawSort =
        typeof item.sort === "number" ? item.sort : Number(item.sort);
      const sort =
        Number.isFinite(rawSort) && rawSort > 0 ? Math.floor(rawSort) : index + 1;
      return {
        lineNodeId,
        sort,
        index,
      };
    })
    .filter((item) => item.lineNodeId)
    .sort((left, right) => left.sort - right.sort || left.index - right.index);

  return uniquePreserveOrder(normalized.map((item) => item.lineNodeId));
}

export function orderLineIdsByReferenceOrder(
  rawLineIds: string[],
  referenceLineIds: readonly string[],
): string[] {
  const normalized = uniquePreserveOrder(rawLineIds);
  if (normalized.length === 0) return [];

  const selected = new Set(normalized);
  const ordered: string[] = [];

  referenceLineIds.forEach((lineId) => {
    const normalizedId = String(lineId ?? "").trim();
    if (!normalizedId || !selected.has(normalizedId)) return;
    ordered.push(normalizedId);
    selected.delete(normalizedId);
  });

  normalized.forEach((lineId) => {
    if (!selected.has(lineId)) return;
    ordered.push(lineId);
    selected.delete(lineId);
  });

  return ordered;
}

export function getMaxNodeNumber(lineIds: string[]): number {
  let max = 0;
  for (const id of lineIds) {
    const m = /^node(\d+)$/.exec(id.trim());
    if (!m) continue;
    max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function buildSlotLines(tokens: string[]): string[] {
  const cleaned = uniquePreserveOrder(tokens.map(normalizeSlotToken));
  if (cleaned.length === 0) return ["?"];

  const h = cleaned.filter((t) => /^H\d+$/i.test(t));
  const normal = cleaned.filter((t) => !/^H\d+$/i.test(t));

  const lines: string[] = [];
  const pushChunks = (arr: string[]) => {
    const maxPerLine = 3;
    for (let i = 0; i < arr.length; i += maxPerLine) {
      lines.push(arr.slice(i, i + maxPerLine).join(","));
    }
  };

  if (normal.length) pushChunks(normal);
  if (h.length) pushChunks(h);

  if (lines.length > 2) {
    const head = lines.slice(0, 1);
    const tail = lines.slice(1).join(",");
    return [...head, tail];
  }

  return lines;
}

export function makeDmlMap(data: 高针图): Map<string, DmlValue> {
  const compiled = compileDmlRules(data);
  const map = new Map<string, DmlValue>();
  compiled.assignments.forEach((value, key) => {
    map.set(key, value);
  });
  return map;
}

export function makeDoubleSet(
  list: 高针图["自定义数据"]["单双标注"],
): Set<string> {
  return new Set(list.filter((d) => d.双数).map((d) => d.lineNodeId));
}

export type RegionDraft = {
  name: string;
  lineLength: number;
};

export function normalizeRegionDraft(
  draft: RegionDraft,
  fallbacks: 高针图系统预置区域[],
): RegionDraft {
  const name = normalizeLabel(draft.name);
  const preset = fallbacks.find((r) => r.name === name);
  return {
    name,
    lineLength: Number.isFinite(draft.lineLength)
      ? draft.lineLength
      : preset?.lineLength ?? 0,
  };
}
