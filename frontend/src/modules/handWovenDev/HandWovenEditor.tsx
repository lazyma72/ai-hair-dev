import * as React from "react";
import { message } from "antd";
import FileUploadButton from "../../components/FileUploadButton";
import InlineSvg from "../../components/InlineSvg";
import {
  Field,
  NumInput,
  OneDecimalInput,
  Section,
  TextInput,
  inputCls,
} from "../../pages/admin/add-file/components/ui";
import type {
  手织图,
  手织图比例键,
  手织图类型,
} from "../../shared/models/手织图";
import {
  build手织图间色比例预览Svg,
  createEmpty手织图,
  get有效排序,
} from "./svgBuilder";

const 比例键列表: 手织图比例键[] = ["D", "M", "L"];
const 比例组合列表 = ["D:M", "D:L", "D:M:L"] as const;

type 本地间色比例 =
  | {
      type: "横排";
      比值: {
        D: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
        M?: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
        L?: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
      };
    }
  | {
      type: "方形";
      比值: {
        D: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
        M?: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
        L?: {
          值: number;
          是否染色?: boolean;
          remark?: string;
          sort: number;
        };
      };
      边长: number;
    }
  | {
      type: "特殊";
    };

type 可生成类型 = Extract<本地间色比例, { type: "横排" | "方形" }>;
type 比例组合 = (typeof 比例组合列表)[number];

type 本地手织图 = {
  json: string;
  svg: string;
  间色比例: 本地间色比例;
};

type Props = {
  title?: string;
  description?: string;
  value: 手织图;
  onChange: (v: 手织图) => void;
  fileName?: string | null;
  onFileNameChange?: (name: string | null) => void;
  emptyText?: string;
  showJsonActions?: boolean;
  fullscreen?: boolean;
  embed?: boolean;
  heightClassName?: string;
  showUploader?: boolean;
  svgMode?: "embedded" | "external";
};

function get间色比例(value: 手织图 | 本地手织图): 本地间色比例 {
  const raw = (value as unknown as { 间色比例?: 本地间色比例 }).间色比例;
  if (!raw || typeof raw !== "object") {
    return { type: "特殊" };
  }

  if (raw.type === "横排") {
    return {
      type: "横排",
      比值: raw.比值 ?? {
        D: { 值: 1, remark: "", sort: 1 },
        M: { 值: 2, remark: "", sort: 2 },
        L: { 值: 1, remark: "", sort: 3 },
      },
    };
  }

  if (raw.type === "方形") {
    return {
      type: "方形",
      比值: raw.比值 ?? {
        D: { 值: 1, remark: "", sort: 1 },
        M: { 值: 2, remark: "", sort: 2 },
        L: { 值: 1, remark: "", sort: 3 },
      },
      边长:
        typeof raw.边长 === "number" &&
        Number.isFinite(raw.边长) &&
        raw.边长 > 0
          ? raw.边长
          : 1,
    };
  }

  return { type: "特殊" };
}

function clone生成类型(type: 可生成类型): 可生成类型 {
  if (type.type === "方形") {
    return {
      ...type,
      边长: type.边长,
      比值: {
        D: { ...type.比值.D },
        M: type.比值.M ? { ...type.比值.M } : undefined,
        L: type.比值.L ? { ...type.比值.L } : undefined,
      },
    };
  }
  return {
    ...type,
    比值: {
      D: { ...type.比值.D },
      M: type.比值.M ? { ...type.比值.M } : undefined,
      L: type.比值.L ? { ...type.比值.L } : undefined,
    },
  };
}

function ensure生成类型(data: 本地手织图): 可生成类型 {
  const 间色比例 = get间色比例(data);
  if (间色比例.type !== "特殊") {
    return clone生成类型(间色比例);
  }
  return {
    type: "横排",
    比值: {
      D: { 值: 1, remark: "", sort: 1 },
      M: { 值: 2, remark: "", sort: 2 },
      L: { 值: 1, remark: "", sort: 3 },
    },
  };
}

function create默认比例项(sort: number) {
  return {
    值: 1,
    remark: "",
    是否染色: false,
    sort,
  };
}

function get比例组合(type: 可生成类型): 比例组合 {
  const hasM = Boolean(type.比值.M);
  const hasL = Boolean(type.比值.L);
  if (hasM && hasL) return "D:M:L";
  if (hasL) return "D:L";
  return "D:M";
}

