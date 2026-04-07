import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import type {
  DML重量,
  制品规格书,
  裁断重量项,
  染色档位,
  沐茵丝假发成品稿,
} from "../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 胶丝比例ListItem } from "../../shared/frontend/model/model";
import {
  普通染色档位,
  对折染色档位,
  错位染色档位,
} from "../../shared/models/染色档位示例";

// ── 初始值 ─────────────────────────────────────────────

const empty机器档位 = (): 制品规格书["机器规格清单"][number] =>
  ({
    档位: "",
    裁断与重量: [],
    整毛: { 拉尖: 0 },
    双针: { 毛长: 0, 尺数: { D: 0 }, 密度: 0 },
    美容: { 铝管: 0, 方向: "", 层数: 0 },
  }) as 制品规格书["机器规格清单"][number];

const empty人工档位 = (): 制品规格书["人工规格清单"][number] => ({
  档位: "",
  裁断与重量: [],
  整毛: { 拉尖: 0 },
  双针: { 毛长: 0, 磅发: 0 },
  美容: { 铝管: 0 },
});

const empty工艺说明 = (): 制品规格书["工艺说明"][number] => ({
  作业方法: "",
  整毛: "",
  双针: "",
  美容: "",
  制帽: "",
  手织: "",
  高针: "",
  完成: "",
  包装: "",
});

const emptyFile = (): 沐茵丝假发成品稿 => ({
  _id: "",
  假发类型: 假发类型.纯色,
  客户编号: "",
  品名: "",
  原材料: "",
  CAP: "",
  头型图片: [],
  染色档位列表: [],
  制品规格书: {
    机器规格清单: [],
    人工规格清单: [],
    胶丝比例id: { 颜色编号: "", 发丝种类: "" },
    制帽: { 帽围: 0, 帽深: 0, 前后: 0, 唛头: "", 号码: "" },
    工艺说明: [],
    工程重量: {},
  },
  高针指示单: {
    注意事项: "",
    高针图: {
      底图: {
        svg: "",
        区域名: [],
        区域线条: [],
        区域DML标注: [],
        文本替换: {},
      },
      自定义数据: { DML标注: [], 文本替换: {} },
    },
  },
  手织指示单: {
    尺寸: 0,
    注意事项: "",
    手织图: { svg: "" },
  },
});

// ── 共用样式 ───────────────────────────────────────────

const inputCls =
  "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";
const numInputCls =
  "w-full rounded border border-slate-200 px-1.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";

// ── 共用小组件 ─────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  step = "0.01",
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const fmt = (n: number) =>
    step === "1" ? String(Math.round(n)) : n.toFixed(2);
  const [raw, setRaw] = useState(fmt(value));

  useEffect(() => {
    if (parseFloat(raw) !== value) setRaw(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      step={step}
      placeholder={placeholder ?? "0"}
      disabled={disabled}
      className={`${numInputCls}${disabled ? " opacity-40 cursor-not-allowed" : ""}`}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? 0 : n);
      }}
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function AddBtn({
  label = "+ 添加",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
      onClick={onClick}
    >
      删除
    </button>
  );
}

// ── 裁断与重量 ─────────────────────────────────────────

