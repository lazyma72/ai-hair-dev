import * as React from "react";

type Props = {
  step: "DML" | "单双";
  clearDmlStage: () => void;
  clearDoubleStage: () => void;
  goNextStep: () => void;
};

export default function MarkStagePanel({ step, clearDmlStage, clearDoubleStage, goNextStep }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {step === "DML" ? "点击线条：D → M → L → 空" : "点击线条：切换是否双数（加粗显示）"}
      </div>

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
