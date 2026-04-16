import * as React from "react";
import { getDmlPatternPresets } from "./dmlAuto";

type Props = {
  step: "DML" | "单双";
  clearDmlStage: () => void;
  clearDoubleStage: () => void;
  dmlPattern?: string;
  setDmlPattern?: (value: string) => void;
};

export default function MarkStagePanel({
  step,
  clearDmlStage,
  clearDoubleStage,
  dmlPattern,
  setDmlPattern,
}: Props) {
  const patterns = React.useMemo(() => getDmlPatternPresets(), []);

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {step === "DML"
          ? "先选择规律，再用鼠标勾选线条；系统会按区域线条顺序从小到大套用规律，DML 标注落在交点位置"
          : "点击线条：切换是否双数（加粗显示）"}
      </div>

      {step === "DML" ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            说明：左侧只选择一个规律。你在画布中勾选到的线条，会按照区域线条既有顺序从小到大，循环套用这个规律。
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <div className="mb-1 text-[10px] font-medium text-slate-500">
              规律
            </div>
            <input
              list="dml_pattern_presets"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="如：DML / DMM"
              value={dmlPattern ?? ""}
              onChange={(e) => setDmlPattern?.(e.target.value)}
            />
          </div>

          <datalist id="dml_pattern_presets">
            {patterns.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <div className="text-[11px] text-slate-500">
            规律会循环使用（例如 DML 会按 D→M→L→D→… 连续分配）。
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
