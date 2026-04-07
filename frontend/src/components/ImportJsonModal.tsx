import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** 接收原始 JSON 字符串，由调用方负责 parse 和校验 */
  onImport: (text: string) => void | Promise<void>;
};

export default function ImportJsonModal({
  open,
  title,
  onClose,
  onImport,
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setText("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleImport() {
    setError("");
    setLoading(true);
    try {
      await onImport(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          请粘贴单个成品稿的 JSON 对象（
          <code className="rounded bg-slate-100 px-1">
            {"{ _id, 假发类型, 客户, ... }"}
          </code>
          ）
        </p>

        <textarea
          className="mt-3 h-72 w-full rounded border border-slate-200 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-slate-300"
          placeholder='{"_id": "XM-6190(L)", "假发类型": "纯色", ...}'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded bg-white px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={() => void handleImport()}
            disabled={loading || !text.trim()}
          >
            {loading ? "提交中…" : "导入"}
          </button>
        </div>
      </div>
    </div>
  );
}
