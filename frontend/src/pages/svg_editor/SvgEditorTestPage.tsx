import PageShell from "../../components/PageShell";
import { SvgEditor } from "../../modules/svgEditor/externalSvgEditor";

export default function SvgEditorTestPage() {
  return (
    <PageShell
      title="SVG 编辑器测试页面"
      onBack={() => window.history.back()}
      actions={<div className="text-xs text-slate-500">入口：/test/svg-demo</div>}
      fullWidth
      compact
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SvgEditor style={{ width: "100%", height: "calc(100vh - 230px)", minHeight: 640 }} />
      </section>
    </PageShell>
  );
}