function get组合键列表(combo: 比例组合): 手织图比例键[] {
  if (combo === "D:L") return ["D", "L"];
  if (combo === "D:M:L") return ["D", "M", "L"];
  return ["D", "M"];
}

function apply比例组合(type: 可生成类型, combo: 比例组合): 可生成类型 {
  const keys = get组合键列表(combo);
  const next比值: 可生成类型["比值"] = {
    D: {
      ...(type.比值.D ?? create默认比例项(1)),
      sort: 1,
    },
  };

  if (keys.includes("M")) {
    next比值.M = {
      ...(type.比值.M ?? create默认比例项(keys.indexOf("M") + 1)),
      sort: keys.indexOf("M") + 1,
    };
  }

  if (keys.includes("L")) {
    next比值.L = {
      ...(type.比值.L ?? create默认比例项(keys.indexOf("L") + 1)),
      sort: keys.indexOf("L") + 1,
    };
  }

  return {
    ...type,
    比值: next比值,
  };
}

function move排序(
  type: 可生成类型,
  key: 手织图比例键,
  direction: "up" | "down",
): 可生成类型 {
  const entries = 比例键列表
    .map((itemKey, index) => ({
      key: itemKey,
      item: type.比值[itemKey],
      index,
    }))
    .filter(({ item }) => Boolean(item && item.值 > 0))
    .sort((left, right) => {
      const leftSort = Number(left.item?.sort ?? left.index + 1);
      const rightSort = Number(right.item?.sort ?? right.index + 1);
      if (leftSort !== rightSort) return leftSort - rightSort;
      return left.index - right.index;
    });

  const currentIndex = entries.findIndex((entry) => entry.key === key);
  if (currentIndex < 0) return type;
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= entries.length) return type;

  [entries[currentIndex], entries[targetIndex]] = [
    entries[targetIndex],
    entries[currentIndex],
  ];

  const next比值 = { ...type.比值 };
  entries.forEach((entry, index) => {
    const item = next比值[entry.key];
    if (!item) return;
    next比值[entry.key] = {
      ...item,
      sort: index + 1,
    };
  });

  return {
    ...type,
    比值: next比值,
  };
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function deriveSelectedType(value: 本地手织图): 手织图类型 | "" {
  const 间色比例 = get间色比例(value);
  if (value.svg.trim()) return 间色比例.type;
  return 间色比例.type === "特殊" ? "" : 间色比例.type;
}

