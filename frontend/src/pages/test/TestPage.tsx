import * as React from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell";

function LinkCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-xs leading-relaxed text-slate-500">
            {desc}
          </div>
        </div>
        <div className="text-sm text-slate-300 transition group-hover:text-slate-500">
          →
        </div>
      </div>
    </Link>
  );
}

export default function TestPage() {
  return (
    <PageShell title="测试页面">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        这里集中放置原有页面入口，便于对照验收与复用组件。新版导航入口不直接暴露管理后台/Dev 页，但都能从此处访问。
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LinkCard
          title="原始成品稿列表（旧首页）"
          desc="原来的 / 页面，保留在 /test/files"
          to="/test/files"
        />
        <LinkCard
          title="原始后台：成品稿管理"
          desc="原来的 /admin/files 页面"
          to="/test/admin/files"
        />
        <LinkCard
          title="原始后台：新增成品稿"
          desc="原来的 /admin/add 表单（完整字段）"
          to="/test/admin/add"
        />
        <LinkCard
          title="胶丝比例（旧）"
          desc="保留原页面能力，同时已按需求改造列表交互"
          to="/test/ratio"
        />
        <LinkCard
          title="客户管理（旧）"
          desc="查询 + 新增客户"
          to="/test/admin/customers"
        />
        <LinkCard
          title="高针标注 Demo"
          desc="开发工具页（原 /admin/high-needle-annotator）"
          to="/test/high-needle-annotator"
        />
        <LinkCard
          title="高针预览 Demo"
          desc="开发工具页（原 /admin/high-needle-preview）"
          to="/test/high-needle-preview"
        />
      </div>
    </PageShell>
  );
}
