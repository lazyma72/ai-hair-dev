import * as React from "react";
import type { 制品规格书 } from "../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";
import type {
  手织指示单Frontend,
  高针指示单Frontend,
} from "../../shared/frontend/model/model";
import { formatInchText } from "../../pages/admin/add-file/components/DyeLevelEditor";
import {
  NumInput,
  OneDecimalInput,
  OptionalQuarterFractionInput,
  PresetTextInput,
  QuarterFractionInput,
  TextInput,
} from "../../pages/admin/add-file/components/ui";
import { 美容方向预置选项 } from "../../shared/models/美容方向预置列表";
import { 轻重TS预置选项 } from "../../shared/models/形态预置列表";

type MachineRow = 制品规格书["机器规格清单"][number];
type ManualRow = 制品规格书["人工规格清单"][number];
type DMLKey = "D" | "M" | "L";
type DMLMode = "D:L" | "D:M" | "D:M:L";
const compactTableInputCls = "min-h-7 px-1.5 py-1 text-[11px] leading-tight";
const compactTableFlexInputCls = `${compactTableInputCls} min-w-0 flex-1`;
const compactTableTextareaCls =
  "min-h-[4.5rem] px-1.5 py-1.5 text-[11px] leading-tight text-left resize-y";

function fmtNum(value: number | undefined) {
  if (value == null) return "—";
  return value.toFixed(2);
}

function fmtFrac(value: number | undefined) {
  if (value == null) return "—";
  const n = Math.round(value * 4) / 4;
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 4);
  const fracStr = ["", "\u00bc", "\u00bd", "\u00be"][frac] ?? "";
  if (whole === 0 && !fracStr) return "0";
  if (whole === 0) return fracStr;
  return fracStr ? `${whole}${fracStr}` : String(whole);
}

function Cell({
  children,
  rowSpan,
  align = "center",
  narrow = false,
}: {
  children: React.ReactNode;
  rowSpan?: number;
  align?: "left" | "center";
  narrow?: boolean;
}) {
  return (
    <td
      rowSpan={rowSpan}
      className={`border border-slate-300 px-1 py-1 text-[11px] leading-tight text-slate-800 ${
        narrow ? "min-w-[3.75rem] tabular-nums" : "min-w-[4.5rem]"
      } ${
        align === "left"
          ? "text-left align-top"
          : "text-center align-middle tabular-nums"
      }`}
    >
      {children}
    </td>
  );
}

