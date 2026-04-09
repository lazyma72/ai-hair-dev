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
    patch: Partial<Pick<DmlAutoConfig, "regionName" | "pattern" | "rangeStart" | "rangeEnd">>,
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
        <div className="space-y-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            说明：每个区域可配置一个「规律」和「范围(%)」。规律只识别 D/M/L 字符，其他字符会被自动忽略；范围为 0~100
            的整数百分比（例如 0~50）。当你在画布上点击某条线时，如果它落在某个区域规则范围内，会把该线对应的规律位
            置一起修改，从而影响同一规律位置的其它线条。
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">区域</th>
                  <th className="px-3 py-2 text-left font-medium">规律</th>
                  <th className="px-3 py-2 text-left font-medium">范围(%)</th>
                  <th className="px-3 py-2 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dmlAutoConfigs.map((cfg) => (
                  <tr key={cfg.id}>
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        value={cfg.regionName}
                        onChange={(e) =>
                          updateDmlAutoConfig(cfg.id, { regionName: e.target.value })
                        }
                      >
                        <option value="">（请选择）</option>
                        {regionNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2">
                      <input
                        list="dml_pattern_presets"
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder="例如：DML / DDML"
                        value={cfg.pattern}
                        onChange={(e) => updateDmlAutoConfig(cfg.id, { pattern: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          value={cfg.rangeStart}
                          onChange={(e) =>
                            updateDmlAutoConfig(cfg.id, { rangeStart: Number(e.target.value) })
                          }
                        />
                        <span className="text-slate-400">~</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          value={cfg.rangeEnd}
                          onChange={(e) =>
                            updateDmlAutoConfig(cfg.id, { rangeEnd: Number(e.target.value) })
                          }
                        />
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                        onClick={() => removeDmlAutoConfig(cfg.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}

                {dmlAutoConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-xs text-slate-500">
                      暂无区域规则
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <datalist id="dml_pattern_presets">
            {patterns.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={addDmlAutoConfig}
            >
              新增区域规则
            </button>
            <button
              type="button"
              className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={resetDmlAutoConfigs}
            >
              重置为所有区域
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            规律提示：会循环使用（例如 DML 会按 D→M→L→D→… 连续分配）。
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={step === "DML" ? clearDmlStage : clearDoubleStage}
        >
          清空本阶段
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={goNextStep}
        >
          下一阶段
        </button>
      </div>
    </div>
  );
}