function 裁断重量编辑器({
  value,
  onChange,
}: {
  value: 裁断重量项[];
  onChange: (v: 裁断重量项[]) => void;
}) {
  function update(i: number, patch: Partial<裁断重量项>) {
    onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function updateDML(i: number, patch: Partial<DML重量>) {
    const prev = value[i].重量g ?? { D: 0 };
    update(i, { 重量g: { ...prev, ...patch } });
  }
  return (
    <div className="space-y-1">
      {value.length > 0 && (
        <div className="grid grid-cols-[55px_60px_60px_60px_auto] gap-1.5 px-1">
          {["裁断", "D(g)", "M(g)", "L(g)", ""].map((h) => (
            <div key={h} className="text-[10px] font-medium text-slate-400">
              {h}
            </div>
          ))}
        </div>
      )}
      {value.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[55px_60px_60px_60px_auto] items-center gap-1.5"
        >
          <NumInput
            value={row.裁断}
            onChange={(n) => update(i, { 裁断: n })}
            step="1"
          />
          {(["D", "M", "L"] as const).map((k) => (
            <NumInput
              key={k}
              value={row.重量g?.[k] ?? 0}
              onChange={(n) => updateDML(i, { [k]: n || undefined })}
            />
          ))}
          <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn
        label="+ 裁断行"
        onClick={() => onChange([...value, { 裁断: 0, 重量g: { D: 0 } }])}
      />
    </div>
  );
}

// ── 机器规格档位 ───────────────────────────────────────

type 机器档位 = 制品规格书["机器规格清单"][number];

function 机器档位编辑器({
  value,
  onChange,
  是间色,
}: {
  value: 机器档位;
  onChange: (v: 机器档位) => void;
  是间色: boolean;
}) {
  function p<K extends keyof 机器档位>(key: K, val: 机器档位[K]) {
    onChange({ ...value, [key]: val });
  }
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      {/* 档位 + DML比值（仅间色） */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-20">
          <Field label="档位 *">
            <TextInput
              value={value.档位}
              onChange={(v) => p("档位", v)}
              placeholder="1"
            />
          </Field>
        </div>
        {是间色 && (
          <>
            {(["D", "M", "L"] as const).map((k) => (
              <div key={k} className="w-20">
                <Field label={`DML·${k}${k === "D" ? " *" : ""}`}>
                  <NumInput
                    value={value.DML比值?.[k] ?? 0}
                    onChange={(n) =>
                      p("DML比值", {
                        D: value.DML比值?.D ?? 0,
                        ...value.DML比值,
                        [k]: n || undefined,
                      })
                    }
                  />
                </Field>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 裁断与重量 */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">
          裁断与重量
        </p>
        <裁断重量编辑器
          value={value.裁断与重量}
          onChange={(v) => p("裁断与重量", v)}
        />
      </div>

      {/* 整毛 + 双针 */}
      <div className="grid grid-cols-[65px_65px_65px_65px_65px_65px_65px] gap-2">
        <Field label="整毛·拉尖">
          <NumInput
            value={value.整毛.拉尖}
            onChange={(n) => p("整毛", { ...value.整毛, 拉尖: n })}
          />
        </Field>
        <Field label="整毛·对裁">
          <NumInput
            value={value.整毛.对裁 ?? 0}
            onChange={(n) => p("整毛", { ...value.整毛, 对裁: n || undefined })}
          />
        </Field>
        <Field label="双针·毛长">
          <NumInput
            value={value.双针.毛长}
            onChange={(n) => p("双针", { ...value.双针, 毛长: n })}
          />
        </Field>
        <Field label="双针·密度">
          <NumInput
            value={value.双针.密度}
            onChange={(n) => p("双针", { ...value.双针, 密度: n })}
          />
        </Field>
        {(["D", "M", "L"] as const).map((k) => (
          <Field key={k} label={`尺数·${k}`}>
            <NumInput
              value={value.双针.尺数[k] ?? 0}
              onChange={(n) =>
                p("双针", {
                  ...value.双针,
                  尺数: { ...value.双针.尺数, [k]: n || undefined },
                })
              }
            />
          </Field>
        ))}
      </div>

      {/* 形态 */}
      <Field label="形态">
        <TextInput
          value={value.形态 ?? ""}
          onChange={(v) => p("形态", v || undefined)}
          placeholder="可选"
        />
      </Field>

      {/* 美容 */}
      <div className="grid grid-cols-[65px_1fr_65px] gap-2">
        <Field label="美容·铝管">
          <NumInput
            value={value.美容.铝管}
            onChange={(n) => p("美容", { ...value.美容, 铝管: n })}
          />
        </Field>
        <Field label="美容·方向">
          <TextInput
            value={value.美容.方向}
            onChange={(v) => p("美容", { ...value.美容, 方向: v })}
          />
        </Field>
        <Field label="美容·层数">
          <NumInput
            value={value.美容.层数}
            onChange={(n) => p("美容", { ...value.美容, 层数: n })}
            step="1"
          />
        </Field>
      </div>

      {/* 备注 */}
      <Field label="备注">
        <TextInput
          value={value.备注 ?? ""}
          onChange={(v) => p("备注", v || undefined)}
          placeholder="可选"
        />
      </Field>
    </div>
  );
}

// ── 人工规格档位 ───────────────────────────────────────

type 人工档位 = 制品规格书["人工规格清单"][number];

function 人工档位编辑器({
  value,
  onChange,
}: {
  value: 人工档位;
  onChange: (v: 人工档位) => void;
}) {
  function p<K extends keyof 人工档位>(key: K, val: 人工档位[K]) {
    onChange({ ...value, [key]: val });
  }
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-[1fr_1fr_65px_65px_65px_auto] items-end gap-3">
        <Field label="档位">
          <TextInput
            value={value.档位}
            onChange={(v) => p("档位", v)}
            placeholder="H1"
          />
        </Field>
        <Field label="形态">
          <TextInput
            value={value.形态 ?? ""}
            onChange={(v) => p("形态", v || undefined)}
            placeholder="可选"
          />
        </Field>
        <Field label="双针·毛长">
          <NumInput
            value={value.双针.毛长}
            onChange={(n) => p("双针", { ...value.双针, 毛长: n })}
          />
        </Field>
        <Field label="双针·磅发g">
          <NumInput
            value={value.双针.磅发}
            onChange={(n) => p("双针", { ...value.双针, 磅发: n })}
          />
        </Field>
        <Field label="美容·铝管">
          <NumInput
            value={value.美容.铝管}
            onChange={(n) => p("美容", { ...value.美容, 铝管: n })}
          />
        </Field>
        <Field label="备注">
          <TextInput
            value={value.备注 ?? ""}
            onChange={(v) => p("备注", v || undefined)}
            placeholder="可选"
          />
        </Field>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">
          裁断与重量
        </p>
        <裁断重量编辑器
          value={value.裁断与重量}
          onChange={(v) => p("裁断与重量", v)}
        />
      </div>
      <div className="grid grid-cols-[65px_65px] gap-2">
        <Field label="整毛·拉尖">
          <NumInput
            value={value.整毛.拉尖}
            onChange={(n) => p("整毛", { ...value.整毛, 拉尖: n })}
          />
        </Field>
        <Field label="整毛·对裁">
          <NumInput
            value={value.整毛.对裁 ?? 0}
            onChange={(n) => p("整毛", { ...value.整毛, 对裁: n || undefined })}
          />
        </Field>
      </div>
    </div>
  );
}

// ── 工艺说明 ───────────────────────────────────────────

type 工艺说明项 = 制品规格书["工艺说明"][number];
const 工艺说明Keys = [
  "作业方法",
  "整毛",
  "双针",
  "美容",
  "制帽",
  "手织",
  "高针",
  "完成",
  "包装",
] as const;

function 工艺说明编辑器({
  value,
  onChange,
}: {
  value: 工艺说明项;
  onChange: (v: 工艺说明项) => void;
}) {
  return (
    <div className="grid grid-cols-9 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      {工艺说明Keys.map((k) => (
        <Field key={k} label={k}>
          <input
            type="text"
            className={inputCls}
            value={value[k] ?? ""}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })}
          />
        </Field>
      ))}
    </div>
  );
}