function Header({
  children,
  colSpan,
  rowSpan,
  narrow = false,
}: {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  narrow?: boolean;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border border-slate-300 bg-slate-100 px-1 py-1 text-center text-[11px] font-semibold leading-tight text-slate-700 ${
        narrow ? "min-w-[3.75rem]" : "min-w-[4.5rem]"
      }`}
    >
      {children}
    </th>
  );
}

function TableShell({
  children,
  topSlot,
}: {
  children: React.ReactNode;
  topSlot?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
      {topSlot ? (
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          {topSlot}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse bg-white text-xs">
          {children}
        </table>
      </div>
    </div>
  );
}

type 间色比例值 = {
  D: number;
  M?: number;
  L?: number;
};

function toOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getDMLMode(dml?: 间色比例值): DMLMode {
  if (dml?.M != null && dml?.L != null) return "D:M:L";
  if (dml?.M != null) return "D:M";
  return "D:L";
}

function getDMLKeysByMode(mode: DMLMode): DMLKey[] {
  if (mode === "D:M") return ["D", "M"];
  if (mode === "D:M:L") return ["D", "M", "L"];
  return ["D", "L"];
}

function getDMLRatio(dml?: 间色比例值): Required<间色比例值> {
  const mode = getDMLMode(dml);
  return {
    D: toOneDecimal(dml?.D ?? 1),
    M: mode === "D:L" ? 0 : toOneDecimal(dml?.M ?? 1),
    L: mode === "D:M" ? 0 : toOneDecimal(dml?.L ?? 1),
  };
}

function patchDMLMode<T extends { DML比值?: 间色比例值 }>(
  value: T,
  mode: DMLMode,
): T {
  const ratio = getDMLRatio(value.DML比值);
  if (mode === "D:M") {
    return {
      ...value,
      DML比值: { D: ratio.D, M: ratio.M, L: undefined },
    };
  }
  if (mode === "D:M:L") {
    return {
      ...value,
      DML比值: { D: ratio.D, M: ratio.M, L: ratio.L },
    };
  }
  return {
    ...value,
    DML比值: { D: ratio.D, M: undefined, L: ratio.L },
  };
}

function patchDMLValue<T extends { DML比值?: 间色比例值 }>(
  value: T,
  key: DMLKey,
  next: number,
): T {
  const mode = getDMLMode(value.DML比值);
  const ratio = getDMLRatio(value.DML比值);
  return {
    ...value,
    DML比值: {
      D: key === "D" ? toOneDecimal(next) : ratio.D,
      M:
        mode !== "D:L"
          ? key === "M"
            ? toOneDecimal(next)
            : ratio.M
          : undefined,
      L:
        mode !== "D:M"
          ? key === "L"
            ? toOneDecimal(next)
            : ratio.L
          : undefined,
    },
  };
}

function RatioModeEditor<T extends { DML比值?: 间色比例值 }>({
  value,
  onChange,
}: {
  value: T;
  onChange: (next: T) => void;
}) {
  const mode = getDMLMode(value.DML比值);
  const ratio = getDMLRatio(value.DML比值);
  const activeKeys = getDMLKeysByMode(mode);

  return (
    <div className="min-w-[10rem] space-y-1">
      <div className="text-[11px] text-slate-700">
        <select
          className="w-[4.75rem] rounded border border-slate-200 px-1.5 py-1 text-[11px] outline-none focus:ring-2 focus:ring-slate-300"
          value={mode}
          onChange={(e) =>
            onChange(patchDMLMode(value, e.target.value as DMLMode))
          }
        >
          <option value="D:L">D:L</option>
          <option value="D:M">D:M</option>
          <option value="D:M:L">D:M:L</option>
        </select>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-slate-700">
        {activeKeys.map((key, index) => (
          <React.Fragment key={key}>
            <div className="w-12">
              <OneDecimalInput
                value={ratio[key]}
                className="min-h-6 px-1 py-0.5 text-[11px]"
                onChange={(n) => onChange(patchDMLValue(value, key, n))}
              />
            </div>
            {index < activeKeys.length - 1 ? (
              <span className="text-slate-400">:</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function getT色DML比值(
  hasM: boolean,
  hasL: boolean,
): MachineRow["DML比值"] | undefined {
  if (hasM && hasL) return { D: 3, M: 3, L: 4 };
  if (hasM) return { D: 4, M: 6 };
  if (hasL) return { D: 4, L: 6 };
  return undefined;
}

function getT色HasM(dml?: MachineRow["DML比值"]): boolean {
  return dml?.M != null;
}

function getT色HasL(dml?: MachineRow["DML比值"]): boolean {
  return dml?.L != null;
}

function getMachineRowFactor(rowIndex: number, totalRows: number): number {
  if (totalRows <= 1) return 1;
  if (totalRows === 2) return rowIndex === 0 ? 0.4 : 0.6;
  return rowIndex < 2 ? 0.3 : 0.4;
}

function getMachineActiveWeightKeys(
  row: MachineRow,
  type: 假发类型,
  splitFlags?: { hasM: boolean; hasL: boolean },
): DMLKey[] {
  if (type === 假发类型.间色) return getDMLKeysByMode(getDMLMode(row.DML比值));
  if (type === 假发类型.T色) {
    const keys: DMLKey[] = ["D"];
    if (getT色HasM(row.DML比值)) keys.push("M");
    if (getT色HasL(row.DML比值)) keys.push("L");
    return keys;
  }
  if (type === 假发类型.上下分) {
    const keys: DMLKey[] = ["D"];
    if (splitFlags?.hasM) keys.push("M");
    if (splitFlags?.hasL) keys.push("L");
    return keys;
  }
  return ["D"];
}

function getManualActiveWeightKeys(
  row: 可编辑人工档位,
  type: 假发类型,
  splitFlags?: { hasM: boolean; hasL: boolean },
): DMLKey[] {
  if (type === 假发类型.间色) return getDMLKeysByMode(getDMLMode(row.DML比值));
  if (type === 假发类型.上下分) {
    const keys: DMLKey[] = ["D"];
    if (splitFlags?.hasM) keys.push("M");
    if (splitFlags?.hasL) keys.push("L");
    return keys;
  }
  if (type === 假发类型.纯色) return ["D"];

  const keys: DMLKey[] = ["D"];
  if (row.裁断与重量.some((item) => item.重量g?.M != null)) keys.push("M");
  if (row.裁断与重量.some((item) => item.重量g?.L != null)) keys.push("L");
  return keys;
}

type T色重量行Map = Partial<Record<DMLKey, number>>;

function shouldStoreMachineWeight(
  row: MachineRow,
  type: 假发类型,
  rowIndex: number,
  key: DMLKey,
  t色重量行: T色重量行Map = {},
  splitFlags?: { hasM: boolean; hasL: boolean },
): boolean {
  if (type === 假发类型.T色) {
    const targetRow = t色重量行[key] ?? 0;
    if (rowIndex !== targetRow) return false;
    return getMachineActiveWeightKeys(row, type, splitFlags).includes(key);
  }
  return getMachineActiveWeightKeys(row, type, splitFlags).includes(key);
}

function calcMachineWeight(
  row: MachineRow,
  type: 假发类型,
  item: MachineRow["裁断与重量"][number],
  rowIndex: number,
  totalRows: number,
  key: DMLKey,
  t色重量行: T色重量行Map = {},
  splitFlags?: { hasM: boolean; hasL: boolean },
): number {
  const rowFactor = getMachineRowFactor(rowIndex, totalRows);
  const 密度 = row.双针.密度;
  const 尺数D = row.双针.尺数.D;

  if (type === 假发类型.间色) {
    const dml = getDMLRatio(row.DML比值);
    const totalDML = dml.D + dml.M + dml.L;
    const ratio = key === "D" ? dml.D : key === "M" ? dml.M : dml.L;
    return (
      ((item.裁断 * 密度 * 尺数D * 2.54) / 100 / 2) *
      rowFactor *
      (totalDML > 0 ? ratio / totalDML : 0)
    );
  }

  if (type === 假发类型.上下分) {
    if (key === "M" && !splitFlags?.hasM) return 0;
    if (key === "L" && !splitFlags?.hasL) return 0;
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
  row: MachineRow,
  type: 假发类型,
  t色重量行: T色重量行Map = {},
  splitFlags?: { hasM: boolean; hasL: boolean },
): MachineRow {
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
            key,
            t色重量行,
            splitFlags,
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
          splitFlags,
        );
      });
      return {
        ...item,
        重量g,
      };
    }),
  };
}

export function ExcelStyleMachineTable({ rows }: { rows: MachineRow[] }) {
  return <ExcelStyleMachineTableInner rows={rows} />;
}

function ExcelStyleMachineTableInner({
  rows,
  editable = false,
  onChange,
  onInsertRowAfter,
  假发类型: type = 假发类型.纯色,
  hasGlobalM = false,
  hasGlobalL = false,
}: {
  rows: MachineRow[];
  editable?: boolean;
  onChange?: (rows: MachineRow[]) => void;
  onInsertRowAfter?: (rowIndex: number) => void;
  假发类型?: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
}) {
  const [t色重量行ByRow, setT色重量行ByRow] = React.useState<
    Record<number, T色重量行Map>
  >({});
  const showWeightM =
    type === 假发类型.上下分
      ? hasGlobalM
      : rows.some((row) => getMachineActiveWeightKeys(row, type).includes("M"));
  const showWeightL =
    type === 假发类型.上下分
      ? hasGlobalL
      : rows.some((row) => getMachineActiveWeightKeys(row, type).includes("L"));
  const show尺数M = type === 假发类型.上下分 && hasGlobalM;
  const show尺数L = type === 假发类型.上下分 && hasGlobalL;
  const hasAny对裁 = rows.some((row) => row.整毛.对裁 != null);
  const show对裁 = editable || hasAny对裁;
  const show间色比例列 = editable && type === 假发类型.间色;
  const weightColCount = 1 + (showWeightM ? 1 : 0) + (showWeightL ? 1 : 0);
  const doubleNeedleColCount = 3 + (show尺数M ? 1 : 0) + (show尺数L ? 1 : 0);
  const colSpan =
    1 +
    1 +
    (show对裁 ? 2 : 1) +
    (show间色比例列 ? 1 : 0) +
    weightColCount +
    doubleNeedleColCount +
    1 +
    3 +
    1;
  const editableColSpan = colSpan + (editable ? 1 : 0);

  function emit(next: MachineRow[]) {
    onChange?.(
      next.map((row, index) => ({
        ...syncMachineWeights(row, type, t色重量行ByRow[index] ?? {}, {
          hasM: hasGlobalM,
          hasL: hasGlobalL,
        }),
        档位: String(index + 1),
      })),
    );
  }

  function patchRow(
    rowIndex: number,
    updater: (row: MachineRow) => MachineRow,
  ) {
    emit(rows.map((row, index) => (index === rowIndex ? updater(row) : row)));
  }

  function toggleAll对裁(enabled: boolean) {
    emit(
      rows.map((row) => {
        if (enabled) {
          return {
            ...row,
            整毛: {
              ...row.整毛,
              对裁: row.整毛.对裁 ?? 0,
            },
          };
        }
        const { 对裁: _omit, ...rest } = row.整毛;
        return {
          ...row,
          整毛: rest,
        };
      }),
    );
  }

  React.useEffect(() => {
    if (type !== 假发类型.T色) return;
    setT色重量行ByRow((prev) => {
      const next: Record<number, T色重量行Map> = {};
      rows.forEach((row, rowIndex) => {
        const maxIdx = Math.max(0, row.裁断与重量.length - 1);
        const prevMap = prev[rowIndex] ?? {};
        const resolved: T色重量行Map = {};
        (["D", "M", "L"] as const).forEach((key) => {
          const idxFromData = row.裁断与重量.findIndex(
            (item) =>
              item.重量g?.[key] != null && (item.重量g[key] as number) > 0,
          );
          const fallback = idxFromData >= 0 ? idxFromData : 0;
          resolved[key] = Math.min(prevMap[key] ?? fallback, maxIdx);
        });
        next[rowIndex] = resolved;
      });
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, [rows, type]);

  return (
    <TableShell
      topSlot={
        editable ? (
          <div className="text-xs text-slate-500">
            直接在表格中修改，重量列自动计算且不可编辑。
          </div>
        ) : undefined
      }
    >
      <thead>
        <tr>
          <Header rowSpan={2}>档位</Header>
          <Header rowSpan={2} narrow>
            裁断
          </Header>
          <Header colSpan={show对裁 ? 2 : 1}>整毛</Header>
          {show间色比例列 ? <Header rowSpan={2}>DML比例</Header> : null}
          <Header colSpan={weightColCount}>重量 g</Header>
          <Header colSpan={doubleNeedleColCount}>双针</Header>
          <Header rowSpan={2}>形态</Header>
          <Header colSpan={3}>美容</Header>
          <Header rowSpan={2}>备注</Header>
          {editable ? <Header rowSpan={2}>操作</Header> : null}
        </tr>
        <tr>
          <Header narrow>拉尖</Header>
          {show对裁 ? (
            <Header narrow>
              {editable ? (
                <label className="flex items-center justify-center gap-1 text-[10px] text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300"
                    checked={hasAny对裁}
                    onChange={(e) => toggleAll对裁(e.target.checked)}
                  />
                  <span>对裁</span>
                </label>
              ) : (
                "对裁"
              )}
            </Header>
          ) : null}
          <Header narrow>D</Header>
          {showWeightM ? <Header narrow>M</Header> : null}
          {showWeightL ? <Header narrow>L</Header> : null}
          <Header narrow>毛长</Header>
          <Header narrow>尺数 D</Header>
          {show尺数M ? <Header narrow>尺数 M</Header> : null}
          {show尺数L ? <Header narrow>尺数 L</Header> : null}
          <Header narrow>密度</Header>
          <Header narrow>铝管</Header>
          <Header>方向</Header>
          <Header narrow>层数</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={editableColSpan}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              <div className="flex flex-col items-center gap-3">
                <div>暂无机器规格清单</div>
                {editable ? (
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    onClick={() => onInsertRowAfter?.(-1)}
                  >
                    + 添加档位
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        ) : (
          rows.flatMap((row, rowIndex) => {
            const cutRows =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            const hasM尺数 = row.双针.尺数.M != null;
            const hasL尺数 = row.双针.尺数.L != null;
            const activeWeightKeys = getMachineActiveWeightKeys(row, type, {
              hasM: hasGlobalM,
              hasL: hasGlobalL,
            });
            const t色重量行 = t色重量行ByRow[rowIndex] ?? {};

            const groupRows = cutRows.map((item, index) => (
              <tr key={`${row.档位 || "row"}-${index}`} className="bg-white">
                {index === 0 ? (
                  <Cell rowSpan={cutRows.length}>
                    {editable ? (
                      <div className="space-y-2">
                        <div className="font-medium">{row.档位 || "—"}</div>
                        <div className="flex flex-col gap-1">
                          {type === 假发类型.T色 ? (
                            <>
                              <label className="flex items-center gap-1 text-[10px] text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={getT色HasM(row.DML比值)}
                                  onChange={(e) =>
                                    patchRow(rowIndex, (current) => ({
                                      ...current,
                                      DML比值: getT色DML比值(
                                        e.target.checked,
                                        getT色HasL(current.DML比值),
                                      ),
                                    }))
                                  }
                                />
                                <span>M重量</span>
                              </label>
                              <label className="flex items-center gap-1 text-[10px] text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={getT色HasL(row.DML比值)}
                                  onChange={(e) =>
                                    patchRow(rowIndex, (current) => ({
                                      ...current,
                                      DML比值: getT色DML比值(
                                        getT色HasM(current.DML比值),
                                        e.target.checked,
                                      ),
                                    }))
                                  }
                                />
                                <span>L重量</span>
                              </label>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200"
                            onClick={() =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                裁断与重量: [
                                  ...current.裁断与重量,
                                  { 裁断: 0 },
                                ],
                              }))
                            }
                          >
                            + 裁断行
                          </button>
                          <button
                            type="button"
                            aria-label="删除档位"
                            title="删除档位"
                            className="rounded px-2 py-1 text-sm leading-none text-slate-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() =>
                              emit(
                                rows.filter(
                                  (_, currentRowIndex) =>
                                    currentRowIndex !== rowIndex,
                                ),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      row.档位 || "—"
                    )}
                  </Cell>
                ) : null}
                <Cell narrow>
                  {editable ? (
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={item.裁断}
                        className={compactTableFlexInputCls}
                        onChange={(n) =>
                          patchRow(rowIndex, (current) => ({
                            ...current,
                            裁断与重量: current.裁断与重量.map(
                              (cut, cutIndex) =>
                                cutIndex === index ? { ...cut, 裁断: n } : cut,
                            ),
                          }))
                        }
                        step="1"
                      />
                      <button
                        type="button"
                        disabled={cutRows.length <= 1}
                        aria-label="删除裁断行"
                        title="删除裁断行"
                        className={`rounded px-1 py-1 text-[10px] ${
                          cutRows.length <= 1
                            ? "cursor-not-allowed text-slate-200"
                            : "text-base leading-none text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                        onClick={() =>
                          patchRow(rowIndex, (current) => ({
                            ...current,
                            裁断与重量: current.裁断与重量.filter(
                              (_, cutIndex) => cutIndex !== index,
                            ),
                          }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    fmtNum(item.裁断)
                  )}
                </Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <QuarterFractionInput
                          value={row.整毛.拉尖}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              整毛: { ...current.整毛, 拉尖: n },
                            }))
                          }
                        />
                      ) : (
                        fmtFrac(row.整毛.拉尖)
                      )}
                    </Cell>
                    {show对裁 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable ? (
                          <OptionalQuarterFractionInput
                            enabled={hasAny对裁}
                            value={row.整毛.对裁 ?? 0}
                            className={compactTableInputCls}
                            onChange={(n) =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                整毛: { ...current.整毛, 对裁: n },
                              }))
                            }
                          />
                        ) : (
                          fmtFrac(row.整毛.对裁)
                        )}
                      </Cell>
                    ) : null}
                    {show间色比例列 ? (
                      <Cell rowSpan={cutRows.length} align="left">
                        <RatioModeEditor
                          value={row}
                          onChange={(next) => patchRow(rowIndex, () => next)}
                        />
                      </Cell>
                    ) : null}
                  </>
                ) : null}
                <Cell narrow>
                  {fmtNum(
                    calcMachineWeight(
                      row,
                      type,
                      item,
                      index,
                      cutRows.length,
                      "D",
                      t色重量行,
                      {
                        hasM: hasGlobalM,
                        hasL: hasGlobalL,
                      },
                    ),
                  )}
                </Cell>
                {showWeightM ? (
                  <Cell narrow>
                    {activeWeightKeys.includes("M")
                      ? fmtNum(
                          calcMachineWeight(
                            row,
                            type,
                            item,
                            index,
                            cutRows.length,
                            "M",
                            t色重量行,
                            {
                              hasM: hasGlobalM,
                              hasL: hasGlobalL,
                            },
                          ),
                        )
                      : "—"}
                  </Cell>
                ) : null}
                {showWeightL ? (
                  <Cell narrow>
                    {activeWeightKeys.includes("L")
                      ? fmtNum(
                          calcMachineWeight(
                            row,
                            type,
                            item,
                            index,
                            cutRows.length,
                            "L",
                            t色重量行,
                            {
                              hasM: hasGlobalM,
                              hasL: hasGlobalL,
                            },
                          ),
                        )
                      : "—"}
                  </Cell>
                ) : null}
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <QuarterFractionInput
                          value={row.双针.毛长}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              双针: { ...current.双针, 毛长: n },
                            }))
                          }
                        />
                      ) : (
                        fmtFrac(row.双针.毛长)
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <NumInput
                          value={row.双针.尺数.D}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              双针: {
                                ...current.双针,
                                尺数: { ...current.双针.尺数, D: n },
                              },
                            }))
                          }
                        />
                      ) : (
                        fmtNum(row.双针.尺数.D)
                      )}
                    </Cell>
                    {show尺数M ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable && type === 假发类型.上下分 && hasM尺数 ? (
                          <NumInput
                            value={row.双针.尺数.M ?? 0}
                            className={compactTableInputCls}
                            onChange={(n) =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                双针: {
                                  ...current.双针,
                                  尺数: { ...current.双针.尺数, M: n },
                                },
                              }))
                            }
                          />
                        ) : (
                          fmtNum(row.双针.尺数.M)
                        )}
                      </Cell>
                    ) : null}
                    {show尺数L ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable && type === 假发类型.上下分 && hasL尺数 ? (
                          <NumInput
                            value={row.双针.尺数.L ?? 0}
                            className={compactTableInputCls}
                            onChange={(n) =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                双针: {
                                  ...current.双针,
                                  尺数: { ...current.双针.尺数, L: n },
                                },
                              }))
                            }
                          />
                        ) : (
                          fmtNum(row.双针.尺数.L)
                        )}
                      </Cell>
                    ) : null}
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <NumInput
                          value={row.双针.密度}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              双针: { ...current.双针, 密度: n },
                            }))
                          }
                        />
                      ) : (
                        fmtNum(row.双针.密度)
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>
                      {editable ? (
                        <PresetTextInput
                          value={row.形态 ?? ""}
                          className={compactTableInputCls}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              形态: v || undefined,
                            }))
                          }
                          options={轻重TS预置选项}
                          placeholder="可选"
                        />
                      ) : (
                        row.形态 || "—"
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <NumInput
                          value={row.美容.铝管}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              美容: { ...current.美容, 铝管: n },
                            }))
                          }
                        />
                      ) : (
                        fmtNum(row.美容.铝管)
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>
                      {editable ? (
                        <PresetTextInput
                          value={row.美容.方向 || ""}
                          className={compactTableInputCls}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              美容: { ...current.美容, 方向: v },
                            }))
                          }
                          options={美容方向预置选项}
                          placeholder="方向"
                        />
                      ) : (
                        row.美容.方向 || "—"
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <NumInput
                          value={row.美容.层数}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              美容: { ...current.美容, 层数: n },
                            }))
                          }
                          step="1"
                        />
                      ) : (
                        fmtNum(row.美容.层数)
                      )}
                    </Cell>
                    <Cell
                      rowSpan={cutRows.length}
                      align={editable ? "left" : "left"}
                    >
                      {editable ? (
                        <TextInput
                          value={row.备注 ?? ""}
                          className={compactTableTextareaCls}
                          multiline
                          rows={3}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              备注: v || undefined,
                            }))
                          }
                          placeholder="可选"
                        />
                      ) : (
                        row.备注 || "—"
                      )}
                    </Cell>
                    {editable ? (
                      <Cell rowSpan={cutRows.length}>
                        {type === 假发类型.T色 && cutRows.length > 1 ? (
                          <div className="space-y-1">
                            {activeWeightKeys.map((key) => (
                              <label
                                key={key}
                                className="flex items-center gap-1 text-[10px] text-slate-700"
                              >
                                <input
                                  type="radio"
                                  name={`t色重量行-${rowIndex}-${key}`}
                                  checked={(t色重量行[key] ?? 0) === 0}
                                  onChange={() =>
                                    setT色重量行ByRow((prev) => ({
                                      ...prev,
                                      [rowIndex]: {
                                        ...(prev[rowIndex] ?? {}),
                                        [key]: 0,
                                      },
                                    }))
                                  }
                                />
                                <span>{key}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            自动算重
                          </div>
                        )}
                      </Cell>
                    ) : null}
                  </>
                ) : null}
              </tr>
            ));

            if (editable && type === 假发类型.T色 && cutRows.length > 1) {
              groupRows.unshift(
                <tr key={`${row.档位 || "row"}-tcolor`} className="bg-slate-50">
                  <td
                    colSpan={editableColSpan}
                    className="border border-slate-300 px-2 py-1 text-[10px] text-slate-600"
                  >
                    <div className="flex flex-wrap gap-3">
                      {activeWeightKeys.map((key) => (
                        <div key={key} className="flex items-center gap-1">
                          <span>{key} 重量在</span>
                          {cutRows.map((_, cutIndex) => (
                            <label
                              key={cutIndex}
                              className="flex items-center gap-1"
                            >
                              <input
                                type="radio"
                                name={`t色重量行-${rowIndex}-${key}`}
                                checked={(t色重量行[key] ?? 0) === cutIndex}
                                onChange={() =>
                                  setT色重量行ByRow((prev) => ({
                                    ...prev,
                                    [rowIndex]: {
                                      ...(prev[rowIndex] ?? {}),
                                      [key]: cutIndex,
                                    },
                                  }))
                                }
                              />
                              <span>{cutIndex + 1}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>,
              );
            }

            if (editable && rowIndex === rows.length - 1) {
              groupRows.push(
                <tr key={`${row.档位 || "row"}-insert`} className="bg-slate-50">
                  <td
                    colSpan={editableColSpan}
                    className="border border-slate-300 px-1 py-1"
                  >
                    <button
                      type="button"
                      aria-label="添加档位"
                      title="添加档位"
                      className="mx-auto flex h-6 w-6 items-center justify-center rounded border border-dashed border-slate-300 text-sm leading-none text-slate-500 hover:bg-white hover:text-slate-900"
                      onClick={() => onInsertRowAfter?.(rows.length - 1)}
                    >
                      +
                    </button>
                  </td>
                </tr>,
              );
            }

            return groupRows;
          })
        )}
      </tbody>
    </TableShell>
  );
}

