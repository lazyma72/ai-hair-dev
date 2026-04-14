import * as React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell";

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
  const account = useMemo(
    () => localStorage.getItem("demo_login_account") || "访客",
    [],
  );

  return (
    <PageShell title="Welcome">
      <div className="rounded-2xl bg-slate-900 px-6 py-6 text-white">
        <div className="text-sm text-white/70">你好，{account}</div>
        <div className="mt-2 text-2xl font-semibold">
          今天想从哪里开始？
        </div>
        <div className="mt-3 max-w-3xl text-sm text-white/80">
          这里把“设计稿管理 / 添加设计稿 / 胶丝比例 / 客户 / 用户管理 / 测试页面”串成一个可浏览的 Demo。
          现有的详情页、导入页和高针工具页会在对应入口继续复用。
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        <StatCard label="草稿设计稿" value="12" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ActionCard
          title="进入设计稿管理"
          desc="卡片式 CRUD 列表（新增入口在列表页右上角）"
          to="/designs"
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
