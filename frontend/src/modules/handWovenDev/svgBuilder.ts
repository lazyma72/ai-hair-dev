import type {
  手织图,
  手织图比例项,
  手织图比例键,
  手织图比值,
} from "../../shared/models/手织图";
import {
  格式化厘米文本,
  格式化最多一位小数,
} from "../../shared/models/数字格式化";

type 手织图间色比例类型 =
  | {
      type: "横排";
      比值: 手织图比值;
    }
  | {
      type: "方形";
      比值: 手织图比值;
      边长: number;
    }
  | {
      type: "特殊";
    };

type 手织图预览输入 = {
  svg?: string;
  间色比例?: 手织图间色比例类型;
};

type 可生成类型 = Extract<手织图间色比例类型, { type: "横排" | "方形" }>;

type 预览区块 = {
  width: number;
  height: number;
  body: string;
};

export function createEmpty手织图(): 手织图 {
  return {
    json: "",
    间色比例: {
      type: "特殊",
    },
  } as unknown as 手织图;
}

function normalize比值(raw: unknown): 手织图比值 {
  const source = (raw ?? {}) as Partial<
    Record<手织图比例键, Partial<手织图比例项>>
  >;
  const normalizeItem = (
    item: Partial<手织图比例项> | undefined,
    sort: number,
    fallbackValue: number,
  ): 手织图比例项 => ({
    值:
      typeof item?.值 === "number" && Number.isFinite(item.值)
        ? item.值
        : fallbackValue,
    是否染色: Boolean(item?.是否染色),
    remark: typeof item?.remark === "string" ? item.remark : "",
    sort:
      typeof item?.sort === "number" &&
      Number.isFinite(item.sort) &&
      item.sort > 0
        ? Math.floor(item.sort)
        : sort,
  });

  return {
    D: normalizeItem(source.D, 1, 1),
    M: source.M == null ? undefined : normalizeItem(source.M, 2, 2),
    L: source.L == null ? undefined : normalizeItem(source.L, 3, 1),
  };
}

function normalize间色比例(
  input: 手织图预览输入 | 手织图间色比例类型 | null | undefined,
): 手织图间色比例类型 {
  const raw = input && "间色比例" in input ? input.间色比例 : input;
  if (!raw || typeof raw !== "object") {
    return { type: "特殊" };
  }

  const type = (raw as { type?: unknown }).type;
  if (type === "横排") {
    return {
      type: "横排",
      比值: normalize比值((raw as { 比值?: unknown }).比值),
    };
  }

  if (type === "方形") {
    const 边长 = (raw as { 边长?: unknown }).边长;
    return {
      type: "方形",
      比值: normalize比值((raw as { 比值?: unknown }).比值),
      边长:
        typeof 边长 === "number" && Number.isFinite(边长) && 边长 > 0
          ? 边长
          : 1,
    };
  }

  return { type: "特殊" };
}

