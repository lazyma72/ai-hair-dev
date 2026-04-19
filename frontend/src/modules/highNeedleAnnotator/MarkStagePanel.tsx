import * as React from "react";
import type { DmlValue } from "./types";
import type {
  DML按档位标记命令,
  DML区域百分比命令,
  DML特殊标记命令,
  DML规则命令,
} from "../../shared/models/DML规则";

type Props = {
  step: "DML" | "单双";
  clearDmlStage: () => void;
  clearDoubleStage: () => void;
  dmlRuleCommands?: DML规则命令[];
  regionNames?: string[];
  levelNames?: string[];
  dmlRegionRules?: Array<{
    id: string;
    规律: Array<"D" | "M" | "L">;
    区域百分比: Array<{ 区域: string; 开始位置: number; 结束位置: number }>;
  }>;
  dmlLevelRules?: Array<{
    id: string;
    规律: Array<"D" | "M" | "L">;
    档位: Array<{ 档位名称: string; 开始位置: number; 结束位置: number }>;
  }>;
  dmlSpecialCount?: number;
  addDmlRegionRule?: () => void;
  updateDmlRegionRule?: (
    ruleId: string,
    patch: { 区域?: string; 开始位置?: number; 结束位置?: number; 规律?: Array<"D" | "M" | "L"> },
  ) => void;
  addDmlLevelRule?: () => void;
  updateDmlLevelRule?: (
    ruleId: string,
    patch: { 档位名称?: string; 开始位置?: number; 结束位置?: number; 规律?: Array<"D" | "M" | "L"> },
  ) => void;
  addDmlSpecialRule?: () => void;
  removeDmlRule?: (ruleId: string) => void;
  activeDmlRuleId?: string;
  activeDmlRuleType?: "区域百分比" | "按档位标记" | "特殊标记";
  activeSpecialDmlValue?: DmlValue;
  selectDmlRule?: (ruleId: string, ruleType: "区域百分比" | "按档位标记") => void;
  selectSpecialDmlRule?: (value: string) => void;
  setActiveSpecialDmlValue?: (value: DmlValue) => void;
  clearActiveDmlRule?: () => void;
};

