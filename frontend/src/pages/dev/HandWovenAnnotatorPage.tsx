import PageShell from "../../components/PageShell";

export default function HandWovenAnnotatorPage() {
  return (
    <PageShell
      title="手织标注测试页面"
      onBack={() => window.history.back()}
      fullWidth
      compact
      actions={<div className="text-xs text-slate-500">入口：/test/hand-woven-annotator</div>}
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900">
        手织图编辑器已下线，当前版本不允许在线编辑手织图 SVG。
        如需继续测试手织相关数据，请使用“手织指示单测试页面”查看生成结果，或在成品稿页面直接导入已有 SVG 文件。
      </div>
    </PageShell>
  );
}
