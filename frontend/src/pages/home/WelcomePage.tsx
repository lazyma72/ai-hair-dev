import { Link } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { getAuthUserProfile, isLoggedIn } from "../../auth";
import PageShell from "../../components/PageShell";
import { useApi } from "../../hooks/useApi";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ActionCard({
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
      className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{desc}</div>
        </div>
        <div className="text-sm text-slate-300 transition group-hover:text-slate-500">
          →
        </div>
      </div>
    </Link>
  );
}

export default function WelcomePage() {
  const account = isLoggedIn()
    ? getAuthUserProfile()?.name || getAuthUserProfile()?.username || "已登录用户"
    : "访客";

  const { data, loading, error } = useApi(() => callApi("admin/GetPreview", {}));
  const statValue = (n: number | undefined) =>
    loading ? "加载中…" : error ? "—" : String(n ?? 0);

  return (
    <PageShell title="产品规格系统 / Product Specification System">
      <div className="rounded-2xl bg-slate-900 px-6 py-6 text-white">
        <div className="text-sm text-white/70">你好，{account}</div>
        <div className="mt-2 text-2xl font-semibold">
          产品规格系统 / Product Specification System
        </div>
        <div className="mt-3 max-w-3xl text-sm text-white/80">
          这里统一提供成品稿、制品规格书、制帽、胶丝比例、客户与相关工具页面的入口。
          现有的详情页、导入页和高针工具页会在对应入口继续复用，形成完整的产品规格系统体验。
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="设计稿总数" value={statValue(data?.设计稿总数)} />
        <StatCard label="制帽总数" value={statValue(data?.制帽总数)} />
        <StatCard label="胶丝比例总数" value={statValue(data?.胶丝比例总数)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ActionCard
          title="进入设计稿管理"
          desc="卡片式 CRUD 列表（新增入口在列表页右上角）"
          to="/designs"
        />
        <ActionCard
          title="制帽管理"
          desc="制帽规格列表、详情与新增"
          to="/hat-making"
        />
        <ActionCard
          title="胶丝比例管理"
          desc="按发丝种类分标签展示，支持颜色编号搜索"
          to="/ratio"
        />
        <ActionCard
          title="客户管理"
          desc="查询展示 + 添加客户（复用现有页面）"
          to="/customers"
        />
        <ActionCard
          title="用户管理"
          desc="账号密码管理（静态 Demo）"
          to="/users"
        />
        <ActionCard
          title="测试页面"
          desc="原有页面集中入口，方便验收与复用组件"
          to="/test"
        />
      </div>
    </PageShell>
  );
}
