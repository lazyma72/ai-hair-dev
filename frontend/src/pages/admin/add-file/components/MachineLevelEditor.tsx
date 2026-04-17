import { useEffect, useState } from "react";
import type {
  制品规格书,
  裁断重量项,
} from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 美容方向预置选项 } from "../../../../shared/models/美容方向预置列表";
import { 轻重TS预置选项 } from "../../../../shared/models/形态预置列表";
import {
  AddBtn,
  DelBtn,
  Field,
  NumInput,
  OneDecimalInput,
  OptionalQuarterFractionInput,
  PresetTextInput,
  QuarterFractionInput,
  TextInput,
} from "./ui";

type 机器档位 = 制品规格书["机器规格清单"][number];
type DMLKey = "D" | "M" | "L";

type Props = {
  value: 机器档位;
  onChange: (v: 机器档位) => void;
  假发类型: 假发类型;
};

const MAX_CUT_WEIGHT_ITEMS = 3;
type DMLMode = "D:M" | "D:L" | "D:M:L";

function getDMLMode(dml?: 机器档位["DML比值"]): DMLMode {
  if (dml?.M != null && dml?.L != null) return "D:M:L";
  if (dml?.L != null) return "D:L";
  return "D:M";
}

/** T色固定比值：D:M=4:6, D:M:L=3:3:4, D:L=4:6 */
function getT色DML比值(
  hasM: boolean,
  hasL: boolean,
): 机器档位["DML比值"] | undefined {
  if (hasM && hasL) return { D: 3, M: 3, L: 4 };
  if (hasM) return { D: 4, M: 6 };
  if (hasL) return { D: 4, L: 6 };
  return undefined;
}

function getT色HasM(dml?: 机器档位["DML比值"]): boolean {
  return dml?.M != null;
}
function getT色HasL(dml?: 机器档位["DML比值"]): boolean {
  return dml?.L != null;
}

