import * as React from "react";

type Props = {
  levelNo: number;
  draftSelected: string[];
  savedLevelCount: number;
  requestCanvasReset: () => void;
  setDraftSelected: (v: string[]) => void;

  finishLevel: () => void;
  clearLevelStage: () => void;
  goNextStep: () => void;
};

export default function LevelStagePanel({
  levelNo,
  draftSelected,
  savedLevelCount,
  requestCanvasReset,
  setDraftSelected,
  finishLevel,
  clearLevelStage,
  goNextStep,
}: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        当前：{levelNo}档（可批量勾选，保存后自动进入下一档）
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={finishLevel}
        >
          保存当前档位
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={() => {
            requestCanvasReset();
            setDraftSelected([]);
          }}
        >
          清空本次已选
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={clearLevelStage}
        >
          清空档位阶段
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={goNextStep}
        >
          下一阶段
        </button>
      </div>

      <div className="text-[11px] text-slate-500">
        已选 {draftSelected.length} 条；已标注 {savedLevelCount} 个档位
      </div>
    </div>
  );
}
