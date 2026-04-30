import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell";

function OptionCard({
  tag,
  title,
  desc,
  to,
}: {
  tag?: string;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {tag ? (
            <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {tag}
            </div>
          ) : null}
          <div className="mt-2 text-base font-semibold text-slate-900">
            {title}
          </div>
          <div className="mt-2 text-sm leading-relaxed text-slate-500">
            {desc}
          </div>
        </div>
        <div className="mt-1 text-base text-slate-300 transition group-hover:text-slate-500">
          →
        </div>
      </div>
    </Link>
  );
}

export default function DesignCreateHubPage() {
  return (
    <PageShell title="产品规格系统 · 新建产品规格稿">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-base font-semibold text-slate-900">
            选择新建方式
          </div>
          <div className="mt-2 text-sm leading-relaxed text-slate-600">
            支持两种方式：手动上传设计稿，或选择 A + B 生成 C 稿。
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <OptionCard
            tag="推荐"
            title="手动上传设计稿"
            desc="从零开始录入：制品规格书 / 高针指示单 / 手织指示单"
            to="/designs/create/manual"
          />
          <OptionCard
            tag="快速"
            title="选择 A + B 生成 C 稿"
            desc="A 稿取规格书数据，B 稿取高针/手织，合成后可直接预览并编辑 C 稿"
            to="/designs/create/ab"
          />
        </div>
      </div>
    </PageShell>
  );
}
