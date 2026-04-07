import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import type {
  DML重量,
  制品规格书,
  裁断重量项,
  沐茵丝假发成品稿,
} from "../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";

// ── 初始值 ─────────────────────────────────────────────

const empty机器档位 = (): 制品规格书["机器规格清单"][number] =>
  ({
    档位: "",
    裁断与重量: [],
    整毛: { 拉尖: 0 },
    双针: { 毛长: 0, 尺数: { D: 0 }, 密度: 0 },
    美容: { 铝管: 0, 方向: "", 层数: 0 },
  }) as 制品规格书["机器规格清单"][number];

const empty人工档位 = (): 制品规格书["人工规格清单"][number] =>
  ({
    档位: "",
    裁断: 0,
    整毛: 0,
    双针: { 毛长: 0, 磅发: 0 },
    美容: { 铝管: 0 },
  }) as 制品规格书["人工规格清单"][number];

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
  客户: "",
  品名: "",
  原材料: "",
  CAP: "",
  头型图片: [],
  制品规格书: {
    机器规格清单: [],
    人工规格清单: [],
    胶丝比例列表: [],
    尺寸: "",
    制帽: { 帽围: 0, 帽深: 0, 前后: 0, 唛头: "", 号码: "" },
    工艺说明: [],
    工程重量: {},
    染色档位映射图: [],
  },
  高针指示单: {
    尺寸: "",
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
    手织图: { 底图: { svg: "", 可定制项: [] } },
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

      {/* 染色 */}
      <div>
        <label className="mb-2 flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <input
            type="checkbox"
            checked={value.染色 !== undefined}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({ ...value, 染色: { 比例: 0, 对折: false } });
              } else {
                const { 染色: _omit, ...rest } = value;
                onChange(rest as 机器档位);
              }
            }}
          />
          染色
        </label>
        {value.染色 !== undefined && (
          <div className="grid grid-cols-[65px_120px] gap-2">
            <Field label="染色·比例">
              <NumInput
                value={value.染色?.比例 ?? 0}
                onChange={(n) =>
                  p("染色", {
                    ...(value.染色 ?? { 比例: 0, 对折: false }),
                    比例: n,
                  })
                }
              />
            </Field>
            <Field label="染色·对折">
              <select
                className={inputCls}
                value={value.染色?.对折 ? "是" : "否"}
                onChange={(e) =>
                  p("染色", {
                    ...(value.染色 ?? { 比例: 0, 对折: false }),
                    对折: e.target.value === "是",
                  })
                }
              >
                <option>否</option>
                <option>是</option>
              </select>
            </Field>
          </div>
        )}
      </div>
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
    <div className="grid grid-cols-[repeat(10,1fr)_auto] items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <Field label="档位">
        <TextInput
          value={value.档位}
          onChange={(v) => p("档位", v)}
          placeholder="H1"
        />
      </Field>
      <Field label="裁断">
        <NumInput value={value.裁断} onChange={(n) => p("裁断", n)} step="1" />
      </Field>
      <Field label="整毛">
        <NumInput value={value.整毛} onChange={(n) => p("整毛", n)} />
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
      <Field label="染色·比例">
        <NumInput
          value={value.染色?.比例 ?? 0}
          onChange={(n) =>
            p("染色", { ...(value.染色 ?? { 比例: 0, 对折: false }), 比例: n })
          }
        />
      </Field>
      <Field label="染色·对折">
        <select
          className={inputCls}
          value={value.染色?.对折 ? "是" : "否"}
          onChange={(e) =>
            p("染色", {
              ...(value.染色 ?? { 比例: 0, 对折: false }),
              对折: e.target.value === "是",
            })
          }
        >
          <option>否</option>
          <option>是</option>
        </select>
      </Field>
      <Field label="形态">
        <TextInput
          value={value.形态 ?? ""}
          onChange={(v) => p("形态", v || undefined)}
          placeholder="可选"
        />
      </Field>
      <Field label="备注">
        <TextInput
          value={value.备注 ?? ""}
          onChange={(v) => p("备注", v || undefined)}
          placeholder="可选"
        />
      </Field>
      <div className="pb-0.5">
        <DelBtn onClick={() => onChange(value)} />
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