// ── Section 容器 ───────────────────────────────────────

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── SVG 文本节点更新 ───────────────────────────────────

function updateSvgTextNode(svg: string, nodeId: string, text: string): string {
  if (!svg || !nodeId) return svg;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const el = doc.getElementById(nodeId);
    if (!el) return svg;
    const firstTspan = el.querySelector("tspan");
    if (firstTspan) {
      firstTspan.textContent = text;
    } else {
      el.textContent = text;
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

function buildPreviewSvg(item: 染色档位): string {
  let svg = item.染色图.svg;
  const 档位文字 = item.染色图.档位标注.档位列表.join("/") || "?";
  svg = updateSvgTextNode(svg, item.染色图.档位标注.textNodeId, 档位文字);
  svg = updateSvgTextNode(
    svg,
    item.染色图.染色尺寸标注.textNodeId,
    `${item.染色图.染色尺寸标注.尺寸}"`,
  );
  if (item.type === "错位") {
    svg = updateSvgTextNode(
      svg,
      item.染色图.长尺寸标注.textNodeId,
      `${item.染色图.长尺寸标注.尺寸}"`,
    );
    if (item.染色图.短尺寸标注) {
      svg = updateSvgTextNode(
        svg,
        item.染色图.短尺寸标注.textNodeId,
        `${item.染色图.短尺寸标注.尺寸}"`,
      );
    }
  }
  return svg;
}

// 各类型对应的示例 SVG 数据（textNodeId 等从示例中提取）
// 注意：示例文件中的变量名与 type 字段顺序对调，按 type 字段情就映射
const 染色示例 = {
  普通: 对折染色档位, // 对折染色档位.type === "普通"
  对折: 普通染色档位, // 普通染色档位.type === "对折"
  错位: 错位染色档位, // 错位染色档位.type === "错位"
} satisfies Record<染色档位["type"], 染色档位>;

// ── 染色档位编辑器 ──────────────────────────────────────

function 染色档位编辑器({
  value,
  onChange,
  全部档位名,
}: {
  value: 染色档位;
  onChange: (v: 染色档位) => void;
  全部档位名: string[];
}) {
  const previewSvg = useMemo(() => buildPreviewSvg(value), [value]);

  function changeType(type: 染色档位["type"]) {
    const 基 = {
      svg: value.染色图.svg,
      档位标注: value.染色图.档位标注,
      染色尺寸标注: value.染色图.染色尺寸标注,
      文本替换: value.染色图.文本替换,
    };
    if (type === "错位") {
      if (value.type === "错位") {
        onChange({
          type,
          染色图: {
            ...基,
            长尺寸标注: value.染色图.长尺寸标注,
            短尺寸标注:
              value.染色图.短尺寸标注 ?? 染色示例.错位.染色图.短尺寸标注,
          },
        });
      } else {
        onChange({
          type,
          染色图: {
            ...基,
            长尺寸标注: 染色示例.错位.染色图.长尺寸标注,
            短尺寸标注: 染色示例.错位.染色图.短尺寸标注,
          },
        });
      }
    } else {
      onChange({ type: type as "普通" | "对折", 染色图: 基 });
    }
  }

  function toggleArchive(名: string) {
    const 列表 = value.染色图.档位标注.档位列表;
    const next = 列表.includes(名)
      ? 列表.filter((d) => d !== 名)
      : [...列表, 名];
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

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* 类型 */}
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
        {/* 尺寸 */}
        <div className="w-24">
          <Field label="尺寸 (寸)">
            <NumInput
              value={value.染色图.染色尺寸标注.尺寸}
              onChange={(n) => {
                if (value.type === "错位") {
                  onChange({
                    type: "错位",
                    染色图: {
                      ...value.染色图,
                      染色尺寸标注: { ...value.染色图.染色尺寸标注, 尺寸: n },
                    },
                  });
                } else {
                  onChange({
                    type: value.type,
                    染色图: {
                      ...value.染色图,
                      染色尺寸标注: { ...value.染色图.染色尺寸标注, 尺寸: n },
                    },
                  });
                }
              }}
              step="0.5"
            />
          </Field>
        </div>
        {/* 错位：长尺寸 + 短尺寸 */}
        {value.type === "错位" && (
          <>
            <div className="w-24">
              <Field label="长尺寸 (寸)">
                <NumInput
                  value={value.染色图.长尺寸标注.尺寸}
                  onChange={(n) => {
                    if (value.type !== "错位") return;
                    onChange({
                      type: "错位",
                      染色图: {
                        ...value.染色图,
                        长尺寸标注: { ...value.染色图.长尺寸标注, 尺寸: n },
                      },
                    });
                  }}
                  step="0.5"
                />
              </Field>
            </div>
            <div className="w-24">
              <Field label="短尺寸 (寸)">
                <NumInput
                  value={value.染色图.短尺寸标注?.尺寸 ?? 0}
                  onChange={(n) => {
                    if (value.type !== "错位") return;
                    onChange({
                      type: "错位",
                      染色图: {
                        ...value.染色图,
                        短尺寸标注: {
                          textNodeId:
                            value.染色图.短尺寸标注?.textNodeId ??
                            染色示例.错位.染色图.短尺寸标注.textNodeId,
                          尺寸: n,
                        },
                      },
                    });
                  }}
                  step="0.5"
                />
              </Field>
            </div>
          </>
        )}
      </div>
      {/* 档位勾选 */}
      {全部档位名.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">
            适用档位
          </p>
          <div className="flex flex-wrap gap-2">
            {全部档位名.map((名) => (
              <label
                key={名}
                className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={value.染色图.档位标注.档位列表.includes(名)}
                  onChange={() => toggleArchive(名)}
                />
                {名}
              </label>
            ))}
          </div>
        </div>
      )}
      {/* SVG 预览 */}
      {previewSvg && (
        <div className="overflow-x-auto rounded border border-slate-100 bg-white p-3">
          <div
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
      )}
    </div>
  );
}

