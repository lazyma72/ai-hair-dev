/**
 * PageShell — 页面外壳
 *
 * 提供统一导航栏 + 标题行（含可选返回按钮）+ 子内容区域。
 * 所有 page 用这个包裹，确保布局与交互一致。
 */
import * as React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "首页", to: "/" },
  { label: "管理后台", to: "/admin/files" },
  { label: "客户", to: "/admin/customers" },
  { label: "数据导入", to: "/admin/add" },
  { label: "胶丝比例", to: "/admin/ratio" },
  { label: "高针标注", to: "/admin/high-needle-annotator" },
  { label: "高针预览", to: "/admin/high-needle-preview" },
];

type Props = {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
};

export default function PageShell({
  title,
  onBack,
  actions,
  children,
  fullWidth,
}: Props) {
  const containerClass = fullWidth
    ? "w-full space-y-5 p-4 sm:p-6"
    : "mx-auto max-w-7xl space-y-5 p-4 sm:p-6";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className={containerClass}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={onBack}
              >
                ←
              </button>
            ) : null}
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
