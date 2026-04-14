import * as React from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell";

function OptionCard({
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

export default function DesignCreateHubPage() {
  return (
    <PageShell title="添加设计稿">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        这里提供三种方式的分步 Demo：手动上传设计稿、选择 A+B 生成 C 稿、导入 Excel。
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OptionCard
          title="手动上传设计稿"
          desc="三步：1 导入数据 2 导入高针图(JSON) 3 导入手织图（Demo 为空）"
          to="/designs/create/manual"
        />
        <OptionCard
          title="选择 A + B 生成 C 稿"
          desc="选择 A 稿（取规格书数据）+ 选择 B 稿（取高针/手织）→ 预览 C 稿（复用现有详情页展示组件）"
          to="/designs/create/ab"
        />
        <OptionCard
          title="导入 Excel"
          desc="选择 Excel + 手织图 SVG + 高针图 SVG（静态 Demo）→ 基本信息填入预览"
          to="/designs/create/import"
        />
      </div>
    </PageShell>
  );
}