// ── 主页面 ─────────────────────────────────────────────

export default function AddFilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyFile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratioList, setRatioList] = useState<胶丝比例ListItem[]>([]);

  useEffect(() => {
    callApi("admin/ratio/GetList", {}).then((r) => {
      if (r.isSucc) setRatioList(r.res.list);
    });
  }, []);

  const 发丝种类选项 = useMemo(
    () => [...new Set(ratioList.map((r) => r.发丝种类))].sort(),
    [ratioList],
  );

  const 当前发丝种类颜色编号列表 = useMemo(
    () =>
      ratioList
        .filter((r) => r.发丝种类 === form.制品规格书.胶丝比例id.发丝种类)
        .map((r) => r._id),
    [ratioList, form.制品规格书.胶丝比例id.发丝种类],
  );

  const 全部档位名 = useMemo(() => {
    const 机器 = form.制品规格书.机器规格清单
      .map((d) => d.档位)
      .filter(Boolean);
    const 人工 = form.制品规格书.人工规格清单
      .map((d) => d.档位)
      .filter(Boolean);
    return [...机器, ...人工];
  }, [form.制品规格书.机器规格清单, form.制品规格书.人工规格清单]);

  function set规格书<K extends keyof 制品规格书>(key: K, val: 制品规格书[K]) {
    setForm((f) => ({ ...f, 制品规格书: { ...f.制品规格书, [key]: val } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form._id.trim()) {
      setError("样品编号不能为空");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const r = await callApi("admin/file/Add", { file: form });
      if (!r.isSucc) {
        setError(r.err.message);
        return;
      }
      navigate("/admin/files");
    } finally {
      setLoading(false);
    }
  }

  const 是间色 = form.假发类型 === 假发类型.间色;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-800"
              onClick={() => navigate("/admin/files")}
            >
              ← 返回
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">
              添加成品稿
            </span>
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              form="add-file-form"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "提交中…" : "保存成品稿"}
            </button>
          </div>
        </div>
      </div>

      {/* 表单主体 */}
      <form
        id="add-file-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="mx-auto max-w-7xl space-y-5 px-6 py-6"
      >
        {/* ── 基本信息 ── */}
        <Section title="基本信息">
          <div className="grid grid-cols-6 gap-3">
            <Field label="样品编号 *">
              <input
                type="text"
                required
                placeholder="XM-6190(L)"
                className={inputCls}
                value={form._id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, _id: e.target.value }))
                }
              />
            </Field>
            <Field label="假发类型">
              <select
                className={inputCls}
                value={form.假发类型}
                onChange={(e) => {
                  const next = e.target.value as 假发类型;
                  setForm((f) => ({
                    ...f,
                    假发类型: next,
                    制品规格书:
                      next !== 假发类型.间色
                        ? {
                            ...f.制品规格书,
                            机器规格清单: f.制品规格书.机器规格清单.map(
                              ({ DML比值: _omit, ...rest }) => rest,
                            ),
                          }
                        : f.制品规格书,
                  }));
                }}
              >
                {Object.values(假发类型).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            {[
              { key: "客户编号" as const, placeholder: "XM" },
              { key: "品名" as const, placeholder: "Michelle BB TBOB080" },
              { key: "原材料" as const, placeholder: "FU:50%+HL:50%" },
              { key: "CAP" as const, placeholder: "P-025(侧分雪花网L)" },
            ].map(({ key, placeholder }) => (
              <Field key={key} label={key}>
                <input
                  type="text"
                  placeholder={placeholder}
                  className={inputCls}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* ── 制帽规格 ── */}
        <Section title="制帽规格">
          <div className="grid grid-cols-5 gap-3">
            {(["帽围", "帽深", "前后"] as const).map((k) => (
              <Field key={k} label={`${k} (cm)`}>
                <NumInput
                  value={form.制品规格书.制帽[k]}
                  onChange={(n) =>
                    set规格书("制帽", { ...form.制品规格书.制帽, [k]: n })
                  }
                />
              </Field>
            ))}
            {(["唛头", "号码"] as const).map((k) => (
              <Field key={k} label={k}>
                <TextInput
                  value={form.制品规格书.制帽[k]}
                  onChange={(v) =>
                    set规格书("制帽", { ...form.制品规格书.制帽, [k]: v })
                  }
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* ── 胶丝比例 ── */}
        <Section title="胶丝比例">
          <div className="grid grid-cols-[200px_1fr] gap-3">
            <Field label="发丝种类">
              <select
                className={inputCls}
                value={form.制品规格书.胶丝比例id.发丝种类}
                onChange={(e) =>
                  set规格书("胶丝比例id", {
                    颜色编号: "",
                    发丝种类: e.target.value,
                  })
                }
              >
                <option value="">— 选择发丝种类 —</option>
                {发丝种类选项.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="颜色编号">
              <>
                <input
                  list="颜色编号列表"
                  className={inputCls}
                  placeholder={
                    form.制品规格书.胶丝比例id.发丝种类
                      ? "输入或选择颜色编号"
                      : "请先选择发丝种类"
                  }
                  disabled={!form.制品规格书.胶丝比例id.发丝种类}
                  value={form.制品规格书.胶丝比例id.颜色编号}
                  onChange={(e) =>
                    set规格书("胶丝比例id", {
                      ...form.制品规格书.胶丝比例id,
                      颜色编号: e.target.value,
                    })
                  }
                />
                <datalist id="颜色编号列表">
                  {当前发丝种类颜色编号列表.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            </Field>
          </div>
        </Section>

        {/* ── 工程重量 ── */}
        <Section title="工程重量（加减值 g）">
          <div className="grid grid-cols-8 gap-3">
            {(
              [
                "整毛",
                "双针",
                "美容",
                "制帽",
                "高针",
                "手织",
                "剪驳",
                "发网",
              ] as const
            ).map((k) => (
              <Field key={k} label={k}>
                <NumInput
                  value={form.制品规格书.工程重量[k]?.加减 ?? 0}
                  onChange={(n) =>
                    set规格书("工程重量", {
                      ...form.制品规格书.工程重量,
                      [k]: n === 0 ? undefined : { 加减: n },
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* ── 机器规格清单 ── */}
        <Section
          title="机器规格清单"
          action={
            <AddBtn
              onClick={() =>
                set规格书("机器规格清单", [
                  ...form.制品规格书.机器规格清单,
                  {
                    ...empty机器档位(),
                    档位: String(form.制品规格书.机器规格清单.length + 1),
                  },
                ])
              }
            />
          }
        >
          {form.制品规格书.机器规格清单.length === 0 ? (
            <p className="text-xs text-slate-400">暂无档位</p>
          ) : (
            <div className="space-y-3">
              {form.制品规格书.机器规格清单.map((档位, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      档位 {i + 1}
                    </span>
                    <DelBtn
                      onClick={() =>
                        set规格书(
                          "机器规格清单",
                          form.制品规格书.机器规格清单.filter(
                            (_, j) => j !== i,
                          ),
                        )
                      }
                    />
                  </div>
                  <机器档位编辑器
                    value={档位}
                    是间色={是间色}
                    onChange={(v) => {
                      const next = [...form.制品规格书.机器规格清单];
                      next[i] = v;
                      set规格书("机器规格清单", next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 人工规格清单 ── */}
        <Section
          title="人工规格清单"
          action={
            <AddBtn
              onClick={() =>
                set规格书("人工规格清单", [
                  ...form.制品规格书.人工规格清单,
                  {
                    ...empty人工档位(),
                    档位: `H${form.制品规格书.人工规格清单.length + 1}`,
                  },
                ])
              }
            />
          }
        >
          {form.制品规格书.人工规格清单.length === 0 ? (
            <p className="text-xs text-slate-400">暂无档位</p>
          ) : (
            <div className="space-y-2">
              {/* 表头 */}
              <div className="grid grid-cols-[60px_55px_65px_65px_1fr_55px_1fr_auto] gap-2 px-3">
                {[
                  "档位",
                  "整毛·拉尖",
                  "双针·毛长",
                  "双针·磅发g",
                  "形态",
                  "美容·铝管",
                  "备注",
                  "",
                ].map((h, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-medium text-slate-400"
                  >
                    {h}
                  </div>
                ))}
              </div>
              {form.制品规格书.人工规格清单.map((档位, i) => {
                function p<K extends keyof 人工档位>(key: K, val: 人工档位[K]) {
                  const next = [...form.制品规格书.人工规格清单];
                  next[i] = { ...next[i], [key]: val };
                  set规格书("人工规格清单", next);
                }
                type 人工档位 = 制品规格书["人工规格清单"][number];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[60px_55px_65px_65px_1fr_55px_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <TextInput
                      value={档位.档位}
                      onChange={(v) => p("档位", v)}
                      placeholder="H1"
                    />
                    <NumInput
                      value={档位.整毛.拉尖}
                      onChange={(n) => p("整毛", { ...档位.整毛, 拉尖: n })}
                    />
                    <NumInput
                      value={档位.双针.毛长}
                      onChange={(n) => p("双针", { ...档位.双针, 毛长: n })}
                    />
                    <NumInput
                      value={档位.双针.磅发}
                      onChange={(n) => p("双针", { ...档位.双针, 磅发: n })}
                    />
                    <TextInput
                      value={档位.形态 ?? ""}
                      onChange={(v) => p("形态", v || undefined)}
                      placeholder="可选"
                    />
                    <NumInput
                      value={档位.美容.铝管}
                      onChange={(n) => p("美容", { ...档位.美容, 铝管: n })}
                    />
                    <TextInput
                      value={档位.备注 ?? ""}
                      onChange={(v) => p("备注", v || undefined)}
                      placeholder="可选"
                    />
                    <DelBtn
                      onClick={() =>
                        set规格书(
                          "人工规格清单",
                          form.制品规格书.人工规格清单.filter(
                            (_, j) => j !== i,
                          ),
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── 工程重量 ── */}
        <Section title="工程重量（加减值 g）">
          <div className="grid grid-cols-8 gap-3">
            {(
              [
                "整毛",
                "双针",
                "美容",
                "制帽",
                "高针",
                "手织",
                "剪驳",
                "发网",
              ] as const
            ).map((k) => (
              <Field key={k} label={k}>
                <NumInput
                  value={form.制品规格书.工程重量[k]?.加减 ?? 0}
                  onChange={(n) =>
                    set规格书("工程重量", {
                      ...form.制品规格书.工程重量,
                      [k]: n === 0 ? undefined : { 加减: n },
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* ── 工艺说明 ── */}
        <Section
          title="工艺说明"
          action={
            <AddBtn
              onClick={() =>
                set规格书("工艺说明", [
                  ...form.制品规格书.工艺说明,
                  empty工艺说明(),
                ])
              }
            />
          }
        >
          {form.制品规格书.工艺说明.length === 0 ? (
            <p className="text-xs text-slate-400">暂无</p>
          ) : (
            <div className="space-y-2">
              {/* 表头 */}
              <div className="grid grid-cols-[repeat(9,1fr)_auto] gap-3 px-4">
                {[...工艺说明Keys, ""].map((h, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-medium text-slate-400"
                  >
                    {h}
                  </div>
                ))}
              </div>
              {form.制品规格书.工艺说明.map((行, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[repeat(9,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2"
                >
                  {工艺说明Keys.map((k) => (
                    <input
                      key={k}
                      type="text"
                      className={inputCls}
                      value={行[k] ?? ""}
                      onChange={(e) => {
                        const next = [...form.制品规格书.工艺说明];
                        next[i] = { ...next[i], [k]: e.target.value };
                        set规格书("工艺说明", next);
                      }}
                    />
                  ))}
                  <DelBtn
                    onClick={() =>
                      set规格书(
                        "工艺说明",
                        form.制品规格书.工艺说明.filter((_, j) => j !== i),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 染色档位列表 ── */}
        <Section
          title="染色档位列表"
          action={
            <AddBtn
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  染色档位列表: [
                    ...f.染色档位列表,
                    染色示例.普通,
                  ],
                }))
              }
            />
          }
        >
          {form.染色档位列表.length === 0 ? (
            <p className="text-xs text-slate-400">
              暂无染色档位，点击右上角添加
            </p>
          ) : (
            <div className="space-y-3">
              {form.染色档位列表.map((项, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      染色档位 {i + 1}（{项.type}）
                    </span>
                    <DelBtn
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          染色档位列表: f.染色档位列表.filter(
                            (_, j) => j !== i,
                          ),
                        }))
                      }
                    />
                  </div>
                  <染色档位编辑器
                    value={项}
                    全部档位名={全部档位名}
                    onChange={(v) =>
                      setForm((f) => {
                        const next = [...f.染色档位列表];
                        next[i] = v;
                        return { ...f, 染色档位列表: next };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 高针指示单 ── */}
        <Section title="高针指示单">
          <Field label="注意事项">
            <textarea
              rows={3}
              className={inputCls}
              placeholder="高针 :1.高针后帽子不能变形。"
              value={form.高针指示单.注意事项}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  高针指示单: { ...f.高针指示单, 注意事项: e.target.value },
                }))
              }
            />
          </Field>
        </Section>

        {/* ── 手织指示单 ── */}
        <Section title="手织指示单">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="尺寸">
                <NumInput
                  value={form.手织指示单.尺寸}
                  onChange={(n) =>
                    setForm((f) => ({
                      ...f,
                      手织指示单: { ...f.手织指示单, 尺寸: n },
                    }))
                  }
                  step="1"
                />
              </Field>
            </div>
            <Field label="注意事项">
              <textarea
                rows={3}
                className={inputCls}
                placeholder="手织 :1.手织后帽子不能变形。"
                value={form.手织指示单.注意事项}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    手织指示单: { ...f.手织指示单, 注意事项: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="手织图 SVG">
              <TextInput
                value={form.手织指示单.手织图.svg}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    手织指示单: {
                      ...f.手织指示单,
                      手织图: { svg: v },
                    },
                  }))
                }
                placeholder="SVG 内容"
              />
            </Field>
          </div>
        </Section>
      </form>
    </div>
  );
}
