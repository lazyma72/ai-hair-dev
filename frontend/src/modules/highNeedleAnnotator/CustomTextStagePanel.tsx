type TextNodeRecord = {
  textNodeId: string;
  text?: string;
  fontStyle?: Record<string, unknown>;
  created?: boolean;
};

type Props = {
  textNodeEntries: Array<[string, TextNodeRecord]>;
  activeTextKey: string;
  setActiveTextKey: (v: string) => void;

  newTextDraft: {
    text: string;
    fill: string;
    fontWeight: string;
    fontSize: number;
  };
  setNewTextDraft: (updater: any) => void;

  createTextNode: () => void;
  updateTextNodeText: (key: string, text: string) => void;
  updateTextNodeStyle: (key: string, patch: Record<string, unknown>) => void;
  removeTextNode: (key: string) => void;
  clearCustomText: () => void;
  completeTextStage: () => void;
};

const COLOR_OPTIONS = [
  { label: "黑色", value: "#111827" },
  { label: "红色", value: "#ef4444" },
  { label: "橙色", value: "#f59e0b" },
  { label: "绿色", value: "#10b981" },
  { label: "蓝色", value: "#3b82f6" },
  { label: "灰色", value: "#64748b" },
] as const;

const WEIGHT_OPTIONS = [
  { label: "常规 400", value: "400" },
  { label: "加粗 700", value: "700" },
  { label: "超粗 900", value: "900" },
] as const;

function readFontStyle(fontStyle: unknown, key: string): string {
  if (!fontStyle || typeof fontStyle !== "object") return "";
  const val = (fontStyle as Record<string, unknown>)[key];
  return typeof val === "string" || typeof val === "number" ? String(val) : "";
}

export default function CustomTextStagePanel({
  textNodeEntries,
  activeTextKey,
  setActiveTextKey,
  newTextDraft,
  setNewTextDraft,
  createTextNode,
  updateTextNodeText,
  updateTextNodeStyle,
  removeTextNode,
  clearCustomText,
  completeTextStage,
}: Props) {
  const activeEntry = textNodeEntries.find(([k]) => k === activeTextKey)?.[1];

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        文本阶段：默认隐藏 D/M/L/单/双 文本节点（不会立刻删除），其余文本已加入“已保留文本节点”；可拖动文字调整位置；不需要的文本可在列表中删除。最终完成时会清理无关文本。
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 text-xs font-medium text-slate-700">
          新增文本节点
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <div className="text-[11px] text-slate-500">文本</div>
            <input
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
              value={newTextDraft.text}
              onChange={(e) =>
                setNewTextDraft((d: any) => ({
                  ...d,
                  text: e.target.value,
                }))
              }
            />
          </label>

          <label className="space-y-1">
            <div className="text-[11px] text-slate-500">字号</div>
            <input
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
              type="number"
              value={newTextDraft.fontSize}
              onChange={(e) =>
                setNewTextDraft((d: any) => ({
                  ...d,
                  fontSize: Number(e.target.value) || 0,
                }))
              }
            />
          </label>

          <label className="space-y-1">
            <div className="text-[11px] text-slate-500">颜色</div>
            <select
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
              value={newTextDraft.fill}
              onChange={(e) =>
                setNewTextDraft((d: any) => ({ ...d, fill: e.target.value }))
              }
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-[11px] text-slate-500">粗细</div>
            <select
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
              value={newTextDraft.fontWeight}
              onChange={(e) =>
                setNewTextDraft((d: any) => ({
                  ...d,
                  fontWeight: e.target.value,
                }))
              }
            >
              {WEIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={createTextNode}
          >
            添加文本节点
          </button>

          <button
            type="button"
            className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            onClick={clearCustomText}
          >
            清空自定义文本
          </button>

          <button
            type="button"
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={completeTextStage}
          >
            保存并清理文本
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 text-xs font-medium text-slate-700">
          已保留文本节点（{textNodeEntries.length}）
        </div>

        {textNodeEntries.length === 0 ? (
          <div className="text-xs text-slate-500">
            还没有保留文本。点击画布中的文字即可加入。
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {textNodeEntries.map(([k, v]) => {
              const active = k === activeTextKey;
              return (
                <div
                  key={k}
                  className={
                    active
                      ? "relative rounded border border-slate-200 bg-slate-50 p-2"
                      : "relative rounded border border-slate-100 p-2"
                  }
                >
                  {active ? (
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-red-500 shadow-sm hover:bg-red-50"
                      onClick={() => removeTextNode(k)}
                    >
                      x
                    </button>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setActiveTextKey(k)}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                          {k}
                        </span>
                        <span className="truncate text-xs text-slate-800">
                          {v.text ? (
                            v.text
                          ) : (
                            <span className="italic text-slate-400">
                              （空文本）
                            </span>
                          )}
                        </span>
                        {v.created ? (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                            新建
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-slate-400">
                        {v.textNodeId}
                      </div>
                    </button>

                    <button
                      type="button"
                      className="shrink-0 text-xs text-red-600 hover:text-red-700"
                      onClick={() => removeTextNode(k)}
                    >
                      删除
                    </button>
                  </div>

                  {active ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <div className="text-[11px] text-slate-500">文本</div>
                        <input
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          value={v.text ?? ""}
                          onChange={(e) =>
                            updateTextNodeText(k, e.target.value)
                          }
                        />
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-slate-500">字号</div>
                        <input
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          type="number"
                          value={readFontStyle(v.fontStyle, "fontSize") || 14}
                          onChange={(e) =>
                            updateTextNodeStyle(k, {
                              fontSize: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-slate-500">颜色</div>
                        <select
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          value={
                            readFontStyle(v.fontStyle, "fill") || "#111827"
                          }
                          onChange={(e) =>
                            updateTextNodeStyle(k, { fill: e.target.value })
                          }
                        >
                          {COLOR_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-slate-500">粗细</div>
                        <select
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          value={
                            readFontStyle(v.fontStyle, "fontWeight") || "700"
                          }
                          onChange={(e) =>
                            updateTextNodeStyle(k, {
                              fontWeight: e.target.value,
                            })
                          }
                        >
                          {WEIGHT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeEntry ? (
        <div className="text-[11px] text-slate-400">
          当前选中：{activeTextKey}（{activeEntry.textNodeId}）
        </div>
      ) : null}
    </div>
  );
}
