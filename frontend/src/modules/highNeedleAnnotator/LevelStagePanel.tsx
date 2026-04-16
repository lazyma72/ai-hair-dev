type Props = {
  levelNo: number;
  draftSelected: string[];
  savedLevelCount: number;
  savedLevels: Array<{ name: string; lineCount: number }>;
  requestCanvasReset: () => void;
  setDraftSelected: (v: string[]) => void;

  finishLevel: () => void;
  clearLevelStage: () => void;
};

export default function LevelStagePanel({
  levelNo,
  draftSelected,
  savedLevelCount,
  savedLevels,
  requestCanvasReset,
  setDraftSelected,
  finishLevel,
  clearLevelStage,
}: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        当前：{levelNo}档（可批量勾选，保存后自动进入下一档）
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
          onClick={finishLevel}
        >
          保存当前档位
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          onClick={() => {
            requestCanvasReset();
            setDraftSelected([]);
          }}
        >
          清空本次已选
        </button>

        <button
          type="button"
          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-100"
          onClick={clearLevelStage}
        >
          清空档位阶段
        </button>
      </div>

      <div className="text-[11px] text-slate-500">
        已选 {draftSelected.length} 条；已标注 {savedLevelCount} 个档位
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="mb-2 text-[11px] font-medium text-slate-600">
          已标注档位
        </div>
        {savedLevels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {savedLevels.map((level) => (
              <div
                key={level.name}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                {level.name} · {level.lineCount} 条
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">暂未保存档位</div>
        )}
      </div>
    </div>
  );
}
