import { useEffect, useState } from "react";
import PageShell from "../../components/PageShell";
import { SvgEditor } from "../../modules/svgEditor/externalSvgEditor";

export default function SvgEditorTestPage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <PageShell
      title="SVG 编辑器测试页面"
      onBack={() => window.history.back()}
      actions={<div className="text-xs text-slate-500">入口：/test/svg-demo</div>}
      fullWidth
      compact
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            测试页已改为全屏弹窗模式，点击下面按钮打开 SVG 编辑器。
          </div>
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => setOpen(true)}
          >
            打开 SVG 编辑器
          </button>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[1000] bg-slate-100">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/92 p-2 shadow-sm backdrop-blur">
            <div className="px-2 text-xs font-medium text-slate-500">
              SVG 编辑器测试
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              关闭
            </button>
          </div>
          <SvgEditor
            style={{ width: "100%", height: "100vh", minHeight: 640 }}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
