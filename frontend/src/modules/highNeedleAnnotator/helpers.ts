import type { DmlValue, 高针图, 高针图系统预置区域 } from "./types";

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

export function makeDmlMap(list: 高针图["自定义数据"]["DML标注"]): Map<string, DmlValue> {
  const map = new Map<string, DmlValue>();
  for (const r of list) {
    const v = (r.标注DML ?? "").trim() as DmlValue;
    map.set(r.lineNodeId, v);
  }
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
