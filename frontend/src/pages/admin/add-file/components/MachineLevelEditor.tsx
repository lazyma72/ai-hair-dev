import * as React from "react";
import type {
  DML重量,
  制品规格书,
  裁断重量项,
} from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Field, NumInput, TextInput } from "./ui";

type 机器档位 = 制品规格书["机器规格清单"][number];

type Props = {
  value: 机器档位;
  onChange: (v: 机器档位) => void;
  是间色: boolean;
};

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
      {value.length > 0 ? (
        <div className="grid grid-cols-[55px_60px_60px_60px_auto] gap-1.5 px-1">
          {["裁断", "D(g)", "M(g)", "L(g)", ""].map((h) => (
            <div key={h} className="text-[10px] font-medium text-slate-400">
              {h}
            </div>
          ))}
        </div>
      ) : null}

      {value.map((row, i) => (
        <div
          key={`${row.裁断}-${row.重量g?.D ?? 0}-${row.重量g?.M ?? 0}-${row.重量g?.L ?? 0}`}
          className="grid grid-cols-[55px_60px_60px_60px_auto] items-center gap-1.5"
        >
          <NumInput value={row.裁断} onChange={(n) => update(i, { 裁断: n })} step="1" />
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

      <AddBtn label="+ 裁断行" onClick={() => onChange([...value, { 裁断: 0, 重量g: { D: 0 } }])} />
    </div>
  );
}

export default function MachineLevelEditor({ value, onChange, 是间色 }: Props) {
  function p<K extends keyof 机器档位>(key: K, val: 机器档位[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-20">
          <Field label="档位" required>
            <TextInput value={value.档位} onChange={(v) => p("档位", v)} placeholder="1" />
          </Field>
        </div>

        {是间色 ? (
          <>
            {(["D", "M", "L"] as const).map((k) => (
              <div key={k} className="w-20">
                <Field label={`DML·${k}`} required={k === "D"}>
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
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">裁断与重量</p>
        <裁断重量编辑器 value={value.裁断与重量} onChange={(v) => p("裁断与重量", v)} />
      </div>

      <div className="grid grid-cols-[65px_65px_65px_65px_65px_65px_65px] gap-2">
        <Field label="整毛·拉尖">
          <NumInput value={value.整毛.拉尖} onChange={(n) => p("整毛", { ...value.整毛, 拉尖: n })} />
        </Field>
        <Field label="整毛·对裁">
          <NumInput
            value={value.整毛.对裁 ?? 0}
            onChange={(n) => p("整毛", { ...value.整毛, 对裁: n || undefined })}
          />
        </Field>
        <Field label="双针·毛长">
          <NumInput value={value.双针.毛长} onChange={(n) => p("双针", { ...value.双针, 毛长: n })} />
        </Field>
        <Field label="双针·密度">
          <NumInput value={value.双针.密度} onChange={(n) => p("双针", { ...value.双针, 密度: n })} />
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

      <Field label="形态">
        <TextInput value={value.形态 ?? ""} onChange={(v) => p("形态", v || undefined)} placeholder="可选" />
      </Field>

      <div className="grid grid-cols-[65px_1fr_65px] gap-2">
        <Field label="美容·铝管">
          <NumInput value={value.美容.铝管} onChange={(n) => p("美容", { ...value.美容, 铝管: n })} />
        </Field>
        <Field label="美容·方向" required>
          <TextInput value={value.美容.方向} onChange={(v) => p("美容", { ...value.美容, 方向: v })} />
        </Field>
        <Field label="美容·层数">
          <NumInput value={value.美容.层数} onChange={(n) => p("美容", { ...value.美容, 层数: n })} step="1" />
        </Field>
      </div>

      <Field label="备注">
        <TextInput value={value.备注 ?? ""} onChange={(v) => p("备注", v || undefined)} placeholder="可选" />
      </Field>
    </div>
  );
}
