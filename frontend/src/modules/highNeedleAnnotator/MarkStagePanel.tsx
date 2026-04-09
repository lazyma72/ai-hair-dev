import * as React from "react";
import type { DmlAutoConfig } from "./dmlAuto";
import { getDmlPatternPresets } from "./dmlAuto";

type Props = {
  step: "DML" | "单双";
  clearDmlStage: () => void;
  clearDoubleStage: () => void;
  goNextStep: () => void;

  // DML 规则配置（仅 step === "DML" 时使用）
  regionNames?: string[];
  dmlAutoConfigs?: DmlAutoConfig[];
  addDmlAutoConfig?: () => void;
  updateDmlAutoConfig?: (
    configId: string,
    patch: Partial<
      Pick<DmlAutoConfig, "regionName" | "pattern" | "rangeStart" | "rangeEnd">
    >,
  ) => void;
  removeDmlAutoConfig?: (configId: string) => void;
  resetDmlAutoConfigs?: () => void;
};

export default function MarkStagePanel({
  step,
  clearDmlStage,
  clearDoubleStage,
  goNextStep,
  regionNames,
  dmlAutoConfigs,
  addDmlAutoConfig,
  updateDmlAutoConfig,
  removeDmlAutoConfig,
  resetDmlAutoConfigs,
}: Props) {
  const patterns = React.useMemo(() => getDmlPatternPresets(), []);

  const showDmlAuto =
    step === "DML" &&
    regionNames &&
    dmlAutoConfigs &&
    addDmlAutoConfig &&
    updateDmlAutoConfig &&
    removeDmlAutoConfig &&
    resetDmlAutoConfigs;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {step === "DML"
          ? "点击线条：D → M → L → 空（若线条位于自动规律范围内，则会改写该规律的对应位置）"
          : "点击线条：切换是否双数（加粗显示）"}
      </div>

      {showDmlAuto ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            说明：每个区域可配置一个「规律」和「范围(%)」。规律只识别 D/M/L
            字符；范围为 0~100
            的整数百分比。点击画布中的线条时，若落在某规则范围内，会同步修改该规律位置的其它线条。
          </div>

          <div className="space-y-2">
            {dmlAutoConfigs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                暂无区域规则
              </div>
            ) : (
              dmlAutoConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
                >
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="mb-1 text-[10px] font-medium text-slate-500">
                        区域
                      </div>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        value={cfg.regionName}
                        onChange={(e) =>
                          updateDmlAutoConfig(cfg.id, {
                            regionName: e.target.value,
                          })
                        }
                      >
                        <option value="">（请选择）</option>
                        {regionNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-medium text-slate-500">
                        规律
                      </div>
                      <input
                        list="dml_pattern_presets"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder="如：DML / DDML"
                        value={cfg.pattern}
                        onChange={(e) =>
                          updateDmlAutoConfig(cfg.id, {
                            pattern: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="mb-1 text-[10px] font-medium text-slate-500">
                        范围 (%)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          value={cfg.rangeStart}
                          onChange={(e) =>
                            updateDmlAutoConfig(cfg.id, {
                              rangeStart: Number(e.target.value),
                            })
                          }
                        />
                        <span className="flex-shrink-0 text-xs text-slate-400">
                          ~
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          value={cfg.rangeEnd}
                          onChange={(e) =>
                            updateDmlAutoConfig(cfg.id, {
                              rangeEnd: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-100"
                      onClick={() => removeDmlAutoConfig(cfg.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <datalist id="dml_pattern_presets">
            {patterns.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
              onClick={addDmlAutoConfig}
            >
              新增区域规则
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              onClick={resetDmlAutoConfigs}
            >
              重置为所有区域
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            规律会循环使用（例如 DML 会按 D→M→L→D→… 连续分配）。
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          onClick={goNextStep}
        >
          下一阶段
        </button>
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