export default function HandWovenEditor({
  title = "手织图编辑",
  description = "间色比例与手织图 SVG 分开展示；当前仅支持导入与预览，不支持编辑。",
  value,
  onChange,
  fileName,
  onFileNameChange,
  emptyText: _emptyText = "请先上传一份手织图 SVG 文件。",
  showJsonActions = true,
  fullscreen = false,
  embed = false,
  heightClassName,
  showUploader = true,
  svgMode = "embedded",
}: Props) {
  const normalizedValue = React.useMemo<本地手织图>(
    () => ({
      json: (value as 手织图 & { json?: string })?.json ?? "",
      svg: value?.svg ?? "",
      间色比例: get间色比例(value),
    }),
    [value],
  );
  const [selectedType, setSelectedType] = React.useState<手织图类型 | "">(() =>
    deriveSelectedType(normalizedValue),
  );
  const [data, setData] = React.useState<本地手织图>(() =>
    normalizedValue.svg || normalizedValue.间色比例.type !== "特殊"
      ? normalizedValue
      : (createEmpty手织图() as unknown as 本地手织图),
  );

  React.useEffect(() => {
    setData(
      normalizedValue.svg || normalizedValue.间色比例.type !== "特殊"
        ? normalizedValue
        : (createEmpty手织图() as unknown as 本地手织图),
    );
    setSelectedType((prev) => {
      const derived = deriveSelectedType(normalizedValue);
      if (
        !derived &&
        normalizedValue.间色比例.type === "特殊" &&
        prev === "特殊"
      ) {
        return "特殊";
      }
      return derived;
    });
  }, [normalizedValue]);

  const 当前生成类型 =
    selectedType && data.间色比例.type !== "特殊" ? data.间色比例 : null;
  const 有效排序 = get有效排序(to外部手织图(data));
  const 当前比例组合 = 当前生成类型 ? get比例组合(当前生成类型) : "D:M:L";
  const 当前组合键列表 = 当前生成类型 ? get组合键列表(当前比例组合) : [];
  const hasLoadedSvg = Boolean(data.svg.trim());
  const 间色比例预览Svg = React.useMemo(
    () => build手织图间色比例预览Svg(data),
    [data],
  );

  function to外部手织图(nextData: 本地手织图): 手织图 {
    return nextData as unknown as 手织图;
  }

  function commit(nextData: 本地手织图) {
    setData(nextData);
    onChange(to外部手织图(nextData));
  }

  function syncSvg(nextSvg: string, options?: { silent?: boolean }) {
    commit({
      ...data,
      json: data.json,
      svg: nextSvg,
    });
    if (!options?.silent) {
      message.success("已更新手织图 SVG");
    }
  }

  async function importSvgFile(file: File) {
    try {
      const nextSvg = await file.text();
      if (!nextSvg.trim()) {
        message.error("SVG 文件内容为空");
        return;
      }
      syncSvg(nextSvg, { silent: true });
      onFileNameChange?.(file.name);
      message.success("已导入手织图 SVG");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "导入手织图 SVG 失败";
      message.error(errorMessage);
    }
  }

  function update间色比例(mutator: (draft: 可生成类型) => 可生成类型) {
    const next类型 = mutator(ensure生成类型(data));
    commit({
      ...data,
      间色比例: next类型,
    });
  }

  function change类型(nextType: 手织图类型) {
    setSelectedType(nextType);

    if (nextType === "特殊") {
      commit({
        ...data,
        间色比例: { type: "特殊" },
      });
      return;
    }

    const base = ensure生成类型(data);
    commit({
      ...data,
      间色比例:
        nextType === "横排"
          ? {
              type: "横排",
              比值: base.比值,
            }
          : {
              type: "方形",
              比值: base.比值,
              边长: base.type === "方形" && base.边长 > 0 ? base.边长 : 1,
            },
    });
  }

  const content = (
    <section
      className={
        embed
          ? "rounded-xl border border-slate-200 bg-white"
          : fullscreen
            ? "rounded-xl border border-slate-100 bg-slate-50 p-5"
            : "rounded-xl border border-slate-100 bg-slate-50 p-5"
      }
    >
      {!embed ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <div className="mt-1 text-xs text-slate-500">{description}</div>
          </div>
          {showJsonActions ? (
            <details className="shrink-0">
              <summary className="cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                JSON 操作
              </summary>
              <div className="mt-2 flex min-w-[140px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        JSON.stringify(data, null, 2),
                      );
                      message.success("已复制 JSON");
                    } catch {
                      message.error("复制失败");
                    }
                  }}
                >
                  复制 JSON
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={() => {
                    downloadTextFile(
                      "hand-woven.json",
                      JSON.stringify(data, null, 2),
                      "application/json;charset=utf-8",
                    );
                  }}
                >
                  下载 JSON
                </button>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <Section title="间色比例">
          <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Field label="手织图类型">
                <select
                  className={inputCls}
                  value={selectedType}
                  onChange={(e) => {
                    const nextType = e.target.value as 手织图类型 | "";
                    if (!nextType) {
                      setSelectedType("");
                      commit({
                        ...data,
                        间色比例: { type: "特殊" },
                      });
                      return;
                    }
                    change类型(nextType);
                  }}
                >
                  <option value="">请选择类型</option>
                  <option value="横排">横排</option>
                  <option value="方形">方形</option>
                  <option value="特殊">特殊</option>
                </select>
              </Field>

              {!selectedType ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600">
                  请先选择手织图类型，再填写间色比例参数。
                </div>
              ) : 当前生成类型 ? (
                <>
                  {当前生成类型.type === "方形" ? (
                    <Field label="边长 (cm)">
                      <NumInput
                        value={当前生成类型.边长}
                        step="0.1"
                        onChange={(nextValue) =>
                          update间色比例((draft) =>
                            draft.type === "方形"
                              ? {
                                  ...draft,
                                  边长: nextValue > 0 ? nextValue : 1,
                                }
                              : draft,
                          )
                        }
                      />
                    </Field>
                  ) : null}

                  <Field label="比例组合">
                    <select
                      className={inputCls}
                      value={当前比例组合}
                      onChange={(e) =>
                        update间色比例((draft) =>
                          apply比例组合(draft, e.target.value as 比例组合),
                        )
                      }
                    >
                      {比例组合列表.map((combo) => (
                        <option key={combo} value={combo}>
                          {combo}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid gap-1.5">
                    {当前组合键列表.map((key) => {
                      const item = 当前生成类型.比值[key] ?? {
                        值: 0,
                        remark: "",
                        是否染色: false,
                        sort: 比例键列表.indexOf(key) + 1,
                      };
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-slate-900">
                              {key}
                            </div>
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <input
                                type="checkbox"
                                checked={Boolean(item.是否染色)}
                                onChange={(e) =>
                                  update间色比例((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        是否染色: e.target.checked,
                                      },
                                    },
                                  }))
                                }
                              />
                              染色后显示 {key}T
                            </label>
                          </div>

                          <div className="grid gap-1.5">
                            <Field label="比值">
                              <OneDecimalInput
                                value={item.值}
                                onChange={(nextValue) =>
                                  update间色比例((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        值: nextValue,
                                      },
                                    },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="备注">
                              <TextInput
                                value={item.remark ?? ""}
                                onChange={(remark) =>
                                  update间色比例((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        remark,
                                      },
                                    },
                                  }))
                                }
                                placeholder="可留空"
                              />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-700">
                      排序（值大于 0 的项会参与预览）
                    </div>
                    <div className="space-y-1">
                      {有效排序.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded border border-slate-200 px-2 py-1"
                        >
                          <div className="text-xs text-slate-700">
                            {index + 1}. {key}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                              onClick={() =>
                                update间色比例((draft) =>
                                  move排序(draft, key, "up"),
                                )
                              }
                            >
                              上移
                            </button>
                            <button
                              type="button"
                              className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                              onClick={() =>
                                update间色比例((draft) =>
                                  move排序(draft, key, "down"),
                                )
                              }
                            >
                              下移
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5">
                  <div className="text-xs text-slate-700">
                    特殊模式不生成间色比例预览，只维护手织图 SVG。
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-600">
                  预览效果
                </div>
                {间色比例预览Svg ? (
                  <button
                    type="button"
                    className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    onClick={() =>
                      downloadTextFile(
                        "hand-woven-ratio-preview.svg",
                        间色比例预览Svg,
                        "image/svg+xml",
                      )
                    }
                  >
                    下载预览 SVG
                  </button>
                ) : null}
              </div>

              {间色比例预览Svg ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                  <InlineSvg
                    svg={间色比例预览Svg}
                    className="min-h-[220px] w-full overflow-auto bg-white"
                    height="auto"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  {selectedType === "特殊"
                    ? "当前为特殊模式，不展示间色比例预览。"
                    : "请先选择类型并填写有效的间色比例参数。"}
                </div>
              )}
            </div>
          </div>
        </Section>

        {svgMode === "embedded" ? (
          <Section
            title="手织图 SVG"
            action={
              <div className="flex items-center gap-2">
                {showUploader ? (
                  <FileUploadButton
                    text={hasLoadedSvg ? "重新导入 SVG" : "导入 SVG"}
                    accept=".svg,image/svg+xml"
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    onSelect={(file) => {
                      void importSvgFile(file);
                    }}
                  />
                ) : null}
                <span className="text-xs text-slate-500">
                  当前仅支持导入与预览，不支持在线编辑
                </span>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  {fileName
                    ? `当前 SVG：${fileName}`
                    : hasLoadedSvg
                      ? "当前 SVG：已导入"
                      : _emptyText}
                </div>
                {hasLoadedSvg ? (
                  <button
                    type="button"
                    className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    onClick={() =>
                      downloadTextFile("hand-woven.svg", data.svg, "image/svg+xml")
                    }
                  >
                    下载当前 SVG
                  </button>
                ) : null}
              </div>

              {hasLoadedSvg ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                  <InlineSvg
                    svg={data.svg}
                    className="w-full overflow-auto bg-white"
                    height="auto"
                  />
                </div>
              ) : (
                <div
                  className={`rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 ${
                    embed
                      ? (heightClassName ?? "min-h-[320px]")
                      : "min-h-[360px]"
                  }`}
                >
                  {_emptyText}
                </div>
              )}
            </div>
          </Section>
        ) : null}
      </div>
    </section>
  );

  if (embed) {
    return content;
  }

  return fullscreen ? (
    content
  ) : (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        {description}
      </div>
      {content}
    </>
  );
}
