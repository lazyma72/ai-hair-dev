import * as React from "react";
import type { DmlValue } from "./types";
import { getDmlPatternPresets } from "./dmlAuto";
import type {
  DML按档位标记命令,
  DML区域百分比命令,
  DML特殊标记命令,
  DML规则命令,
  DML值,
} from "../../shared/models/DML规则";

type Props = {
  step: "DML" | "单双";
  clearDmlStage: () => void;
  clearDoubleStage: () => void;
  dmlRuleCommands?: DML规则命令[];
  regionNames?: string[];
  levelNames?: string[];
  dmlSpecialCount?: number;
  lineToRegionInfo?: Map<
    string,
    { 区域名: string; globalIndex: number; total: number }
  >;
  lineToLevelInfo?: Map<string, { 档位名称: string }>;
  regionOrderedLines?: Map<string, string[]>;
  levelOrderedLines?: Map<string, string[]>;
  addDmlRegionRule?: () => void;
  updateDmlRegionRule?: (ruleId: string, patch: { 规律?: string }) => void;
  addDmlLevelRule?: () => void;
  updateDmlLevelRule?: (ruleId: string, patch: { 规律?: string }) => void;
  addDmlSpecialRule?: () => void;
  removeDmlRule?: (ruleId: string) => void;
  activeDmlRuleId?: string;
  activeDmlRuleType?: "区域百分比" | "按档位标记" | "特殊标记";
  activeSpecialDmlValue?: DmlValue;
  selectDmlRule?: (
    ruleId: string,
    ruleType: "区域百分比" | "按档位标记",
  ) => void;
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
  dmlSpecialCount = 0,
  lineToRegionInfo,
  lineToLevelInfo,
  regionOrderedLines,
  levelOrderedLines,
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

  const patternPresets = React.useMemo(() => getDmlPatternPresets(), []);

  const specialRules = React.useMemo<DML特殊标记命令[]>(
    () =>
      (dmlRuleCommands ?? []).filter(
        (item): item is DML特殊标记命令 => item.type === "特殊标记",
      ),
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
            说明：DML
            规则分三层。先按区域规律，再按档位规律，最后用右键逐条修正形成特殊规律覆盖前面结果。
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
            <div>
              <div className="text-xs font-semibold text-slate-700">
                当前模式
              </div>
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
            选中某条规律后，左键沿线滑动会修改这条规律的覆盖范围；特殊规律则按输入的
            D/M/L
            批量覆盖。再次从已选线条开始滑动可取消。未选中规律时，左键只用于拖动现有
            DML 文本。右键仍可对单条线循环切换 D/M/L/清空。
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">
                规律列表
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                  value={newRuleType}
                  onChange={(e) =>
                    setNewRuleType(
                      e.target.value as
                        | "区域百分比"
                        | "按档位标记"
                        | "特殊标记",
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
                const isActive =
                  activeDmlRuleId === rule.id &&
                  activeDmlRuleType === rule.type;
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
                        <div className="text-[11px] text-slate-500">
                          ID: {rule.id}
                        </div>
                      </div>
                    </div>
                    {rule.type === "区域百分比"
                      ? (() => {
                          const regionRule = rule as DML区域百分比命令;
                          // Use global insertion-order index (not per-batch ratio).
                          // Split a run only when two consecutive selected lines have
                          // a gap > 1 in their global index (i.e. at least one unselected
                          // line sits between them in the full region array).
                          const selectedSet = new Set(regionRule.lineNodeIds ?? []);
                          const touchedRegions = new Set<string>();
                          selectedSet.forEach((id) => {
                            const info = lineToRegionInfo?.get(id);
                            if (info) touchedRegions.add(info.区域名);
                          });
                          const derivedSegments: {
                            区域: string;
                            开始: number;
                            结束: number;
                            total: number;
                          }[] = [];
                          touchedRegions.forEach((regionName) => {
                            const orderedIds =
                              regionOrderedLines?.get(regionName) ?? [];
                            const total = orderedIds.length;
                            // collect selected indices in order
                            const selectedIndices: number[] = [];
                            orderedIds.forEach((id, idx) => {
                              if (selectedSet.has(id))
                                selectedIndices.push(idx);
                            });
                            if (selectedIndices.length === 0) return;
                            let runStart = selectedIndices[0];
                            let runEnd = selectedIndices[0];
                            for (
                              let i = 1;
                              i < selectedIndices.length;
                              i++
                            ) {
                              if (
                                selectedIndices[i] - selectedIndices[i - 1] >
                                1
                              ) {
                                derivedSegments.push({
                                  区域: regionName,
                                  开始: runStart,
                                  结束: runEnd,
                                  total,
                                });
                                runStart = selectedIndices[i];
                              }
                              runEnd = selectedIndices[i];
                            }
                            derivedSegments.push({
                              区域: regionName,
                              开始: runStart,
                              结束: runEnd,
                              total,
                            });
                          });
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">
                                  规律
                                </span>
                                <input
                                  type="text"
                                  className="w-20 rounded border border-slate-200 px-2 py-1 text-xs font-mono uppercase"
                                  placeholder="如 DML"
                                  value={regionRule.规律}
                                  onChange={(e) =>
                                    updateDmlRegionRule?.(regionRule.id, {
                                      规律: e.target.value.toUpperCase(),
                                    })
                                  }
                                />
                                <select
                                  className="rounded border border-slate-200 px-1 py-1 text-xs"
                                  value=""
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    updateDmlRegionRule?.(regionRule.id, {
                                      规律: e.target.value,
                                    });
                                  }}
                                >
                                  <option value="">预设…</option>
                                  {patternPresets.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {derivedSegments.length > 0 ? (
                                <div className="space-y-1">
                                  {derivedSegments.map((seg, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-1 text-[11px] text-slate-600"
                                    >
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                                        {seg.区域}
                                      </span>
                                      <span className="text-slate-400">
                                        {seg.total <= 1
                                          ? "100%"
                                          : `${
                                              Math.round(
                                                (seg.开始 / (seg.total - 1)) *
                                                  100,
                                              )
                                            }% – ${
                                              Math.round(
                                                (seg.结束 / (seg.total - 1)) *
                                                  100,
                                              )
                                            }%`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">
                                  选中后画线以覆盖区域
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">
                                共 {(regionRule.lineNodeIds ?? []).length}{" "}
                                条已选线
                              </div>
                            </div>
                          );
                        })()
                      : rule.type === "按档位标记"
                        ? (() => {
                            const levelRule = rule as DML按档位标记命令;
                            // Use ordered level lines for reliable contiguous-run detection.
                            // Split a run only when index gap > 1.
                            const selectedSet = new Set(
                              levelRule.lineNodeIds ?? [],
                            );
                            const touchedLevels = new Set<string>();
                            selectedSet.forEach((id) => {
                              const info = lineToLevelInfo?.get(id);
                              if (info) touchedLevels.add(info.档位名称);
                            });
                            const derivedLevels: {
                              档位: string;
                              count: number;
                              runs: number;
                            }[] = [];
                            touchedLevels.forEach((levelName) => {
                              const orderedIds =
                                levelOrderedLines?.get(levelName) ?? [];
                              const selectedIndices: number[] = [];
                              orderedIds.forEach((id, idx) => {
                                if (selectedSet.has(id))
                                  selectedIndices.push(idx);
                              });
                              if (selectedIndices.length === 0) return;
                              let runs = 1;
                              for (
                                let i = 1;
                                i < selectedIndices.length;
                                i++
                              ) {
                                if (
                                  selectedIndices[i] -
                                    selectedIndices[i - 1] >
                                  1
                                )
                                  runs++;
                              }
                              derivedLevels.push({
                                档位: levelName,
                                count: selectedIndices.length,
                                runs,
                              });
                            });
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500">
                                    规律
                                  </span>
                                  <input
                                    type="text"
                                    className="w-20 rounded border border-slate-200 px-2 py-1 text-xs font-mono uppercase"
                                    placeholder="如 DML"
                                    value={levelRule.规律}
                                    onChange={(e) =>
                                      updateDmlLevelRule?.(levelRule.id, {
                                        规律: e.target.value.toUpperCase(),
                                      })
                                    }
                                  />
                                  <select
                                    className="rounded border border-slate-200 px-1 py-1 text-xs"
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      updateDmlLevelRule?.(levelRule.id, {
                                        规律: e.target.value,
                                      });
                                    }}
                                  >
                                    <option value="">预设…</option>
                                    {patternPresets.map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {derivedLevels.length > 0 ? (
                                  <div className="space-y-1">
                                    {derivedLevels.map((seg, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-1 text-[11px] text-slate-600"
                                      >
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                                          {seg.档位}
                                        </span>
                                        <span className="text-slate-400">
                                          {seg.count} 条
                                          {seg.runs > 1
                                            ? `（${seg.runs} 段）`
                                            : ""}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400">
                                    选中后画线以覆盖档位
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400">
                                  共 {(levelRule.lineNodeIds ?? []).length}{" "}
                                  条已选线
                                </div>
                              </div>
                            );
                          })()
                        : (() => {
                            const special = rule as DML特殊标记命令;
                            return (
                              <div className="flex items-center gap-2">
                                <div className="rounded bg-slate-100 px-3 py-1 text-sm font-bold">
                                  {special.规律}
                                </div>
                                <div className="text-xs text-slate-500">
                                  共 {(special.lineNodeIds ?? []).length}{" "}
                                  条特殊覆盖线
                                </div>
                              </div>
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
              {(dmlRuleCommands ?? []).length === 0 ? (
                <div className="rounded border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  还没有规律，先选择类型再新增。
                </div>
              ) : null}
            </div>
          </div>

          {/* 特殊规律: 显示各 D/M/L 的特殊标记数量概览 */}
          {specialRules.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-slate-700">
                特殊规律汇总
              </div>
              <div className="flex gap-3">
                {specialRules.map((cmd) => (
                  <div key={cmd.id} className="flex items-center gap-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold">
                      {cmd.规律}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {(cmd.lineNodeIds ?? []).length} 条
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                共 {dmlSpecialCount} 条特殊覆盖
              </div>
            </div>
          ) : null}
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