function get比值项(
  比值: 手织图比值 | undefined,
  key: 手织图比例键,
): 手织图比例项 | undefined {
  return 比值?.[key];
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
  return 格式化厘米文本(value, 1);
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

function build间色比例标题(type: 可生成类型): string {
  if (type.type === "方形") {
    const 边长文本 = 格式化最多一位小数(type.边长);
    return `间色比例 ${边长文本}*${边长文本} CM`;
  }
  return "间色比例";
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

function build横排预览(type: Extract<可生成类型, { type: "横排" }>): 预览区块 {
  const labels = build横排标签(type);
  const textFontSize = 14;
  const estimateCharWidth = textFontSize * 0.62;
  const contentWidth = Math.max(
    180,
    labels.reduce(
      (max, entry) => Math.max(max, entry.text.length * estimateCharWidth),
      0,
    ),
  );
  const width = Math.max(360, Math.ceil(contentWidth + 120));
  const title = build间色比例标题(type);
  const paddingX = 48;
  const topY = 64;
  const minGap = 32;
  const lineEndX = width - paddingX;
  const textX = paddingX + 12;

  if (labels.length === 0) {
    const height = 160;
    return {
      width,
      height,
      body: `
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="#ffffff" stroke="#e2e8f0" />
  <text x="${width / 2}" y="30" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700">${title}</text>
  <line x1="${paddingX}" y1="${topY}" x2="${lineEndX}" y2="${topY}" stroke="#475569" stroke-width="1.5" />
  <line x1="${paddingX}" y1="${topY + 56}" x2="${lineEndX}" y2="${topY + 56}" stroke="#475569" stroke-width="1.5" />
  <text x="${textX}" y="${topY + 33}" fill="#0f172a" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="14" font-weight="600">请先填写有效比值</text>`,
    };
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
  const height = Math.max(
    180,
    Math.ceil((lineYs[lineYs.length - 1] ?? topY) + 36),
  );

  const lines = lineYs
    .map(
      (y) =>
        `  <line x1="${paddingX}" y1="${y}" x2="${lineEndX}" y2="${y}" stroke="#475569" stroke-width="1.5" />`,
    )
    .join("\n");
  const tspans = labels
    .map((entry, index) => {
      const startY = lineYs[index];
      const endY = lineYs[index + 1];
      const textY = startY + (endY - startY) / 2 + 4;
      return `    <tspan x="${textX}" y="${textY}">${entry.text}</tspan>`;
    })
    .join("\n");

  return {
    width,
    height,
    body: `
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="#ffffff" stroke="#e2e8f0" />
  <text x="${width / 2}" y="30" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700">${title}</text>
${lines}
  <text fill="#0f172a" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="14" font-weight="600">
${tspans}
  </text>`,
  };
}

function rotateRight<T>(list: T[], step: number): T[] {
  if (list.length === 0) return [];
  const normalized = ((step % list.length) + list.length) % list.length;
  if (normalized === 0) return [...list];
  return [...list.slice(-normalized), ...list.slice(0, -normalized)];
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

function build方形预览(type: Extract<可生成类型, { type: "方形" }>): 预览区块 {
  const matrix = build方形行数据(type);
  const cellWidth = 82;
  const cellHeight = 54;
  const paddingX = 32;
  const gridY = 62;
  const gridWidth = matrix.columns * cellWidth;
  const gridHeight = 3 * cellHeight;
  const width = Math.max(280, gridWidth + paddingX * 2);
  const height = gridY + gridHeight + 28;
  const gridX = (width - gridWidth) / 2;
  const title = build间色比例标题(type);

  const verticalLines = Array.from(
    { length: matrix.columns + 1 },
    (_, index) => {
      const x = gridX + index * cellWidth;
      return `  <line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridHeight}" stroke="#94a3b8" />`;
    },
  ).join("\n");

  const horizontalLines = Array.from({ length: 4 }, (_, index) => {
    const y = gridY + index * cellHeight;
    return `  <line x1="${gridX}" y1="${y}" x2="${gridX + gridWidth}" y2="${y}" stroke="#94a3b8" />`;
  }).join("\n");

  const tspans = matrix.rows
    .flatMap((row, rowIndex) =>
      row.map((token, colIndex) => {
        const x = gridX + colIndex * cellWidth + cellWidth / 2;
        const y = gridY + rowIndex * cellHeight + cellHeight / 2 + 4;
        return `    <tspan x="${x}" y="${y}">${token}</tspan>`;
      }),
    )
    .join("\n");

  return {
    width,
    height,
    body: `
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="#ffffff" stroke="#e2e8f0" />
  <text x="${width / 2}" y="30" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700">${title}</text>
  <rect x="${gridX}" y="${gridY}" width="${gridWidth}" height="${gridHeight}" fill="#f8fafc" stroke="#94a3b8" />
${verticalLines}
${horizontalLines}
  <text fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="18" font-weight="700">
${tspans}
  </text>`,
  };
}

export function build手织图间色比例预览Svg(
  input: 手织图预览输入 | 手织图间色比例类型,
): string {
  const 间色比例 = normalize间色比例(input);
  if (间色比例.type === "特殊") return "";

  const block =
    间色比例.type === "横排"
      ? build横排预览(间色比例)
      : build方形预览(间色比例);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${block.width}" height="${block.height}" viewBox="0 0 ${block.width} ${block.height}">
${block.body}
</svg>`;
}

export function get有效排序(data: 手织图): 手织图比例键[] {
  const 间色比例 = normalize间色比例(data as unknown as 手织图预览输入);
  if (间色比例.type === "特殊") return [];
  return get有效比例键列表(间色比例.比值);
}
