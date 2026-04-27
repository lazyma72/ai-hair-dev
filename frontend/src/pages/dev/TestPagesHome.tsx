import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell";

function TestEntryCard({
  title,
  desc,
  to,
}: {
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{desc}</div>
        </div>
        <div className="text-sm text-slate-300 transition group-hover:text-slate-500">
          →
        </div>
      </div>
    </Link>
  );
}

export default function TestPagesHome() {
  return (
    <PageShell title="测试页面">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        这里集中放置开发和测试用页面，方便从导航直接进入，不再落到“页面不存在”。
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TestEntryCard
          title="手织标注测试页面"
          desc="生成横排 / 方形 / 特殊手织图 SVG，并支持直接编辑 SVG 源码和文本节点。"
          to="/test/hand-woven-annotator"
        />
        <TestEntryCard
          title="高针标注 Demo"
          desc="导入 SVG 后在页面内完成高针图标注流程。"
          to="/test/high-needle-annotator"
        />
        <TestEntryCard
          title="高针预览"
          desc="导入 JSON，查看高针图预览和叠加标记效果。"
          to="/test/high-needle-preview"
        />
        <TestEntryCard
          title="CDR 转 SVG"
          desc="上传 CDR 文件，调用后端转换接口并直接在页面内预览 SVG。"
          to="/test/cdr-to-svg"
        />
      </div>
    </PageShell>
  );
}
