/**
 * PageShell — 页面外壳
 *
 * 提供统一头部导航 + 标题行（含可选返回按钮）+ 子内容区域。
 * - 导航栏目仅包含业务模块入口，不包含“登录”。
 * - 右上角展示登录状态（用户/退出登录）。
 */
import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

type NavItem = {
  label: string;
  to: string;
  end?: boolean;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    group: "工作台",
    items: [{ label: "首页", to: "/welcome", end: true }],
  },
  {
    group: "设计稿",
    items: [{ label: "设计稿管理", to: "/designs", end: true }],
  },
  {
    group: "管理",
    items: [
      { label: "胶丝比例", to: "/ratio" },
      { label: "客户管理", to: "/customers" },
      { label: "用户管理", to: "/users" },
    ],
  },
  {
    group: "工具",
    items: [{ label: "测试页面", to: "/test" }],
  },
];

const flatNavItems = NAV_GROUPS.flatMap((g) => g.items);

type Props = {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function PageShell({ title, onBack, actions, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const account = localStorage.getItem("demo_login_account") || "";
  const loggedIn = Boolean(account);

  const isLoginPage = location.pathname === "/login";
  const showNav = loggedIn;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
              AI
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                AI 设计稿工作台
              </div>
              <div className="text-xs text-slate-500">
                成品稿 / 胶丝比例 / 客户管理（Demo）
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showNav ? (
              <nav className="hidden items-center gap-1 lg:flex">
                {flatNavItems.map((item) => (
                  <NavItemLink key={item.to} item={item} />
                ))}
              </nav>
            ) : null}

            <div className="flex items-center gap-2">
              {loggedIn ? (
                <>
                  <div className="text-sm text-slate-600">
                    用户：<span className="font-mono">{account}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                    onClick={() => {
                      localStorage.removeItem("demo_login_account");
                      navigate("/login", { replace: true });
                    }}
                  >
                    退出登录
                  </button>
                </>
              ) : isLoginPage ? (
                <div className="text-sm text-slate-400">未登录</div>
              ) : (
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  onClick={() => navigate("/login")}
                >
                  去登录
                </button>
              )}
            </div>
          </div>
        </div>

        {showNav ? (
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 pb-3 lg:hidden sm:px-6">
            <div className="flex w-max items-center gap-1">
              {flatNavItems.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
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
      </main>
    </div>
  );
}
