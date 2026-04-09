import * as React from "react";
import { message } from "antd";

const CUSTOM_REGION_PRESET_VALUE = "__custom__";

type Preset = { name: string; lineLength: number };

type Props = {
  presets: Preset[];
  regionPresetValue: string;
  setRegionPresetValue: (v: string) => void;
  regionDraft: { name: string; lineLength: number };
  setRegionDraft: (updater: any) => void;

  draftSelected: string[];
  savedLineCount: number;

  requestCanvasReset: () => void;
  setDraftSelected: (v: string[]) => void;

  finishRegion: (options?: { gotoNextStage?: boolean }) => void;
  clearRegionStage: () => void;
  goNextStep: () => void;
};

export default function RegionStagePanel({
  presets,
  regionPresetValue,
  setRegionPresetValue,
  regionDraft,
  setRegionDraft,
  draftSelected,
  savedLineCount,
  requestCanvasReset,
  setDraftSelected,
  finishRegion,
  clearRegionStage,
  goNextStep,
}: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-medium text-slate-600">
            预置区域
          </div>
          <select
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            value={regionPresetValue}
            onChange={(e) => {
              const presetValue = e.target.value;
              setRegionPresetValue(presetValue);

              if (presetValue === CUSTOM_REGION_PRESET_VALUE) {
                setRegionDraft((d: any) => ({
                  ...d,
                  name: presets.some((p) => p.name === d.name) ? "" : d.name,
                }));
                return;
              }

              const preset = presets.find((p) => p.name === presetValue);
              if (!preset) return;
              setRegionDraft({
                name: preset.name,
                lineLength: preset.lineLength,
              });
            }}
          >
            <option value={CUSTOM_REGION_PRESET_VALUE}>（自定义）</option>
            {presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-medium text-slate-600">
            线条长度
          </div>
          <input
            type="number"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            value={regionDraft.lineLength}
            onChange={(e) =>
              setRegionDraft((d: any) => ({
                ...d,
                lineLength: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      <div>
        <div className="mb-1 text-[11px] font-medium text-slate-600">
          区域名
          {regionPresetValue === CUSTOM_REGION_PRESET_VALUE
            ? "（自定义）"
            : "（预置，不可编辑）"}
        </div>
        <input
          disabled={regionPresetValue !== CUSTOM_REGION_PRESET_VALUE}
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-300"
          placeholder="例如：尾巴"
          value={regionDraft.name}
          onChange={(e) =>
            setRegionDraft((d: any) => ({ ...d, name: e.target.value }))
          }
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ 按顺序标注：区域顺序会影响后续 DML
        排列顺序；并且区域序号会跨区域累增。
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={draftSelected.length === 0}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => finishRegion()}
        >
          保存并开始下一区域
        </button>

        {draftSelected.length > 0 && (
          <button
            type="button"
            className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
            onClick={() => finishRegion({ gotoNextStage: true })}
          >
            保存并开启下一阶段
          </button>
        )}

        <button
          type="button"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          onClick={() => goNextStep()}
        >
          开启下一阶段
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={() => {
            if (draftSelected.length === 0) {
              message.info("当前没有选中的线条");
              return;
            }
            requestCanvasReset();
            setDraftSelected([]);
            message.success("已清空本次已选");
          }}
        >
          清空本次已选
        </button>

        <button
          type="button"
          className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
          onClick={clearRegionStage}
        >
          清空区域阶段
        </button>
      </div>

      <div className="text-[11px] text-slate-500">
        操作：按住鼠标左键拖动经过线条，可连续勾选/取消（一次拖动内同一条线只会切换一次）。当前已选{" "}
        {draftSelected.length}
        条；已归档 {savedLineCount} 条。
      </div>
    </div>
  );
}