function fmtDML值(v: number | undefined): string {
  if (v == null) return "?";
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function fmtWeight(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getRowFactor(rowIndex: number, totalRows: number): number {
  if (totalRows <= 1) return 1;
  if (totalRows === 2) return rowIndex === 0 ? 0.4 : 0.6;
  return rowIndex < 2 ? 0.3 : 0.4;
}

function getMachineActiveWeightKeys(row: 机器档位, type: 假发类型): DMLKey[] {
  const dmlMode = getDMLMode(row.DML比值);
  const dmlKeys: DMLKey[] =
    dmlMode === "D:M"
      ? ["D", "M"]
      : dmlMode === "D:L"
        ? ["D", "L"]
        : ["D", "M", "L"];

  if (type === 假发类型.间色) return dmlKeys;
  if (type === 假发类型.T色) {
    const keys: DMLKey[] = ["D"];
    if (getT色HasM(row.DML比值)) keys.push("M");
    if (getT色HasL(row.DML比值)) keys.push("L");
    return keys;
  }
  if (type === 假发类型.上下分) {
    const keys: DMLKey[] = ["D"];
    if (row.双针.尺数.M != null) keys.push("M");
    if (row.双针.尺数.L != null) keys.push("L");
    return keys;
  }
  return ["D"];
}

type T色重量行Map = Partial<Record<DMLKey, number>>;

function shouldStoreMachineWeight(
  row: 机器档位,
  type: 假发类型,
  rowIndex: number,
  totalRows: number,
  key: DMLKey,
  t色重量行: T色重量行Map = {},
): boolean {
  if (type === 假发类型.T色) {
    const targetRow = t色重量行[key] ?? 0;
    if (rowIndex !== targetRow) return false;
    return getMachineActiveWeightKeys(row, type).includes(key);
  }

  return getMachineActiveWeightKeys(row, type).includes(key);
}

function calcMachineWeight(
  row: 机器档位,
  type: 假发类型,
  item: 裁断重量项,
  rowIndex: number,
  totalRows: number,
  key: DMLKey,
  t色重量行: T色重量行Map = {},
): number {
  const rowFactor = getRowFactor(rowIndex, totalRows);
  const 密度 = row.双针.密度;
  const 尺数D = row.双针.尺数.D;

  if (type === 假发类型.间色) {
    const dml = row.DML比值;
    const totalDML = (dml?.D ?? 1) + (dml?.M ?? 0) + (dml?.L ?? 0);
    const ratio =
      key === "D" ? (dml?.D ?? 1) : key === "M" ? (dml?.M ?? 0) : (dml?.L ?? 0);
    return (
      ((item.裁断 * 密度 * 尺数D * 2.54) / 100 / 2) *
      rowFactor *
      (totalDML > 0 ? ratio / totalDML : 0)
    );
  }

  if (type === 假发类型.上下分) {
    const 对应尺数 =
      key === "D"
        ? 尺数D
        : key === "M"
          ? (row.双针.尺数.M ?? 0)
          : (row.双针.尺数.L ?? 0);
    return ((item.裁断 * 密度 * 对应尺数 * 2.54) / 100 / 2) * rowFactor;
  }

  if (type === 假发类型.T色) {
    const targetRow = t色重量行[key] ?? 0;
    if (rowIndex !== targetRow) return 0;
    const dml = row.DML比值;
    const base = (item.裁断 * 密度 * 尺数D * 2.54) / 100 / 2;
    if (!dml) return key === "D" ? base : 0;
    const totalDML = (dml.D ?? 0) + (dml.M ?? 0) + (dml.L ?? 0);
    const ratio =
      key === "D" ? (dml.D ?? 0) : key === "M" ? (dml.M ?? 0) : (dml.L ?? 0);
    return totalDML > 0 ? (base * ratio) / totalDML : key === "D" ? base : 0;
  }

  return ((item.裁断 * 密度 * 尺数D * 2.54) / 100 / 2) * rowFactor;
}

function syncMachineWeights(
  row: 机器档位,
  type: 假发类型,
  t色重量行: T色重量行Map = {},
): 机器档位 {
  const totalRows = row.裁断与重量.length;

  return {
    ...row,
    裁断与重量: row.裁断与重量.map((item, rowIndex) => {
      const 重量g: { D: number; M?: number; L?: number } = { D: 0 };

      (["D", "M", "L"] as const).forEach((key) => {
        if (
          !shouldStoreMachineWeight(
            row,
            type,
            rowIndex,
            totalRows,
            key,
            t色重量行,
          )
        ) {
          return;
        }
        重量g[key] = calcMachineWeight(
          row,
          type,
          item,
          rowIndex,
          totalRows,
          key,
          t色重量行,
        );
      });

      return {
        ...item,
        重量g,
      };
    }),
  };
}

function 裁断重量编辑器({
  value,
  onChange,
  activeKeys,
  getWeight,
}: {
  value: 裁断重量项[];
  onChange: (v: 裁断重量项[]) => void;
  activeKeys: DMLKey[];
  getWeight: (
    row: 裁断重量项,
    rowIndex: number,
    totalRows: number,
    key: DMLKey,
  ) => number;
}) {
  const reachedMax = value.length >= MAX_CUT_WEIGHT_ITEMS;
  const canDelete = value.length > 1;
  const templateCols = `55px ${activeKeys.map(() => "60px").join(" ")} auto`;

  return (
    <div className="space-y-1">
      {value.length > 0 ? (
        <div
          className="grid gap-1.5 px-1"
          style={{ gridTemplateColumns: templateCols }}
        >
          {["裁断", ...activeKeys.map((k) => `${k}(g)`), ""].map((h) => (
            <div key={h} className="text-[10px] font-medium text-slate-400">
              {h}
            </div>
          ))}
        </div>
      ) : null}

      {value.map((row, i) => (
        <div
          key={`cut-weight-row-${i}`}
          className="grid items-center gap-1.5"
          style={{ gridTemplateColumns: templateCols }}
        >
          <NumInput
            value={row.裁断}
            onChange={(n) => {
              const next = [...value];
              next[i] = { ...row, 裁断: n };
              onChange(next);
            }}
            step="1"
          />
          {activeKeys.map((k) => (
            <div
              key={k}
              className="flex h-[34px] items-center justify-center rounded border border-slate-100 bg-slate-50 px-1.5 text-sm text-slate-700"
            >
              {fmtWeight(getWeight(row, i, value.length, k))}
            </div>
          ))}
          <DelBtn
            disabled={!canDelete}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          />
        </div>
      ))}

      <div className="space-y-1">
        {!reachedMax ? (
          <AddBtn
            label="+ 裁断行"
            onClick={() => onChange([...value, { 裁断: 0 }])}
          />
        ) : null}
        <p className="text-[10px] text-slate-400">
          裁断重量项最多 {MAX_CUT_WEIGHT_ITEMS} 个
        </p>
      </div>
    </div>
  );
}

export default function MachineLevelEditor({
  value,
  onChange,
  假发类型: type,
}: Props) {
  function p<K extends keyof 机器档位>(key: K, val: 机器档位[K]) {
    onChange(syncMachineWeights({ ...value, [key]: val }, type, t色重量行));
  }

  const dml = value.DML比值;
  const dmlMode = getDMLMode(dml);
  const has对裁 = value.整毛.对裁 != null;
  const 是间色 = type === 假发类型.间色;
  const 是上下分 = type === 假发类型.上下分;
  const 是T色 = type === 假发类型.T色;

  // T色：从数据初始化每个权重键对应的行号
  const [t色重量行, setT色重量行] = useState<T色重量行Map>(() => {
    if (type !== 假发类型.T色) return {};
    const result: T色重量行Map = {};
    for (const key of ["D", "M", "L"] as const) {
      const idx = value.裁断与重量.findIndex(
        (item) => item.重量g?.[key] != null && (item.重量g[key] as number) > 0,
      );
      result[key] = idx >= 0 ? idx : 0;
    }
    return result;
  });

  const dmlKeys: DMLKey[] =
    dmlMode === "D:M"
      ? ["D", "M"]
      : dmlMode === "D:L"
        ? ["D", "L"]
        : ["D", "M", "L"];

  const hasM尺数 = value.双针.尺数.M != null;
  const hasL尺数 = value.双针.尺数.L != null;
  const 密度 = value.双针.密度;
  const 尺数D = value.双针.尺数.D;
  const dmlKeysSig = dmlKeys.join(",");

  const activeWeightKeys: DMLKey[] = getMachineActiveWeightKeys(value, type);

  function getWeight(
    row: 裁断重量项,
    rowIndex: number,
    totalRows: number,
    key: DMLKey,
  ): number {
    return calcMachineWeight(
      value,
      type,
      row,
      rowIndex,
      totalRows,
      key,
      t色重量行,
    );
  }

  useEffect(() => {
    const synced = syncMachineWeights(value, type, t色重量行);
    const current = JSON.stringify(value.裁断与重量 ?? []);
    const next = JSON.stringify(synced.裁断与重量 ?? []);

    if (current !== next) {
      onChange(synced);
    }
  }, [onChange, type, value, t色重量行]);

  // Debug logging for weight calculation.
  // Default: logs in dev. In production, set `localStorage.debug_weight=1` to enable.
  useEffect(() => {
    const canLog =
      import.meta.env.DEV ||
      (typeof window !== "undefined" &&
        window.localStorage?.getItem("debug_weight") === "1");
    if (!canLog) return;

    const rows = value.裁断与重量 ?? [];
    const totalRows = rows.length;
    const d = dml?.D ?? 1;
    const m = dml?.M ?? 0;
    const l = dml?.L ?? 0;
    const totalDML = d + m + l;
    const keys = activeWeightKeys;

    const logs = rows.flatMap((row, rowIndex) => {
      const rowFactor = getRowFactor(rowIndex, totalRows);

      return keys.map((key) => {
        const base = ((row.裁断 * 密度 * 尺数D * 2.54) / 100 / 2) * rowFactor;
        const ratio = key === "D" ? d : key === "M" ? m : l;
        const ratioPart = totalDML > 0 ? ratio / totalDML : 0;

        const 对应尺数 =
          key === "D"
            ? 尺数D
            : key === "M"
              ? (value.双针.尺数.M ?? 0)
              : (value.双针.尺数.L ?? 0);

        const weight = getWeight(row, rowIndex, totalRows, key);

        return {
          档位: value.档位,
          假发类型: type,
          行: rowIndex + 1,
          裁断: row.裁断,
          密度,
          尺数D,
          对应尺数,
          rowFactor,
          对裁: has对裁,
          DML模式: dmlMode,
          key,
          ratio,
          totalDML,
          ratioPart,
          base,
          weight,
        };
      });
    });

    console.group(
      `[重量计算] 档位=${value.档位} 类型=${type} 模式=${dmlMode} D=${d} M=${m} L=${l} 密度=${密度} 尺数D=${尺数D} 对裁=${has对裁} 行数=${totalRows}`,
    );
    console.table(logs);
    console.groupEnd();
  }, [
    type,
    是间色,
    是上下分,
    是T色,
    dml?.D,
    dml?.M,
    dml?.L,
    dmlMode,
    dmlKeysSig,
    activeWeightKeys.join(","),
    has对裁,
    密度,
    尺数D,
    value.双针.尺数.M,
    value.双针.尺数.L,
    value.档位,
    value.裁断与重量,
    t色重量行,
  ]);

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      {/* 档位 + 类型相关控件 */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-20">
          <Field label="档位">
            <div className="flex h-[34px] items-center rounded border border-slate-100 bg-slate-50 px-2 text-sm font-medium text-slate-700">
              {value.档位}
            </div>
          </Field>
        </div>

        {是间色 ? (
          <>
            <div className="w-[120px]">
              <Field label="DML模式" required>
                <select
                  className="w-full rounded border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  value={dmlMode}
                  onChange={(e) => {
                    const mode = e.target.value as DMLMode;
                    const d = dml?.D ?? 1;
                    const m = dml?.M ?? 1;
                    const l = dml?.L ?? 1;
                    if (mode === "D:M") {
                      p("DML比值", { D: d, M: m, L: undefined });
                      return;
                    }
                    if (mode === "D:L") {
                      p("DML比值", { D: d, M: undefined, L: l });
                      return;
                    }
                    p("DML比值", { D: d, M: m, L: l });
                  }}
                >
                  <option value="D:M">D:M</option>
                  <option value="D:L">D:L</option>
                  <option value="D:M:L">D:M:L</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-col justify-end pb-2 text-xs text-slate-500">
              {`${dmlKeys.join(":")} = ${dmlKeys.map((k) => fmtDML值(dml?.[k])).join(":")}`}
            </div>

            {dmlKeys.map((k) => (
              <div key={k} className="w-20">
                <Field label={`DML·${k}`} required={k === "D"}>
                  <OneDecimalInput
                    value={dml?.[k] ?? (k === "D" ? 1 : 0)}
                    onChange={(n) => {
                      const base = { D: dml?.D ?? 1, M: dml?.M, L: dml?.L };
                      p("DML比值", { ...base, [k]: n });
                    }}
                  />
                </Field>
              </div>
            ))}
          </>
        ) : null}

        {是上下分 ? (
          <>
            <div className="flex flex-col justify-end pb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  checked={hasM尺数}
                  onChange={(e) => {
                    if (e.target.checked) {
                      p("双针", {
                        ...value.双针,
                        尺数: { ...value.双针.尺数, M: 0 },
                      });
                    } else {
                      const { M: _omit, ...rest } = value.双针.尺数;
                      p("双针", { ...value.双针, 尺数: rest });
                    }
                  }}
                />
                <span>存在M</span>
              </label>
            </div>
            <div className="flex flex-col justify-end pb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  checked={hasL尺数}
                  onChange={(e) => {
                    if (e.target.checked) {
                      p("双针", {
                        ...value.双针,
                        尺数: { ...value.双针.尺数, L: 0 },
                      });
                    } else {
                      const { L: _omit, ...rest } = value.双针.尺数;
                      p("双针", { ...value.双针, 尺数: rest });
                    }
                  }}
                />
                <span>存在L</span>
              </label>
            </div>
          </>
        ) : null}

        {是T色 ? (
          <>
            <div className="flex flex-col justify-end pb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  checked={getT色HasM(dml)}
                  onChange={(e) => {
                    const hasM = e.target.checked;
                    const hasL = getT色HasL(dml);
                    p("DML比值", getT色DML比值(hasM, hasL));
                  }}
                />
                <span>M重量 (4:6)</span>
              </label>
            </div>
            <div className="flex flex-col justify-end pb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  checked={getT色HasL(dml)}
                  onChange={(e) => {
                    const hasL = e.target.checked;
                    const hasM = getT色HasM(dml);
                    p("DML比值", getT色DML比值(hasM, hasL));
                  }}
                />
                <span>L重量 {getT色HasM(dml) ? "(3:3:4)" : "(4:6)"}</span>
              </label>
            </div>
          </>
        ) : null}
      </div>

      {/* 整毛 */}
      <div className="grid grid-cols-[100px_110px] gap-2">
        <Field label="整毛·拉尖">
          <QuarterFractionInput
            value={value.整毛.拉尖}
            onChange={(n) => p("整毛", { ...value.整毛, 拉尖: n })}
          />
        </Field>
        <Field
          label="整毛·对裁"
          labelExtra={
            <label className="flex items-center gap-1.5 text-xs font-normal text-slate-600">
              <span>对裁</span>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                checked={has对裁}
                onChange={(e) => {
                  if (e.target.checked) {
                    p("整毛", { ...value.整毛, 对裁: 0 });
                    return;
                  }
                  const { 对裁: _omit, ...rest } = value.整毛;
                  p("整毛", rest);
                }}
              />
            </label>
          }
        >
          <OptionalQuarterFractionInput
            enabled={has对裁}
            value={value.整毛.对裁 ?? 0}
            onChange={(n) => p("整毛", { ...value.整毛, 对裁: n })}
          />
        </Field>
      </div>

      {/* 裁断与重量 — 整毛·拉尖后 */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">
          裁断与重量
        </p>
        {是T色 && value.裁断与重量.length > 1 ? (
          <div className="mb-2 space-y-1">
            {(activeWeightKeys as DMLKey[]).map((key) => (
              <div key={key} className="flex flex-wrap items-center gap-2">
                <span className="w-16 text-[10px] text-slate-500">
                  {key} 重量在：
                </span>
                {value.裁断与重量.map((_, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-center gap-1 text-xs text-slate-700"
                  >
                    <input
                      type="radio"
                      name={`t色重量行-${value.档位}-${key}`}
                      checked={(t色重量行[key] ?? 0) === i}
                      onChange={() => {
                        const next = { ...t色重量行, [key]: i };
                        setT色重量行(next);
                        onChange(syncMachineWeights(value, type, next));
                      }}
                    />
                    行 {i + 1}
                  </label>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        <裁断重量编辑器
          value={value.裁断与重量}
          onChange={(v) => {
            const maxIdx = Math.max(0, v.length - 1);
            const clamped: T色重量行Map = {};
            let changed = false;
            for (const key of ["D", "M", "L"] as const) {
              const cur = t色重量行[key] ?? 0;
              const next = Math.min(cur, maxIdx);
              clamped[key] = next;
              if (next !== cur) changed = true;
            }
            if (changed) setT色重量行(clamped);
            p("裁断与重量", v);
          }}
          activeKeys={activeWeightKeys}
          getWeight={getWeight}
        />
      </div>

      {/* 双针 + 尺数 */}
      <div className="flex flex-wrap gap-2">
        <div className="w-[100px]">
          <Field label="双针·毛长">
            <QuarterFractionInput
              value={value.双针.毛长}
              onChange={(n) => p("双针", { ...value.双针, 毛长: n })}
            />
          </Field>
        </div>
        <div className="w-[70px]">
          <Field label="双针·密度">
            <NumInput
              value={value.双针.密度}
              onChange={(n) => p("双针", { ...value.双针, 密度: n })}
            />
          </Field>
        </div>
        <div className="w-[70px]">
          <Field label="尺数·D">
            <NumInput
              value={value.双针.尺数.D}
              onChange={(n) =>
                p("双针", {
                  ...value.双针,
                  尺数: { ...value.双针.尺数, D: n },
                })
              }
            />
          </Field>
        </div>
        {是上下分 && hasM尺数 ? (
          <div className="w-[90px]">
            <Field label="尺数·M">
              <NumInput
                value={value.双针.尺数.M ?? 0}
                onChange={(n) =>
                  p("双针", {
                    ...value.双针,
                    尺数: { ...value.双针.尺数, M: n },
                  })
                }
              />
            </Field>
          </div>
        ) : null}
        {是上下分 && hasL尺数 ? (
          <div className="w-[70px]">
            <Field label="尺数·L">
              <NumInput
                value={value.双针.尺数.L ?? 0}
                onChange={(n) =>
                  p("双针", {
                    ...value.双针,
                    尺数: { ...value.双针.尺数, L: n },
                  })
                }
              />
            </Field>
          </div>
        ) : null}
      </div>

      <Field label="形态">
        <PresetTextInput
          value={value.形态 ?? ""}
          onChange={(v) => p("形态", v || undefined)}
          options={轻重TS预置选项}
          placeholder="可选"
        />
      </Field>

      <div className="grid grid-cols-[65px_1fr_65px] gap-2">
        <Field label="美容·铝管">
          <NumInput
            value={value.美容.铝管}
            onChange={(n) => p("美容", { ...value.美容, 铝管: n })}
          />
        </Field>
        <Field label="美容·方向" required>
          <PresetTextInput
            value={value.美容.方向}
            onChange={(v) => p("美容", { ...value.美容, 方向: v })}
            options={美容方向预置选项}
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
