import { useState, useEffect } from "react";
import { callApi } from "../api/callApi";
import type {
  DML重量,
  制品规格书,
  裁断重量项,
  沐茵丝假发成品稿,
} from "../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../shared/db/Db沐茵丝假发成品稿";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// ── 初始值 ─────────────────────────────────────────────

const empty机器档位 = (): 制品规格书["机器规格清单"][number] => ({
  档位: "",
  裁断与重量: [],
  整毛: { 拉尖: 0 },
  双针: { 毛长: 0, 尺数: { D: 0 }, 密度: 0 },
  美容: { 铝管: 0, 方向: "", 层数: 0 },
  染色: { 比例: 0, 对折: false },
});

const empty人工档位 = (): 制品规格书["人工规格清单"][number] => ({
  档位: "",
  裁断: 0,
  整毛: 0,
  双针: { 毛长: 0, 磅发: 0 },
  美容: { 铝管: 0 },
  染色: { 比例: 0, 对折: false },
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

const empty染色档位映射图 = (): 制品规格书["染色档位映射图"][number] => ({
  档位映射: [],
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

// ── 辅助组件 ───────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
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

const inputCls =
  "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";
const sectionCls =
  "rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-3";

function NumInput({
  value,
  onChange,
  step = "0.1",
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: string;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    if (parseFloat(raw) !== value) setRaw(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      step={step}
      placeholder={placeholder ?? "0"}
      className={inputCls}
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

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded bg-slate-200 px-2 py-0.5 text-xs hover:bg-slate-300"
      onClick={onClick}
    >
      + 添加
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
      onClick={onClick}
    >
      删除
    </button>
  );
}

// ── 裁断与重量子组件 ────────────────────────────────────

function 裁断重量编辑器({
  value,
  onChange,
}: {
  value: 裁断重量项[];
  onChange: (v: 裁断重量项[]) => void;
}) {
  function update(i: number, patch: Partial<裁断重量项>) {
    const next = value.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next);
  }
  function updateDML(i: number, patch: Partial<DML重量>) {
    const prev = value[i].重量g ?? { D: 0 };
    update(i, { 重量g: { ...prev, ...patch } });
  }
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div
          key={i}
          className="flex flex-wrap items-end gap-2 rounded border border-slate-200 bg-white p-2"
        >
          <div className="w-20">
            <label className="mb-1 block text-[10px] text-slate-500">
              裁断
            </label>
            <NumInput
              value={row.裁断}
              onChange={(n) => update(i, { 裁断: n })}
              step="1"
            />
          </div>
          <div className="w-16">
            <label className="mb-1 block text-[10px] text-slate-500">
              D(g)
            </label>
            <NumInput
              value={row.重量g?.D ?? 0}
              onChange={(n) => updateDML(i, { D: n })}
            />
          </div>
          <div className="w-16">
            <label className="mb-1 block text-[10px] text-slate-500">
              M(g)
            </label>
            <NumInput
              value={row.重量g?.M ?? 0}
              onChange={(n) => updateDML(i, { M: n || undefined })}
            />
          </div>
          <div className="w-16">
            <label className="mb-1 block text-[10px] text-slate-500">
              L(g)
            </label>
            <NumInput
              value={row.重量g?.L ?? 0}
              onChange={(n) => updateDML(i, { L: n || undefined })}
            />
          </div>
          <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn
        onClick={() => onChange([...value, { 裁断: 0, 重量g: { D: 0 } }])}
      />
    </div>
  );
}

// ── 机器规格档位编辑器 ──────────────────────────────────

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
    <div className="space-y-3 rounded border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="档位">
          <TextInput
            value={value.档位}
            onChange={(v) => p("档位", v)}
            placeholder="例如: 1"
          />
        </Field>
        <Field label="形态">
          <TextInput
            value={value.形态 ?? ""}
            onChange={(v) => p("形态", v || undefined)}
            placeholder="可选"
          />
        </Field>
      </div>

      {是间色 && (
        <div className="grid grid-cols-3 gap-2">
          {(["D", "M", "L"] as const).map((k) => (
            <Field key={k} label={`DML比值 ${k}${k === "D" ? " *" : ""}`}>
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
          ))}
        </div>
      )}

      <div>
        <p className="mb-1 text-[10px] font-medium text-slate-500">
          裁断与重量
        </p>
        <裁断重量编辑器
          value={value.裁断与重量}
          onChange={(v) => p("裁断与重量", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
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

      <div className="grid grid-cols-3 gap-2">
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
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {(["D", "M", "L"] as const).map((k) => (
            <Field key={k} label={`双针·尺数 ${k}`}>
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
      </div>

      <div className="grid grid-cols-3 gap-2">
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

      <div className="grid grid-cols-2 gap-2">
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

// ── 人工规格档位编辑器 ──────────────────────────────────

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
    <div className="space-y-3 rounded border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="档位">
          <TextInput
            value={value.档位}
            onChange={(v) => p("档位", v)}
            placeholder="例如: H1"
          />
        </Field>
        <Field label="形态">
          <TextInput
            value={value.形态 ?? ""}
            onChange={(v) => p("形态", v || undefined)}
            placeholder="可选"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="裁断">
          <NumInput
            value={value.裁断}
            onChange={(n) => p("裁断", n)}
            step="1"
          />
        </Field>
        <Field label="整毛">
          <NumInput value={value.整毛} onChange={(n) => p("整毛", n)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="双针·毛长">
          <NumInput
            value={value.双针.毛长}
            onChange={(n) => p("双针", { ...value.双针, 毛长: n })}
          />
        </Field>
        <Field label="双针·磅发(g)">
          <NumInput
            value={value.双针.磅发}
            onChange={(n) => p("双针", { ...value.双针, 磅发: n })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="美容·铝管">
          <NumInput
            value={value.美容.铝管}
            onChange={(n) => p("美容", { ...value.美容, 铝管: n })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
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

// ── 工艺说明编辑器 ──────────────────────────────────────

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
    <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
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

// ── 染色档位映射图编辑器 ────────────────────────────────

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
    const next = 档位映射.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange({ ...value, 档位映射: next });
  }

  return (
    <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
      {档位映射.map((row, i) => (
        <div key={i} className="space-y-2 rounded bg-slate-50 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">
              映射 {i + 1}
            </span>
            <DelBtn
              onClick={() =>
                onChange({
                  ...value,
                  档位映射: 档位映射.filter((_, j) => j !== i),
                })
              }
            />
          </div>
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
        </div>
      ))}
      <AddBtn
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

// ── 可定制项编辑器（手织图） ─────────────────────────────

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
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-slate-500">
              lineId
            </label>
            <TextInput
              value={row.lineId}
              onChange={(v) => {
                const next = [...value];
                next[i] = { ...next[i], lineId: v };
                onChange(next);
              }}
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[10px] text-slate-500">
              尺数
            </label>
            <NumInput
              value={row.尺数}
              onChange={(n) => {
                const next = [...value];
                next[i] = { ...next[i], 尺数: n };
                onChange(next);
              }}
              step="1"
            />
          </div>
          <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...value, { lineId: "", 尺数: 0 }])} />
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────

export default function AddFileModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(emptyFile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setForm(emptyFile());
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function setStr(key: keyof 沐茵丝假发成品稿, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function set规格书<K extends keyof 制品规格书>(key: K, val: 制品规格书[K]) {
    setForm((f) => ({
      ...f,
      制品规格书: { ...f.制品规格书, [key]: val },
    }));
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
      reset();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">添加成品稿</h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            onClick={handleClose}
          >
            关闭
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="add-file-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        >
          {/* ── 基本信息 ── */}
          <div className={sectionCls}>
            <SectionTitle>基本信息</SectionTitle>
            <Field label="样品编号 *">
              <input
                type="text"
                required
                placeholder="例如: XM-6190(L)"
                className={inputCls}
                value={form._id}
                onChange={(e) => setStr("_id", e.target.value)}
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
                    // 切换为非间色时，清除所有档位的 DML比值
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
            {(
              [
                { key: "客户", placeholder: "例如: XM" },
                { key: "品名", placeholder: "例如: Michelle BB TBOB080" },
                { key: "原材料", placeholder: "例如: FU:50%+HL:50%" },
                { key: "CAP", placeholder: "例如: P-025(侧分雪花网L)" },
              ] as const
            ).map(({ key, placeholder }) => (
              <Field key={key} label={key}>
                <TextInput
                  value={form[key]}
                  onChange={(v) => setStr(key, v)}
                  placeholder={placeholder}
                />
              </Field>
            ))}
          </div>

          {/* ── 制帽规格 ── */}
          <div className={sectionCls}>
            <SectionTitle>制帽规格</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
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
            </div>
            <div className="grid grid-cols-2 gap-2">
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
          </div>

          {/* ── 胶丝比例列表 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>胶丝比例列表</SectionTitle>
              <AddBtn
                onClick={() =>
                  set规格书("胶丝比例列表", [
                    ...form.制品规格书.胶丝比例列表,
                    { 颜色编号: "", 线色: "" },
                  ])
                }
              />
            </div>
            {form.制品规格书.胶丝比例列表.length === 0 && (
              <p className="text-xs text-slate-400">暂无</p>
            )}
            {form.制品规格书.胶丝比例列表.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput
                  value={row.颜色编号}
                  placeholder="颜色编号"
                  onChange={(v) => {
                    const next = [...form.制品规格书.胶丝比例列表];
                    next[i] = { ...next[i], 颜色编号: v };
                    set规格书("胶丝比例列表", next);
                  }}
                />
                <TextInput
                  value={row.线色}
                  placeholder="线色"
                  onChange={(v) => {
                    const next = [...form.制品规格书.胶丝比例列表];
                    next[i] = { ...next[i], 线色: v };
                    set规格书("胶丝比例列表", next);
                  }}
                />
                <DelBtn
                  onClick={() =>
                    set规格书(
                      "胶丝比例列表",
                      form.制品规格书.胶丝比例列表.filter((_, j) => j !== i),
                    )
                  }
                />
              </div>
            ))}
          </div>

          {/* ── 工程重量 ── */}
          <div className={sectionCls}>
            <SectionTitle>工程重量（加减值，单位 g）</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          {/* ── 机器规格清单 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>机器规格清单</SectionTitle>
              <AddBtn
                onClick={() =>
                  set规格书("机器规格清单", [
                    ...form.制品规格书.机器规格清单,
                    empty机器档位(),
                  ])
                }
              />
            </div>
            {form.制品规格书.机器规格清单.length === 0 && (
              <p className="text-xs text-slate-400">暂无档位</p>
            )}
            {form.制品规格书.机器规格清单.map((档位, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500">
                    档位 {i + 1}
                  </span>
                  <DelBtn
                    onClick={() =>
                      set规格书(
                        "机器规格清单",
                        form.制品规格书.机器规格清单.filter((_, j) => j !== i),
                      )
                    }
                  />
                </div>
                <机器档位编辑器
                  value={档位}
                  是间色={form.假发类型 === 假发类型.间色}
                  onChange={(v) => {
                    const next = [...form.制品规格书.机器规格清单];
                    next[i] = v;
                    set规格书("机器规格清单", next);
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── 人工规格清单 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>人工规格清单</SectionTitle>
              <AddBtn
                onClick={() =>
                  set规格书("人工规格清单", [
                    ...form.制品规格书.人工规格清单,
                    empty人工档位(),
                  ])
                }
              />
            </div>
            {form.制品规格书.人工规格清单.length === 0 && (
              <p className="text-xs text-slate-400">暂无档位</p>
            )}
            {form.制品规格书.人工规格清单.map((档位, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500">
                    档位 {i + 1}
                  </span>
                  <DelBtn
                    onClick={() =>
                      set规格书(
                        "人工规格清单",
                        form.制品规格书.人工规格清单.filter((_, j) => j !== i),
                      )
                    }
                  />
                </div>
                <人工档位编辑器
                  value={档位}
                  onChange={(v) => {
                    const next = [...form.制品规格书.人工规格清单];
                    next[i] = v;
                    set规格书("人工规格清单", next);
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── 工艺说明 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>工艺说明</SectionTitle>
              <AddBtn
                onClick={() =>
                  set规格书("工艺说明", [
                    ...form.制品规格书.工艺说明,
                    empty工艺说明(),
                  ])
                }
              />
            </div>
            {form.制品规格书.工艺说明.length === 0 && (
              <p className="text-xs text-slate-400">暂无</p>
            )}
            {form.制品规格书.工艺说明.map((行, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500">
                    说明 {i + 1}
                  </span>
                  <DelBtn
                    onClick={() =>
                      set规格书(
                        "工艺说明",
                        form.制品规格书.工艺说明.filter((_, j) => j !== i),
                      )
                    }
                  />
                </div>
                <工艺说明编辑器
                  value={行}
                  onChange={(v) => {
                    const next = [...form.制品规格书.工艺说明];
                    next[i] = v;
                    set规格书("工艺说明", next);
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── 染色档位映射图 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>染色档位映射图</SectionTitle>
              <AddBtn
                onClick={() =>
                  set规格书("染色档位映射图", [
                    ...form.制品规格书.染色档位映射图,
                    empty染色档位映射图(),
                  ])
                }
              />
            </div>
            {form.制品规格书.染色档位映射图.length === 0 && (
              <p className="text-xs text-slate-400">暂无</p>
            )}
            {form.制品规格书.染色档位映射图.map((项, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500">
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

          {/* ── 高针指示单 ── */}
          <div className={sectionCls}>
            <SectionTitle>高针指示单</SectionTitle>
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
                placeholder="例如: 高针 :1.高针后帽子不能变形。"
                value={form.高针指示单.注意事项}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    高针指示单: { ...f.高针指示单, 注意事项: e.target.value },
                  }))
                }
              />
            </Field>
          </div>

          {/* ── 手织指示单 ── */}
          <div className={sectionCls}>
            <SectionTitle>手织指示单</SectionTitle>
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
            <Field label="注意事项">
              <textarea
                rows={3}
                className={inputCls}
                placeholder="例如: 手织 :1.手织后帽子不能变形。"
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
              <p className="mb-1 text-xs font-medium text-slate-700">
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

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            className="rounded px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={handleClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            form="add-file-form"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "提交中…" : "添加"}
          </button>
        </div>
      </div>
    </div>
  );
}
