import { ExcelStyleManualTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 轻重TS预置选项 } from "../../../../shared/models/形态预置列表";
import {
  AddBtn,
  DelBtn,
  Field,
  NumInput,
  OptionalQuarterFractionInput,
  PresetTextInput,
  QuarterFractionInput,
  Section,
  TextInput,
} from "../components/ui";
import { empty人工档位 } from "../defaults";

type 人工档位 = 制品规格书["人工规格清单"][number];
type 人工双针 = 人工档位["双针"] & { 密度: number };

const MAX_CUT_WEIGHT_ITEMS = 3;

function fmtWeight(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getRowFactor(rowIndex: number, totalRows: number): number {
  if (totalRows <= 1) return 1;
  if (totalRows === 2) return rowIndex === 0 ? 0.4 : 0.6;
  return rowIndex < 2 ? 0.3 : 0.4;
}

function calcManualWeight(
  裁断: number,
  密度: number,
  rowIndex: number,
  totalRows: number,
  has对裁: boolean,
): number {
  let w = 裁断 * 密度 * 0.5 * getRowFactor(rowIndex, totalRows);
  if (has对裁) w /= 2;
  return w;
}

function applyManualWeights(list: 人工档位[]): 人工档位[] {
  return list.map((档位) => {
    const 双针 = 档位.双针 as 人工双针;
    const totalRows = 档位.裁断与重量.length;
    const has对裁 =
      档位.整毛.对裁 !== undefined && 档位.整毛.对裁 !== null;
    return {
      ...档位,
      裁断与重量: 档位.裁断与重量.map((item, rowIndex) => {
        const weight = calcManualWeight(
          item.裁断,
          双针.密度,
          rowIndex,
          totalRows,
          has对裁,
        );
        return {
          ...item,
          重量g: {
            D: weight,
            M: weight,
            L: weight,
          },
        };
      }),
    };
  });
}

type Props = {
  list: 制品规格书["人工规格清单"];
  onChange: (v: 制品规格书["人工规格清单"]) => void;
  error?: string;
  clearError?: () => void;
};

export default function ManualSpecSection({
  list,
  onChange,
  error,
  clearError,
}: Props) {
  function emit(next: 人工档位[]) {
    clearError?.();
    onChange(applyManualWeights(next));
  }

  return (
    <Section
      title="人工规格清单"
      error={error}
      action={
        <AddBtn
          onClick={() => {
            emit([
              ...list,
              { ...empty人工档位(), 档位: `H${list.length + 1}` },
            ]);
          }}
        />
      }
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无档位</p>
      ) : (
        <div className="space-y-2">
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500">
              当前预览
            </div>
            <ExcelStyleManualTable rows={list} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 text-xs font-medium text-slate-500">
              编辑明细
            </div>
            <div className="grid grid-cols-[60px_130px_130px_130px_70px_70px_1fr_55px_1fr_auto] gap-2 px-3">
              {[
                "档位",
                "整毛·拉尖",
                "整毛·对裁",
                "双针·毛长",
                "双针·磅发g",
                "双针·密度",
                "形态",
                "美容·铝管",
                "备注",
                "",
              ].map((h) => (
                <div
                  key={h || "action"}
                  className="text-[10px] font-medium text-slate-400"
                >
                  {h}
                </div>
              ))}
            </div>

            {list.map((档位, i) => {
              const 双针 = 档位.双针 as 人工双针;
              const has对裁 =
                档位.整毛.对裁 !== undefined && 档位.整毛.对裁 !== null;
              const totalRows = 档位.裁断与重量.length;

              function p<K extends keyof 人工档位>(key: K, val: 人工档位[K]) {
                const next = [...list];
                next[i] = { ...next[i], [key]: val };
                emit(next);
              }

              return (
                <div
                  key={档位.档位}
                  className="grid grid-cols-[60px_130px_130px_130px_70px_70px_1fr_55px_1fr_auto] items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <TextInput
                    value={档位.档位}
                    onChange={(v) => p("档位", v)}
                    placeholder="H1"
                  />
                  <QuarterFractionInput
                    value={档位.整毛.拉尖}
                    onChange={(n) => p("整毛", { ...档位.整毛, 拉尖: n })}
                  />
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
                              p("整毛", { ...档位.整毛, 对裁: 0 });
                              return;
                            }

                            const { 对裁: _omit, ...rest } = 档位.整毛;
                            p("整毛", rest);
                          }}
                        />
                      </label>
                    }
                  >
                    <OptionalQuarterFractionInput
                      enabled={has对裁}
                      value={档位.整毛.对裁 ?? 0}
                      onChange={(n) =>
                        p("整毛", { ...档位.整毛, 对裁: n })
                      }
                    />
                  </Field>
                  <QuarterFractionInput
                    value={双针.毛长}
                    onChange={(n) =>
                      p("双针", { ...双针, 毛长: n } as 人工档位["双针"])
                    }
                  />
                  <NumInput
                    value={双针.磅发}
                    onChange={(n) =>
                      p("双针", { ...双针, 磅发: n } as 人工档位["双针"])
                    }
                  />
                  <NumInput
                    value={双针.密度}
                    onChange={(n) =>
                      p("双针", { ...双针, 密度: n } as 人工档位["双针"])
                    }
                  />
                  <PresetTextInput
                    value={档位.形态 ?? ""}
                    onChange={(v) => p("形态", v || undefined)}
                    options={轻重TS预置选项}
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
                  <DelBtn onClick={() => emit(list.filter((_, j) => j !== i))} />

                  <div className="col-span-full rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-slate-700">
                          裁断与重量
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          公式：裁断 * 密度 / 2 * 行系数；如存在整毛·对裁，再 / 2。D/M/L
                          三列当前显示相同值。
                        </div>
                      </div>
                      {档位.裁断与重量.length < MAX_CUT_WEIGHT_ITEMS ? (
                        <AddBtn
                          label="+ 裁断行"
                          onClick={() => {
                            const next = [...list];
                            next[i] = {
                              ...档位,
                              裁断与重量: [...档位.裁断与重量, { 裁断: 0 }],
                            };
                            emit(next);
                          }}
                        />
                      ) : null}
                    </div>

                    {档位.裁断与重量.length === 0 ? (
                      <div className="text-xs text-slate-400">暂无裁断行</div>
                    ) : (
                      <div className="space-y-1">
                        <div className="grid grid-cols-[70px_70px_70px_70px_auto] gap-1.5 px-1">
                          {["裁断", "D(g)", "M(g)", "L(g)", ""].map((h) => (
                            <div
                              key={h || "action"}
                              className="text-[10px] font-medium text-slate-400"
                            >
                              {h}
                            </div>
                          ))}
                        </div>

                        {档位.裁断与重量.map((item, rowIndex) => {
                          const weight = calcManualWeight(
                            item.裁断,
                            双针.密度,
                            rowIndex,
                            totalRows,
                            has对裁,
                          );

                          return (
                            <div
                              key={`${档位.档位}-cut-${rowIndex}`}
                              className="grid grid-cols-[70px_70px_70px_70px_auto] items-center gap-1.5"
                            >
                              <NumInput
                                value={item.裁断}
                                onChange={(n) => {
                                  const next = [...list];
                                  next[i] = {
                                    ...档位,
                                    裁断与重量: 档位.裁断与重量.map((row, idx) =>
                                      idx === rowIndex ? { ...row, 裁断: n } : row,
                                    ),
                                  };
                                  emit(next);
                                }}
                                step="1"
                              />
                              {(["D", "M", "L"] as const).map((key) => (
                                <div
                                  key={key}
                                  className="flex h-[34px] items-center justify-center rounded border border-slate-100 bg-white px-1.5 text-sm text-slate-700"
                                >
                                  {fmtWeight(weight)}
                                </div>
                              ))}
                              <DelBtn
                                disabled={档位.裁断与重量.length <= 1}
                                onClick={() => {
                                  const next = [...list];
                                  next[i] = {
                                    ...档位,
                                    裁断与重量: 档位.裁断与重量.filter(
                                      (_, idx) => idx !== rowIndex,
                                    ),
                                  };
                                  emit(next);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}