export default function MarkStagePanel({
  step,
  clearDmlStage,
  clearDoubleStage,
  dmlRuleCommands = [],
  regionNames = [],
  levelNames = [],
  dmlRegionRules = [],
  dmlLevelRules = [],
  dmlSpecialCount = 0,
  addDmlRegionRule,
  updateDmlRegionRule,
  addDmlLevelRule,
  updateDmlLevelRule,
  addDmlSpecialRule,
  removeDmlRule,
  activeDmlRuleId,
  activeDmlRuleType,
  activeSpecialDmlValue = "D",
  selectDmlRule,
  selectSpecialDmlRule,
  setActiveSpecialDmlValue,
  clearActiveDmlRule,
}: Props) {
  const [newRuleType, setNewRuleType] = React.useState<
    "区域百分比" | "按档位标记" | "特殊标记"
  >("区域百分比");

  const specialRule = React.useMemo<DML特殊标记命令 | null>(
    () =>
      dmlRuleCommands.find(
        (item): item is DML特殊标记命令 => item.type === "特殊标记",
      ) ?? null,
    [dmlRuleCommands],
  );

  const handleAddRule = () => {
    if (newRuleType === "区域百分比") {
      addDmlRegionRule?.();
      return;
    }
    if (newRuleType === "按档位标记") {
      addDmlLevelRule?.();
      return;
    }
    addDmlSpecialRule?.();
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {step === "DML"
          ? "默认模式下拖动图上的 DML 文本。先点选一条规律进入 DML 标记模式，再沿线滑动修改这条规律覆盖的范围。"
          : "点击线条：切换是否双数（加粗显示）"}
      </div>

      {step === "DML" ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            说明：DML 规则分三层。先按区域规律，再按档位规律，最后用右键逐条修正形成特殊规律覆盖前面结果。
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
            <div>
              <div className="text-xs font-semibold text-slate-700">当前模式</div>
              <div className="mt-1 text-xs text-slate-500">
                {activeDmlRuleId
                  ? `规则标记模式：${
                      activeDmlRuleType === "区域百分比"
                        ? "区域规律"
                        : activeDmlRuleType === "按档位标记"
                          ? "档位规律"
                          : `特殊规律（${activeSpecialDmlValue}）`
                    }`
                  : "默认模式：拖动 DML 文本节点"}
              </div>
            </div>
            <button
              type="button"
              className="rounded bg-white px-2 py-1 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
              onClick={() => clearActiveDmlRule?.()}
            >
              默认模式
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            选中某条规律后，左键沿线滑动会修改这条规律的覆盖范围；特殊规律则按输入的 D/M/L 批量覆盖。再次从已选线条开始滑动可取消。未选中规律时，左键只用于拖动现有 DML 文本。右键仍可对单条线循环切换 D/M/L/清空。
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">规律列表</div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                  value={newRuleType}
                  onChange={(e) =>
                    setNewRuleType(
                      e.target.value as "区域百分比" | "按档位标记" | "特殊标记",
                    )
                  }
                >
                  <option value="区域百分比">区域规律</option>
                  <option value="按档位标记">档位规律</option>
                  <option value="特殊标记">特殊规律</option>
                </select>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  onClick={handleAddRule}
                >
                  新增规律
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {dmlRuleCommands.map((rule, index) => {
                const isActive = activeDmlRuleId === rule.id && activeDmlRuleType === rule.type;
                return (
                  <div
                    key={rule.id}
                    className={`rounded border p-2 transition ${
                      isActive
                        ? "border-sky-400 bg-sky-50 shadow-sm"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                          #{index + 1}
                        </div>
                        <div className="rounded bg-white px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
                          {rule.type === "区域百分比"
                            ? "区域规律"
                            : rule.type === "按档位标记"
                              ? "档位规律"
                              : "特殊规律"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-sky-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                          onClick={() =>
                            rule.type === "特殊标记"
                              ? selectSpecialDmlRule?.(activeSpecialDmlValue)
                              : selectDmlRule?.(rule.id, rule.type)
                          }
                        >
                          {isActive ? "已选中" : "选中后画线"}
                        </button>
                        <div className="text-[11px] text-slate-500">ID: {rule.id}</div>
                      </div>
                    </div>
                    {rule.type === "区域百分比" ? (() => {
                      const regionRule = rule as DML区域百分比命令;
                      const segment =
                        regionRule.区域百分比[0] ?? { 区域: "", 开始位置: 0, 结束位置: 1 };
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.区域}
                            onChange={(e) =>
                              updateDmlRegionRule?.(regionRule.id, {
                                区域: e.target.value,
                              })
                            }
                          >
                            {regionNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={regionRule.规律.join("")}
                            onChange={(e) =>
                              updateDmlRegionRule?.(regionRule.id, {
                                规律: e.target.value
                                  .toUpperCase()
                                  .split("")
                                  .filter(
                                    (ch): ch is "D" | "M" | "L" =>
                                      ch === "D" || ch === "M" || ch === "L",
                                  ),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.开始位置}
                            onChange={(e) =>
                              updateDmlRegionRule?.(regionRule.id, {
                                开始位置: Number(e.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.结束位置}
                            onChange={(e) =>
                              updateDmlRegionRule?.(regionRule.id, {
                                结束位置: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      );
                    })() : rule.type === "按档位标记" ? (() => {
                      const levelRule = rule as DML按档位标记命令;
                      const segment =
                        levelRule.档位[0] ?? { 档位名称: "", 开始位置: 0, 结束位置: 1 };
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.档位名称}
                            onChange={(e) =>
                              updateDmlLevelRule?.(levelRule.id, {
                                档位名称: e.target.value,
                              })
                            }
                          >
                            {levelNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={levelRule.规律.join("")}
                            onChange={(e) =>
                              updateDmlLevelRule?.(levelRule.id, {
                                规律: e.target.value
                                  .toUpperCase()
                                  .split("")
                                  .filter(
                                    (ch): ch is "D" | "M" | "L" =>
                                      ch === "D" || ch === "M" || ch === "L",
                                  ),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.开始位置}
                            onChange={(e) =>
                              updateDmlLevelRule?.(levelRule.id, {
                                开始位置: Number(e.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                            value={segment.结束位置}
                            onChange={(e) =>
                              updateDmlLevelRule?.(levelRule.id, {
                                结束位置: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      );
                    })() : (() => {
                      const special = rule as DML特殊标记命令;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-20 rounded border border-slate-200 px-2 py-1 text-sm uppercase"
                              maxLength={1}
                              value={activeSpecialDmlValue}
                              onChange={(e) => {
                                const next = e.target.value.toUpperCase();
                                if (next !== "D" && next !== "M" && next !== "L") {
                                  return;
                                }
                                setActiveSpecialDmlValue?.(next);
                              }}
                            />
                            <div className="text-xs text-slate-500">
                              输入 D / M / L，然后勾选线条形成特殊覆盖
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-600">
                            当前已记录 {special.标记.length || dmlSpecialCount} 条特殊覆盖线
                          </div>
                        </>
                      );
                    })()}
                    <button
                      type="button"
                      className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      onClick={() => removeDmlRule?.(rule.id)}
                    >
                      删除
                    </button>
                  </div>
                );
              })}
              {dmlRuleCommands.length === 0 ? (
                <div className="rounded border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  还没有规律，先选择类型再新增。
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-100"
          onClick={step === "DML" ? clearDmlStage : clearDoubleStage}
        >
          清空本阶段
        </button>
      </div>
    </div>
  );
}