export function ExcelStyleManualTable({ rows }: { rows: ManualRow[] }) {
  return <ExcelStyleManualTableInner rows={rows} />;
}

type 可编辑人工档位 = ManualRow & {
  DML比值?: 间色比例值;
};

function ExcelStyleManualTableInner({
  rows,
  editable = false,
  onChange,
  onInsertRowAfter,
  假发类型: type = 假发类型.纯色,
  hasGlobalM = false,
  hasGlobalL = false,
}: {
  rows: ManualRow[];
  editable?: boolean;
  onChange?: (rows: ManualRow[]) => void;
  onInsertRowAfter?: (rowIndex: number) => void;
  假发类型?: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
}) {
  const editableRows = rows as 可编辑人工档位[];
  const showWeightM = editableRows.some((row) =>
    getManualActiveWeightKeys(row, type, {
      hasM: hasGlobalM,
      hasL: hasGlobalL,
    }).includes("M"),
  );
  const showWeightL = editableRows.some((row) =>
    getManualActiveWeightKeys(row, type, {
      hasM: hasGlobalM,
      hasL: hasGlobalL,
    }).includes("L"),
  );
  const hasAny对裁 = rows.some((row) => row.整毛.对裁 != null);
  const show对裁 = editable || hasAny对裁;
  const hasAny磅发 = rows.some((row) => row.双针.磅发 != null);
  const show磅发 = editable || hasAny磅发;
  const hasAny密度 = rows.some((row) => row.双针.密度 != null);
  const show密度 = editable || hasAny密度;
  const show间色比例列 = editable && type === 假发类型.间色;
  const weightColCount = 1 + (showWeightM ? 1 : 0) + (showWeightL ? 1 : 0);
  const doubleNeedleColCount = 1 + (show磅发 ? 1 : 0) + (show密度 ? 1 : 0);
  const colSpan =
    1 +
    1 +
    (show对裁 ? 2 : 1) +
    (show间色比例列 ? 1 : 0) +
    weightColCount +
    doubleNeedleColCount +
    1 +
    1 +
    1 +
    1;
  const editableColSpan = colSpan;

  function emit(next: ManualRow[]) {
    onChange?.(next);
  }

  function patchRow(rowIndex: number, updater: (row: ManualRow) => ManualRow) {
    emit(rows.map((row, index) => (index === rowIndex ? updater(row) : row)));
  }

  function renumberRows(next: ManualRow[]) {
    return next.map((row, index) => ({
      ...row,
      档位: `H${index + 1}`,
    }));
  }

  function toggleAll对裁(enabled: boolean) {
    emit(
      rows.map((row) => {
        if (enabled) {
          return {
            ...row,
            整毛: {
              ...row.整毛,
              对裁: row.整毛.对裁 ?? 0,
            },
          };
        }
        const { 对裁: _omit, ...rest } = row.整毛;
        return {
          ...row,
          整毛: rest,
        };
      }),
    );
  }

  function toggleAll磅发(enabled: boolean) {
    emit(
      rows.map((row) => {
        if (enabled) {
          return {
            ...row,
            双针: { ...row.双针, 磅发: row.双针.磅发 ?? 0 },
          };
        }
        const { 磅发: _omit, ...rest } = row.双针;
        return { ...row, 双针: rest };
      }) as ManualRow[],
    );
  }

  function toggleAll密度(enabled: boolean) {
    emit(
      rows.map((row) => {
        if (enabled) {
          return {
            ...row,
            双针: { ...row.双针, 密度: row.双针.密度 ?? 0 },
          };
        }
        const { 密度: _omit, ...rest } = row.双针;
        return { ...row, 双针: rest };
      }) as ManualRow[],
    );
  }

  return (
    <TableShell
      topSlot={
        editable ? (
          <div className="text-xs text-slate-500">直接在表格中修改。</div>
        ) : undefined
      }
    >
      <thead>
        <tr>
          <Header rowSpan={2}>档位</Header>
          <Header rowSpan={2} narrow>
            裁断
          </Header>
          <Header colSpan={show对裁 ? 2 : 1}>整毛</Header>
          {show间色比例列 ? <Header rowSpan={2}>DML比例</Header> : null}
          <Header colSpan={weightColCount}>重量 g</Header>
          <Header colSpan={doubleNeedleColCount}>双针</Header>
          <Header rowSpan={2}>形态</Header>
          <Header rowSpan={2}>美容铝管</Header>
          <Header rowSpan={2}>位置</Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>拉尖</Header>
          {show对裁 ? (
            <Header narrow>
              {editable ? (
                <label className="flex items-center justify-center gap-1 text-[10px] text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300"
                    checked={hasAny对裁}
                    onChange={(e) => toggleAll对裁(e.target.checked)}
                  />
                  <span>对裁</span>
                </label>
              ) : (
                "对裁"
              )}
            </Header>
          ) : null}
          <Header narrow>D</Header>
          {showWeightM ? <Header narrow>M</Header> : null}
          {showWeightL ? <Header narrow>L</Header> : null}
          <Header narrow>毛长</Header>
          {show磅发 ? (
            <Header narrow>
              {editable ? (
                <label className="flex items-center justify-center gap-1 text-[10px] text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300"
                    checked={hasAny磅发}
                    onChange={(e) => toggleAll磅发(e.target.checked)}
                  />
                  <span>磅发</span>
                </label>
              ) : (
                "磅发"
              )}
            </Header>
          ) : null}
          {show密度 ? (
            <Header narrow>
              {editable ? (
                <label className="flex items-center justify-center gap-1 text-[10px] text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300"
                    checked={hasAny密度}
                    onChange={(e) => toggleAll密度(e.target.checked)}
                  />
                  <span>密度</span>
                </label>
              ) : (
                "密度"
              )}
            </Header>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={editableColSpan}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              <div className="flex flex-col items-center gap-3">
                <div>暂无人工规格清单</div>
                {editable ? (
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    onClick={() => onInsertRowAfter?.(-1)}
                  >
                    + 添加档位
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        ) : (
          editableRows.flatMap((row, rowIndex) => {
            const cutRows =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            const activeWeightKeys = getManualActiveWeightKeys(row, type, {
              hasM: hasGlobalM,
              hasL: hasGlobalL,
            });
            const groupRows = cutRows.map((item, index) => (
              <tr key={`${row.档位 || "row"}-${index}`} className="bg-white">
                {index === 0 ? (
                  <Cell rowSpan={cutRows.length}>
                    {editable ? (
                      <div className="space-y-2">
                        <div className="font-medium">{row.档位 || "—"}</div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200"
                            onClick={() =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                裁断与重量: [
                                  ...current.裁断与重量,
                                  { 裁断: 0 },
                                ],
                              }))
                            }
                          >
                            + 裁断行
                          </button>
                          <button
                            type="button"
                            aria-label="删除档位"
                            title="删除档位"
                            className="rounded px-2 py-1 text-sm leading-none text-slate-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() =>
                              emit(
                                renumberRows(
                                  rows.filter(
                                    (_, currentRowIndex) =>
                                      currentRowIndex !== rowIndex,
                                  ),
                                ),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      row.档位 || "—"
                    )}
                  </Cell>
                ) : null}
                <Cell narrow>
                  {editable ? (
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={item.裁断}
                        className={compactTableFlexInputCls}
                        onChange={(n) =>
                          patchRow(rowIndex, (current) => ({
                            ...current,
                            裁断与重量: current.裁断与重量.map(
                              (cut, cutIndex) =>
                                cutIndex === index ? { ...cut, 裁断: n } : cut,
                            ),
                          }))
                        }
                        step="1"
                      />
                      <button
                        type="button"
                        disabled={cutRows.length <= 1}
                        aria-label="删除裁断行"
                        title="删除裁断行"
                        className={`rounded px-1 py-1 text-[10px] ${
                          cutRows.length <= 1
                            ? "cursor-not-allowed text-slate-200"
                            : "text-base leading-none text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                        onClick={() =>
                          patchRow(rowIndex, (current) => ({
                            ...current,
                            裁断与重量: current.裁断与重量.filter(
                              (_, cutIndex) => cutIndex !== index,
                            ),
                          }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    fmtNum(item.裁断)
                  )}
                </Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <QuarterFractionInput
                          value={row.整毛.拉尖}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              整毛: { ...current.整毛, 拉尖: n },
                            }))
                          }
                        />
                      ) : (
                        fmtFrac(row.整毛.拉尖)
                      )}
                    </Cell>
                    {show对裁 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable ? (
                          <OptionalQuarterFractionInput
                            enabled={hasAny对裁}
                            value={row.整毛.对裁 ?? 0}
                            className={compactTableInputCls}
                            onChange={(n) =>
                              patchRow(rowIndex, (current) => ({
                                ...current,
                                整毛: { ...current.整毛, 对裁: n },
                              }))
                            }
                          />
                        ) : (
                          fmtFrac(row.整毛.对裁)
                        )}
                      </Cell>
                    ) : null}
                    {show间色比例列 ? (
                      <Cell rowSpan={cutRows.length} align="left">
                        <RatioModeEditor
                          value={row}
                          onChange={(next) =>
                            patchRow(rowIndex, () => next as 可编辑人工档位)
                          }
                        />
                      </Cell>
                    ) : null}
                  </>
                ) : null}
                <Cell narrow>
                  {editable ? (
                    <NumInput
                      value={item.重量g?.D ?? 0}
                      className={compactTableInputCls}
                      onChange={(n) =>
                        patchRow(rowIndex, (current) => ({
                          ...current,
                          裁断与重量: current.裁断与重量.map((cut, cutIndex) =>
                            cutIndex === index
                              ? {
                                  ...cut,
                                  重量g: { ...(cut.重量g ?? { D: 0 }), D: n },
                                }
                              : cut,
                          ),
                        }))
                      }
                    />
                  ) : (
                    fmtNum(item.重量g?.D)
                  )}
                </Cell>
                {showWeightM ? (
                  <Cell narrow>
                    {editable ? (
                      activeWeightKeys.includes("M") ? (
                        <NumInput
                          value={item.重量g?.M ?? 0}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              裁断与重量: current.裁断与重量.map(
                                (cut, cutIndex) =>
                                  cutIndex === index
                                    ? {
                                        ...cut,
                                        重量g: {
                                          ...(cut.重量g ?? { D: 0 }),
                                          M: n,
                                        },
                                      }
                                    : cut,
                              ),
                            }))
                          }
                        />
                      ) : null
                    ) : activeWeightKeys.includes("M") ? (
                      fmtNum(item.重量g?.M)
                    ) : (
                      "—"
                    )}
                  </Cell>
                ) : null}
                {showWeightL ? (
                  <Cell narrow>
                    {editable ? (
                      activeWeightKeys.includes("L") ? (
                        <NumInput
                          value={item.重量g?.L ?? 0}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              裁断与重量: current.裁断与重量.map(
                                (cut, cutIndex) =>
                                  cutIndex === index
                                    ? {
                                        ...cut,
                                        重量g: {
                                          ...(cut.重量g ?? { D: 0 }),
                                          L: n,
                                        },
                                      }
                                    : cut,
                              ),
                            }))
                          }
                        />
                      ) : null
                    ) : activeWeightKeys.includes("L") ? (
                      fmtNum(item.重量g?.L)
                    ) : (
                      "—"
                    )}
                  </Cell>
                ) : null}
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <QuarterFractionInput
                          value={row.双针.毛长}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              双针: { ...current.双针, 毛长: n },
                            }))
                          }
                        />
                      ) : (
                        fmtFrac(row.双针.毛长)
                      )}
                    </Cell>
                    {show磅发 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable ? (
                          hasAny磅发 ? (
                            <NumInput
                              value={row.双针.磅发 ?? 0}
                              className={compactTableInputCls}
                              onChange={(n) =>
                                patchRow(rowIndex, (current) => ({
                                  ...current,
                                  双针: { ...current.双针, 磅发: n },
                                }))
                              }
                            />
                          ) : null
                        ) : row.双针.磅发 != null ? (
                          `磅${row.双针.磅发}g/扎`
                        ) : (
                          "—"
                        )}
                      </Cell>
                    ) : null}
                    {show密度 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {editable ? (
                          hasAny密度 ? (
                            <NumInput
                              value={row.双针.密度 ?? 0}
                              className={compactTableInputCls}
                              onChange={(n) =>
                                patchRow(rowIndex, (current) => ({
                                  ...current,
                                  双针: { ...current.双针, 密度: n },
                                }))
                              }
                            />
                          ) : null
                        ) : (
                          fmtNum(row.双针.密度)
                        )}
                      </Cell>
                    ) : null}
                    <Cell rowSpan={cutRows.length}>
                      {editable ? (
                        <PresetTextInput
                          value={row.形态 ?? ""}
                          className={compactTableInputCls}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              形态: v || undefined,
                            }))
                          }
                          options={轻重TS预置选项}
                          placeholder="可选"
                        />
                      ) : (
                        row.形态 || "—"
                      )}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {editable ? (
                        <NumInput
                          value={row.美容.铝管}
                          className={compactTableInputCls}
                          onChange={(n) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              美容: { ...current.美容, 铝管: n },
                            }))
                          }
                        />
                      ) : (
                        fmtNum(row.美容.铝管)
                      )}
                    </Cell>
                    <Cell
                      rowSpan={cutRows.length}
                      align={editable ? "left" : "center"}
                    >
                      {editable ? (
                        <TextInput
                          value={row.位置 ?? ""}
                          className={compactTableTextareaCls}
                          multiline
                          rows={3}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              位置: v || undefined,
                            }))
                          }
                          placeholder="可选"
                        />
                      ) : (
                        row.位置 || "—"
                      )}
                    </Cell>
                    <Cell
                      rowSpan={cutRows.length}
                      align={editable ? "left" : "left"}
                    >
                      {editable ? (
                        <TextInput
                          value={row.备注 ?? ""}
                          className={compactTableTextareaCls}
                          multiline
                          rows={3}
                          onChange={(v) =>
                            patchRow(rowIndex, (current) => ({
                              ...current,
                              备注: v || undefined,
                            }))
                          }
                          placeholder="可选"
                        />
                      ) : (
                        row.备注 || "—"
                      )}
                    </Cell>
                  </>
                ) : null}
              </tr>
            ));

            // Only keep one compact insert row at the end of the whole table
            if (editable && rowIndex === rows.length - 1) {
              groupRows.push(
                <tr key={`${row.档位 || "row"}-insert`} className="bg-slate-50">
                  <td
                    colSpan={editableColSpan}
                    className="border border-slate-300 px-1 py-1"
                  >
                    <button
                      type="button"
                      aria-label="添加档位"
                      title="添加档位"
                      className="mx-auto flex h-6 w-6 items-center justify-center rounded border border-dashed border-slate-300 text-sm leading-none text-slate-500 hover:bg-white hover:text-slate-900"
                      onClick={() => onInsertRowAfter?.(rows.length - 1)}
                    >
                      +
                    </button>
                  </td>
                </tr>,
              );
            }

            return groupRows;
          })
        )}
      </tbody>
    </TableShell>
  );
}

export function EditableExcelStyleManualTable({
  rows,
  onChange,
  onInsertRowAfter,
  假发类型,
  hasGlobalM,
  hasGlobalL,
}: {
  rows: ManualRow[];
  onChange: (rows: ManualRow[]) => void;
  onInsertRowAfter?: (rowIndex: number) => void;
  假发类型: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
}) {
  return (
    <ExcelStyleManualTableInner
      rows={rows}
      editable
      onChange={onChange}
      onInsertRowAfter={onInsertRowAfter}
      假发类型={假发类型}
      hasGlobalM={hasGlobalM}
      hasGlobalL={hasGlobalL}
    />
  );
}

export function EditableExcelStyleMachineTable({
  rows,
  onChange,
  onInsertRowAfter,
  假发类型,
  hasGlobalM,
  hasGlobalL,
}: {
  rows: MachineRow[];
  onChange: (rows: MachineRow[]) => void;
  onInsertRowAfter?: (rowIndex: number) => void;
  假发类型: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
}) {
  return (
    <ExcelStyleMachineTableInner
      rows={rows}
      editable
      onChange={onChange}
      onInsertRowAfter={onInsertRowAfter}
      假发类型={假发类型}
      hasGlobalM={hasGlobalM}
      hasGlobalL={hasGlobalL}
    />
  );
}

type HighNeedleImageRow = 高针指示单Frontend["机器规格清单_高针图"][number];
type HandWovenImageRow = 手织指示单Frontend["人工规格清单_手织图"][number];

function fmtIntLike(value: number | undefined) {
  if (value == null) return "";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function fmtInchCell(value: number | undefined) {
  if (value == null) return "";
  return formatInchText(value);
}

export function ExcelStyleHighNeedleImageTable({
  rows,
}: {
  rows: HighNeedleImageRow[];
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2} narrow>
            档位
          </Header>
          <Header rowSpan={2} narrow>
            毛长
          </Header>
          <Header colSpan={3}>长度</Header>
          <Header rowSpan={2} narrow>
            形态
          </Header>
          <Header rowSpan={2} narrow>
            管径 Φ
          </Header>
          <Header rowSpan={2} narrow>
            方向
          </Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>D</Header>
          <Header narrow>M</Header>
          <Header narrow>L</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无机器规格清单（高针图版）
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.档位 || Math.random()} className="bg-white">
              <Cell narrow>{row.档位 || "—"}</Cell>
              <Cell narrow>{fmtInchCell(row.毛长)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.D)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.M)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.L)}</Cell>
              <Cell>{row.形态 || ""}</Cell>
              <Cell narrow>{fmtIntLike(row.管径)}</Cell>
              <Cell>{row.方向 || ""}</Cell>
              <Cell align="left">{row.备注 || ""}</Cell>
            </tr>
          ))
        )}
      </tbody>
    </TableShell>
  );
}

export function ExcelStyleHandWovenImageTable({
  rows,
}: {
  rows: HandWovenImageRow[];
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2} narrow>
            档位
          </Header>
          <Header rowSpan={2} narrow>
            整毛
          </Header>
          <Header rowSpan={2} narrow>
            毛长
          </Header>
          <Header colSpan={3}>重量: g</Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>D</Header>
          <Header narrow>M</Header>
          <Header narrow>L</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无人工规格清单（手织图版）
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.档位 || Math.random()} className="bg-white">
              <Cell narrow>{row.档位 || "—"}</Cell>
              <Cell narrow>{fmtIntLike(row.整长)}</Cell>
              <Cell narrow>{fmtInchCell(row.毛长)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.D)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.M)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.L)}</Cell>
              <Cell align="left">{row.位置 || ""}</Cell>
            </tr>
          ))
        )}
      </tbody>
    </TableShell>
  );
}
