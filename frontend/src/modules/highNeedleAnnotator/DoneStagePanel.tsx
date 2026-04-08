import * as React from "react";

type Props = {
  value: any;
  clearRegionStage: () => void;
};

export default function DoneStagePanel({ value, clearRegionStage }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        已完成标注。你可以复制 JSON。
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(value, null, 2));
          }}
        >
          复制 JSON
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={clearRegionStage}
        >
          清空全部
        </button>
      </div>

      <div className="text-[11px] text-slate-500">
        区域数：{value.底图.区域名.length}；区域线条：{value.底图.区域线条.length}；档位数：{value.底图.档位标注.length}
      </div>
    </div>
  );
}
