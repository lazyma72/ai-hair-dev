import * as React from "react";
import { message } from "antd";
import { useMemo } from "react";
import InlineSvg from "../../../../components/InlineSvg";
import type { 染色档位 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import {
  对折染色档位,
  普通染色档位,
  错位染色档位,
} from "../../../../shared/models/染色档位示例";
import { Field, NumInput, inputCls } from "./ui";

type SvgTextUpdateOptions = {
  /** 默认只替换第一个 tspan（保留模板里其它文字，比如“档”）。 */
  replaceAllTspans?: boolean;
  /** 多行文本：会清空并重建 tspans。 */
  lines?: string[]; /** 指定字体大小（px），会同步更新 text 元素和所有 tspan 的 font-size。 */
  fontSize?: number;
};

function updateSvgTextNode(
  svg: string,
  nodeId: string,
  text: string,
  options?: SvgTextUpdateOptions,
): string {
  if (!svg || !nodeId) return svg;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");

    // 避免 SVG 内部负坐标文本被裁剪
    doc.documentElement.setAttribute("overflow", "visible");

    const el = doc.getElementById(nodeId);
    if (!el) return svg;

    const tspans = Array.from(el.querySelectorAll("tspan"));
    const lines = options?.lines?.map((s) => s.trim()).filter(Boolean);
    const fontSize = options?.fontSize;
    if (fontSize) {
      el.setAttribute("font-size", `${fontSize}px`);
    }

    if (lines && lines.length > 0) {
      const ns = "http://www.w3.org/2000/svg";
      const baseX =
        tspans[0]?.getAttribute("x") ?? el.getAttribute("x") ?? undefined;

      // 清空原有内容（避免原模板文字残留）
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      lines.forEach((line, i) => {
        const tspan = doc.createElementNS(ns, "tspan");
        if (baseX) tspan.setAttribute("x", baseX);
        if (i > 0) tspan.setAttribute("dy", "1.2em");
        if (fontSize) tspan.setAttribute("font-size", `${fontSize}px`);
        tspan.textContent = line;
        el.appendChild(tspan);
      });

      return new XMLSerializer().serializeToString(doc);
    }

    if (tspans.length > 0) {
      if (options?.replaceAllTspans) {
        tspans.forEach((t) => {
          t.textContent = text;
          if (fontSize) t.setAttribute("font-size", `${fontSize}px`);
        });
      } else {
        tspans[0].textContent = text;
        if (fontSize) tspans[0].setAttribute("font-size", `${fontSize}px`);
      }
    } else {
      el.textContent = text;
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

function format档位文字(list: string[]): string {
  // 规则：保留 H 档位（如 H1/H2），避免被误格式化成 1/2 导致展示重复。
  const normalized = list
    .map((s) => s.replace(/档$/, ""))
    .map((s) => s.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(normalized));
  return unique.join(",") || "?";
}

function build档位行(list: string[], maxPerLine = 3, maxRows = 2): string[] {
  const normalized = list
    .map((s) => s.replace(/档$/, ""))
    .map((s) => s.trim())
    .filter(Boolean);

  const tokens = Array.from(new Set(normalized));
  if (tokens.length === 0) return ["?"];

  const hSlots = tokens.filter((t) => /^H\d+$/i.test(t));
  const normalSlots = tokens.filter((t) => !/^H\d+$/i.test(t));

  const lines: string[] = [];
  const pushChunks = (arr: string[]) => {
    for (let i = 0; i < arr.length; i += maxPerLine) {
      lines.push(arr.slice(i, i + maxPerLine).join(","));
    }
  };

  if (normalSlots.length) pushChunks(normalSlots);
  if (hSlots.length) pushChunks(hSlots);

  // 超出 maxRows 行时，把尾部合并到最后一行
  if (lines.length > maxRows) {
    const head = lines.slice(0, maxRows - 1);
    const tail = lines.slice(maxRows - 1).join(",");
    return [...head, tail];
  }

  return lines;
}

/** 根据档位数量自动计算最佳字号和行布局，避免文字与图形重叠。 */
function compute档位字体配置(count: number): {
  fontSize: number;
  maxPerLine: number;
  maxRows: number;
} {
  if (count <= 3) return { fontSize: 18, maxPerLine: 3, maxRows: 1 };
  if (count <= 6) return { fontSize: 15, maxPerLine: 3, maxRows: 2 };
  if (count <= 9) return { fontSize: 12, maxPerLine: 3, maxRows: 3 };
  return { fontSize: 10, maxPerLine: 4, maxRows: 3 };
}

type InchFraction = "¼" | "½" | "¾" | "";

export function formatInch(n: number): string {
  const rounded = Math.round(n * 4) / 4;
  const intPart = Math.floor(rounded);
  const frac = rounded - intPart;

  const fracStr: InchFraction =
    frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";

  if (fracStr) {
    return intPart === 0 ? fracStr : `${intPart}${fracStr}`;
  }

  return String(intPart);
}

export function formatInchText(n: number): string {
  return `${formatInch(n)}"`;
}

export function buildPreviewSvg(item: 染色档位): string {
  let svg = item.染色图.svg;

  const slotCount = item.染色图.档位标注.档位列表.length;
  const { fontSize, maxPerLine, maxRows } = compute档位字体配置(slotCount);
  const slotLines = build档位行(
    item.染色图.档位标注.档位列表,
    maxPerLine,
    maxRows,
  );
  const slotText = format档位文字(item.染色图.档位标注.档位列表);
  svg = updateSvgTextNode(svg, item.染色图.档位标注.textNodeId, slotText, {
    lines: slotLines,
    fontSize,
  });

  svg = updateSvgTextNode(
    svg,
    item.染色图.染色尺寸标注.textNodeId,
    formatInchText(item.染色图.染色尺寸标注.尺寸),
  );

  if (item.type === "错位") {
    svg = updateSvgTextNode(
      svg,
      item.染色图.长尺寸标注.textNodeId,
      formatInchText(item.染色图.长尺寸标注.尺寸),
    );
    if (item.染色图.短尺寸标注) {
      svg = updateSvgTextNode(
        svg,
        item.染色图.短尺寸标注.textNodeId,
        formatInchText(item.染色图.短尺寸标注.尺寸),
      );
    }
  }

  return svg;
}

const 染色示例列表 = [普通染色档位, 对折染色档位, 错位染色档位] as const;

function get染色示例(type: 染色档位["type"]): 染色档位 {
  return 染色示例列表.find((d) => d.type === type) ?? 染色示例列表[0];
}

function get错位染色示例() {
  return get染色示例("错位") as Extract<染色档位, { type: "错位" }>;
}

export function clone染色档位示例(type: 染色档位["type"]): 染色档位 {
  const cloned = structuredClone(get染色示例(type));
  cloned.染色图.档位标注.档位列表 = [];
  return cloned;
}

function normalizeSlotName(s: string): string {
  return s.trim();
}

export function validate染色档位列表(
  list: 染色档位[],
): { ok: true } | { ok: false; message: string } {
  // 规则：
  // - 每张染色图可以选择多个档位（多选）
  // - 但一个档位最多只能被一张染色图选择（全局唯一）
  const used = new Map<string, number>();

  for (const item of list) {
    const slots = item.染色图.档位标注.档位列表;
    const normalized = slots.map(normalizeSlotName).filter(Boolean);
    const unique = Array.from(new Set(normalized));

    if (unique.length < 1) {
      return {
        ok: false,
        message:
          "每张染色图至少选择一个适用档位（且一个档位最多对应一张染色图）",
      };
    }

    for (const slot of unique) {
      used.set(slot, (used.get(slot) ?? 0) + 1);
    }
  }

  for (const [slot, count] of used) {
    if (count > 1) {
      return { ok: false, message: `档位 ${slot} 被多个染色图选择，请调整` };
    }
  }

  return { ok: true };
}

export function DyeLevelEditor({
  value,
  onChange,
  全部档位名,
  已占用档位 = [],
}: {
  value: 染色档位;
  onChange: (v: 染色档位) => void;
  全部档位名: string[];
  已占用档位?: string[];
}) {
  const previewSvg = useMemo(() => buildPreviewSvg(value), [value]);

  const occupied = useMemo(
    () => 已占用档位.map(normalizeSlotName).filter(Boolean),
    [已占用档位],
  );

  const selected = useMemo(
    () => value.染色图.档位标注.档位列表.map(normalizeSlotName).filter(Boolean),
    [value.染色图.档位标注.档位列表],
  );

  function changeType(type: 染色档位["type"]) {
    const template = clone染色档位示例(type);

    template.染色图.档位标注 = {
      ...template.染色图.档位标注,
      档位列表: selected,
    };
    template.染色图.染色尺寸标注 = {
      ...template.染色图.染色尺寸标注,
      尺寸: value.染色图.染色尺寸标注.尺寸,
    };
    template.染色图.文本替换 = value.染色图.文本替换;

    if (template.type === "错位") {
      template.染色图.长尺寸标注 = {
        ...template.染色图.长尺寸标注,
        尺寸:
          value.type === "错位"
            ? value.染色图.长尺寸标注.尺寸
            : template.染色图.长尺寸标注.尺寸,
      };

      if (template.染色图.短尺寸标注) {
        template.染色图.短尺寸标注 = {
          ...template.染色图.短尺寸标注,
          尺寸:
            value.type === "错位"
              ? (value.染色图.短尺寸标注?.尺寸 ??
                template.染色图.短尺寸标注.尺寸)
              : template.染色图.短尺寸标注.尺寸,
        };
      }
    }

    onChange(template);
  }

  function setSlots(next: string[]) {
    const newDs = { ...value.染色图.档位标注, 档位列表: next };
    if (value.type === "错位") {
      onChange({ type: "错位", 染色图: { ...value.染色图, 档位标注: newDs } });
    } else {
      onChange({
        type: value.type,
        染色图: { ...value.染色图, 档位标注: newDs },
      });
    }
  }

  function toggleArchive(name: string) {
    const 名 = normalizeSlotName(name);
    if (!名) return;

    if (selected.includes(名)) {
      setSlots(selected.filter((d) => d !== 名));
      return;
    }

    if (occupied.includes(名)) {
      message.error(`档位 ${名} 已绑定其他染色图，请先取消冲突项`);
      return;
    }

    setSlots(Array.from(new Set([...selected, 名])));
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-24">
          <Field label="类型">
            <select
              className={inputCls}
              value={value.type}
              onChange={(e) => changeType(e.target.value as 染色档位["type"])}
            >
              <option value="普通">普通</option>
              <option value="对折">对折</option>
              <option value="错位">错位</option>
            </select>
          </Field>
        </div>

        <div className="w-24">
          <Field label="尺寸 (寸)">
            <NumInput
              value={value.染色图.染色尺寸标注.尺寸}
              onChange={(n) => {
                const normalized = Math.round(n * 4) / 4;
                if (value.type === "错位") {
                  onChange({
                    type: "错位",
                    染色图: {
                      ...value.染色图,
                      染色尺寸标注: {
                        ...value.染色图.染色尺寸标注,
                        尺寸: normalized,
                      },
                    },
                  });
                } else {
                  onChange({
                    type: value.type,
                    染色图: {
                      ...value.染色图,
                      染色尺寸标注: {
                        ...value.染色图.染色尺寸标注,
                        尺寸: normalized,
                      },
                    },
                  });
                }
              }}
              step="0.25"
            />
          </Field>
        </div>

        {value.type === "错位" ? (
          <>
            <div className="w-24">
              <Field label="长尺寸 (寸)">
                <NumInput
                  value={value.染色图.长尺寸标注.尺寸}
                  onChange={(n) => {
                    const normalized = Math.round(n * 4) / 4;
                    if (value.type !== "错位") return;
                    onChange({
                      type: "错位",
                      染色图: {
                        ...value.染色图,
                        长尺寸标注: {
                          ...value.染色图.长尺寸标注,
                          尺寸: normalized,
                        },
                      },
                    });
                  }}
                  step="0.25"
                />
              </Field>
            </div>
            <div className="w-24">
              <Field label="短尺寸 (寸)">
                <NumInput
                  value={value.染色图.短尺寸标注?.尺寸 ?? 0}
                  onChange={(n) => {
                    const normalized = Math.round(n * 4) / 4;
                    if (value.type !== "错位") return;
                    onChange({
                      type: "错位",
                      染色图: {
                        ...value.染色图,
                        短尺寸标注: {
                          textNodeId:
                            value.染色图.短尺寸标注?.textNodeId ??
                            get错位染色示例().染色图.短尺寸标注?.textNodeId ??
                            "",
                          尺寸: normalized,
                        },
                      },
                    });
                  }}
                  step="0.25"
                />
              </Field>
            </div>
          </>
        ) : null}
      </div>

      {全部档位名.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">
            适用档位
          </p>
          <div className="flex flex-wrap gap-2">
            {全部档位名.map((rawName) => {
              const 名 = normalizeSlotName(rawName);
              const checked = selected.includes(名);
              const disabled = !checked && occupied.includes(名);

              return (
                <button
                  key={名}
                  type="button"
                  disabled={disabled}
                  className={
                    checked
                      ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                      : disabled
                        ? "cursor-not-allowed rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-400"
                        : "rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }
                  onClick={() => toggleArchive(名)}
                >
                  {名}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            提示：可多选，但一个档位最多对应一张染色图。
          </p>
        </div>
      ) : null}

      {previewSvg ? (
        <div className="overflow-x-auto rounded border border-slate-100 bg-white p-3">
          <InlineSvg svg={previewSvg} className="max-w-full" height="auto" />
        </div>
      ) : null}
    </div>
  );
}