// ── 染色档位映射图 ─────────────────────────────────────

type 染色项 = 制品规格书["染色档位映射图"][number];

function 染色档位编辑器({
  value,
  onChange,
}: {
  value: 染色项;
  onChange: (v: 染色项) => void;
}) {
  const { 档位映射 } = value;
  function updateRow(i: number, patch: Partial<染色项["档位映射"][number]>) {
    onChange({
      ...value,
      档位映射: 档位映射.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    });
  }
  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-4">
      {档位映射.map((row, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] items-end gap-3">
          <Field label="档位数组（逗号分隔）">
            <TextInput
              value={row.档位数组.join(",")}
              onChange={(v) =>
                updateRow(i, {
                  档位数组: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="例如: 1,2,3,H1"
            />
          </Field>
          <Field label="染色尺寸">
            <TextInput
              value={row.染色尺寸}
              onChange={(v) => updateRow(i, { 染色尺寸: v })}
              placeholder="例如: 2.5"
            />
          </Field>
          <div className="pb-0.5">
            <DelBtn
              onClick={() =>
                onChange({
                  ...value,
                  档位映射: 档位映射.filter((_, j) => j !== i),
                })
              }
            />
          </div>
        </div>
      ))}
      <AddBtn
        label="+ 映射行"
        onClick={() =>
          onChange({
            ...value,
            档位映射: [
              ...档位映射,
              { 档位数组: [], 染色尺寸: "", 染色尺寸图片: "" },
            ],
          })
        }
      />
    </div>
  );
}

// ── 可定制项 ───────────────────────────────────────────

type 可定制项 = { lineId: string; 尺数: number };

function 可定制项编辑器({
  value,
  onChange,
}: {
  value: 可定制项[];
  onChange: (v: 可定制项[]) => void;
}) {
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_100px_auto] items-end gap-2"
        >
          <Field label="lineId">
            <TextInput
              value={row.lineId}
              onChange={(v) => {
                const next = [...value];
                next[i] = { ...next[i], lineId: v };
                onChange(next);
              }}
            />
          </Field>
          <Field label="尺数">
            <NumInput
              value={row.尺数}
              onChange={(n) => {
                const next = [...value];
                next[i] = { ...next[i], 尺数: n };
                onChange(next);
              }}
              step="1"
            />
          </Field>
          <div className="pb-0.5">
            <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      <AddBtn onClick={() => onChange([...value, { lineId: "", 尺数: 0 }])} />
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

// ── 主页面 ─────────────────────────────────────────────

export default function AddFilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyFile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
              { key: "客户" as const, placeholder: "XM" },
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

        {/* ── 胶丝比例列表 ── */}
        <Section
          title="胶丝比例列表"
          action={
            <AddBtn
              onClick={() =>
                set规格书("胶丝比例列表", [
                  ...form.制品规格书.胶丝比例列表,
                  { 颜色编号: "", 线色: "" },
                ])
              }
            />
          }
        >
          {form.制品规格书.胶丝比例列表.length === 0 ? (
            <p className="text-xs text-slate-400">暂无</p>
          ) : (
            <div className="space-y-2">
              {form.制品规格书.胶丝比例列表.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto] items-end gap-3"
                >
                  <Field label="颜色编号">
                    <TextInput
                      value={row.颜色编号}
                      placeholder="TT830.27.6"
                      onChange={(v) => {
                        const next = [...form.制品规格书.胶丝比例列表];
                        next[i] = { ...next[i], 颜色编号: v };
                        set规格书("胶丝比例列表", next);
                      }}
                    />
                  </Field>
                  <Field label="线色">
                    <TextInput
                      value={row.线色}
                      placeholder="8#"
                      onChange={(v) => {
                        const next = [...form.制品规格书.胶丝比例列表];
                        next[i] = { ...next[i], 线色: v };
                        set规格书("胶丝比例列表", next);
                      }}
                    />
                  </Field>
                  <div className="pb-0.5">
                    <DelBtn
                      onClick={() =>
                        set规格书(
                          "胶丝比例列表",
                          form.制品规格书.胶丝比例列表.filter(
                            (_, j) => j !== i,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 工程重量 ── */}
        <Section title="工程重量（加减值 g）">
          <div className="grid grid-cols-9 gap-3">
            {(
              [
                "整毛",
                "双针",
                "美容",
                "SKIN",
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
              <div className="grid grid-cols-[60px_55px_55px_65px_65px_1fr_55px_1fr_32px_55px_75px_auto] gap-2 px-3">
                {[
                  "档位",
                  "裁断",
                  "整毛",
                  "双针·毛长",
                  "双针·磅发g",
                  "形态",
                  "美容·铝管",
                  "备注",
                  "染色?",
                  "染色·比例",
                  "染色·对折",
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
                    className="grid grid-cols-[60px_55px_55px_65px_65px_1fr_55px_1fr_32px_55px_75px_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <TextInput
                      value={档位.档位}
                      onChange={(v) => p("档位", v)}
                      placeholder="H1"
                    />
                    <NumInput
                      value={档位.裁断}
                      onChange={(n) => p("裁断", n)}
                      step="1"
                    />
                    <NumInput
                      value={档位.整毛}
                      onChange={(n) => p("整毛", n)}
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
                    <input
                      type="checkbox"
                      className="mx-auto block"
                      checked={档位.染色 !== undefined}
                      onChange={(e) => {
                        const next = [...form.制品规格书.人工规格清单];
                        if (e.target.checked) {
                          next[i] = {
                            ...next[i],
                            染色: { 比例: 0, 对折: false },
                          };
                        } else {
                          const { 染色: _omit, ...rest } = next[i];
                          next[i] = rest as (typeof next)[number];
                        }
                        set规格书("人工规格清单", next);
                      }}
                    />
                    <NumInput
                      value={档位.染色?.比例 ?? 0}
                      disabled={档位.染色 === undefined}
                      onChange={(n) =>
                        p("染色", {
                          ...(档位.染色 ?? { 对折: false }),
                          比例: n,
                        })
                      }
                    />
                    <select
                      className={inputCls}
                      disabled={档位.染色 === undefined}
                      value={档位.染色?.对折 ? "是" : "否"}
                      onChange={(e) =>
                        p("染色", {
                          ...(档位.染色 ?? { 比例: 0 }),
                          对折: e.target.value === "是",
                        })
                      }
                    >
                      <option>否</option>
                      <option>是</option>
                    </select>
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
          <div className="grid grid-cols-9 gap-3">
            {(
              [
                "整毛",
                "双针",
                "美容",
                "SKIN",
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

        {/* ── 染色档位映射图 ── */}
        <Section
          title="染色档位映射图"
          action={
            <AddBtn
              onClick={() =>
                set规格书("染色档位映射图", [
                  ...form.制品规格书.染色档位映射图,
                  { 档位映射: [] },
                ])
              }
            />
          }
        >
          {form.制品规格书.染色档位映射图.length === 0 ? (
            <p className="text-xs text-slate-400">暂无</p>
          ) : (
            <div className="space-y-3">
              {form.制品规格书.染色档位映射图.map((项, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      映射图 {i + 1}
                    </span>
                    <DelBtn
                      onClick={() =>
                        set规格书(
                          "染色档位映射图",
                          form.制品规格书.染色档位映射图.filter(
                            (_, j) => j !== i,
                          ),
                        )
                      }
                    />
                  </div>
                  <染色档位编辑器
                    value={项}
                    onChange={(v) => {
                      const next = [...form.制品规格书.染色档位映射图];
                      next[i] = v;
                      set规格书("染色档位映射图", next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 高针指示单 ── */}
        <Section title="高针指示单">
          <Field label="尺寸">
            <TextInput
              value={form.高针指示单.尺寸 ?? ""}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  高针指示单: { ...f.高针指示单, 尺寸: v },
                }))
              }
              placeholder='例如: 15"~18"'
            />
          </Field>
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
            <div>
              <p className="mb-2 text-xs font-medium text-slate-700">
                手织图·可定制项
              </p>
              <可定制项编辑器
                value={form.手织指示单.手织图.底图.可定制项}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    手织指示单: {
                      ...f.手织指示单,
                      手织图: {
                        底图: { ...f.手织指示单.手织图.底图, 可定制项: v },
                      },
                    },
                  }))
                }
              />
            </div>
          </div>
        </Section>
      </form>
    </div>
  );
}
