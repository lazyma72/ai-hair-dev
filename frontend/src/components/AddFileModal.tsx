import { useState, useEffect, useMemo } from "react";
import { callApi } from "../api/callApi";
import type {
  DML重量,
  制品规格书,
  裁断重量项,
  染色档位,
  沐茵丝假发成品稿,
} from "../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../shared/db/Db沐茵丝假发成品稿";
import type { 胶丝比例ListItem } from "../shared/frontend/model/model";
import {
  普通染色档位,
  对折染色档位,
  错位染色档位,
} from "../shared/models/染色档位示例";

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
});

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
  染色档位列表: [],
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
        <Field label="备注">
          <TextInput
            value={value.备注 ?? ""}
            onChange={(v) => p("备注", v || undefined)}
            placeholder="可选"
          />
        </Field>
      </div>
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
        <Field label="备注">
          <TextInput
            value={value.备注 ?? ""}
            onChange={(v) => p("备注", v || undefined)}
            placeholder="可选"
          />
        </Field>
      </div>
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

// ── SVG 预览辅助 ────────────────────────────────────────

function updateSvgTextNode(svg: string, nodeId: string, text: string): string {
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

// 注意：示例文件中的变量名与 type 字段顺序对调，按 type 字段情就映射
const 染色示例 = {
  普通: 对折染色档位, // 对折染色档位.type === "普通"
  对折: 普通染色档位, // 普通染色档位.type === "对折"
  错位: 错位染色档位, // 错位染色档位.type === "错位"
} satisfies Record<染色档位["type"], 染色档位>;

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
      ? 列表.filter((d: string) => d !== 名)
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

// ── 主组件 ──────────────────────────────────────────────

export default function AddFileModal({ open, onClose, onSuccess }: Props) {
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
                { key: "客户编号", placeholder: "例如: XM" },
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

          {/* ── 胶丝比例 ── */}
          <div className={sectionCls}>
            <SectionTitle>胶丝比例</SectionTitle>
            <div className="grid grid-cols-[200px_1fr] gap-2">
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
                    list="modal-颜色编号列表"
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
                  <datalist id="modal-颜色编号列表">
                    {当前发丝种类颜色编号列表.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              </Field>
            </div>
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

          {/* ── 高针指示单 ── */}
          <div className={sectionCls}>
            <SectionTitle>高针指示单</SectionTitle>
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
                手织图 SVG
              </p>
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
            </div>
          </div>

          {/* ── 染色档位列表 ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <SectionTitle>染色档位列表</SectionTitle>
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
            </div>
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
